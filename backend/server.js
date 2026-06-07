'use strict';
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const Stripe     = require('stripe');

// ─── CONFIG VALIDATION ────────────────────────────────────────────────────────
const REQUIRED = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY'];
REQUIRED.forEach(k => {
  if (!process.env[k]) {
    console.error(`❌  Missing env var: ${k}`);
    process.exit(1);
  }
});

const PORT         = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';

// ─── CLIENTS ─────────────────────────────────────────────────────────────────
// Service role client — bypasses RLS for server operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

// ─── APP SETUP ────────────────────────────────────────────────────────────────
const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));

// Stripe webhook needs raw body — must come BEFORE express.json()
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts.' }
});

app.use('/api/', apiLimiter);

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { req.user = null; return next(); }
  const token = header.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(token);
  req.user = user || null;
  next();
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const token = header.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
  req.user = user;
  next();
}

async function requireAdmin(req, res, next) {
  await requireAuth(req, res, async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();
    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    req.userRole = 'admin';
    next();
  });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ══════════════════════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/products', asyncHandler(async (req, res) => {
  const { category, collection, search, featured, new_arrival, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('products')
    .select(`
      *,
      categories(id, name, slug),
      product_images(url, alt, is_primary),
      inventory(quantity, track_inventory)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).single();
    if (cat) query = query.eq('category_id', cat.id);
  }
  if (featured)    query = query.eq('is_featured', true);
  if (new_arrival) query = query.eq('is_new_arrival', true);
  if (search)      query = query.ilike('name', `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw error;

  let products = data;

  if (collection) {
    const { data: coll } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', collection)
      .single();
    if (coll) {
      const { data: pc } = await supabase
        .from('product_collections')
        .select('product_id')
        .eq('collection_id', coll.id);
      const ids = (pc || []).map(r => r.product_id);
      products = products.filter(p => ids.includes(p.id));
    }
  }

  res.json({ products, total: count || products.length });
}));

app.get('/api/products/:slug', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(id, name, slug),
      product_images(url, alt, is_primary, sort_order),
      product_variants(id, name, sku, price_adjustment, is_active),
      inventory(quantity, track_inventory),
      reviews(id, user_id, rating, title, body, created_at)
    `)
    .eq('slug', req.params.slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Product not found.' });
  res.json(data);
}));

// ══════════════════════════════════════════════════════════════════════════════
//  CART (DB-synced for authenticated users)
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/cart', requireAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id, quantity,
      products(id, slug, name, price, material, product_images(url, alt, is_primary)),
      product_variants(id, name, price_adjustment)
    `)
    .eq('user_id', req.user.id);

  if (error) throw error;
  res.json(data || []);
}));

app.post('/api/cart', requireAuth, asyncHandler(async (req, res) => {
  const { product_id, variant_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required.' });

  // Verify product exists
  const { data: product } = await supabase
    .from('products')
    .select('id, name')
    .eq('id', product_id)
    .eq('is_active', true)
    .single();
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const { data, error } = await supabase
    .from('cart_items')
    .upsert({
      user_id: req.user.id,
      product_id,
      variant_id: variant_id || null,
      quantity
    }, {
      onConflict: 'user_id,product_id,variant_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(data);
}));

app.patch('/api/cart/:id', requireAuth, asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    // Remove if qty = 0
    await supabase.from('cart_items').delete()
      .eq('id', req.params.id).eq('user_id', req.user.id);
    return res.json({ deleted: true });
  }
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select().single();
  if (error) throw error;
  res.json(data);
}));

app.delete('/api/cart/:id', requireAuth, asyncHandler(async (req, res) => {
  await supabase.from('cart_items').delete()
    .eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ deleted: true });
}));

app.delete('/api/cart', requireAuth, asyncHandler(async (req, res) => {
  await supabase.from('cart_items').delete().eq('user_id', req.user.id);
  res.json({ cleared: true });
}));

// Sync localStorage cart to DB (called after login)
app.post('/api/cart/sync', requireAuth, asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ product_slug, quantity }]
  if (!Array.isArray(items) || items.length === 0) return res.json({ synced: 0 });

  // Look up product IDs by slug
  const slugs = items.map(i => i.product_slug).filter(Boolean);
  const { data: products } = await supabase
    .from('products')
    .select('id, slug')
    .in('slug', slugs)
    .eq('is_active', true);

  const productMap = Object.fromEntries((products || []).map(p => [p.slug, p.id]));
  let synced = 0;

  for (const item of items) {
    const product_id = productMap[item.product_slug];
    if (!product_id) continue;
    await supabase.from('cart_items').upsert({
      user_id: req.user.id,
      product_id,
      quantity: item.quantity
    }, { onConflict: 'user_id,product_id,variant_id', ignoreDuplicates: false });
    synced++;
  }

  res.json({ synced });
}));

