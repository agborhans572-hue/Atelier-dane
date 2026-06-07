/* Dane Design — Full App Integration
   Cart · Wishlist · Search · Auth · Quickview · Filters
   All state stored in localStorage; Auth via Supabase REST */
(function () {
  'use strict';

  // ─── CONFIG ──────────────────────────────────────────────────────────────────
  var SUPA_URL    = 'https://owmddpatncdmjhaxdsqq.supabase.co';
  var SUPA_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bWRkcGF0bmNkbWpoYXhkc3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc1NDYsImV4cCI6MjA5NjMzMzU0Nn0.IYAJj8f1DM5pycg5sfZrlUc_ZKS3z3SrDU3sJ8crtj4';
  var BACKEND_URL = (window.DANE_CONFIG && window.DANE_CONFIG.backendUrl) || 'http://localhost:3001';

  function syncCartToBackend(token) {
    var items = Cart.get();
    if (!items.length || !token) return;
    var payload = items.map(function(i) { return { product_slug: i.id, quantity: i.qty }; });
    fetch(BACKEND_URL + '/api/cart/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ items: payload })
    }).catch(function() {}); // non-fatal — cart still works from localStorage
  }

  // ─── PRODUCT CATALOG ─────────────────────────────────────────────────────────
  var PRODUCTS = [
    // Seating
    { id: 'aura-lounge-chair',    name: 'Aura Lounge Chair',     category: 'Seating',     price: 1250, material: 'Light Ash & Bouclé',          page: 'seating.html',  desc: 'Ergonomic harmony meets timeless form. Light ash frame with premium bouclé upholstery.',                         img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDofLJ9Lta216HrW6PKjVFpsojAaupbTaEWNjNaakeaytxwb7tiKkn9xM9X9LpPC-ICySP-JexkDLVS0j_zWvEbRseOfRWnY1aAeQ0Fyw2t4wONsRaWT4TcW0O8XPRZz0DHHPAODGEdMD3AfgvJD12jqC_kxyTCgEndVunnAtlIW12kNJr5k-4Zg0XVcxVsEbPpHsZoxbEqatIhmxQfOPpuj8tgFrMhfqQuGN-QJoSo8ByP-gudIZBNiHWFyTlh2Awj_y_A6KNp_aA' },
    { id: 'freya-lounge-chair',   name: 'Freya Lounge Chair',    category: 'Seating',     price: 1850, material: 'Solid Ash, Bouclé Wool',       page: 'seating.html',  desc: 'Engineered for optimal comfort. Steam-bent ash frame with luxurious bouclé wool. W78 D82 H104cm.',            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoBzom2bE46g4uzwehXy2D7IvICB5u7zucRBTQmrKepQKCZMlKvtVofA_syFWIvtJvuO-lRI-jOenZh2VFVHlu90eAOP5yTD7hs-_sYHdgLkMEb3NcmDP4Sot9yPU7-mNz7m_7-tvUCwZ7byg5QHPUyvT0dnR8kJsdu_o8gzG4jepY0DfrIIEaCSfJuDXMU30UXCjRMTo2vOmAOV1sNve7pLV-_v24e8irY1ezV6KRKv6WoJ3keDpCkqzLZzE4AXJpN3gM-0WU8D4' },
    { id: 'odin-oak-stool',       name: 'Odin Oak Stool',        category: 'Seating',     price: 450,  material: 'Solid Blonde Oak',             page: 'seating.html',  desc: 'Pure solid blonde oak in a timeless stool form. Sustainably sourced Scandinavian hardwood.',                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBh71N46M_NkHKnRcwXKChJEiQK57zi6YuZfxEDVzVq6bW-J2h33-gY6dsOUwk73b_AEhtm6etz-s_Ir0y2S9ZDhF_psMHbS4BB1vt_s1hgiIgxwQcL0VlV_3enZ58bhWBK11g_x8n0S8UJak4RY4WgI7X-Yn9shJGqqANQH0_B34H6zXIKxrhjZpa9letttW_Ze9tptYjpeqVXJpkOu7SnIrrEGBk6zzDRGPZKuXa79QMBHNTpWqzAE_pNYlnyRr6UZ7UUKWqTKVg' },
    { id: 'nordic-dining-chairs', name: 'Nordic Dining Chairs',  category: 'Seating',     price: 890,  material: 'Beech & Paper Cord (Set of 2)',  page: 'seating.html',  desc: 'Classic Scandinavian dining chairs in beech with traditional paper cord weave. Set of 2.',                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpcRKGog3ytue8hmi846vXdl467w7rJqD3xSN8bNfhbohK26UDY1iXNq5ThKEnZSjSxoqPun7X2s5q7leEK-HESuJ1BLQTP1ZsB5HcBmz_j4VsI8Uj9dsgFf_LimJsEptKzegOpT673y5PpWTKYy8oZ7tZWMuEcV-4xF5sqxGpZb7ramh2dIO7UgcCFa5er4nNz0VJ7zrUvQpu1fGXT0bfHCtFnB9_sziFkRioIYQbcd7F6O6KAbXYWy4pbfRy6g2lwxvsbx-hTG8' },
    // Lighting
    { id: 'aura-floor-lamp',      name: 'Aura Floor Lamp',       category: 'Lighting',    price: 580,  material: 'Brushed Steel & Frosted Glass',  page: 'lighting.html', desc: 'New arrival. Slender brushed steel floor lamp with warm spherical frosted glass head.',                       img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGD53iL_ENLzR3s2s8_lcsgIaQBkkqSCqEgjcielsF9Xe7YmczX5bc_rUv_Z0gs1SF8ioA5bdzO0LEw0N25lSESRNoVluJ53P4NN7fWAZIR9rDfX1STiatsFcs4Gj01eOpT_02jRumYU3ONszKETT5CZ-jgXFWdXrw1IoZ17YIKp2qvhfbGXOuVZu1fr9Of3QqylHm2g-T5WC1rXH_i60nTru89wHhejsF6om3tgLkfhV2feh9PpPJaHDBFb9sGfaQgt9Z5-_eRmQ' },
    { id: 'lumina-pendant',       name: 'Lumina Pendant',        category: 'Lighting',    price: 450,  material: 'Organic Pleated Paper',          page: 'lighting.html', desc: 'Pleated organic paper pendant diffusing warm ambient light. Ideal for dining and living spaces.',            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCr-MDoWNO1UnlybOf5tDTHc7VmykTLuGGrm9XbKUmOBy17KMcozHX_Xx0vidH3mbbrjNU0ezAKAqJy0DESuJrMS-ztIDTPF0kWmbdCR1X22ZhwhiGU9y41LwwYlJHiG404DUzOB6HFNMwcjPcR9tK4fTi9C8bKX3DJgMoo94fMs9488hpDLrgfb8GkAZcPioXT1rXFFifykpBDnU6Z9ickUktZ5gObQsBQZbtraFX3t0mnOqIvHOLh4CFLs-gntxIrwGDEZXrestg' },
    { id: 'vesper-wall-sconce',   name: 'Vesper Wall Sconce',    category: 'Lighting',    price: 185,  material: 'Powder Coated Aluminum',         page: 'lighting.html', desc: 'Charcoal powder-coated aluminum wall sconce casting a soft directional downward glow.',                       img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDP6ziSqnDYpuhuC9_ysJoFUDytpuzh0j3LpNtn5_oCtzlCyzqmT1aQ7E73RJ1-mfGXc2x3hYrMvpfnjSvr-j4PH3qsg12_E-bPSbzee6lzsl8LjKiMumweRXtW6xLOnxwJC_Qbnie3pRFtV1V7vH3fG69k6nQKA9L1lR-P5LvcYVjqmxRX_nLTpARVm6DmXx8lHSP2i_6E7CuBaqEylinfhE8BGKi83gTLaki-r_tVhpErhLwSykZAS09D4QjRW7rhjZX0wFyoDw4' },
    { id: 'lumen-desk-lamp',      name: 'Lumen Desk Lamp',       category: 'Lighting',    price: 220,  material: 'Touch-Sensitive Controls',       page: 'lighting.html', desc: 'Sleek adjustable desk lamp with integrated touch-sensitive dimmer and warm high-CRI LED.',                    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_tzFjJD5NK4tKBH6W3l6qiGpuu3Og6ADed5ErvfUkru9Ulkr0_VEZdhhUzP-WvutKHB0dUbbaEfNtnhxmP5a5AWb5tGtiWha-SjQWq9O9xUxM8fM6dW0-QXSfjelSKyhz43ct4mjSkvJlAIElxMQgP2f2AkOYVTYGNv5DSanllkN2rNL-Jbx6zlNJ-yfVqq-odm1fX40zLSe0K-iCyzPwddvnfT4vLaTW-h8O8EbBd_6mqgs5hG7jqKLbe-gdxfEQcs8a18Q6agk' },
    // Tables
    { id: 'architects-desk',      name: "The Architect's Desk",  category: 'Tables',      price: 1250, material: 'Solid Oak & Frosted Glass',     page: 'tables.html',   desc: 'Mid-century inspired solid oak desk with frosted glass top. W160×D80×H75cm.',                                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAONb8hQwDOXFS3YTQsOlTVYwkd9Q8sbc6khXxgrDLhIsnh6iw1SvniHDGaLxOkue_GUh8DD_3bpxadZrI7qLbKYmqGyn6CnQtvQIKE-ekSgWzzFJ04bm0Ka-6lGZNimTT4JmL0_o0hDKFAoYLZEPI8v2spzpYG9jIdT3HIrbE9uqjQGknJviiAgBZCqNYlTHYgnUOEpo7QlGKxWxYOSsoV6IQukXuiVBpMvAAnZ9ZU-maHisqvZkVCwitgBhf-1IWtqAKZXg1PsTk' },
    { id: 'aura-side-table',      name: 'Aura Side Table',       category: 'Tables',      price: 450,  material: 'Marble & Steel',                page: 'tables.html',   desc: 'Elegant marble top side table on a slender steel base. Ø45×H55cm.',                                             img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-ocVuPMfAmjA2G96M91xTSPncTZmySAdSxJBEAosL19eqCb1n6UMV1S9Ur9OQXx6DvjkdkOHfsn25UEVQEFfNyYEqFI4W9wZkxg1_GzO7coxmO_ZAxeUhcsdEsW85N1vMYOt6btHbEdGCsSzos2c1b8f1Zmic_vtLSroJJLDyYjpTbXU6yAZSbsgpbH6Wh7tLSZKRNeiOMP_Vuy3XMROItuCRFD6eYjYKju0ZI6e_KAhsb7cwk85jNLyXW304Sjk5xlrH2IwwiDk' },
    { id: 'levity-console',       name: 'Levity Console',        category: 'Tables',      price: 890,  material: 'Walnut & Acrylic',              page: 'tables.html',   desc: 'Floating walnut and acrylic console for entryways. W120×D35×H80cm.',                                            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzuJ55FJkMkT-iZtXDpmGYPC6nAO2oxnWCm9a0JnAbYOKF6p2K3hDE1s-xax19WhZOsg2DE0SQLDq5A-ZAO67j6BvES0rqRgeOSYVTmtCNvkmtEfHjUN2qBqygY9YVjhTSvlQoGcIrnS-1owcXairnGGfv6aTAbimLYha9uzTAQcTgplBcxY01__xDLhYM_gKpURTP0Hg2jMZfaCNdvEa7-7nKXIgmKwexsmeIPIIZjjVpG5h_AC7rTD8WmTc4llpHC82nGg_yH1s' },
    { id: 'fjord-dining-table',   name: 'Fjord Dining Table',    category: 'Tables',      price: 2100, material: 'Ash Wood',                      page: 'tables.html',   desc: 'Solid ash dining table with clean Scandinavian lines. Seats 6–8. W220×D100×H74cm.',                             img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJcm7xuJY4nO0UaNzA8DqqlddWmnud8YvjE26NBqO4ZKlw1K1TRV-OtrRCCwKQSTsHWqstipqzTBqTGvQzdCcc-l66gJrHwXDprZ2PkG2P8hVpiZJ7Tx_ySl2aIUvdwTpxdMbLpcSkoAZAl-qhdTRnNTn3U0R6inozDUrGMt2E4iC_wlVDC4pfWBSHG470O1O6cWbUJ4ogi1VOEqgIVFPhT7Xz73fkUzNIvv6n4d0HFKaZ3AhkHFMW_mRsQWXT0Uwzkbj-LU17sFE' },
    { id: 'nordic-dining-set',    name: 'Nordic Dining Set',     category: 'Tables',      price: 4800, material: 'Solid Ash',                     page: 'index.html',    desc: 'Solid ash dining table with four matching minimalist chairs. Complete set.',                                     img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALpNag2eHwVF1RBKAkqNItSHRvKuif0dPkJGPrpNNyUTz4hxRh49bgCD1yAVIJfSifCJmM9LxZpEMpZLaiz6THizFB1T5fk8Zsg0D_wVuOe9ZK2td2raRMf7LSr4OOk-NuXKOEL5i36LlmuPT1IlHIpbMIlxW8E7E4jFQ13FCyit1t2SGHrkFEFktIxhCoXZOBrHEMfnvuNe62rGlUBpnGVPzzIHyoWUfTlbUYgr_u9ZTxp9JiH4ykOVslISd-2ipgVNRMNQzonLE' },
    // Storage
    { id: 'fjord-sideboard',      name: 'Fjord Sideboard',       category: 'Storage',     price: 3200, material: 'Solid Oak & Fluted Glass',      page: 'storage.html',  desc: 'Solid oak sideboard with fluted glass doors. Two adjustable shelves per bay, soft-close hinges.',              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBI46ivevE32l_A9f2Kw-_pEncNLgy0r9Jz_xvAd9BC9AyuKGcVBhquNBb5fGs3wLKTYUwWhaQS5-zcCvVRqobZROGKFxfUSR0H4UwbjROELy8FyhcXnwvVjqDeGvzcN5o0ee1FCS95suLB_vNeY0RzfJbt0KX-VA5TaYdIYwNKQUSDgO9tWvrx4cikxfblcfpoefnxRXURDCAR2zKIb0I0OEo-RBRT27HCX5dJLp9POtaI2XXjSsV0wwvgqnOgcMvKHIcLV9JSBik' },
    { id: 'ash-valet-tray',       name: 'Ash Valet Tray',        category: 'Storage',     price: 95,   material: 'Solid Ash Wood',                page: 'storage.html',  desc: 'Beautifully simple solid ash wood tray for entryways and dressing tables.',                                    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzUpY08L6OCP6no6hfUi807TqleEesA4mtHoW82DwOCrPhxQNpziMMGOMVuy6Q-a24GO2apEsqNLrfTodi5qKGO506Rl_eiYFoteHvRAhfIxtlxBGr-Kf1FvIgyltQC_WlWCJi1-vaSpgANg7eI10B3B8LveE-9BPUkjk34PDGzlzCREt0Jod2FTaGDbqGzKooe1ro9seJqDizE6gKoewQtgLIYomUTc36DgqQHwVN_RH3yjNLpFiHZGaN6ab5Nz5x8pT7-7BCRAQ' },
    { id: 'aero-shelving',        name: 'Aero Shelving',         category: 'Storage',     price: 650,  material: 'Powder-coated Steel',           page: 'storage.html',  desc: 'Modular powder-coated steel shelving. Configure shelf heights in 50mm increments.',                             img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZmgnBeiEewaAFj16RRnYGafxni8YxXVYYsm_3Mg1_IJnkLDouOeW_NCu0vQ7l3utls_0UDBXRYM75nH3mLpW2jP1KIsUBb8E4Xogqagn4Gdgv75yDvPXcsUP-q83aj1oPFFVXGyZsOlZDSHVTvyth6fKDicP6ylmQi3QLk_i9mdV8qPzhkmDWvE8owRvqWKj2nvhJ-eGpWLhcxdEpfNp9jsOpqb4vAbip1rm_v4SwsZsrEmN0hncNrZ46kURHMXKntPcHIYCy-xk' },
    { id: 'horizon-console',      name: 'Horizon Console',       category: 'Storage',     price: 1100, material: 'Matte Lacquer & Stone',         page: 'storage.html',  desc: 'New arrival. Matte lacquer console with three-drawer push-to-open system and natural stone top.',               img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmQx3DkF879es09gzSiyh7dFp78ce90Ad-6imKB0yQ-dKi0hk90LXvWDMeetgXv-cyil_Kh0Z2PB1iKnNDOL_YPHbSCBFUIcaXlgBxAxbbOz4-ua5TuWi7B1TNTsn2cBs-Sgt6jfqlZi3P1dUpaqLJnoO4gmyXzh_vE-CDXuGtqagEA9ePoImQp5J7711qex9l9CDqK-j_jq_ysdP82JlUG2MauqU7LsfVUCgc-1jtmmdthuQDGB5HJQydZCTGa-EOYadxUpAEOvw' },
    // Accessories
    { id: 'rime-vase',            name: 'Rime Vase',             category: 'Accessories', price: 120,  material: 'Ceramic',                       page: 'index.html',    desc: 'Handcrafted ceramic vase in matte finish. Ideal for dried or fresh botanicals.',                               img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKgcCFcMn-gWLj4qsAc7UlmH_OwsQDVqDZfOC9OYl62Nd5ZfsZKn5X1gX0rAXw56iWWDg6x-z7EzHXxgikxdq3-15ZxnNVTPZgI0ZmX4iL6HIHEQKTAy5ji9SEhehfHOkYKzyGke4P8YWCIrOYJmQf6oCd2UCV1GJIWXTSY99-yRevxduXH-_K7XvRnu-KMJVEGxhp0MAQ6cvojimJxI76yZ08HCL1Ol8u9fYF90O2sZNM9C3jS4ykzCB1_CC-mlcEYo40ml5BK3Y' },
    { id: 'krono-clock',          name: 'Krono Clock',           category: 'Accessories', price: 280,  material: 'Brass & Glass',                 page: 'index.html',    desc: 'Precision table clock in brass and glass. Minimalist face with silent quartz movement.',                       img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZEbn6-KlP5ocsG7rQLMUxvvoBueThrJswP4IaEvM8yet3wWEze9juchjFj8E4GiRUQUkiEb_X7caxA41z9mrLSPc9M27gNEbk24oBfiCbHfYWJA_IeSN90KUog-QTGmWXYefAwmq_ex9fhwZphrtxOVcQbuRLhqsHXX-ZPbgCtw8a4v50YoEprtXoAjEtQVZuvq5zCBmw19vd2P5Q71Zg0l8LdrJrMgQZdmGkzQX8F3JkJ7BmouYslSTfGc1wmlYoyaZPBTM5u9U' },
    { id: 'alpaca-throw',         name: 'Alpaca Throw',          category: 'Accessories', price: 350,  material: 'Alpaca Wool',                   page: 'index.html',    desc: 'Sumptuous alpaca wool throw in a natural undyed palette. Ethically sourced from the Andes.',                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDo9oLkyLD8zAnvCbHbYoYo8aew9MyQzw2t5km8sP2-owiXHX6W2Vp2QrjP8wb-2V5YTqioAyN5ohFfwK3lNl4HPydF6M9C9TXVoRlY14dZipqwVCqdL0_Pew2uWsw94JoBth8VBCa41vAfpqZBOsWhg9kFxxy_meGRk12REC_dlMVwOPA6s1ykZA40rUOcrA6_tztfwtKW8H_HPsYlu_lQtSmdlniGRX6xyQtxSnmGVz4Vfijg21NnAiAI0efydHCCA937QfPNPM' },
    { id: 'valet-tray',           name: 'Valet Tray',            category: 'Accessories', price: 190,  material: 'Full-grain Leather',            page: 'index.html',    desc: 'Full-grain leather valet tray with rigid base for keys, wallet and everyday carry.',                           img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAd77UYaP0yCZLAD5efocPtzkotaLX68A5S3v-jHL5uboM6NWqN_QhX9q-ibB40y9juhQRTppGm-tuZnQKp3zOc9Q3h_mMTFb5p5aBVvSd0lPK_YiYFEkuYphNO02ETnpJTLFqUrZN5ij8aIhCInvjCMFvn-bIF-4OKuX4NPIMJzLWX282oodKtCR4ar1jDlZODsEvBUMAf7wniv93Lr7MncoiZ6eAadJ7J5iJ8zTakvpUaoukdUCJ3vAfxXDoe-s_jdiHO74lOIWQ' },
  ];

  // ─── UTILS ────────────────────────────────────────────────────────────────────
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function toast(msg, isErr) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;padding:12px 24px;border-radius:9999px;font-family:Inter,sans-serif;font-size:14px;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,.15);transition:opacity .3s;white-space:nowrap;pointer-events:none;';
    t.style.background = isErr ? '#ba1a1a' : '#006686';
    t.style.color = '#fff';
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 300); }, 3200);
  }

  function fmt(n) { return '$' + Number(n).toLocaleString(); }

  function findProduct(name) {
    var lower = (name || '').toLowerCase().trim();
    return PRODUCTS.find(function (p) {
      var pn = p.name.toLowerCase();
      return pn === lower || lower === pn || lower.includes(pn) || pn.includes(lower.split(' ')[0]) && lower.split(' ').length >= 2;
    });
  }

  // ─── CART ─────────────────────────────────────────────────────────────────────
  var Cart = {
    KEY: 'dane-cart',
    get: function () { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch (e) { return []; } },
    save: function (items) { localStorage.setItem(this.KEY, JSON.stringify(items)); },
    count: function () { return this.get().reduce(function (s, i) { return s + i.qty; }, 0); },
    total: function () {
      return this.get().reduce(function (sum, item) {
        var p = PRODUCTS.find(function (p) { return p.id === item.id; });
        return sum + (p ? p.price * item.qty : 0);
      }, 0);
    },
    add: function (id, qty) {
      qty = qty || 1;
      var items = this.get();
      var ex = items.find(function (i) { return i.id === id; });
      if (ex) ex.qty += qty; else items.push({ id: id, qty: qty });
      this.save(items);
      this.badge();
      CartDrawer.render();
      toast('Added to cart');
    },
    remove: function (id) {
      this.save(this.get().filter(function (i) { return i.id !== id; }));
      this.badge(); CartDrawer.render();
    },
    setQty: function (id, qty) {
      if (qty < 1) { this.remove(id); return; }
      var items = this.get();
      var item = items.find(function (i) { return i.id === id; });
      if (item) item.qty = qty;
      this.save(items); this.badge(); CartDrawer.render();
    },
    clear: function () { localStorage.removeItem(this.KEY); this.badge(); CartDrawer.render(); },
    badge: function () {
      var count = this.count();
      $$('[aria-label="Cart"]').forEach(function (btn) {
        var badge = btn.querySelector('.dd-cart-badge');
        if (count > 0) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'dd-cart-badge';
            badge.style.cssText = 'position:absolute;top:0;right:0;min-width:16px;height:16px;background:#006686;color:#fff;border-radius:9999px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 3px;pointer-events:none;line-height:1;';
            btn.style.position = 'relative';
            btn.appendChild(badge);
          }
          badge.textContent = count > 99 ? '99+' : count;
        } else if (badge) {
          badge.remove();
        }
      });
    }
  };

  // ─── CART DRAWER ──────────────────────────────────────────────────────────────
  var CartDrawer = {
    init: function () {
      var el = document.createElement('div');
      el.id = 'dd-cart-drawer';
      el.innerHTML = '<div id="dd-cart-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:400;backdrop-filter:blur(2px);opacity:0;transition:opacity .3s;pointer-events:none;"></div>' +
        '<div id="dd-cart-panel" style="position:fixed;top:0;right:0;height:100%;width:min(420px,100vw);background:#fff;z-index:401;transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;box-shadow:-20px 0 60px rgba(0,0,0,.12);">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #e5e8ec;">' +
            '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:18px;font-weight:700;color:#181c1f;margin:0;">Your Cart</h2>' +
            '<button id="dd-cart-close" style="background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;color:#6f787e;"><span class="material-symbols-outlined" style="font-size:22px;">close</span></button>' +
          '</div>' +
          '<div id="dd-cart-items" style="flex:1;overflow-y:auto;padding:8px 24px;"></div>' +
          '<div id="dd-cart-footer" style="padding:20px 24px;border-top:1px solid #e5e8ec;"></div>' +
        '</div>';
      document.body.appendChild(el);
      document.getElementById('dd-cart-overlay').addEventListener('click', function () { CartDrawer.close(); });
      document.getElementById('dd-cart-close').addEventListener('click', function () { CartDrawer.close(); });
    },
    open: function () {
      document.getElementById('dd-cart-overlay').style.cssText += ';opacity:1;pointer-events:all;';
      document.getElementById('dd-cart-panel').style.transform = 'translateX(0)';
      document.body.style.overflow = 'hidden';
      this.render();
    },
    close: function () {
      document.getElementById('dd-cart-overlay').style.cssText += ';opacity:0;pointer-events:none;';
      document.getElementById('dd-cart-panel').style.transform = 'translateX(100%)';
      document.body.style.overflow = '';
    },
    render: function () {
      var itemsEl = document.getElementById('dd-cart-items');
      var footerEl = document.getElementById('dd-cart-footer');
      if (!itemsEl) return;
      var items = Cart.get();
      if (items.length === 0) {
        itemsEl.innerHTML = '<div style="text-align:center;padding:48px 0;color:#6f787e;"><span class="material-symbols-outlined" style="font-size:48px;display:block;margin-bottom:12px;opacity:.3;">shopping_bag</span><p style="font-family:Inter,sans-serif;font-size:15px;margin:0;">Your cart is empty</p></div>';
        footerEl.innerHTML = '';
        return;
      }
      itemsEl.innerHTML = items.map(function (item) {
        var p = PRODUCTS.find(function (pr) { return pr.id === item.id; });
        if (!p) return '';
        return '<div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid #f1f4f7;align-items:flex-start;">' +
          '<img src="' + p.img + '" style="width:60px;height:60px;object-fit:cover;border-radius:10px;flex-shrink:0;" alt="' + p.name + '"/>' +
          '<div style="flex:1;min-width:0;">' +
            '<p style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:13px;font-weight:600;color:#181c1f;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + p.name + '</p>' +
            '<p style="font-family:Inter,sans-serif;font-size:11px;color:#6f787e;margin:0 0 8px;">' + p.material + '</p>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;">' +
              '<div style="display:flex;align-items:center;gap:6px;">' +
                '<button onclick="window.DaneApp.cartQty(\'' + p.id + '\',' + (item.qty - 1) + ')" style="width:24px;height:24px;border-radius:50%;border:1px solid #bec8ce;background:none;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:#181c1f;line-height:1;">−</button>' +
                '<span style="font-family:Inter,sans-serif;font-size:13px;font-weight:600;color:#181c1f;min-width:18px;text-align:center;">' + item.qty + '</span>' +
                '<button onclick="window.DaneApp.cartQty(\'' + p.id + '\',' + (item.qty + 1) + ')" style="width:24px;height:24px;border-radius:50%;border:1px solid #bec8ce;background:none;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:#181c1f;line-height:1;">+</button>' +
              '</div>' +
              '<span style="font-family:Inter,sans-serif;font-size:14px;font-weight:700;color:#006686;">' + fmt(p.price * item.qty) + '</span>' +
            '</div>' +
          '</div>' +
          '<button onclick="window.DaneApp.cartRemove(\'' + p.id + '\')" style="background:none;border:none;cursor:pointer;padding:2px;color:#bec8ce;flex-shrink:0;" aria-label="Remove"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>' +
        '</div>';
      }).join('');
      footerEl.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
          '<span style="font-family:Inter,sans-serif;font-size:15px;color:#181c1f;font-weight:500;">Subtotal</span>' +
          '<span style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:20px;color:#006686;font-weight:700;">' + fmt(Cart.total()) + '</span>' +
        '</div>' +
        '<p style="font-family:Inter,sans-serif;font-size:11px;color:#6f787e;margin:0 0 16px;line-height:1.4;">All furniture is made to order. Shipping calculated at checkout.</p>' +
        '<button onclick="window.DaneApp.checkout()" style="width:100%;background:#006686;color:#fff;border:none;border-radius:9999px;padding:15px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;margin-bottom:8px;" onmouseover="this.style.opacity=\'.85\'" onmouseout="this.style.opacity=\'1\'">Proceed to Checkout</button>' +
        '<button onclick="window.DaneApp.cartClear()" style="width:100%;background:none;border:none;color:#6f787e;font-family:Inter,sans-serif;font-size:12px;cursor:pointer;padding:6px;text-decoration:underline;">Clear cart</button>';
    }
  };

  // ─── WISHLIST ─────────────────────────────────────────────────────────────────
  var Wishlist = {
    KEY: 'dane-wishlist',
    get: function () { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch (e) { return []; } },
    save: function (items) { localStorage.setItem(this.KEY, JSON.stringify(items)); },
    has: function (id) { return this.get().indexOf(id) > -1; },
    toggle: function (id) {
      var items = this.get();
      var idx = items.indexOf(id);
      if (idx > -1) { items.splice(idx, 1); toast('Removed from wishlist'); }
      else { items.push(id); toast('Saved to wishlist'); }
      this.save(items);
      this.syncButtons();
    },
    syncButtons: function () {
      $$('[data-dd-wish]').forEach(function (btn) {
        var id = btn.getAttribute('data-dd-wish');
        var filled = Wishlist.has(id);
        var icon = btn.querySelector('.material-symbols-outlined');
        if (icon) {
          icon.style.fontVariationSettings = filled ? "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24" : "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24";
          icon.style.color = filled ? '#4B3D33' : '';
        }
      });
    }
  };

  // ─── SEARCH ───────────────────────────────────────────────────────────────────
  var Search = {
    el: null,
    init: function () {
      var el = document.createElement('div');
      el.id = 'dd-search';
      el.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(247,250,253,.97);backdrop-filter:blur(20px);display:none;flex-direction:column;align-items:center;padding-top:80px;';
      el.innerHTML =
        '<div style="width:100%;max-width:640px;padding:0 24px;">' +
          '<div style="display:flex;align-items:center;gap:12px;border-bottom:2px solid #006686;padding-bottom:10px;margin-bottom:8px;">' +
            '<span class="material-symbols-outlined" style="font-size:22px;color:#006686;">search</span>' +
            '<input id="dd-search-input" type="text" placeholder="Search products…" autocomplete="off" style="flex:1;background:none;border:none;outline:none;font-family:Inter,sans-serif;font-size:18px;color:#181c1f;"/>' +
            '<button id="dd-search-close" style="background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;color:#6f787e;" aria-label="Close"><span class="material-symbols-outlined">close</span></button>' +
          '</div>' +
          '<p style="font-family:Inter,sans-serif;font-size:11px;color:#6f787e;margin:0 0 20px;letter-spacing:.04em;">PRESS ESC TO CLOSE · ⌘K TO OPEN</p>' +
          '<div id="dd-search-results"></div>' +
        '</div>';
      document.body.appendChild(el);
      this.el = el;
      var self = this;
      document.getElementById('dd-search-close').addEventListener('click', function () { self.close(); });
      document.getElementById('dd-search-input').addEventListener('input', function (e) { self.query(e.target.value); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Escape') self.close(); });
      el.addEventListener('click', function (e) { if (e.target === el) self.close(); });
    },
    open: function () {
      this.el.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      var inp = document.getElementById('dd-search-input');
      inp.value = '';
      setTimeout(function () { inp.focus(); }, 50);
      this.query('');
    },
    close: function () {
      this.el.style.display = 'none';
      document.body.style.overflow = '';
    },
    query: function (q) {
      var resultsEl = document.getElementById('dd-search-results');
      var term = (q || '').trim().toLowerCase();
      var matches = term.length === 0
        ? PRODUCTS.slice(0, 8)
        : PRODUCTS.filter(function (p) {
            return p.name.toLowerCase().includes(term) ||
                   p.category.toLowerCase().includes(term) ||
                   p.material.toLowerCase().includes(term) ||
                   (p.desc || '').toLowerCase().includes(term);
          });
      if (matches.length === 0) {
        resultsEl.innerHTML = '<p style="text-align:center;padding:32px;font-family:Inter,sans-serif;color:#6f787e;font-size:14px;">No results for "' + q + '"</p>';
        return;
      }
      resultsEl.innerHTML = matches.map(function (p) {
        return '<a href="' + p.page + '" onclick="window.DaneApp.searchClose()" style="display:flex;align-items:center;gap:14px;padding:10px 12px;border-radius:12px;text-decoration:none;transition:background .12s;" onmouseover="this.style.background=\'#f1f4f7\'" onmouseout="this.style.background=\'transparent\'">' +
          '<img src="' + p.img + '" style="width:52px;height:52px;object-fit:cover;border-radius:8px;flex-shrink:0;" alt=""/>' +
          '<div style="flex:1;min-width:0;">' +
            '<p style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:14px;font-weight:600;color:#181c1f;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + p.name + '</p>' +
            '<p style="font-family:Inter,sans-serif;font-size:12px;color:#6f787e;margin:0;">' + p.category + ' · ' + p.material + '</p>' +
          '</div>' +
          '<span style="font-family:Inter,sans-serif;font-size:14px;font-weight:700;color:#006686;white-space:nowrap;">' + fmt(p.price) + '</span>' +
        '</a>';
      }).join('');
    }
  };

  // ─── AUTH ─────────────────────────────────────────────────────────────────────
  var Auth = {
    SESSION_KEY: 'dane-session',
    session: null,
    tab: 'signin',
    el: null,
    init: function () {
      try { var s = localStorage.getItem(this.SESSION_KEY); if (s) this.session = JSON.parse(s); } catch (e) {}
      var el = document.createElement('div');
      el.id = 'dd-auth';
      el.style.cssText = 'position:fixed;inset:0;z-index:500;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.45);backdrop-filter:blur(6px);padding:16px;';
      el.innerHTML =
        '<div style="background:#fff;border-radius:24px;padding:36px;width:100%;max-width:400px;box-shadow:0 40px 80px rgba(0,0,0,.18);position:relative;">' +
          '<button id="dd-auth-close" style="position:absolute;top:14px;right:14px;background:#f1f4f7;border:none;cursor:pointer;padding:6px;border-radius:50%;display:flex;align-items:center;"><span class="material-symbols-outlined" style="font-size:18px;color:#3f484e;">close</span></button>' +
          '<div id="dd-auth-user" style="display:none;text-align:center;">' +
            '<div id="dd-auth-avatar" style="width:60px;height:60px;border-radius:50%;background:#006686;color:#fff;font-family:\'Plus Jakarta Sans\',sans-serif;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;"></div>' +
            '<p id="dd-auth-email" style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:15px;font-weight:600;color:#181c1f;margin:0 0 4px;"></p>' +
            '<p style="font-family:Inter,sans-serif;font-size:12px;color:#6f787e;margin:0 0 28px;">Signed in to your account</p>' +
            '<button onclick="window.DaneApp.signOut()" style="width:100%;border:1px solid #bec8ce;background:none;border-radius:9999px;padding:13px;font-family:Inter,sans-serif;font-size:14px;cursor:pointer;color:#3f484e;">Sign out</button>' +
          '</div>' +
          '<div id="dd-auth-form-wrap">' +
            '<div style="display:flex;gap:6px;background:#f1f4f7;border-radius:9999px;padding:4px;margin-bottom:28px;">' +
              '<button id="dd-tab-in" onclick="window.DaneApp.authTab(\'signin\')" style="flex:1;border:none;border-radius:9999px;padding:9px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;background:#fff;color:#181c1f;box-shadow:0 1px 4px rgba(0,0,0,.08);">Sign In</button>' +
              '<button id="dd-tab-up" onclick="window.DaneApp.authTab(\'signup\')" style="flex:1;border:none;border-radius:9999px;padding:9px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:#6f787e;">Create Account</button>' +
            '</div>' +
            '<h2 id="dd-auth-title" style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:20px;font-weight:700;color:#181c1f;margin:0 0 20px;">Welcome back</h2>' +
            '<form id="dd-auth-form">' +
              '<div id="dd-name-wrap" style="margin-bottom:14px;display:none;">' +
                '<label style="font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:#6f787e;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:5px;">Full name</label>' +
                '<input id="dd-auth-name" type="text" placeholder="Your name" style="width:100%;border:1px solid #bec8ce;border-radius:10px;padding:11px 14px;font-family:Inter,sans-serif;font-size:14px;color:#181c1f;outline:none;box-sizing:border-box;"/>' +
              '</div>' +
              '<div style="margin-bottom:14px;">' +
                '<label style="font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:#6f787e;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:5px;">Email</label>' +
                '<input id="dd-auth-email" type="email" required placeholder="you@example.com" style="width:100%;border:1px solid #bec8ce;border-radius:10px;padding:11px 14px;font-family:Inter,sans-serif;font-size:14px;color:#181c1f;outline:none;box-sizing:border-box;"/>' +
              '</div>' +
              '<div style="margin-bottom:20px;">' +
                '<label style="font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:#6f787e;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:5px;">Password</label>' +
                '<input id="dd-auth-pw" type="password" required placeholder="Min. 6 characters" style="width:100%;border:1px solid #bec8ce;border-radius:10px;padding:11px 14px;font-family:Inter,sans-serif;font-size:14px;color:#181c1f;outline:none;box-sizing:border-box;"/>' +
              '</div>' +
              '<p id="dd-auth-err" style="color:#ba1a1a;font-family:Inter,sans-serif;font-size:12px;margin:0 0 14px;display:none;"></p>' +
              '<button id="dd-auth-btn" type="submit" style="width:100%;background:#006686;color:#fff;border:none;border-radius:9999px;padding:14px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;" onmouseover="this.style.opacity=\'.85\'" onmouseout="this.style.opacity=\'1\'">Sign In</button>' +
            '</form>' +
          '</div>' +
        '</div>';
      document.body.appendChild(el);
      this.el = el;
      var self = this;
      document.getElementById('dd-auth-close').addEventListener('click', function () { self.close(); });
      el.addEventListener('click', function (e) { if (e.target === el) self.close(); });
      document.getElementById('dd-auth-form').addEventListener('submit', function (e) { self.submit(e); });
      this.syncNavUI();
    },
    open: function () {
      this.el.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      this.render();
    },
    close: function () {
      this.el.style.display = 'none';
      document.body.style.overflow = '';
    },
    render: function () {
      var uv = document.getElementById('dd-auth-user');
      var fv = document.getElementById('dd-auth-form-wrap');
      if (this.session && this.session.user) {
        uv.style.display = 'block'; fv.style.display = 'none';
        var email = this.session.user.email || '';
        document.getElementById('dd-auth-email') && (document.getElementById('dd-auth-email').value = '');
        document.getElementById('dd-auth-email-disp') && (document.getElementById('dd-auth-email-disp').textContent = email);
        document.getElementById('dd-auth-email').closest && null; // no-op
        document.getElementById('dd-auth-email') && null;
        document.getElementById('dd-auth-avatar').textContent = (email[0] || 'U').toUpperCase();
        document.getElementById('dd-auth-email').value = '';
        // show email in user view
        var emailEl = document.getElementById('dd-auth-email');
        // actually the signed-in email display is #dd-auth-email in user view... let me use proper id
        document.querySelector('#dd-auth-user p#dd-auth-email') && (document.querySelector('#dd-auth-user p#dd-auth-email').textContent = email);
        document.getElementById('dd-auth-email').parentElement && null;
        // simpler approach:
        document.getElementById('dd-auth-email').tagName === 'INPUT' && null;
        var emailDisplay = document.getElementById('dd-auth-email-p');
        if (!emailDisplay) {
          // Find the p element inside user view
          var ps = document.querySelectorAll('#dd-auth-user p');
          if (ps[0]) ps[0].textContent = email;
        }
      } else {
        uv.style.display = 'none'; fv.style.display = 'block';
      }
    },
    switchTab: function (t) {
      this.tab = t;
      var isUp = t === 'signup';
      var tabIn = document.getElementById('dd-tab-in');
      var tabUp = document.getElementById('dd-tab-up');
      tabIn.style.background = isUp ? 'transparent' : '#fff';
      tabIn.style.color = isUp ? '#6f787e' : '#181c1f';
      tabIn.style.boxShadow = isUp ? 'none' : '0 1px 4px rgba(0,0,0,.08)';
      tabUp.style.background = isUp ? '#fff' : 'transparent';
      tabUp.style.color = isUp ? '#181c1f' : '#6f787e';
      tabUp.style.boxShadow = isUp ? '0 1px 4px rgba(0,0,0,.08)' : 'none';
      document.getElementById('dd-auth-title').textContent = isUp ? 'Create your account' : 'Welcome back';
      document.getElementById('dd-auth-btn').textContent = isUp ? 'Create Account' : 'Sign In';
      document.getElementById('dd-name-wrap').style.display = isUp ? 'block' : 'none';
      document.getElementById('dd-auth-err').style.display = 'none';
    },
    submit: function (e) {
      e.preventDefault();
      var self = this;
      var email = document.getElementById('dd-auth-email').value.trim();
      var pw    = document.getElementById('dd-auth-pw').value;
      var errEl = document.getElementById('dd-auth-err');
      var btn   = document.getElementById('dd-auth-btn');
      errEl.style.display = 'none';
      btn.disabled = true;
      btn.textContent = this.tab === 'signup' ? 'Creating…' : 'Signing in…';
      var url = this.tab === 'signup'
        ? SUPA_URL + '/auth/v1/signup'
        : SUPA_URL + '/auth/v1/token?grant_type=password';
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY },
        body: JSON.stringify({ email: email, password: pw })
      })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }); })
      .then(function (r) {
        if (!r.ok) throw new Error(r.d.error_description || r.d.msg || r.d.message || 'Authentication failed');
        self.session = r.d;
        localStorage.setItem(self.SESSION_KEY, JSON.stringify(r.d));
        self.close();
        toast(self.tab === 'signup' ? 'Account created! Welcome to Dane Design.' : 'Welcome back!');
        self.syncNavUI();
        syncCartToBackend(r.d.access_token);
      })
      .catch(function (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = self.tab === 'signup' ? 'Create Account' : 'Sign In';
      });
    },
    signOut: function () {
      if (this.session && this.session.access_token) {
        fetch(SUPA_URL + '/auth/v1/logout', {
          method: 'POST',
          headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + this.session.access_token }
        }).catch(function () {});
      }
      this.session = null;
      localStorage.removeItem(this.SESSION_KEY);
      this.close();
      toast('Signed out successfully.');
      this.syncNavUI();
    },
    syncNavUI: function () {
      var self = this;
      $$('[aria-label="Account"]').forEach(function (btn) {
        var av = btn.querySelector('.dd-user-av');
        if (self.session && self.session.user) {
          var email = self.session.user.email || '';
          if (!av) {
            av = document.createElement('span');
            av.className = 'dd-user-av';
            av.style.cssText = 'position:absolute;inset:0;background:#006686;border-radius:50%;color:#fff;font-family:Inter,sans-serif;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;';
            btn.style.position = 'relative';
            btn.style.width = '34px'; btn.style.height = '34px';
            var icon = btn.querySelector('.material-symbols-outlined');
            if (icon) icon.style.display = 'none';
            btn.appendChild(av);
          }
          av.textContent = (email[0] || 'U').toUpperCase();
        } else {
          if (av) {
            av.remove();
            var icon = btn.querySelector('.material-symbols-outlined');
            if (icon) icon.style.display = '';
            btn.style.position = ''; btn.style.width = ''; btn.style.height = '';
          }
        }
      });
    }
  };

  // ─── PRODUCT QUICKVIEW ────────────────────────────────────────────────────────
  var Quickview = {
    el: null,
    init: function () {
      var el = document.createElement('div');
      el.id = 'dd-qv';
      el.style.cssText = 'position:fixed;inset:0;z-index:450;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);padding:16px;';
      el.innerHTML =
        '<div style="background:#fff;border-radius:24px;width:100%;max-width:760px;max-height:92vh;overflow-y:auto;position:relative;box-shadow:0 40px 80px rgba(0,0,0,.2);">' +
          '<button id="dd-qv-close" style="position:absolute;top:14px;right:14px;background:#f1f4f7;border:none;cursor:pointer;padding:7px;border-radius:50%;display:flex;align-items:center;z-index:1;"><span class="material-symbols-outlined" style="font-size:18px;color:#3f484e;">close</span></button>' +
          '<div id="dd-qv-body"></div>' +
        '</div>';
      document.body.appendChild(el);
      this.el = el;
      document.getElementById('dd-qv-close').addEventListener('click', function () { Quickview.close(); });
      el.addEventListener('click', function (e) { if (e.target === el) Quickview.close(); });
    },
    open: function (id) {
      var p = PRODUCTS.find(function (pr) { return pr.id === id; });
      if (!p) return;
      var inW = Wishlist.has(id);
      document.getElementById('dd-qv-body').innerHTML =
        '<img src="' + p.img + '" style="width:100%;height:260px;object-fit:cover;border-radius:24px 24px 0 0;" alt="' + p.name + '"/>' +
        '<div style="padding:28px 32px 32px;">' +
          '<span style="font-family:Inter,sans-serif;font-size:11px;font-weight:700;color:#006686;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:6px;">' + p.category + '</span>' +
          '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:26px;font-weight:700;color:#181c1f;margin:0 0 6px;">' + p.name + '</h2>' +
          '<p style="font-family:Inter,sans-serif;font-size:13px;color:#6f787e;margin:0 0 14px;">' + p.material + '</p>' +
          '<p style="font-family:Inter,sans-serif;font-size:15px;color:#3f484e;line-height:1.65;margin:0 0 22px;">' + (p.desc || '') + '</p>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 0;border-top:1px solid #ebeef1;border-bottom:1px solid #ebeef1;margin-bottom:22px;">' +
            '<span style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:26px;font-weight:700;color:#006686;">' + fmt(p.price) + '</span>' +
            '<a href="' + p.page + '" style="font-family:Inter,sans-serif;font-size:13px;color:#6f787e;text-decoration:none;display:flex;align-items:center;gap:4px;">Full details <span class="material-symbols-outlined" style="font-size:14px;">arrow_forward</span></a>' +
          '</div>' +
          '<div style="display:flex;gap:10px;">' +
            '<button onclick="window.DaneApp.addToCart(\'' + id + '\')" style="flex:1;background:#006686;color:#fff;border:none;border-radius:9999px;padding:15px 20px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;" onmouseover="this.style.opacity=\'.85\'" onmouseout="this.style.opacity=\'1\'">Add to Cart</button>' +
            '<button onclick="window.DaneApp.toggleWishlist(\'' + id + '\')" style="padding:15px 18px;border:1px solid #bec8ce;border-radius:9999px;background:none;cursor:pointer;display:flex;align-items:center;" title="' + (inW ? 'Remove from wishlist' : 'Save to wishlist') + '">' +
              '<span class="material-symbols-outlined" style="font-size:20px;color:' + (inW ? '#4B3D33' : '#6f787e') + ';font-variation-settings:\'FILL\' ' + (inW ? 1 : 0) + ',\'wght\' 400,\'GRAD\' 0,\'opsz\' 24;">' + (inW ? 'favorite' : 'favorite_border') + '</span>' +
            '</button>' +
          '</div>' +
        '</div>';
      this.el.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    },
    close: function () {
      this.el.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  // ─── HOME PAGE FILTER BAR ─────────────────────────────────────────────────────
  function initFilters() {
    var articles = $$('main article');
    if (articles.length === 0) return;

    // Identify filter buttons by their text content
    var filterMap = {
      'all pieces': null,
      'lounge chairs': 'seating',
      'dining tables': 'tables',
      'lighting': 'lighting',
      'storage': 'storage'
    };

    $$('button').forEach(function (btn) {
      var text = btn.textContent.trim().toLowerCase();
      if (!(text in filterMap)) return;

      btn.addEventListener('click', function () {
        // Reset all filter buttons styling
        Object.keys(filterMap).forEach(function (label) {
          $$('button').forEach(function (b) {
            if (b.textContent.trim().toLowerCase() === label) {
              b.className = b.className
                .replace(/bg-primary\/10|text-primary|border|border-primary\/20/g, '')
                .trim() + ' text-on-surface-variant hover:text-on-surface hover:bg-black/5';
            }
          });
        });
        // Activate clicked
        btn.className = btn.className
          .replace(/text-on-surface-variant|hover:text-on-surface|hover:bg-black\/5/g, '')
          .trim() + ' bg-primary/10 text-primary border border-primary/20';

        var cat = filterMap[text];
        articles.forEach(function (article) {
          if (!cat) { article.style.display = ''; return; }
          var catEl = article.querySelector('span.text-primary, span.text-xs');
          var itemCat = catEl ? catEl.textContent.trim().toLowerCase() : '';
          var match = itemCat.includes(cat) ||
            (cat === 'tables' && (itemCat === 'tables' || itemCat === 'workspace'));
          article.style.display = match ? '' : 'none';
        });
      });
    });

    // Sort dropdown
    $$('button').forEach(function (btn) {
      if (!btn.textContent.includes('Sort by:')) return;
      var sorts = ['Featured', 'Price: Low to High', 'Price: High to Low'];
      var sortIdx = 0;
      btn.addEventListener('click', function () {
        sortIdx = (sortIdx + 1) % sorts.length;
        btn.querySelector('span:first-child').textContent = 'Sort by: ' + sorts[sortIdx];
        var container = articles[0] && articles[0].parentElement;
        if (!container) return;
        var arr = Array.from(container.querySelectorAll('article'));
        arr.sort(function (a, b) {
          var pa = findProduct((a.querySelector('h2,h3') || {}).textContent || '');
          var pb = findProduct((b.querySelector('h2,h3') || {}).textContent || '');
          var va = pa ? pa.price : 0; var vb = pb ? pb.price : 0;
          if (sorts[sortIdx] === 'Price: Low to High') return va - vb;
          if (sorts[sortIdx] === 'Price: High to Low') return vb - va;
          return 0;
        });
        arr.forEach(function (el) { container.appendChild(el); });
      });
    });
  }

  // ─── WIRE PRODUCT CARDS ───────────────────────────────────────────────────────
  function wireCards() {
    // --- Wishlist heart buttons (seating page) ---
    $$('[aria-label="Add to wishlist"]').forEach(function (btn) {
      var article = btn.closest('article');
      if (!article) return;
      var h = article.querySelector('h2,h3,h4');
      var p = h && findProduct(h.textContent);
      if (!p) return;
      btn.setAttribute('data-dd-wish', p.id);
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        Wishlist.toggle(p.id);
      });
    });

    // --- Add to cart icons (lighting grid cards) ---
    $$('.material-symbols-outlined').forEach(function (icon) {
      if (icon.textContent.trim() !== 'add_shopping_cart') return;
      var card = icon.closest('[class*="group"]') || icon.closest('div');
      if (!card) return;
      var h = card.querySelector('h3,h2');
      var p = h && findProduct(h.textContent);
      if (!p) return;
      var clickable = icon.closest('button') || icon.closest('div[class*="absolute"]') || icon;
      clickable.style.cursor = 'pointer';
      clickable.addEventListener('click', function (e) {
        e.stopPropagation();
        Cart.add(p.id);
        CartDrawer.open();
      });
    });

    // --- Wire article cards (arrow_forward, View Details, add buttons) ---
    $$('article').forEach(function (article) {
      var h = article.querySelector('h2,h3,h4');
      if (!h) return;
      var p = findProduct(h.textContent);
      if (!p) return;
      article.setAttribute('data-product', p.id);

      // View Details buttons
      article.querySelectorAll('button').forEach(function (btn) {
        var label = btn.textContent.trim();
        var icon  = (btn.querySelector('.material-symbols-outlined') || {}).textContent || '';
        icon = icon.trim();

        if (label.includes('View Details') || label.includes('Pre-order')) {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (label.includes('Pre-order')) {
              Cart.add(p.id); CartDrawer.open();
            } else {
              Quickview.open(p.id);
            }
          });
        } else if (icon === 'arrow_forward') {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            Quickview.open(p.id);
          });
        } else if (icon === 'add') {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            Cart.add(p.id);
            toast('Added ' + p.name + ' to cart');
          });
        }
      });
    });

    // --- "Pre-order Now" standalone button (index spotlight) ---
    $$('button').forEach(function (btn) {
      if (btn.textContent.trim() === 'Pre-order Now') {
        btn.addEventListener('click', function () {
          Cart.add('freya-lounge-chair');
          CartDrawer.open();
        });
      }
    });

    // --- "View Full Catalog" / "Explore *" nav buttons ---
    $$('button').forEach(function (btn) {
      var text = btn.textContent.trim();
      if (text === 'View Full Catalog') {
        btn.addEventListener('click', function () {
          var el = document.getElementById('collections');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          else window.location.href = 'index.html#collections';
        });
      }
      if (text.startsWith('Explore') && !btn._wired) {
        btn._wired = true;
        btn.addEventListener('click', function () {
          window.location.href = 'index.html#collections';
        });
      }
    });

    Wishlist.syncButtons();
  }

  // ─── PUBLIC API (used by inline onclick) ──────────────────────────────────────
  window.DaneApp = {
    addToCart:    function (id) { Cart.add(id); CartDrawer.open(); },
    cartQty:      function (id, qty) { Cart.setQty(id, qty); },
    cartRemove:   function (id) { Cart.remove(id); },
    cartClear:    function () { Cart.clear(); },
    checkout:     function () { CartDrawer.close(); window.location.href = 'checkout.html'; },
    toggleWishlist: function (id) { Wishlist.toggle(id); },
    signOut:      function () { Auth.signOut(); },
    authTab:      function (t) { Auth.switchTab(t); },
    searchClose:  function () { Search.close(); },
  };

  // ─── INIT ─────────────────────────────────────────────────────────────────────
  function init() {
    CartDrawer.init();
    Search.init();
    Auth.init();
    Quickview.init();

    // Nav buttons
    $$('[aria-label="Search"]').forEach(function (btn) {
      btn.addEventListener('click', function () { Search.open(); });
    });
    $$('[aria-label="Cart"]').forEach(function (btn) {
      btn.addEventListener('click', function () { CartDrawer.open(); });
    });
    $$('[aria-label="Account"]').forEach(function (btn) {
      btn.addEventListener('click', function () { Auth.open(); });
    });

    wireCards();
    initFilters();
    Cart.badge();
    Wishlist.syncButtons();

    // ⌘K / Ctrl+K → search
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); Search.open();
      }
      if (e.key === 'Escape') {
        Search.close(); Quickview.close(); CartDrawer.close();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
