/* =====================================================================
   EXTour Earth
   - Welcome: the Earth spins behind the first screen. Drag it, tap a
     place name to fly over it and see what is there
   - Onboarding, "Where are you based?": the globe turns to each place picked
   - Creating a profile or picking a demo account: the Earth dives into home
     and Explore opens through a round window
   - Explore location pill, Destinations, "Where to next?" cards: pick a
     sport, see where it is good now, tap a place on the Earth or in the
     list, fly there and land on that place
   Globe: cobe (MIT) bundled in js/vendor, so nothing outside can block it.
   Without WebGL a flat, slowly turning globe keeps the same choices.
   Reduced motion: no automatic spin or flights; dragging still works.
   ===================================================================== */
'use strict';

const EARTH_CFG = {
  sources: [() => new URL('js/vendor/cobe.js', document.baseURI).href, () => 'https://cdn.jsdelivr.net/npm/cobe@0.6.5/+esm'],
  fill: 0.8, zoom: 4.5
};
const LIME = [0.78, 0.95, 0.42], PAPER = [0.98, 0.98, 0.97], DIM = [0.5, 0.58, 0.53];

(function earthStyle() {
  const css = `
.xg-sky{position:absolute;inset:0;pointer-events:none;background:
  radial-gradient(1px 1px at 12% 16%,rgba(250,250,247,.7),transparent 60%),radial-gradient(1px 1px at 82% 10%,rgba(250,250,247,.5),transparent 60%),
  radial-gradient(1.5px 1.5px at 68% 48%,rgba(250,250,247,.4),transparent 60%),radial-gradient(1px 1px at 28% 40%,rgba(250,250,247,.45),transparent 60%),
  radial-gradient(1px 1px at 92% 30%,rgba(250,250,247,.5),transparent 60%),radial-gradient(1px 1px at 6% 52%,rgba(250,250,247,.35),transparent 60%),
  radial-gradient(1px 1px at 48% 8%,rgba(250,250,247,.5),transparent 60%),radial-gradient(60% 46% at 50% 38%,rgba(199,243,107,.11),transparent 70%)}
.xg-stage{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.xg-stage.drag{pointer-events:auto;cursor:grab;touch-action:pan-y}
.xg-stage.drag.both{touch-action:none}
.xg-stage.drag:active{cursor:grabbing}
.xg-canvas{position:absolute;left:50%;transform:translate(-50%,-50%);opacity:0;transition:opacity .6s ease;pointer-events:none}
.xg-canvas.on{opacity:1}
.xg-flat{position:absolute;left:50%;transform:translate(-50%,-50%);border-radius:50%;overflow:hidden;pointer-events:none;
  background:radial-gradient(circle at 34% 30%,#45644F,#203629 58%,#0F1B15);box-shadow:0 0 60px rgba(199,243,107,.2)}
.xg-flat::before{content:"";position:absolute;inset:0;border-radius:50%;opacity:.55;
  background-image:radial-gradient(circle,rgba(199,243,107,.75) 1.2px,transparent 1.6px);background-size:11px 11px;animation:xgTurn 26s linear infinite;
  -webkit-mask-image:radial-gradient(circle at 45% 45%,#000 45%,transparent 72%);mask-image:radial-gradient(circle at 45% 45%,#000 45%,transparent 72%)}
@keyframes xgTurn{to{background-position:220px 0}}
.xg-labels{position:absolute;inset:0;pointer-events:none}
.xg-lab{position:absolute;left:0;top:0;display:inline-flex;transition:opacity .25s ease;align-items:center;gap:6px;height:28px;padding:0 10px 0 8px;border-radius:999px;
  background:rgba(13,23,19,.72);color:var(--paper);font-size:12.5px;font-weight:800;white-space:nowrap;pointer-events:auto;
  border:1px solid rgba(199,243,107,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);will-change:transform,opacity}
.xg-lab::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--lime);box-shadow:0 0 0 3px rgba(199,243,107,.25)}
.xg-lab[aria-pressed="true"]{background:var(--lime);color:var(--forest);border-color:var(--lime)}
.xg-lab[aria-pressed="true"]::before{background:var(--forest);box-shadow:none}
.xg-lab:focus-visible{outline:2px solid var(--lime);outline-offset:2px}
.xg-hint{position:absolute;left:0;right:0;text-align:center;color:rgba(250,250,247,.7);pointer-events:none;z-index:2;transition:opacity .4s ease}
.xg-pin{position:absolute;left:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:var(--lime);
  border:2.5px solid var(--forest);opacity:0;transform:scale(.4);transition:opacity .35s ease,transform .35s ease;pointer-events:none;z-index:1}
.xg-pin.on{opacity:1;transform:none;animation:xgPulse 1.4s ease-out infinite}
@keyframes xgPulse{from{box-shadow:0 0 0 0 rgba(199,243,107,.6)}to{box-shadow:0 0 0 24px rgba(199,243,107,0)}}
.xg-over{position:absolute;inset:0;z-index:70;overflow:hidden;background:var(--forest);color:var(--paper);transition:opacity .3s ease}
.xg-over.leaving{opacity:0}
.xg-top{position:absolute;left:0;right:0;top:0;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:calc(12px + env(safe-area-inset-top,0px)) 14px 0 20px}
.xg-top .brand{color:var(--paper)}
.xg-top .icon-btn{background:rgba(250,250,247,.12);color:var(--paper)}
.xg-status{position:absolute;left:0;right:0;z-index:2;text-align:center;color:var(--lime);padding:0 24px;pointer-events:none}
.xg-over .sheet.xg-sheet{color:var(--ink);z-index:3;max-height:52%;animation:sheetUp .34s var(--ease) both;transition:transform .35s var(--ease)}
.xg-over .sheet.xg-sheet.hide{transform:translateY(110%)}
.xg-dests{display:grid;gap:8px}
.xg-dest{display:flex;gap:12px;align-items:center;width:100%;padding:10px;border-radius:16px;border:1.5px solid var(--line-2);background:var(--paper);text-align:left}
.xg-dest[aria-pressed="true"]{border-color:var(--forest);box-shadow:inset 0 0 0 1px var(--forest)}
.xg-dest .tx{flex:1;min-width:0;display:grid;gap:2px}
.xg-dest b{font-weight:800;font-size:15.5px;line-height:1.2}
.xg-dest small{font-size:12.5px;color:var(--stone-ink);font-weight:600}
.xg-dest .art{width:54px;height:54px;border-radius:13px;flex:none}
.xg-gobar{position:sticky;bottom:calc(-24px - env(safe-area-inset-bottom,0px));margin:0 -20px calc(-24px - env(safe-area-inset-bottom,0px));padding:12px 20px calc(16px + env(safe-area-inset-bottom,0px));background:var(--sand);border-top:1px solid var(--line);z-index:2}
.xg-gobar .btn{width:100%}
.xg-go{display:grid;gap:2px;line-height:1.15}
.xg-go small{font-size:12px;font-weight:700;opacity:.8}
.xg-links{display:flex;flex-wrap:wrap;gap:6px 18px}
.w-hero.xg-hero{height:430px;background:var(--forest)}
.w-hero.xg-hero .shade{pointer-events:none;background:linear-gradient(180deg,rgba(13,23,19,0) 48%,rgba(13,23,19,.86))}
.w-hero.xg-hero .w-tx{pointer-events:none}
.xg-count{color:var(--lime);min-height:1.5em}
.xg-band{position:relative;height:196px;margin:16px 20px 0;border-radius:22px;overflow:hidden;background:var(--forest);color:var(--paper)}
.xg-band-l{position:absolute;left:14px;bottom:12px;z-index:2;color:var(--lime)}
.xg-card{display:flex;align-items:center;gap:14px;width:calc(100% - 40px);margin:0 20px;padding:16px;border-radius:22px;background:var(--forest);color:var(--paper);text-align:left;position:relative;overflow:hidden}
.xg-card .tx{flex:1;min-width:0;display:grid;gap:4px}
.xg-card .mono{color:var(--lime)}
.xg-card b{font-size:18px;font-weight:800;letter-spacing:-.02em;line-height:1.2}
.xg-card small{font-size:13px;color:#CBD5CE;font-weight:600;line-height:1.35}
.xg-mini{width:74px;height:74px;border-radius:50%;flex:none;position:relative;overflow:hidden;
  background:radial-gradient(circle at 34% 30%,#45644F,#203629 60%,#0F1B15);box-shadow:0 0 26px rgba(199,243,107,.22)}
.xg-mini::before{content:"";position:absolute;inset:0;border-radius:50%;opacity:.5;background-image:radial-gradient(circle,rgba(199,243,107,.8) 1px,transparent 1.4px);background-size:8px 8px;animation:xgTurn 30s linear infinite}
.xg-mini i{position:absolute;width:7px;height:7px;border-radius:50%;background:var(--lime);box-shadow:0 0 0 3px rgba(199,243,107,.25);animation:xgPing 2.4s ease-in-out infinite}
.xg-mini i:nth-child(2){animation-delay:.8s}.xg-mini i:nth-child(3){animation-delay:1.6s}
@keyframes xgPing{50%{box-shadow:0 0 0 7px rgba(199,243,107,0)}}
.xg-card .go{width:38px;height:38px;border-radius:12px;background:var(--lime);color:var(--forest);display:grid;place-items:center;flex:none}`;
  const s = document.createElement('style'); s.id = 'xg-style'; s.textContent = css; document.head.appendChild(s);
})();