// ══════════════════════════════════════════════════════════════════════════════
//  WISHLIST
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/wishlist', requireAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select(`
      id, created_at,
      products(id, slug, name, price, material, product_images(url, alt, is_primary))
    `)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  res.json(data || []);
}));

app.post('/api/wishlist/toggle', requireAuth, asyncHandler(async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required.' });

  const { data: existing } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('user_id', req.user.id)
    .eq('product_id', product_id)
    .single();

  if (existing) {
    await supabase.from('wishlist_items').delete().eq('id', existing.id);
    return res.json({ action: 'removed' });
  } else {
    await supabase.from('wishlist_items').insert({ user_id: req.user.id, product_id });
    return res.json({ action: 'added' });
  }
}));

// ══════════════════════════════════════════════════════════════════════════════
//  COUPONS
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/coupons/validate', optionalAuth, asyncHandler(async (req, res) => {
  const { code, order_total } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code required.' });

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single();

  if (error || !coupon) return res.status(404).json({ error: 'Invalid coupon code.' });
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return res.status(400).json({ error: 'This coupon has expired.' });
  }
  if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
    return res.status(400).json({ error: 'This coupon has reached its usage limit.' });
  }
  if (order_total && coupon.min_order_amount && order_total < coupon.min_order_amount) {
    return res.status(400).json({
      error: `Minimum order of $${coupon.min_order_amount.toFixed(0)} required for this coupon.`
    });
  }

  const discount = coupon.type === 'percentage'
    ? (order_total * coupon.value) / 100
    : coupon.value;

  res.json({
    valid: true,
    coupon: { id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value },
    discount: Math.min(discount, order_total || discount)
  });
}));

// ══════════════════════════════════════════════════════════════════════════════
//  PAYMENTS — Stripe Checkout
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/payments/create-checkout-session',
  authLimiter,
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { items, shipping_address, coupon_code, guest_email } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    if (!req.user && !guest_email) {
      return res.status(400).json({ error: 'Email address required for guest checkout.' });
    }

    // Fetch product prices from DB (never trust client-side prices)
    // Frontend sends slugs as product_id/product_slug
    const productSlugs = items.map(i => i.product_slug || i.product_id);
    const { data: products, error: pErr } = await supabase
      .from('products')
      .select('id, slug, name, price, material, product_images(url, is_primary)')
      .in('slug', productSlugs)
      .eq('is_active', true);

    if (pErr || !products || products.length === 0) {
      return res.status(400).json({ error: 'One or more products are unavailable.' });
    }

    const productMap = Object.fromEntries(products.map(p => [p.slug, p]));

    // Build line items
    const lineItems = [];
    let subtotal = 0;

    for (const item of items) {
      const slug = item.product_slug || item.product_id;
      const product = productMap[slug];
      if (!product) return res.status(400).json({ error: `Product ${slug} not found.` });

      const qty = Math.max(1, Math.floor(item.quantity || 1));
      const price = product.price;
      subtotal += price * qty;

      const primaryImage = product.product_images?.find(i => i.is_primary) || product.product_images?.[0];

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.material || '',
            images: primaryImage ? [primaryImage.url] : []
          },
          unit_amount: Math.round(price * 100) // Stripe expects cents
        },
        quantity: qty
      });
    }

    // Shipping
    const shippingCost = subtotal >= 500 ? 0 : 95; // Free over $500
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Standard Shipping & White-Glove Delivery' },
          unit_amount: shippingCost * 100
        },
        quantity: 1
      });
    }

    // Validate and apply coupon
    let discounts = [];
    let stripePromoCode;
    if (coupon_code) {
      try {
        // Look for existing Stripe coupon, or create one
        const coupons = await stripe.coupons.list({ limit: 100 });
        const existing = coupons.data.find(c => c.name === coupon_code.toUpperCase());
        if (existing) {
          const promoList = await stripe.promotionCodes.list({ coupon: existing.id, code: coupon_code.toUpperCase() });
          if (promoList.data.length > 0) {
            discounts = [{ promotion_code: promoList.data[0].id }];
          }
        }
      } catch {
        // Coupon not found in Stripe — apply discount manually if valid
      }
    }

    // Stripe Checkout session — handle both authenticated and guest users
    let stripeCustomerId;
    const customerEmail = req.user
      ? (await supabase.from('profiles').select('email, full_name, stripe_customer_id').eq('id', req.user.id).single()).data
      : null;

    if (req.user) {
      stripeCustomerId = customerEmail?.stripe_customer_id;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: customerEmail?.email || req.user.email,
          name: customerEmail?.full_name || undefined,
          metadata: { supabase_user_id: req.user.id }
        });
        stripeCustomerId = customer.id;
        await supabase.from('profiles').update({ stripe_customer_id: stripeCustomerId }).eq('id', req.user.id);
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      ...(stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: guest_email || undefined }),
      line_items: lineItems,
      discounts: discounts.length > 0 ? discounts : undefined,
      allow_promotion_codes: discounts.length === 0,
      shipping_address_collection: shipping_address
        ? undefined
        : { allowed_countries: ['US', 'GB', 'DE', 'FR', 'DK', 'SE', 'NO', 'FI', 'NL', 'BE', 'CH', 'AT'] },
      ...(shipping_address ? {
        shipping_address_collection: undefined
      } : {}),
      metadata: {
        supabase_user_id: req.user?.id || '',
        coupon_code: coupon_code || '',
        items_json: JSON.stringify(items.map(i => {
          const slug = i.product_slug || i.product_id;
          return {
            product_slug: slug,
            product_id: slug,
            quantity: i.quantity,
            product_name: productMap[slug]?.name
          };
        }))
      },
      success_url: `${FRONTEND_URL}/order-confirmation.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/checkout.html?cancelled=true`,
      payment_intent_data: {
        metadata: {
          supabase_user_id: req.user?.id || ''
        }
      }
    });

    res.json({ url: session.url, session_id: session.id });
  })
);

// Verify a completed session (called from order-confirmation page)
app.get('/api/payments/verify-session', optionalAuth, asyncHandler(async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id required.' });

  let query = supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('stripe_checkout_session_id', session_id);

  // Authenticated users are scoped to their own orders; guests look up by session only
  if (req.user) query = query.eq('user_id', req.user.id);

  const { data: order, error } = await query.single();

  if (error || !order) {
    return res.status(202).json({ status: 'processing', message: 'Order is being confirmed.' });
  }

  res.json({ order });
}));

// ══════════════════════════════════════════════════════════════════════════════
//  STRIPE WEBHOOK
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/webhooks/stripe', asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = webhookSecret
      ? stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
      : JSON.parse(req.body.toString()); // dev mode without signature
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  console.log(`Stripe event: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await handleCheckoutComplete(session);
  }

  if (event.type === 'checkout.session.expired') {
    console.log('Checkout session expired:', event.data.object.id);
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object;
    await supabase
      .from('orders')
      .update({ status: 'refunded' })
      .eq('stripe_payment_intent_id', charge.payment_intent);
  }

  res.json({ received: true });
}));

