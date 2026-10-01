/* Floating WhatsApp button, shared by every page (one <script src="/wa.js" defer> per page). */
(function () {
  if (document.getElementById('waFloat')) return;

  var NUMBER = '201060318808';
  var es = (document.documentElement.lang || '').toLowerCase().indexOf('es') === 0;
  var label = es ? 'Escríbenos por WhatsApp' : 'Chat with us on WhatsApp';
  var text = es
    ? 'Hola, os encontré en freedivingbrain.com y tengo una pregunta.'
    : 'Hi, I found you on freedivingbrain.com and have a question.';

  var css = document.createElement('style');
  css.textContent =
    '.wa-float{position:fixed;right:20px;bottom:calc(20px + var(--wa-lift,0px) + env(safe-area-inset-bottom,0px));z-index:250;' +
    'width:56px;height:56px;border-radius:50%;background:#25d366;color:#fff;display:flex;align-items:center;justify-content:center;' +
    'box-shadow:0 6px 20px rgba(0,0,0,.35);text-decoration:none;transition:transform .25s ease,bottom .35s ease,box-shadow .25s ease}' +
    '.wa-float:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(0,0,0,.4)}' +
    '.wa-float:focus-visible{outline:2px solid #fff;outline-offset:3px}' +
    '.wa-float svg{width:30px;height:30px;fill:currentColor}' +
    '.wa-float-tip{position:absolute;right:68px;top:50%;transform:translate(6px,-50%);white-space:nowrap;pointer-events:none;' +
    'background:rgba(12,26,21,.96);color:#ece8e0;border:1px solid rgba(236,232,224,.14);border-radius:6px;padding:.45rem .75rem;' +
    'font:600 .8rem/1.2 Mulish,system-ui,sans-serif;opacity:0;transition:opacity .2s,transform .2s}' +
    '.wa-float:hover .wa-float-tip,.wa-float:focus-visible .wa-float-tip{opacity:1;transform:translate(0,-50%)}' +
    '@media (hover:none){.wa-float-tip{display:none}}' +
    '@media print{.wa-float{display:none}}' +
    '@media (prefers-reduced-motion:reduce){.wa-float,.wa-float-tip{transition:none}}';
  document.head.appendChild(css);

  var a = document.createElement('a');
  a.id = 'waFloat';
  a.className = 'wa-float';
  a.href = 'https://wa.me/' + NUMBER + '?text=' + encodeURIComponent(text);
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', label);
  a.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.39 9.39 0 0 1-1.44-5.01c0-5.2 4.23-9.43 9.44-9.43a9.37 9.37 0 0 1 6.67 2.77 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.42-9.44 9.42zm8.03-17.46A11.3 11.3 0 0 0 12.05.72C5.79.72.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.67L.6 23.28l5.68-1.49a11.32 11.32 0 0 0 5.77 1.47h.01c6.25 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.33-8.02z"/></svg>' +
    '<span class="wa-float-tip">' + label + '</span>';
  a.addEventListener('click', function () {
    if (typeof gtag === 'function') gtag('event', 'whatsapp_click', { page_path: location.pathname });
  });
  document.body.appendChild(a);

  // Sit above the homepage's mobile "Reserve" bar when it slides in.
  var bar = document.getElementById('stickyCta');
  if (bar) {
    var sync = function () {
      var on = bar.classList.contains('visible') && getComputedStyle(bar).display !== 'none';
      document.documentElement.style.setProperty('--wa-lift', on ? bar.offsetHeight + 'px' : '0px');
    };
    new MutationObserver(sync).observe(bar, { attributes: true, attributeFilter: ['class', 'style'] });
    addEventListener('resize', sync);
    sync();
  }
})();
