(function () {
  var SUPABASE_URL = 'https://owmddpatncdmjhaxdsqq.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bWRkcGF0bmNkbWpoYXhkc3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc1NDYsImV4cCI6MjA5NjMzMzU0Nn0.IYAJj8f1DM5pycg5sfZrlUc_ZKS3z3SrDU3sJ8crtj4';

  function insert(table, data) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) return res.json().catch(function () { return {}; }).then(function (e) { throw new Error(e.message || 'error'); });
    });
  }

  function toast(msg, isError) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;padding:12px 24px;border-radius:9999px;font-family:Inter,sans-serif;font-size:14px;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,0.15);transition:opacity .3s;white-space:nowrap;';
    t.style.background = isError ? '#ba1a1a' : '#006686';
    t.style.color = '#fff';
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 300); }, 3500);
  }

  // ── Newsletter ──────────────────────────────────────────────────────────────
  var nForm = document.getElementById('newsletter-form');
  if (nForm) {
    nForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('newsletter-email');
      var btn   = nForm.querySelector('button[type=submit]');
      var email = (input.value || '').trim();
      if (!email) return;
      if (btn) btn.disabled = true;
      insert('subscribers', { email: email })
        .then(function () {
          input.value = '';
          toast('Subscribed! Thank you.');
        })
        .catch(function (err) {
          toast(/duplicate|already/i.test(err.message) ? 'You\'re already subscribed.' : 'Something went wrong. Please try again.', true);
        })
        .finally(function () { if (btn) btn.disabled = false; });
    });
  }

  // ── Booking Modal ───────────────────────────────────────────────────────────
  var modal = document.getElementById('booking-modal');
  if (!modal) return;

  var bForm    = document.getElementById('booking-form');
  var closeBtn = document.getElementById('booking-close');
  var showroomHidden = document.getElementById('booking-showroom');
  var modalTitle     = document.getElementById('booking-modal-title');

  function openModal(showroom) {
    showroomHidden.value = showroom;
    if (modalTitle) modalTitle.textContent = 'Book a Visit — ' + showroom;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    bForm.reset();
    var submitBtn = bForm.querySelector('[type=submit]');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Request Visit'; }
  }

  document.querySelectorAll('[data-book-showroom]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openModal(el.dataset.bookShowroom);
    });
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  bForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var submitBtn = bForm.querySelector('[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    insert('bookings', {
      name:           document.getElementById('booking-name').value.trim(),
      email:          document.getElementById('booking-email').value.trim(),
      phone:          document.getElementById('booking-phone').value.trim() || null,
      showroom:       showroomHidden.value,
      preferred_date: document.getElementById('booking-date').value || null,
      message:        document.getElementById('booking-message').value.trim() || null
    })
      .then(function () {
        closeModal();
        toast('Booking request sent! We\'ll be in touch soon.');
      })
      .catch(function () {
        toast('Something went wrong. Please try again.', true);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request Visit';
      });
  });
})();