async function handleCheckoutComplete(session) {
  // Prevent duplicate order creation
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_checkout_session_id', session.id)
    .single();
  if (existing) return;

  const userId = session.metadata?.supabase_user_id;
  const itemsRaw = session.metadata?.items_json;
  let items = [];
  try { items = JSON.parse(itemsRaw || '[]'); } catch {}

  const subtotal  = (session.amount_subtotal || 0) / 100;
  const total     = (session.amount_total || 0) / 100;
  const shipping  = (session.shipping_cost?.amount_total || 0) / 100;
  const discount  = (session.total_details?.amount_discount || 0) / 100;

  const shippingAddr = session.shipping_details?.address
    ? {
        full_name:   session.shipping_details.name,
        line1:       session.shipping_details.address.line1,
        line2:       session.shipping_details.address.line2,
        city:        session.shipping_details.address.city,
        state:       session.shipping_details.address.state,
        postal_code: session.shipping_details.address.postal_code,
        country:     session.shipping_details.address.country
      }
    : null;

  // Create order
  const { data: order, error: oErr } = await supabase
    .from('orders')
    .insert({
      user_id:                    userId || null,
      guest_email:                session.customer_details?.email,
      status:                     'payment_received',
      subtotal_amount:            subtotal,
      discount_amount:            discount,
      shipping_amount:            shipping,
      total_amount:               total,
      coupon_code:                session.metadata?.coupon_code || null,
      shipping_address:           shippingAddr,
      stripe_payment_intent_id:   session.payment_intent,
      stripe_checkout_session_id: session.id,
      estimated_delivery_weeks:   10
    })
    .select('id, order_number')
    .single();

  if (oErr) {
    console.error('Order creation error:', oErr.message);
    return;
  }

  // Save order items from DB prices (authoritative)
  if (items.length > 0) {
    const productSlugs = items.map(i => i.product_slug || i.product_id).filter(Boolean);
    let products = [];
    if (productSlugs.length > 0) {
      const { data } = await supabase
        .from('products')
        .select('id, slug, name, price, material, product_images(url, is_primary)')
        .in('slug', productSlugs);
      products = data || [];
    }

    const productMap = Object.fromEntries(products.map(p => [p.slug, p]));
    const orderItems = items.map(item => {
      const slug = item.product_slug || item.product_id;
      const p = productMap[slug];
      if (!p) return null;
      const img = p.product_images?.find(i => i.is_primary) || p.product_images?.[0];
      return {
        order_id:         order.id,
        product_id:       p.id,
        product_name:     p.name,
        product_material: p.material,
        product_image:    img?.url || null,
        quantity:         item.quantity,
        unit_price:       p.price,
        total_price:      p.price * item.quantity
      };
    }).filter(Boolean);

    if (orderItems.length > 0) {
      await supabase.from('order_items').insert(orderItems);
    }
  }

  // Record status history
  await supabase.from('order_status_history').insert({
    order_id: order.id,
    status: 'payment_received',
    note: 'Payment confirmed via Stripe'
  });

  // Record payment
  await supabase.from('payments').insert({
    order_id:                   order.id,
    stripe_payment_intent_id:   session.payment_intent,
    stripe_checkout_session_id: session.id,
    amount:                     total,
    currency:                   session.currency,
    status:                     'succeeded',
    payment_method_type:        session.payment_method_types?.[0]
  });

  // Clear DB cart
  if (userId) {
    await supabase.from('cart_items').delete().eq('user_id', userId);
  }

  // Increment coupon usage
  const couponCode = session.metadata?.coupon_code;
  if (couponCode) {
    await supabase.rpc('increment_coupon_usage', { p_code: couponCode }).catch(() => {});
  }

  console.log(`✅  Order created: ${order.order_number}`);
}

