-- ============================================================
-- Dane Design — Complete Database Schema
-- Run this in Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  num TEXT;
BEGIN
  LOOP
    num := 'DD-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE order_number = num);
  END LOOP;
  RETURN num;
END;
$$ LANGUAGE plpgsql;

-- ─── PROFILES ───────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id                UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email             TEXT NOT NULL,
  full_name         TEXT,
  phone             TEXT,
  avatar_url        TEXT,
  role              TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  stripe_customer_id TEXT,
  marketing_opt_in  BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── CATEGORIES ─────────────────────────────────────────────────────────────

CREATE TABLE categories (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id   UUID REFERENCES categories(id),
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────

CREATE TABLE products (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  description         TEXT,
  long_description    TEXT,
  price               NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price    NUMERIC(10,2),
  category_id         UUID REFERENCES categories(id),
  material            TEXT,
  dimensions          TEXT,
  weight_kg           NUMERIC(5,2),
  origin              TEXT DEFAULT 'Denmark',
  is_active           BOOLEAN DEFAULT TRUE,
  is_featured         BOOLEAN DEFAULT FALSE,
  is_new_arrival      BOOLEAN DEFAULT FALSE,
  is_design_classic   BOOLEAN DEFAULT FALSE,
  lead_time_weeks     INT DEFAULT 8,
  meta_title          TEXT,
  meta_description    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_slug ON products(slug);

-- Product images
CREATE TABLE product_images (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  url         TEXT NOT NULL,
  alt         TEXT,
  sort_order  INT DEFAULT 0,
  is_primary  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_product_images_product ON product_images(product_id);

-- Product variants (wood finish, fabric colour, etc.)
CREATE TABLE product_variants (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id       UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  sku              TEXT UNIQUE,
  price_adjustment NUMERIC(10,2) DEFAULT 0,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_variants_product ON product_variants(product_id);

-- ─── INVENTORY ───────────────────────────────────────────────────────────────

CREATE TABLE inventory (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id          UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE NOT NULL,
  quantity            INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold INT DEFAULT 5,
  track_inventory     BOOLEAN DEFAULT FALSE, -- Most Dane pieces are made-to-order
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COLLECTIONS ─────────────────────────────────────────────────────────────

CREATE TABLE collections (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_collections (
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  sort_order    INT DEFAULT 0,
  PRIMARY KEY (product_id, collection_id)
);

-- ─── ADDRESSES ───────────────────────────────────────────────────────────────

CREATE TABLE addresses (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label        TEXT DEFAULT 'Home',
  full_name    TEXT NOT NULL,
  line1        TEXT NOT NULL,
  line2        TEXT,
  city         TEXT NOT NULL,
  state        TEXT,
  postal_code  TEXT NOT NULL,
  country      TEXT NOT NULL DEFAULT 'DK',
  phone        TEXT,
  is_default   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ─── CART ────────────────────────────────────────────────────────────────────

CREATE TABLE cart_items (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  TEXT, -- guest cart
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_id  UUID REFERENCES product_variants(id),
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (user_id, product_id, variant_id)
);
CREATE TRIGGER trg_cart_updated BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_session ON cart_items(session_id);

-- ─── WISHLIST ─────────────────────────────────────────────────────────────────

CREATE TABLE wishlist_items (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);
CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);

-- ─── COUPONS ──────────────────────────────────────────────────────────────────

CREATE TABLE coupons (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code             TEXT NOT NULL UNIQUE,
  type             TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value            NUMERIC(10,2) NOT NULL CHECK (value > 0),
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_uses         INT,
  uses_count       INT DEFAULT 0,
  expires_at       TIMESTAMPTZ,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDERS ───────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id                            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number                  TEXT NOT NULL UNIQUE DEFAULT generate_order_number(),
  user_id                       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email                   TEXT,
  status                        TEXT NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','payment_received','confirmed',
                                                    'in_production','shipped','delivered',
                                                    'cancelled','refunded')),
  subtotal                      NUMERIC(10,2) NOT NULL,
  discount_amount               NUMERIC(10,2) DEFAULT 0,
  shipping_amount               NUMERIC(10,2) DEFAULT 0,
  total                         NUMERIC(10,2) NOT NULL,
  currency                      TEXT DEFAULT 'usd',
  coupon_id                     UUID REFERENCES coupons(id),
  coupon_code                   TEXT,
  shipping_address              JSONB,
  billing_address               JSONB,
  notes                         TEXT,
  stripe_payment_intent_id      TEXT,
  stripe_checkout_session_id    TEXT UNIQUE,
  estimated_delivery_weeks      INT DEFAULT 10,
  tracking_number               TEXT,
  tracking_url                  TEXT,
  created_at                    TIMESTAMPTZ DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_stripe_session ON orders(stripe_checkout_session_id);

-- Order items
CREATE TABLE order_items (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id         UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id       UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id       UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name     TEXT NOT NULL,
  product_material TEXT,
  product_image    TEXT,
  quantity         INT NOT NULL DEFAULT 1,
  unit_price       NUMERIC(10,2) NOT NULL,
  total_price      NUMERIC(10,2) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Order status history (audit trail)
CREATE TABLE order_status_history (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status      TEXT NOT NULL,
  note        TEXT,
  changed_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_status_history_order ON order_status_history(order_id);

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────────

CREATE TABLE payments (
  id                          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id                    UUID REFERENCES orders(id),
  stripe_payment_intent_id    TEXT,
  stripe_checkout_session_id  TEXT,
  amount                      NUMERIC(10,2) NOT NULL,
  currency                    TEXT DEFAULT 'usd',
  status                      TEXT NOT NULL,
  payment_method_type         TEXT,
  metadata                    JSONB,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_order ON payments(order_id);

-- ─── REVIEWS ──────────────────────────────────────────────────────────────────

CREATE TABLE reviews (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id           UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id             UUID REFERENCES orders(id),
  rating               INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                TEXT,
  body                 TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_published         BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- ─── NEWSLETTER / BOOKINGS (already used by supabase-integration.js) ──────────

CREATE TABLE IF NOT EXISTS subscribers (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  phone          TEXT,
  showroom       TEXT NOT NULL,
  preferred_date DATE,
  message        TEXT,
  status         TEXT DEFAULT 'pending',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CONTACT SUBMISSIONS ──────────────────────────────────────────────────────

CREATE TABLE contact_submissions (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name  TEXT,
  email      TEXT NOT NULL,
  subject    TEXT,
  message    TEXT NOT NULL,
  status     TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory            ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections          ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions  ENABLE ROW LEVEL SECURITY;

-- Public read on catalog
CREATE POLICY "Public can read active products" ON products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can read categories"      ON categories FOR SELECT USING (TRUE);
CREATE POLICY "Public can read product_images"  ON product_images FOR SELECT USING (TRUE);
CREATE POLICY "Public can read product_variants" ON product_variants FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can read collections"     ON collections FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can read product_collections" ON product_collections FOR SELECT USING (TRUE);
CREATE POLICY "Public can read published reviews"   ON reviews FOR SELECT USING (is_published = TRUE);

-- Profiles: users can read/update their own
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Addresses
CREATE POLICY "Users manage own addresses" ON addresses
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cart
CREATE POLICY "Users manage own cart" ON cart_items
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Wishlist
CREATE POLICY "Users manage own wishlist" ON wishlist_items
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders: users see their own
CREATE POLICY "Users read own orders" ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Order items: users see items belonging to their orders
CREATE POLICY "Users read own order items" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- Reviews: users can insert their own
CREATE POLICY "Users insert reviews" ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Newsletter: anyone can subscribe
CREATE POLICY "Anyone can subscribe" ON subscribers FOR INSERT WITH CHECK (TRUE);

-- Bookings: anyone can book
CREATE POLICY "Anyone can book" ON bookings FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can submit contact" ON contact_submissions FOR INSERT WITH CHECK (TRUE);

-- Coupons: authenticated users can read active coupons (to validate)
CREATE POLICY "Auth users read active coupons" ON coupons FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- Admin policies (service role bypasses RLS; these are for authenticated admin users)
CREATE POLICY "Admins full access products" ON products USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins full access orders" ON orders USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins full access profiles" ON profiles USING (
  auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ─── SEED DATA ───────────────────────────────────────────────────────────────

-- Categories
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Seating',     'seating',     1),
  ('Lighting',    'lighting',    2),
  ('Tables',      'tables',      3),
  ('Storage',     'storage',     4),
  ('Accessories', 'accessories', 5),
  ('Outdoor',     'outdoor',     6)
ON CONFLICT (slug) DO NOTHING;

-- Collections
INSERT INTO collections (name, slug, sort_order) VALUES
  ('New Arrivals',    'new-arrivals',    1),
  ('Design Classics', 'design-classics', 2),
  ('Outdoor',         'outdoor',         3),
  ('Gift Ideas',      'gift-ideas',      4)
ON CONFLICT (slug) DO NOTHING;

-- Coupons (sample)
INSERT INTO coupons (code, type, value, min_order_amount, max_uses, expires_at) VALUES
  ('WELCOME10', 'percentage', 10, 500,  NULL,  NOW() + INTERVAL '1 year'),
  ('SAVE200',   'fixed',      200, 1000, 500,  NOW() + INTERVAL '6 months'),
  ('NEWROOM15', 'percentage', 15, 2000, 100,   NOW() + INTERVAL '3 months')
ON CONFLICT (code) DO NOTHING;

-- Products (matching app.js catalog + category pages)
WITH cats AS (
  SELECT id, slug FROM categories
)
INSERT INTO products (slug, name, description, price, category_id, material, is_active, is_featured, is_new_arrival)
VALUES
  -- Seating
  ('aura-lounge-chair',   'Aura Lounge Chair',    'Ergonomic harmony meets timeless form. Light ash frame with premium bouclé upholstery.',                              1250,  (SELECT id FROM cats WHERE slug='seating'),     'Light Ash & Bouclé',             TRUE, TRUE,  FALSE),
  ('freya-lounge-chair',  'Freya Lounge Chair',   'Engineered for optimal comfort. Steam-bent ash frame with luxurious bouclé wool. W78 D82 H104cm.',                   1850,  (SELECT id FROM cats WHERE slug='seating'),     'Solid Ash, Bouclé Wool',         TRUE, TRUE,  FALSE),
  ('odin-oak-stool',      'Odin Oak Stool',       'Pure solid blonde oak in a timeless stool form. Sustainably sourced Scandinavian hardwood.',                          450,   (SELECT id FROM cats WHERE slug='seating'),     'Solid Blonde Oak',               TRUE, FALSE, FALSE),
  ('nordic-dining-chairs','Nordic Dining Chairs', 'Classic Scandinavian dining chairs in beech with traditional paper cord weave. Set of 2.',                            890,   (SELECT id FROM cats WHERE slug='seating'),     'Beech & Paper Cord (Set of 2)',  TRUE, FALSE, FALSE),
  ('hav-dining-chair',    'Hav Dining Chair',     'Solid oak dining chair with hand-woven paper cord seat. In production since 1994.',                                   680,   (SELECT id FROM cats WHERE slug='seating'),     'Solid Oak, Paper Cord',          TRUE, FALSE, FALSE),
  ('helga-three-seat',    'Helga Three-Seat Sofa','Modular down-fill sofa with natural wool upholstery. In production since 2009.',                                      6400,  (SELECT id FROM cats WHERE slug='seating'),     'Modular Down-fill, Natural Wool',TRUE, FALSE, FALSE),
  ('bergen-armchair',     'Bergen Armchair',       'Natural linen armchair with oiled teak legs. A recent addition to the collection.',                                   2100,  (SELECT id FROM cats WHERE slug='seating'),     'Natural Linen, Oiled Teak',      TRUE, FALSE, TRUE),
  -- Lighting
  ('aura-floor-lamp',     'Aura Floor Lamp',      'Slender brushed steel floor lamp with warm spherical frosted glass head.',                                            580,   (SELECT id FROM cats WHERE slug='lighting'),    'Brushed Steel & Frosted Glass',  TRUE, FALSE, FALSE),
  ('lumina-pendant',      'Lumina Pendant',        'Pleated organic paper pendant diffusing warm ambient light. Ideal for dining and living spaces.',                     890,   (SELECT id FROM cats WHERE slug='lighting'),    'Hand-spun Brass, Opal Glass',    TRUE, TRUE,  FALSE),
  ('vesper-wall-sconce',  'Vesper Wall Sconce',   'Charcoal powder-coated aluminum wall sconce casting a soft directional downward glow.',                               185,   (SELECT id FROM cats WHERE slug='lighting'),    'Powder Coated Aluminium',        TRUE, FALSE, FALSE),
  ('lumen-desk-lamp',     'Lumen Desk Lamp',       'Sleek adjustable desk lamp with integrated touch-sensitive dimmer and warm high-CRI LED.',                           320,   (SELECT id FROM cats WHERE slug='lighting'),    'Matte Black Steel',              TRUE, FALSE, FALSE),
  ('fjaril-arc-lamp',     'Fjäril Arc Floor Lamp', 'Brushed brass arc floor lamp with linen shade. Three years of development by Mikkel Kjær.',                         1120,  (SELECT id FROM cats WHERE slug='lighting'),    'Brushed Brass, Linen Shade',     TRUE, FALSE, TRUE),
  ('isvik-chandelier',    'Isvik Chandelier',      'Hand-blown smoked glass chandelier on blackened steel armature.',                                                     4100,  (SELECT id FROM cats WHERE slug='lighting'),    'Hand-blown Smoked Glass, Steel', TRUE, FALSE, TRUE),
  -- Tables
  ('architects-desk',     "The Architect's Desk",  'Mid-century inspired solid oak desk with frosted glass top. W160×D80×H75cm.',                                       1250,  (SELECT id FROM cats WHERE slug='tables'),      'Solid Oak & Frosted Glass',      TRUE, FALSE, FALSE),
  ('aura-side-table',     'Aura Side Table',       'Elegant marble top side table on a slender steel base. Ø45×H55cm.',                                                 450,   (SELECT id FROM cats WHERE slug='tables'),      'Marble & Steel',                 TRUE, FALSE, FALSE),
  ('levity-console',      'Levity Console',        'Floating walnut and acrylic console for entryways. W120×D35×H80cm.',                                                 890,   (SELECT id FROM cats WHERE slug='tables'),      'Walnut & Acrylic',               TRUE, FALSE, FALSE),
  ('fjord-dining-table',  'Fjord Dining Table',    'Solid ash dining table with clean Scandinavian lines. Seats 6–8. W220×D100×H74cm.',                                 5800,  (SELECT id FROM cats WHERE slug='tables'),      'Solid Ash',                      TRUE, TRUE,  FALSE),
  ('nordic-dining-set',   'Nordic Dining Set',     'Solid ash dining table with four matching minimalist chairs. Complete set.',                                          4800,  (SELECT id FROM cats WHERE slug='tables'),      'Solid Ash',                      TRUE, TRUE,  FALSE),
  ('tyr-extending-table', 'Tyr Extending Table',   'Solid white oak dining table with butterfly leaf extension. Extends from 180 to 260cm.',                             6200,  (SELECT id FROM cats WHERE slug='tables'),      'Solid White Oak',                TRUE, FALSE, TRUE),
  ('norn-round-table',    'Norn Round Table',      'Round solid oak dining table. Seats 4 comfortably at Ø120cm.',                                                       3800,  (SELECT id FROM cats WHERE slug='tables'),      'Solid Oak',                      TRUE, FALSE, TRUE),
  ('ymir-marble-table',   'Ymir Marble Table',     'Limited edition Calacatta marble dining table on solid oak trestle base. W200cm.',                                   9400,  (SELECT id FROM cats WHERE slug='tables'),      'Calacatta Marble, Solid Oak',    TRUE, FALSE, TRUE),
  -- Storage
  ('fjord-sideboard',     'Fjord Sideboard',       'Solid oak sideboard with fluted glass doors. Two adjustable shelves per bay, soft-close hinges.',                    3200,  (SELECT id FROM cats WHERE slug='storage'),     'Solid Oak & Fluted Glass',       TRUE, TRUE,  FALSE),
  ('aero-shelving',       'Aero Shelving',         'Modular powder-coated steel shelving. Configure shelf heights in 50mm increments.',                                  650,   (SELECT id FROM cats WHERE slug='storage'),     'Powder-coated Steel',            TRUE, FALSE, FALSE),
  ('horizon-console',     'Horizon Console',       'Matte lacquer console with three-drawer push-to-open system and natural stone top.',                                  1100,  (SELECT id FROM cats WHERE slug='storage'),     'Matte Lacquer & Stone',          TRUE, FALSE, TRUE),
  ('natt-wardrobe',       'Natt Wardrobe',         'Smoked oak wardrobe with cedar-lined interior and solid brass pulls. W220×H240×D62cm.',                              4600,  (SELECT id FROM cats WHERE slug='storage'),     'Smoked Oak, Cedar, Brass',       TRUE, FALSE, TRUE),
  ('isbjorn-cabinet',     'Isbjörn Display Cabinet','White oak display cabinet with hand-blown glass doors and integrated LED lighting.',                                3800,  (SELECT id FROM cats WHERE slug='storage'),     'White Oak, Hand-blown Glass',    TRUE, FALSE, TRUE),
  ('boreas-bookshelf',    'Boreas Bookshelf',      'Smoked oak bookshelf with adjustable shelves. W160×H200×D35cm.',                                                     2800,  (SELECT id FROM cats WHERE slug='storage'),     'Smoked Oak',                     TRUE, FALSE, TRUE),
  -- Accessories
  ('rime-vase',           'Rime Vase',             'Handcrafted ceramic vase in matte finish. Ideal for dried or fresh botanicals.',                                       120,   (SELECT id FROM cats WHERE slug='accessories'), 'Ceramic',                        TRUE, FALSE, FALSE),
  ('krono-clock',         'Krono Clock',           'Precision table clock in brass and glass. Minimalist face with silent quartz movement.',                              280,   (SELECT id FROM cats WHERE slug='accessories'), 'Brass & Glass',                  TRUE, FALSE, FALSE),
  ('alpaca-throw',        'Alpaca Throw',          'Sumptuous alpaca wool throw in a natural undyed palette. Ethically sourced from the Andes.',                          350,   (SELECT id FROM cats WHERE slug='accessories'), 'Alpaca Wool',                    TRUE, FALSE, FALSE),
  ('valet-tray',          'Valet Tray',            'Full-grain leather valet tray with rigid base for keys, wallet and everyday carry.',                                  190,   (SELECT id FROM cats WHERE slug='accessories'), 'Full-grain Leather',             TRUE, FALSE, FALSE)
ON CONFLICT (slug) DO NOTHING;

-- Product images (using existing CDN URLs from app.js)
WITH p AS (SELECT id, slug FROM products)
INSERT INTO product_images (product_id, url, alt, is_primary) VALUES
  ((SELECT id FROM p WHERE slug='aura-lounge-chair'),   'https://lh3.googleusercontent.com/aida-public/AB6AXuDofLJ9Lta216HrW6PKjVFpsojAaupbTaEWNjNaakeaytxwb7tiKkn9xM9X9LpPC-ICySP-JexkDLVS0j_zWvEbRseOfRWnY1aAeQ0Fyw2t4wONsRaWT4TcW0O8XPRZz0DHHPAODGEdMD3AfgvJD12jqC_kxyTCgEndVunnAtlIW12kNJr5k-4Zg0XVcxVsEbPpHsZoxbEqatIhmxQfOPpuj8tgFrMhfqQuGN-QJoSo8ByP-gudIZBNiHWFyTlh2Awj_y_A6KNp_aA','Aura Lounge Chair',TRUE),
  ((SELECT id FROM p WHERE slug='freya-lounge-chair'),  'https://lh3.googleusercontent.com/aida-public/AB6AXuCoBzom2bE46g4uzwehXy2D7IvICB5u7zucRBTQmrKepQKCZMlKvtVofA_syFWIvtJvuO-lRI-jOenZh2VFVHlu90eAOP5yTD7hs-_sYHdgLkMEb3NcmDP4Sot9yPU7-mNz7m_7-tvUCwZ7byg5QHPUyvT0dnR8kJsdu_o8gzG4jepY0DfrIIEaCSfJuDXMU30UXCjRMTo2vOmAOV1sNve7pLV-_v24e8irY1ezV6KRKv6WoJ3keDpCkqzLZzE4AXJpN3gM-0WU8D4','Freya Lounge Chair',TRUE),
  ((SELECT id FROM p WHERE slug='odin-oak-stool'),      'https://lh3.googleusercontent.com/aida-public/AB6AXuBh71N46M_NkHKnRcwXKChJEiQK57zi6YuZfxEDVzVq6bW-J2h33-gY6dsOUwk73b_AEhtm6etz-s_Ir0y2S9ZDhF_psMHbS4BB1vt_s1hgiIgxwQcL0VlV_3enZ58bhWBK11g_x8n0S8UJak4RY4WgI7X-Yn9shJGqqANQH0_B34H6zXIKxrhjZpa9letttW_Ze9tptYjpeqVXJpkOu7SnIrrEGBk6zzDRGPZKuXa79QMBHNTpWqzAE_pNYlnyRr6UZ7UUKWqTKVg','Odin Oak Stool',TRUE),
  ((SELECT id FROM p WHERE slug='aura-floor-lamp'),     'https://lh3.googleusercontent.com/aida-public/AB6AXuDGD53iL_ENLzR3s2s8_lcsgIaQBkkqSCqEgjcielsF9Xe7YmczX5bc_rUv_Z0gs1SF8ioA5bdzO0LEw0N25lSESRNoVluJ53P4NN7fWAZIR9rDfX1STiatsFcs4Gj01eOpT_02jRumYU3ONszKETT5CZ-jgXFWdXrw1IoZ17YIKp2qvhfbGXOuVZu1fr9Of3QqylHm2g-T5WC1rXH_i60nTru89wHhejsF6om3tgLkfhV2feh9PpPJaHDBFb9sGfaQgt9Z5-_eRmQ','Aura Floor Lamp',TRUE),
  ((SELECT id FROM p WHERE slug='lumina-pendant'),      'https://lh3.googleusercontent.com/aida-public/AB6AXuCr-MDoWNO1UnlybOf5tDTHc7VmykTLuGGrm9XbKUmOBy17KMcozHX_Xx0vidH3mbbrjNU0ezAKAqJy0DESuJrMS-ztIDTPF0kWmbdCR1X22ZhwhiGU9y41LwwYlJHiG404DUzOB6HFNMwcjPcR9tK4fTi9C8bKX3DJgMoo94fMs9488hpDLrgfb8GkAZcPioXT1rXFFifykpBDnU6Z9ickUktZ5gObQsBQZbtraFX3t0mnOqIvHOLh4CFLs-gntxIrwGDEZXrestg','Lumina Pendant',TRUE),
  ((SELECT id FROM p WHERE slug='lumen-desk-lamp'),     'https://lh3.googleusercontent.com/aida-public/AB6AXuC_tzFjJD5NK4tKBH6W3l6qiGpuu3Og6ADed5ErvfUkru9Ulkr0_VEZdhhUzP-WvutKHB0dUbbaEfNtnhxmP5a5AWb5tGtiWha-SjQWq9O9xUxM8fM6dW0-QXSfjelSKyhz43ct4mjSkvJlAIElxMQgP2f2AkOYVTYGNv5DSanllkN2rNL-yfVqq-odm1fX40zLSe0K-iCyzPwddvnfT4vLaTW-h8O8EbBd_6mqgs5hG7jqKLbe-gdxfEQcs8a18Q6agk','Lumen Desk Lamp',TRUE),
  ((SELECT id FROM p WHERE slug='fjord-sideboard'),     'https://lh3.googleusercontent.com/aida-public/AB6AXuBI46ivevE32l_A9f2Kw-_pEncNLgy0r9Jz_xvAd9BC9AyuKGcVBhquNBb5fGs3wLKTYUwWhaQS5-zcCvVRqobZROGKFxfUSR0H4UwbjROELy8FyhcXnwvVjqDeGvzcN5o0ee1FCS95suLB_vNeY0RzfJbt0KX-VA5TaYdIYwNKQUSDgO9tWvrx4cikxfblcfpoefnxRXURDCAR2zKIb0I0OEo-RBRT27HCX5dJLp9POtaI2XXjSsV0wwvgqnOgcMvKHIcLV9JSBik','Fjord Sideboard',TRUE),
  ((SELECT id FROM p WHERE slug='nordic-dining-set'),   'https://lh3.googleusercontent.com/aida-public/AB6AXuALpNag2eHwVF1RBKAkqNItSHRvKuif0dPkJGPrpNNyUTz4hxRh49bgCD1yAVIJfSifCJmM9LxZpEMpZLaiz6THizFB1T5fk8Zsg0D_wVuOe9ZK2td2raRMf7LSr4OOk-NuXKOEL5i36LlmuPT1IlHIpbMIlxW8E7E4jFQ13FCyit1t2SGHrkFEFktIxhCoXZOBrHEMfnvuNe62rGlUBpnGVPzzIHyoWUfTlbUYgr_u9ZTxp9JiH4ykOVslISd-2ipgVNRMNQzonLE','Nordic Dining Set',TRUE)
ON CONFLICT DO NOTHING;

-- Inventory (made-to-order by default, track_inventory=false)
INSERT INTO inventory (product_id, quantity, track_inventory)
SELECT id, 0, FALSE FROM products
ON CONFLICT (product_id) DO NOTHING;