/* ---------------------------------------------------------------------
   Globe: one cobe globe at a time. Its view survives moving between
   screens, so the Earth turns continuously from welcome to Explore.
   --------------------------------------------------------------------- */
const Globe = (() => {
  let lib = null, loading = null;
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const webgl = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } };
  function load() {
    if (lib) return Promise.resolve(lib);
    if (!loading) {
      const tryAt = i => i >= EARTH_CFG.sources.length ? Promise.reject(new Error('globe unavailable'))
        : import(EARTH_CFG.sources[i]()).then(m => (lib = m.default || m)).catch(() => tryAt(i + 1));
      loading = Promise.race([tryAt(0), new Promise((_, no) => setTimeout(() => no(new Error('globe timed out')), 6000))]).catch(e => { loading = null; throw e; });
    }
    return loading;
  }
  const angles = (lat, lng) => [Math.PI - (lng * Math.PI / 180 - Math.PI / 2), lat * Math.PI / 180];
  const nearest = (from, to) => { let d = (to - from) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return from + d; };
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, easeIn = x => x * x * x;

  const start = angles(41.39, 2.17);
  const view = { phi: start[0] - 1.4, theta: 0.32, scale: 1 };
  let inst = null, canvas = null, key = '', size = null, tw = null, spin = true, pending = null, raf = 0, gone = 0;
  let host = null, dragOk = false, dragging = false, vel = 0, lastTouch = 0, labelBox = null, labels = [], onLabel = null, labelSel = null;

  function markerList(o = {}) {
    return Q.destsSorted().filter(d => d.lat != null).map(d => {
      const lit = !o.lit || o.lit.includes(d.id), sel = d.id === o.sel;
      return { location: [d.lat, d.lng], size: sel ? 0.1 : lit ? 0.055 : 0.03, color: sel || (lit && o.lit) ? LIME : d.id === o.home ? PAPER : lit ? LIME : DIM };
    });
  }
  function measure(el, cfg) {
    const r = el.getBoundingClientRect(), w = r.width || 360, h = r.height || 420;
    const side = Math.ceil(Math.max(w, h) * (cfg.cover ? 1.45 : 1.2));
    let dpr = Math.min(window.devicePixelRatio || 1, 2); if (side * dpr > 2400) dpr = Math.max(1, 2400 / side);
    const rest = Math.min(cfg.diameter || Infinity, w * 0.84, h * (cfg.cover ? 0.42 : 0.9));
    return { w, h, side, dpr, cy: Math.round(h * (cfg.cy == null ? 0.5 : cfg.cy)), rest, base: rest / (side * EARTH_CFG.fill) };
  }
  function destroy() {
    cancelAnimationFrame(raf); raf = 0;
    if (inst) { try { inst.destroy(); } catch (e) { /* already gone */ } }
    if (canvas) canvas.remove();
    inst = null; canvas = null; key = '';
  }

  /* Where a place sits on screen, from cobe's own rotation (phi, theta). */
  function project(lat, lng) {
    const c = lat * Math.PI / 180, a = lng * Math.PI / 180 - Math.PI, t = Math.cos(c);
    const mx = -t * Math.cos(a), my = Math.sin(c), mz = t * Math.sin(a);
    const d = Math.cos(view.phi), f = Math.sin(view.phi), cc = Math.cos(view.theta), e = Math.sin(view.theta);
    const lx = d * mx + f * mz, ly = f * e * mx + cc * my - d * e * mz, lz = -f * cc * mx + e * my + d * cc * mz;
    const k = 0.8 * view.scale * size.side / 2;
    return { x: size.w / 2 + lx * k, y: size.cy - ly * k, z: lz };
  }
  /* Names follow their places. Where names would overlap, the picked place
     and the places facing the viewer keep theirs; the rest wait their turn. */
  function drawLabels() {
    if (!labelBox || !size || !labels.length) return;
    const zoomed = view.scale > size.base * 1.5, shown = [];
    labels.map(L => ({ L, p: project(L.lat, L.lng) }))
      .sort((a, b) => ((b.L.id === labelSel) - (a.L.id === labelSel)) || b.p.z - a.p.z)
      .forEach(({ L, p }) => {
        if (!L.w) L.w = L.el.offsetWidth || 90;
        let vis = !zoomed && p.z > 0.12 && p.x > 8 && p.x < size.w - 8 && p.y > 40 && p.y < size.h - 8;
        const box = { x: p.x - 9, y: p.y - 14, w: L.w, h: 28 };
        if (vis && shown.some(o => box.x < o.x + o.w + 4 && o.x < box.x + box.w + 4 && box.y < o.y + o.h + 2 && o.y < box.y + box.h + 2)) vis = false;
        if (vis) shown.push(box);
        const o = vis ? Math.min(1, (p.z - 0.12) / 0.25) : 0;
        L.el.style.opacity = o.toFixed(2);
        L.el.style.pointerEvents = o > 0.4 ? 'auto' : 'none';
        L.el.tabIndex = o > 0.4 ? 0 : -1;
        if (vis) L.el.style.transform = `translate(${Math.round(box.x)}px,${Math.round(box.y)}px)`;
      });
  }
  function setLabels(items, tap, sel) {
    labels = []; onLabel = tap || null; labelSel = sel || null;
    if (!labelBox) return;
    labelBox.innerHTML = (items || []).map(D => `<button class="xg-lab" type="button" data-lab="${D.id}" aria-pressed="${D.id === labelSel}" aria-label="${esc(D.name)}, fly over it">${esc(D.name)}</button>`).join('');
    labels = (items || []).map(D => ({ id: D.id, lat: D.lat, lng: D.lng, el: $(`[data-lab="${D.id}"]`, labelBox) }));
    labels.forEach(L => { L.el.style.opacity = '0'; L.el.onclick = e => { e.stopPropagation(); if (onLabel) onLabel(L.id); }; });
    drawLabels();
  }

  function loop(now) {
    raf = 0; if (!inst) return;
    if (!canvas.isConnected) { if (++gone > 45) { destroy(); return; } } else gone = 0;
    if (tw && !dragging) {
      if (!tw.t0) tw.t0 = now;
      const x = Math.min(1, (now - tw.t0) / tw.ms), e = tw.fn(x);
      for (const k of ['phi', 'theta', 'scale']) view[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e;
      if (x >= 1) tw.done();
    } else if (!dragging) {
      if (Math.abs(vel) > 0.0002) { view.phi += vel; vel *= 0.94; }
      else if (spin && !reduced() && now - lastTouch > 2500) view.phi += 0.0022;
    }
    drawLabels();
    raf = requestAnimationFrame(loop);
  }

  /* Drag to spin: sideways turns the Earth; with `both`, up and down tilts it. */
  function bindDrag(el, both) {
    el.classList.add('drag'); el.classList.toggle('both', !!both);
    let px = 0, py = 0, down = false;
    el.onpointerdown = e => {
      if (!dragOk || e.target.closest('.xg-lab')) return;
      down = true; dragging = true; vel = 0; px = e.clientX; py = e.clientY;
      if (tw) tw.done();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    };
    el.onpointermove = e => {
      if (!down || !size) return;
      const k = 3 / Math.max(160, size.rest), dx = e.clientX - px, dy = e.clientY - py;
      px = e.clientX; py = e.clientY;
      view.phi += dx * k; vel = dx * k;
      if (both) view.theta = Math.max(-1.1, Math.min(1.1, view.theta + dy * k));
    };
    const up = () => { if (!down) return; down = false; dragging = false; lastTouch = performance.now(); if (reduced()) vel = 0; };
    el.onpointerup = up; el.onpointercancel = up; el.onlostpointercapture = up;
  }

  function showFlat(el, s) {
    const flat = document.createElement('div'); flat.className = 'xg-flat';
    Object.assign(flat.style, { width: s.rest + 'px', height: s.rest + 'px', top: s.cy + 'px' });
    el.appendChild(flat);
  }
  /* Put the globe in a host element. Same key and size: the same canvas moves over. */
  function mount(el, cfg = {}) {
    spin = cfg.spin !== false; host = el; dragOk = !!cfg.drag; vel = 0;
    const s = measure(el, cfg);
    labelBox = null; labels = [];
    if (cfg.drag) bindDrag(el, cfg.both);
    if (!webgl()) { size = s; showFlat(el, s); return Promise.resolve(false); }
    return load().then(createGlobe => {
      if (!el.isConnected) return false;
      const same = inst && key === cfg.key && size && size.side === s.side && Math.abs(size.dpr - s.dpr) < 0.01;
      size = s;
      if (!same) {
        destroy();
        canvas = document.createElement('canvas'); canvas.className = 'xg-canvas'; canvas.setAttribute('aria-hidden', 'true');
        canvas.width = canvas.height = Math.round(s.side * s.dpr);
        if (!tw) view.scale = s.base;
        inst = createGlobe(canvas, {
          devicePixelRatio: s.dpr, width: canvas.width, height: canvas.height, phi: view.phi, theta: view.theta, scale: view.scale,
          dark: 1, diffuse: 1.2, mapSamples: 20000, mapBrightness: 6, opacity: 0.95,
          baseColor: [0.22, 0.34, 0.28], markerColor: LIME, glowColor: [0.3, 0.45, 0.36], markers: markerList(cfg.markers || {}),
          onRender: st => { st.phi = view.phi; st.theta = view.theta; st.scale = view.scale; st.width = canvas.width; st.height = canvas.height; if (pending) { st.markers = pending; pending = null; } }
        });
        key = cfg.key;
        requestAnimationFrame(() => canvas && canvas.classList.add('on'));
      } else if (!tw) view.scale = s.base;
      canvas.style.width = canvas.style.height = s.side + 'px';
      canvas.style.top = s.cy + 'px';
      el.appendChild(canvas);
      if (cfg.labels) { labelBox = document.createElement('div'); labelBox.className = 'xg-labels'; el.appendChild(labelBox); setLabels(cfg.labels.items, cfg.labels.tap, cfg.labels.sel); }
      if (cfg.markers) pending = markerList(cfg.markers);
      if (!raf) raf = requestAnimationFrame(loop);
      return true;
    }).catch(e => { console.warn('EXTour Earth: flat globe', e); size = s; showFlat(el, s); return false; });
  }
  function to(t, ms, fn = ease) {
    if (tw) tw.done();
    return new Promise(res => {
      if (!inst || reduced() || ms <= 0) { Object.assign(view, t); res(); return; }
      tw = { from: { ...view }, to: { ...view, ...t }, ms, fn, t0: 0, done: () => { tw = null; res(); } };
    });
  }
  return {
    mount, destroy, labels: setLabels,
    markers: o => { pending = markerList(o); },
    lookAt(d, o = {}) { spin = false; vel = 0; const a = angles(d.lat, d.lng); return to({ phi: nearest(view.phi, a[0]) + (o.roll ? 2 * Math.PI : 0), theta: a[1], scale: size ? size.base : view.scale }, o.roll ? 1600 : (o.ms || 900)); },
    dive: () => to({ scale: (size ? size.base : 1) * EARTH_CFG.zoom }, 1400, easeIn),
    spin: on => { spin = on; },
    lock: () => { dragOk = false; dragging = false; vel = 0; if (labelBox) labelBox.innerHTML = ''; labels = []; },
    live: () => !!inst,
    reduced,
    size: () => size
  };
})();