// ══════════════════════════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/orders', requireAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total_amount, currency, created_at, order_items(product_name, quantity, unit_price, product_image)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  res.json(data || []);
}));

app.get('/api/orders/:id', requireAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      order_status_history(status, note, created_at)
    `)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Order not found.' });
  res.json(data);
}));

// ══════════════════════════════════════════════════════════════════════════════
//  USER PROFILE & ADDRESSES
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/profile', requireAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, role, marketing_opt_in, created_at')
    .eq('id', req.user.id)
    .single();
  if (error) throw error;
  res.json(data);
}));

app.patch('/api/profile', requireAuth, asyncHandler(async (req, res) => {
  const { full_name, phone, marketing_opt_in } = req.body;
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, phone, marketing_opt_in })
    .eq('id', req.user.id)
    .select('id, email, full_name, phone, marketing_opt_in')
    .single();
  if (error) throw error;
  res.json(data);
}));

app.get('/api/addresses', requireAuth, asyncHandler(async (req, res) => {
  const { data } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', req.user.id)
    .order('is_default', { ascending: false });
  res.json(data || []);
}));

app.post('/api/addresses', requireAuth, asyncHandler(async (req, res) => {
  const { full_name, line1, line2, city, state, postal_code, country, phone, label, is_default } = req.body;
  if (!full_name || !line1 || !city || !postal_code || !country) {
    return res.status(400).json({ error: 'Required address fields missing.' });
  }
  if (is_default) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', req.user.id);
  }
  const { data, error } = await supabase
    .from('addresses')
    .insert({ user_id: req.user.id, full_name, line1, line2, city, state, postal_code, country, phone, label, is_default })
    .select().single();
  if (error) throw error;
  res.status(201).json(data);
}));

app.delete('/api/addresses/:id', requireAuth, asyncHandler(async (req, res) => {
  await supabase.from('addresses').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ deleted: true });
}));

// ══════════════════════════════════════════════════════════════════════════════
//  REVIEWS
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/reviews', requireAuth, asyncHandler(async (req, res) => {
  const { product_id, order_id, rating, title, body } = req.body;
  if (!product_id || !rating) return res.status(400).json({ error: 'product_id and rating required.' });

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id,
      user_id: req.user.id,
      order_id: order_id || null,
      rating,
      title,
      body,
      is_verified_purchase: !!order_id
    })
    .select().single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'You have already reviewed this product.' });
    throw error;
  }
  res.status(201).json(data);
}));

// ══════════════════════════════════════════════════════════════════════════════
//  CONTACT & NEWSLETTER
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/contact', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), asyncHandler(async (req, res) => {
  const { first_name, email, subject, message } = req.body;
  if (!first_name || !email || !message) {
    return res.status(400).json({ error: 'first_name, email, and message are required.' });
  }
  await supabase.from('contact_submissions').insert({ ...req.body });
  res.json({ success: true, message: 'Thank you. We\'ll be in touch within 2 business days.' });
}));

app.post('/api/subscribe', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required.' });
  const { error } = await supabase.from('subscribers').insert({ email: email.toLowerCase().trim() });
  if (error) {
    if (error.code === '23505') return res.json({ success: true, message: 'You\'re already subscribed.' });
    throw error;
  }
  res.json({ success: true, message: 'Subscribed successfully.' });
}));

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// Dashboard analytics
app.get('/api/admin/analytics', requireAdmin, asyncHandler(async (req, res) => {
  const [
    { count: totalOrders },
    { count: totalCustomers },
    { count: pendingOrders },
    { data: revenueData }
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .neq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('role', 'customer'),
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .eq('status', 'payment_received'),
    supabase.from('orders').select('total_amount')
      .in('status', ['payment_received', 'confirmed', 'in_production', 'shipped', 'delivered'])
  ]);

  const totalRevenue = (revenueData || []).reduce((s, o) => s + (o.total_amount || 0), 0);

  res.json({
    totalOrders,
    totalCustomers,
    pendingOrders,
    totalRevenue: totalRevenue.toFixed(2)
  });
}));

// List all orders
app.get('/api/admin/orders', requireAdmin, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('orders')
    .select(`
      id, order_number, status, total_amount, currency, created_at, guest_email,
      user_id,
      order_items(product_name, quantity, unit_price)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) throw error;
  res.json({ orders: data, total: count, page: Number(page), limit: Number(limit) });
}));

