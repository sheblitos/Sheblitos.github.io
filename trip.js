/* =====================================================================
   FREEDIVING BRAIN · SHARED TRIP PAGE BEHAVIOUR
   Each trip page defines window.TRIP before loading this file:
     TRIP = {
       name:     'Dahab Expedition',           // used in the enquiry email
       dates:    null,                         // e.g. '3–9 May 2027'; null = not announced
       packages: { learn:null, train:null, advance:null },  // € per person; null = "Price on request"
       whatsapp: 'Hi! I'm interested in ...'   // prefilled WhatsApp message
     };
   Markup hooks: [data-trip-status], [data-price-for="key"], .reveal,
   #itinToggle + #days details, [data-pick] + #f-pkg, form#tripForm.
   ===================================================================== */
(function () {
  var TRIP = window.TRIP || {};
  var WA_NUMBER = '34603083325';
  var WA = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(TRIP.whatsapp || "Hi! I'm interested in a Freediving Brain trip.");
  var EMAIL = 'shebl@freedivingbrain.com';

  // Dates and prices
  var status = document.querySelector('[data-trip-status]');
  if (TRIP.dates && status) status.textContent = 'Next ' + (TRIP.short || 'trip') + ': ' + TRIP.dates + '. Places are limited to keep the group small.';
  Object.keys(TRIP.packages || {}).forEach(function (k) {
    var p = TRIP.packages[k], el = document.querySelector('[data-price-for="' + k + '"]');
    if (p && el) el.innerHTML = '€' + Number(p).toLocaleString('en') + '<small>Per person' + (TRIP.dates ? ', ' + TRIP.dates : '') + '</small>';
  });
  document.querySelectorAll('[data-wa]').forEach(function (a) { a.href = WA; });

  // Reveal on scroll
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  // Itinerary: open/close all
  var toggle = document.getElementById('itinToggle'), days = [].slice.call(document.querySelectorAll('#days details'));
  if (toggle && days.length) {
    var sync = function () { toggle.textContent = days.every(function (d) { return d.open; }) ? 'Close all days' : 'Open all days'; };
    toggle.addEventListener('click', function () {
      var open = !days.every(function (d) { return d.open; });
      days.forEach(function (d) { d.open = open; }); sync();
    });
    days.forEach(function (d) { d.addEventListener('toggle', sync); });
  }

  // Package buttons pre-select the package in the form
  var pkgSelect = document.getElementById('f-pkg');
  document.querySelectorAll('[data-pick]').forEach(function (b) {
    b.addEventListener('click', function () { if (pkgSelect) pkgSelect.value = b.getAttribute('data-pick'); });
  });

  // Enquiry form → FormSubmit (same service as the rest of the site)
  var form = document.getElementById('tripForm');
  if (!form) return;
  var btn = form.querySelector('[type="submit"]'), msg = form.querySelector('.form-msg'), label = btn.textContent;
  var required = (form.getAttribute('data-required') || 'name,email').split(',');
  function show(kind, html) { msg.className = 'form-msg ' + kind; msg.innerHTML = html; msg.hidden = false; }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form._honey && form._honey.value) return;
    var bad = null;
    required.forEach(function (n) {
      var f = form.elements[n]; if (!f) return;
      var v = f.value.trim(), ok = !!v && (n !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
      f.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok && !bad) bad = f;
    });
    if (bad) { show('err', form.getAttribute('data-error') || 'Please fill in the highlighted fields.'); bad.focus(); return; }

    var fd = new FormData(form);
    fd.delete('_honey');
    fd.append('trip', TRIP.name || document.title);
    fd.append('_subject', (TRIP.name || 'Trip') + ' enquiry · freedivingbrain.com');
    fd.append('_template', 'table');
    fd.append('_captcha', 'false');
    fd.append('_autoresponse', 'Thanks for your interest in the Freediving Brain ' + (TRIP.name || 'trip') + '! We have your message and will reply within 48 hours. Shebl & Rimi');
    btn.disabled = true; btn.textContent = 'Sending...';
    fetch('https://formsubmit.co/ajax/hello@freedivingbrain.com', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams(fd).toString()
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok || String(j.success) === 'false') throw new Error(j.message || 'failed'); }); })
      .then(function () {
        form.reset();
        btn.textContent = 'Sent';
        show('ok', '<strong>Thank you, your enquiry is in.</strong> We\'ll reply within 48 hours. Want a faster answer? <a href="' + WA + '" target="_blank" rel="noopener">Message us on WhatsApp</a>.');
        if (typeof gtag === 'function') gtag('event', 'generate_lead', { trip: TRIP.name || '' });
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = label;
        show('err', 'Sorry, that didn\'t go through. Please try again, or reach us on <a href="' + WA + '" target="_blank" rel="noopener">WhatsApp</a> or at <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>.');
      });
  });
})();