/* ---------------------------------------------------------------------
   Helpers on top of the app's data
   --------------------------------------------------------------------- */
const coordLine = D => `${Math.abs(D.lat).toFixed(2)}° ${D.lat >= 0 ? 'N' : 'S'} · ${Math.abs(D.lng).toFixed(2)}° ${D.lng >= 0 ? 'E' : 'W'}`;
const destHas = (D, sid) => !sid || Q.destSports(D.id).some(s => s.id === sid);
const placed = () => Q.destsSorted().filter(D => D.lat != null);
/* true: in season this month, false: off season, null: no season data */
function goodNow(D, sid) {
  const m = new Date().getMonth() + 1, rows = (D.seasons || []).filter(([s]) => !sid || s === sid);
  return rows.length ? rows.some(([, months]) => months.includes(m)) : null;
}
function nowFor(D) {
  const m = new Date().getMonth() + 1;
  return (D.seasons || []).filter(([, months]) => months.includes(m)).map(([s]) => (Q.sport(s) || {}).name).filter(Boolean);
}
function inSeasonHook() {
  const mine = Session.me ? Q.userSports(Session.id).map(u => u.sport_id) : [];
  const ranked = (mine.length ? mine : Q.sportsActive().map(s => s.id)).map(sid => ({ sid, n: placed().filter(D => destHas(D, sid) && goodNow(D, sid) === true).length })).sort((a, b) => b.n - a.n);
  const top = ranked[0];
  return top && top.n ? { sid: top.sid, text: `${Q.sport(top.sid).name} is in season in ${top.n} place${top.n === 1 ? '' : 's'} right now` } : null;
}