// Get single order (admin)
app.get('/api/admin/orders/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_status_history(*), payments(*)')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Order not found.' });
  res.json(data);
}));

// Update order status
app.patch('/api/admin/orders/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { status, tracking_number, tracking_url, note } = req.body;
  const validStatuses = ['pending','payment_received','confirmed','in_production','shipped','delivered','cancelled','refunded'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const updates = {};
  if (status) updates.status = status;
  if (tracking_number !== undefined) updates.tracking_number = tracking_number;
  if (tracking_url !== undefined) updates.tracking_url = tracking_url;

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', req.params.id)
    .select().single();

  if (error) throw error;

  if (status) {
    await supabase.from('order_status_history').insert({
      order_id: req.params.id,
      status,
      note: note || null,
      changed_by: req.user.id
    });
  }

  res.json(data);
}));

// List products (admin)
app.get('/api/admin/products', requireAdmin, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, price, is_active, is_featured, is_new_arrival, categories(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data);
}));

// Update product (admin)
app.patch('/api/admin/products/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { name, price, is_active, is_featured, is_new_arrival, description } = req.body;
  const updates = {};
  if (name !== undefined)          updates.name = name;
  if (price !== undefined)         updates.price = price;
  if (is_active !== undefined)     updates.is_active = is_active;
  if (is_featured !== undefined)   updates.is_featured = is_featured;
  if (is_new_arrival !== undefined) updates.is_new_arrival = is_new_arrival;
  if (description !== undefined)   updates.description = description;

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', req.params.id)
    .select().single();
  if (error) throw error;
  res.json(data);
}));

// List customers (admin)
app.get('/api/admin/customers', requireAdmin, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, role, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  res.json(data);
}));

// Publish / unpublish review (admin)
app.patch('/api/admin/reviews/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { is_published } = req.body;
  const { data, error } = await supabase
    .from('reviews')
    .update({ is_published })
    .eq('id', req.params.id)
    .select().single();
  if (error) throw error;
  res.json(data);
}));

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

app.use((err, req, res, next) => {
  console.error('Server error:', err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message
  });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
✅  Dane Design backend running
   http://localhost:${PORT}
   Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

module.exports = app;
