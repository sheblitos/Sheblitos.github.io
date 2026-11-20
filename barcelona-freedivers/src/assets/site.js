/* Barcelona Freedivers: one script for every page. */
(function () {
  var body = document.querySelector('[data-page]') || document.body;
  var preview = body.getAttribute('data-preview') === '1';
  function track(name, params) { try { window.gtag && window.gtag('event', name, params || {}); } catch (e) {} }
  window.bfTrack = track;

  /* Mobile menu */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { toggle.click(); toggle.focus(); }
    });
  }

  /* Consent banner */
  var banner = document.getElementById('consent');
  var stored = null;
  try { stored = localStorage.getItem('bf-consent'); } catch (e) {}
  if (banner && !stored) banner.hidden = false;
  document.querySelectorAll('[data-consent]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-consent');
      try { localStorage.setItem('bf-consent', v); } catch (e) {}
      if (v === 'granted') window.gtag && window.gtag('consent', 'update', { analytics_storage: 'granted' });
      banner.hidden = true;
    });
  });

  /* Click events: WhatsApp, email, course views */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('wa.me/') > -1) track('whatsapp_click', { link_location: body.getAttribute('data-page') });
    if (href.indexOf('mailto:') === 0) track('email_click', { link_location: body.getAttribute('data-page') });
    var cid = a.getAttribute('data-course');
    if (cid && a.hasAttribute('data-course-view')) track('course_view', { course_id: cid });
  });

  /* Courses page: a course opened by link or by the helper counts as a course view */
  var page = body.getAttribute('data-page');
  function viewFromHash() {
    var id = location.hash.replace('#', '');
    var el = id && document.getElementById(id);
    if (el && el.classList.contains('course-detail')) track('course_view', { course_id: id });
  }
  if (page === 'courses') { viewFromHash(); window.addEventListener('hashchange', viewFromHash); }

  /* Course helper: two questions */
  var helper = document.getElementById('helper');
  if (helper) {
    var data = JSON.parse(document.getElementById('course-data').textContent);
    var out = document.getElementById('helper-result');
    var q2 = document.getElementById('q2');
    function pick() {
      var exp = (helper.querySelector('input[name="exp"]:checked') || {}).value;
      var goal = (helper.querySelector('input[name="goal"]:checked') || {}).value;
      q2.disabled = exp !== 'none';
      q2.classList.toggle('muted', exp !== 'none');
      if (!exp) return;
      var id = { 'aida-1': 'aida-2', 'aida-2': 'aida-3', 'aida-3': 'aida-4', 'aida-4': 'aida-instructor' }[exp];
      if (exp === 'none') { if (!goal) { out.hidden = true; return; } id = goal === 'pool' ? 'aida-1' : 'aida-2'; }
      var c = data[id];
      out.innerHTML = '<p class="eyebrow">Start here</p><p><strong style="font-size:1.25rem">' + c.level + ', ' + c.name + '</strong><br>' +
        c.where + ' \u00b7 ' + c.duration + (c.depth && c.depth !== 'None' ? ' \u00b7 Depth ' + c.depth : '') + ' \u00b7 Prerequisite: ' + c.prerequisite + '</p>' +
        '<div class="btn-row on-dark"><a class="btn" href="' + c.request + '">Request a place on ' + c.level + '</a><a class="btn btn-line" href="#' + id + '">See ' + c.level + ' details</a></div>';
      out.hidden = false;
      track('course_view', { course_id: id, source: 'helper' });
    }
    helper.addEventListener('change', pick);
  }

  /* Booking form */
  var form = document.getElementById('booking');
  if (form) {
    var month = document.getElementById('month');
    var now = new Date();
    var fmt = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
    month.innerHTML = '<option value="">Choose a month</option>';
    for (var i = 0; i < 12; i++) {
      var d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      var o = document.createElement('option');
      o.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      o.textContent = fmt.format(d);
      month.appendChild(o);
    }
    month.disabled = false;
    var nojs = document.getElementById('month-nojs');
    if (nojs) nojs.remove();

    var pre = location.hash.replace('#', '');
    var sel = document.getElementById('course');
    if (pre && sel.querySelector('option[value="' + pre + '"]')) sel.value = pre;

    var started = false;
    form.addEventListener('input', function () {
      if (!started) { started = true; track('booking_start', { course_id: sel.value || 'unset' }); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
        f.setAttribute('aria-invalid', bad ? 'true' : 'false');
        var err = document.getElementById(f.id + '-error');
        if (err) err.hidden = !bad;
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) return;
      var next = form.getAttribute('data-next');
      track('booking_submit', { course_id: sel.value, preferred_month: month.value });
      if (preview) { location.href = next; return; }
      var bodyData = new URLSearchParams(new FormData(form)).toString();
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Sending...';
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: bodyData })
        .then(function (r) { if (!r.ok) throw new Error(r.status); location.href = next; })
        .catch(function () {
          btn.disabled = false; btn.textContent = 'Send request';
          document.getElementById('form-error').hidden = false;
        });
    });
  }
})();