/* ---------------------------------------------------------------------
   The Earth screen: an overlay inside the app
   --------------------------------------------------------------------- */
const Earth = {
  el: null, sport: null, pick: null,
  open(mode) {
    Earth.close(true);
    closeSheet();
    const explore = mode === 'explore';
    const el = document.createElement('div');
    el.className = 'xg-over'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', explore ? 'Where to next' : 'Opening EXTour');
    el.innerHTML = `<div class="xg-sky"></div><div class="xg-stage"></div><span class="xg-pin" aria-hidden="true"></span>
      <div class="xg-top"><span class="brand">${MARK(24)}<span class="wm"><b>EX</b>Tour</span></span>${explore ? `<button class="icon-btn" data-act="earthClose" aria-label="Close">${ico('x')}</button>` : ''}</div>
      <p class="xg-status mono" role="status" aria-live="polite"></p>
      ${explore ? '<div class="sheet xg-sheet"><div class="grab"></div><div class="xg-body"></div></div>' : ''}`;
    $('#app').appendChild(el); Earth.el = el;
    const stage = $('.xg-stage', el);
    return Globe.mount(stage, { key: 'over', cover: true, cy: explore ? 0.3 : 0.36, drag: explore, both: explore, markers: { home: Q.homeDest() },
      labels: explore ? { items: placed(), tap: id => A.earthPick(id) } : null }).then(() => {
      const s = Globe.size(); if (!s) return;
      $('.xg-pin', el).style.top = s.cy + 'px';
      $('.xg-status', el).style.top = Math.max(58, s.cy - s.rest / 2 - 30) + 'px';
    });
  },
  status(t) { const s = Earth.el && $('.xg-status', Earth.el); if (s) s.textContent = t || ''; },
  pin(on) { const p = Earth.el && $('.xg-pin', Earth.el); if (p) p.classList.toggle('on', !!on); },
  close(now) {
    const el = Earth.el; if (!el) return; Earth.el = null;
    if (now) { el.remove(); return; }
    el.classList.add('leaving'); setTimeout(() => el.remove(), 320);
  },
  /* A round window opens from the pin onto the screen underneath. */
  reveal() {
    const el = Earth.el; if (!el) return Promise.resolve();
    const s = Globe.size();
    if (!Globe.live() || !s || Globe.reduced()) { Earth.close(); return new Promise(r => setTimeout(r, 320)); }
    Earth.el = null; el.style.pointerEvents = 'none';
    const maxR = Math.hypot(s.w, Math.max(s.cy, s.h - s.cy)) + 40;
    return new Promise(res => {
      let t0 = 0;
      const step = now => {
        if (!t0) t0 = now;
        const x = Math.min(1, (now - t0) / 750), r = x * x * x * maxR;
        const m = `radial-gradient(circle at 50% ${s.cy}px, transparent ${r}px, #000 ${r + 1}px)`;
        el.style.webkitMaskImage = m; el.style.maskImage = m;
        if (x >= 1) { el.remove(); res(); return; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  },

  /* First arrival: turn to home, dive in, open the app underneath. */
  async flyHome(did, land) {
    const D = did && Q.dest(did);
    await Earth.open('home');
    Earth.status(D ? `Taking you home · ${D.name}` : 'Welcome to EXTour');
    if (D) { Globe.markers({ sel: D.id }); await Globe.lookAt(D, { ms: 1300 }); Earth.status(`${D.name} · ${coordLine(D)}`); Earth.pin(true); }
    else await new Promise(r => setTimeout(r, 900));
    land();
    if (D) { Earth.pin(false); await Globe.dive(); }
    await Earth.reveal();
  },

  /* "Where to next?": sport, then place, then fly. */
  async explore(o = {}) {
    Earth.sport = o.sport || null; Earth.pick = null;
    await Earth.open('explore');
    const here = Q.dest(curLoc()); if (here) Globe.lookAt(here, { ms: 900 }).then(() => Globe.spin(true));
    Analytics.track('earth_opened', { from: o.from || 'explore', sport: Earth.sport });
    if (Earth.sport) Earth.places(); else Earth.sports();
  },
  body(html) { const b = Earth.el && $('.xg-body', Earth.el); if (b) { b.innerHTML = html; b.parentNode.scrollTop = 0; } },
  sports() {
    const mine = Session.me ? Q.userSports(Session.id).map(u => u.sport_id) : [];
    const list = Q.sportsActive().sort((a, b) => (mine.includes(b.id) - mine.includes(a.id)) || a.sort - b.sort);
    const home = Q.homeDest(), away = curLoc() !== home && Q.dest(home);
    Globe.markers({ home }); Globe.labels(placed(), id => A.earthPick(id)); Earth.pin(false);
    Earth.status('Drag the Earth · tap a place');
    Earth.body(`<div class="sbody"><div><h3>Where to next?</h3><p class="sub">Tap a place on the Earth, or pick what you want to do and see where it is good this month.</p></div>
      ${away ? `<button class="lrow" data-act="earthHome" style="padding-top:0">${art(away.hero_image, '', 'width:44px;height:44px;border-radius:12px;flex:none')}<span class="tx"><b>Back home to ${esc(away.name)}</b><small>You are exploring ${esc(Q.dest(curLoc()).name)}</small></span>${ico('chev')}</button>` : ''}
      <div class="chips">${list.map(s => `<button class="chip" data-act="earthSport" data-arg="${s.id}" style="color:${s.color}">${ico(s.icon)}${esc(s.name)}${mine.includes(s.id) ? '<small class="muted" style="font-weight:600">· yours</small>' : ''}</button>`).join('')}
        <button class="chip" data-act="earthSport" data-arg="">${ico('globe')}Anything</button></div>
      <div class="xg-links"><button class="btn-link" data-act="earthList">All destinations as a list</button></div></div>`);
  },
  places() {
    const sid = Earth.sport, sp = sid && Q.sport(sid);
    const list = placed().filter(D => destHas(D, sid)).map(D => ({ D, now: goodNow(D, sid), n: Q.inDest(D.id, sid || undefined).length, people: Q.peopleIn(D.id).length }))
      .sort((a, b) => ((b.now === true) - (a.now === true)) || b.n - a.n);
    Globe.markers({ lit: list.map(x => x.D.id), sel: Earth.pick, home: Q.homeDest() });
    Globe.labels(list.map(x => x.D), id => A.earthPick(id), Earth.pick);
    if (!Earth.pick) { Earth.pin(false); Earth.status(`${list.length} places for ${sp ? sp.name.toLowerCase() : 'adventure'} · tap one`); }
    const pick = Earth.pick && list.find(x => x.D.id === Earth.pick);
    Earth.body(`<div class="sbody"><div><h3>${sp ? `${esc(sp.name)} around the world` : 'Everywhere on EXTour'}</h3><p class="sub">${list.length} destination${list.length === 1 ? '' : 's'}. Tap one here or on the Earth to fly over it.</p></div>
      <div class="xg-dests">${list.map(({ D, now, n, people }) => `<button class="xg-dest" data-act="earthPick" data-arg="${D.id}" aria-pressed="${Earth.pick === D.id}">${art(D.hero_image)}<span class="tx"><b>${esc(D.name)}</b><small>${esc(D.country)} · ${n} adventure${n === 1 ? '' : 's'} · ${people} ${people === 1 ? 'person' : 'people'}</small></span>${now === true ? '<span class="pill ok">Good now</span>' : now === false ? '<span class="pill">Off season</span>' : ''}</button>`).join('')}</div>
      <div class="xg-links"><button class="btn-link" data-act="earthSports">Change sport</button><button class="btn-link" data-act="earthList">All destinations as a list</button></div>
      ${pick ? `<div class="xg-gobar"><button class="btn btn-primary" data-act="earthGo"><span class="xg-go">Go to ${esc(pick.D.name)}<small>${pick.n} adventure${pick.n === 1 ? '' : 's'}${sp ? ` · ${esc(sp.name.toLowerCase())}` : ''}${pick.now === true ? ' · good now' : ''}</small></span></button></div>` : ''}</div>`);
    if (pick) { const b = Earth.el && $(`.xg-dest[data-arg="${pick.D.id}"]`, Earth.el); if (b) b.scrollIntoView({ block: 'nearest' }); }
  },
  async go() {
    const D = Q.dest(Earth.pick); if (!D) return;
    const sid = Earth.sport, sheet = Earth.el && $('.xg-sheet', Earth.el);
    if (sheet) sheet.classList.add('hide');
    Globe.lock(); Earth.pin(false); Earth.status(`Flying to ${D.name}`);
    Analytics.track('earth_trip', { destination: D.id, sport: sid });
    await Globe.lookAt(D, { roll: true });
    Earth.status(`${D.name} · ${coordLine(D)}`); Earth.pin(true);
    const toHome = D.id === Q.homeDest() && !sid;
    UI.loc = toHome ? null : D.id; UI.tab = 'explore';
    UI.stacks.explore = toHome ? [{ s: 'explore' }] : [{ s: 'explore' }, { s: 'dest', p: sid ? { id: D.id, sport: sid } : { id: D.id } }];
    render('tab');
    await new Promise(r => setTimeout(r, 250));
    Earth.pin(false); await Globe.dive(); await Earth.reveal();
    toast(toHome ? `Back home in ${D.name}` : `Exploring ${D.name}. Tap the place name on Explore to come back.`);
  }
};

Object.assign(A, {
  earth: arg => Earth.explore({ sport: arg || null, from: 'button' }),
  earthSport: sid => { Earth.sport = sid || null; Earth.pick = null; Earth.places(); },
  earthSports: () => { Earth.pick = null; Earth.sports(); },
  earthPick: did => {
    const D = Q.dest(did); if (!D || !Earth.el) return;
    if (Earth.sport && !destHas(D, Earth.sport)) Earth.sport = null;
    Earth.pick = did; Earth.places();
    const now = nowFor(D);
    Earth.status(now.length ? `${D.name} · good now for ${now.slice(0, 2).join(' and ').toLowerCase()}` : `${D.name} · ${coordLine(D)}`);
    Globe.lookAt(D).then(() => { if (Earth.pick === did) Earth.pin(true); });
  },
  earthGo: () => Earth.go(),
  earthClose: () => Earth.close(),
  earthHome: () => { Earth.pick = Q.homeDest(); Earth.sport = null; Earth.go(); },
  earthList: () => { Earth.close(); UI.tab = 'explore'; push('dests'); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && Earth.el && $('.xg-sheet', Earth.el)) Earth.close(); });

/* ---------------------------------------------------------------------
   Welcome: the Earth replaces the photo. Drag it, tap a place.
   --------------------------------------------------------------------- */
function welcomeTap(id) {
  const D = Q.dest(id); if (!D) return;
  const line = $('.xg-count'), sports = Q.destSports(D.id).map(s => s.name.toLowerCase()), now = nowFor(D);
  if (line) line.textContent = `${D.name}, ${D.country} · ${now.length ? 'good now for ' + now.slice(0, 2).join(' and ').toLowerCase() : sports.slice(0, 3).join(', ')} · ${Q.activeCount(D.id)} adventures`;
  Globe.labels(placed(), welcomeTap, id); Globe.markers({ sel: id });
  Globe.lookAt(D).then(() => Globe.spin(false));
}
const _xgWelcome = SCREENS.welcome;
SCREENS.welcome = () => {
  const out = _xgWelcome(); if (!out.body) return out;
  const nD = placed().length, nS = Q.sportsActive().length;
  out.body = out.body
    .replace(/<div class="w-hero">[\s\S]*?<span class="shade"><\/span>/, '<div class="w-hero xg-hero"><div class="xg-sky"></div><div class="xg-stage" data-globe="welcome"></div><span class="shade"></span><p class="xg-hint mono" style="top:16px">Drag the Earth · tap a place</p>')
    .replace('<div class="w-tx">', `<div class="w-tx"><span class="mono xg-count">${nD} destinations · ${nS} sports · first-timers welcome</span>`)
    .replace(/<button class="btn btn-secondary" disabled aria-disabled="true">[\s\S]*?<\/button>/g, '');
  const after = out.after;
  out.after = v => {
    if (after) after(v);
    const h = $('[data-globe="welcome"]', v); if (!h) return;
    Globe.mount(h, { key: 'welcome', cy: 0.4, diameter: 290, spin: true, drag: true, markers: {}, labels: { items: placed(), tap: welcomeTap } });
  };
  return out;
};

/* Picking a demo account from the welcome screen flies to that person's home. */
const _xgSignInAs = A.signInAs;
A.signInAs = id => {
  if (Session.me || !Q.prof(id)) return _xgSignInAs(id);
  Earth.flyHome(Q.prof(id).home_destination_id || 'barcelona', () => _xgSignInAs(id));
};

/* ---------------------------------------------------------------------
   Onboarding: the globe turns to the place you pick
   --------------------------------------------------------------------- */
const _xgOnboarding = SCREENS.onboarding;
SCREENS.onboarding = () => {
  const out = _xgOnboarding(); const O = UI.ob;
  if (!out.body || !O || O.step !== 1) return out;
  const D = O.home && Q.dest(O.home);
  out.body = out.body.replace('<div class="ob-q"><h1>Where are you based?</h1>', `<div class="xg-band" data-globe="ob"><div class="xg-sky"></div><div class="xg-stage"></div><span class="mono xg-band-l">${D ? `${esc(D.name)} · ${coordLine(D)}` : O.home === '' ? 'Somewhere else · we show the nearest hub' : 'Pick your home'}</span></div><div class="ob-q"><h1>Where are you based?</h1>`);
  const after = out.after;
  out.after = v => {
    if (after) after(v);
    const h = $('[data-globe="ob"] .xg-stage', v); if (!h) return;
    Globe.mount(h, { key: 'ob', cy: 0.5, diameter: 168, spin: !D, drag: true, markers: { sel: D ? D.id : null } }).then(() => { if (D) Globe.lookAt(D); });
  };
  return out;
};

/* Creating the profile: dive into home, Explore opens underneath. */
const _xgObDone = A.obDone;
A.obDone = () => {
  const O = UI.ob; if (!O || !(O.adult && O.terms)) return _xgObDone();
  Earth.flyHome(O.home || null, () => _xgObDone());
};

/* ---------------------------------------------------------------------
   Explore: the place pill and Destinations open the Earth; a card invites
   people to look further
   --------------------------------------------------------------------- */
const _xgLocSheet = A.locSheet;
A.locSheet = () => Earth.explore({ from: 'pill' });
A.locList = () => _xgLocSheet();

const _xgExplore = SCREENS.explore;
SCREENS.explore = () => {
  const out = _xgExplore(); if (!out.body || !Session.me) return out;
  out.body = out.body.replace(/<button data-go="dests" data-p="\{\}">/, '<button data-act="earth" data-arg="">');
  const hook = inSeasonHook(), n = placed().length;
  const card = `<section class="sec"><button class="xg-card" data-act="earth" data-arg="${hook ? hook.sid : ''}"><span class="xg-mini" aria-hidden="true"><i style="left:16px;top:20px"></i><i style="left:44px;top:14px"></i><i style="left:40px;top:44px"></i></span><span class="tx"><span class="mono">Where to next?</span><b>${hook ? esc(hook.text) : `${n} destinations to explore`}</b><small>Spin the Earth, see where it is good this month, and fly there.</small></span><span class="go">${ico('chev')}</span></button></section>`;
  out.body = out.body.replace(/(<section class="sec"><div class="sec-h"><div><h2>Popular near you<\/h2>[\s\S]*?<\/section>)/, `$1${card}`);
  return out;
};

/* Destination page: a way onward to other places for the same sport. */
const _xgDest = SCREENS.dest;
SCREENS.dest = p => {
  const out = _xgDest(p), D = Q.dest(p.id); if (!out.body || !D) return out;
  const sp = p.sport && Q.sport(p.sport);
  const others = placed().filter(x => x.id !== D.id && destHas(x, p.sport)).length;
  if (others) out.body += `<section class="sec"><button class="xg-card" data-act="earth" data-arg="${p.sport || ''}"><span class="xg-mini" aria-hidden="true"><i style="left:22px;top:20px"></i><i style="left:48px;top:36px"></i></span><span class="tx"><span class="mono">Where else?</span><b>${others} more place${others === 1 ? '' : 's'} for ${sp ? esc(sp.name.toLowerCase()) : 'adventure'}</b><small>See them on the Earth and compare seasons.</small></span><span class="go">${ico('chev')}</span></button></section>`;
  return out;
};

/* ---------------------------------------------------------------------
   Prototype index: the Earth flows are one tap away
   --------------------------------------------------------------------- */
if (typeof SCENARIOS !== 'undefined') SCENARIOS.unshift(['0 · The Earth', [['Start as a new visitor', 'earth:new'], ['Where to next? (as Marta)', 'earth:explore']]]);
const _xgJump = A.jump;
A.jump = code => {
  if (code === 'earth:new') { closeSheet(); Earth.close(true); Session.signOut(); render('tab'); toast('Signed out. This is what a new visitor sees.'); return; }
  if (code === 'earth:explore') { if (!Session.me) Session.signInAs('p_marta'); UI.tab = 'explore'; UI.stacks.explore = [{ s: 'explore' }]; render('tab'); Earth.explore({ from: 'index' }); return; }
  return _xgJump(code);
};

/* ---------------------------------------------------------------------
   Entry: every new visit from the link starts on the welcome page
   (Create an account / Sign in). Reloading the same tab keeps you signed
   in. On a real Supabase setup, signed-in accounts stay signed in.
   --------------------------------------------------------------------- */
if (!(typeof SupabaseBoot !== 'undefined' && SupabaseBoot.enabled())) {
  Session.restore = function () {
    const saved = ss(this.key);
    if (saved && Store.get('profiles', saved)) this._id = saved;
  };
}
