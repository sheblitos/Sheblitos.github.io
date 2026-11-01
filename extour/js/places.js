/* =====================================================================
   EXTour real place content
   - Spots: "Good to know" tips and a sources list with the date checked
   - Destinations: "When to go" by sport, sea temperature by month, sources
   Facts without a source are left out rather than guessed.
   ===================================================================== */
'use strict';

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const checkedLabel = ymd => { if (!ymd) return ''; const [y, m, d] = ymd.split('-').map(Number); return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(y, m - 1, d)); };
const hostOf = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };

function sourcesBlock(list, checked, note) {
  if (!list || !list.length) return '';
  return `<section class="sec">${secH('Sources', checked ? `Checked ${checkedLabel(checked)}` : '')}<div class="src-list pad">${list.map(([label, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span>${esc(label)}</span><small>${esc(hostOf(url))}</small></a>`).join('')}</div>
    <p class="pad muted" style="font-size:12.5px;margin-top:8px">${note || 'Conditions, prices and rules change. Check before you go, and tell us if something is wrong.'}</p></section>`;
}

const _plSpot = SCREENS.spot;
SCREENS.spot = p => {
  const out = _plSpot(p), s = Q.spot(p.id); if (!s || !out.body) return out;
  const tips = (s.tips || []);
  if (tips.length) out.body = out.body.replace(/(<section class="sec"><div class="sec-h"><div><h2>Adventures here<\/h2>)/, `<section class="sec">${secH('Good to know')}<ul class="checks dots pad">${tips.map(t => `<li>${ico('info')}<span>${esc(t)}</span></li>`).join('')}</ul></section>$1`);
  if (s.sources && s.sources.length) out.body = out.body.replace(/<section class="sec"><div class="pad"><div class="coming">[\s\S]*?Live conditions come later[\s\S]*?<\/section>$/, sourcesBlock(s.sources, s.checked));
  return out;
};

function whenToGo(D, f) {
  const rows = (D.seasons || []).filter(([sid]) => !f || sid === f);
  if (!rows.length && !(D.water || []).length) return '';
  const now = new Date().getMonth();
  const bar = months => `<div class="mbar" aria-hidden="true">${MONTHS.map((m, i) => `<span class="${months.includes(i + 1) ? 'on' : ''} ${i === now ? 'now' : ''}">${m}</span>`).join('')}</div>`;
  const water = (D.water || []).length && (!f || f === 'freediving' || f === 'surfing') ? `<div class="season"><div class="row between"><b>${ico('wave2')}Sea temperature</b><small class="muted">°C, monthly average</small></div><div class="mbar temps">${D.water.map((t, i) => `<span class="${i === now ? 'now' : ''}" title="${MONTHS[i]}"><i style="height:${t == null ? 0 : Math.round((t - 10) / 17 * 100)}%"></i><em>${t == null ? '–' : t}</em></span>`).join('')}</div><div class="mbar lab">${MONTHS.map(m => `<span>${m}</span>`).join('')}</div></div>` : '';
  return `<section class="sec">${secH('When to go', f ? esc(Q.sport(f).name) : 'Best months by sport')}<div class="pad" style="display:grid;gap:14px">
    ${rows.map(([sid, months, note]) => { const sp = Q.sport(sid) || {}; return `<div class="season"><div class="row between"><b style="color:${sp.color}">${ico(sp.icon)}${esc(sp.name || sid)}</b>${months.includes(now + 1) ? '<span class="pill ok">Good now</span>' : '<span class="pill">Off season</span>'}</div>${bar(months)}<small class="muted">${esc(note)}</small></div>`; }).join('')}
    ${water}</div></section>`;
}

const _plDest = SCREENS.dest;
SCREENS.dest = p => {
  const out = _plDest(p), D = Q.dest(p.id); if (!D || !out.body) return out;
  const marker = '<section class="sec"><div class="sec-h"><div><h2>Know before you go</h2>';
  out.body = out.body.replace(marker, whenToGo(D, p.sport || null) + marker);
  if (D.sources && D.sources.length) out.body += sourcesBlock(D.sources, D.checked, 'Sea temperatures are long-term averages and recent years run warmer. Spot facts have their own sources on each spot.');
  return out;
};

/* Photo credits: Wikimedia Commons photos are CC BY / BY-SA or CC0, so each one is credited where it shows. */
const creditFor = cover => { if (!cover) return null; const sp = Store.find('sports', x => x.photo_credits && x.photo_credits[cover]); if (sp) return sp.photo_credits[cover]; const x = Store.find('spots', s => s.cover === cover && s.photo_credit) || Store.find('destinations', d => d.hero_image === cover && d.photo_credit); return x ? x.photo_credit : null; };
const creditLine = c => c ? `<p class="photo-credit">Photo: ${esc(c.author)} · <a href="${esc(c.source)}" target="_blank" rel="noopener noreferrer">${esc(c.license)}</a>, Wikimedia Commons</p>` : '';
const _crSpot = SCREENS.spot;
SCREENS.spot = p => { const out = _crSpot(p), s = Q.spot(p.id); if (s && s.photo_credit && out.body) out.body = out.body.replace('<div class="facts-grid">', creditLine(s.photo_credit) + '<div class="facts-grid">'); return out; };
const _crDest = SCREENS.dest;
SCREENS.dest = p => { const out = _crDest(p), D = Q.dest(p.id); if (D && D.photo_credit && out.body) out.body = out.body.replace('<div class="pad" style="display:flex;gap:10px;margin-top:14px">', creditLine(D.photo_credit) + '<div class="pad" style="display:flex;gap:10px;margin-top:14px">'); return out; };
const _crAdv = SCREENS.adv;
SCREENS.adv = p => { const out = _crAdv(p), a = Store.get('adventures', p.id), c = a && creditFor(a.cover); if (c && out.body) out.body += `<div class="pad" style="margin:4px 0 18px">${creditLine(c)}</div>`; return out; };
SCREENS.credits = () => {
  const list = [...Store.all('destinations'), ...Store.all('spots')].filter(x => x.photo_credit)
    .concat(Store.all('sports').flatMap(sp => Object.values(sp.photo_credits || {}).map((c, i) => ({ name: `${sp.name}, action photo ${i + 1}`, photo_credit: c }))));
  return { nav: false, body: `<div class="topbar">${backBtn()}<h1>Photo credits</h1></div>
    <div class="page-h"><p>Place photos come from Wikimedia Commons under free licences. Thank you to the photographers.</p></div>
    <div class="group" style="margin-top:12px">${list.map(x => `<a class="lrow" href="${esc(x.photo_credit.source)}" target="_blank" rel="noopener noreferrer"><span class="tx"><b>${esc(x.name)}</b><small>${esc(x.photo_credit.author)} · ${esc(x.photo_credit.license)}</small></span>${ico('chev')}</a>`).join('')}</div>` };
};
const _crAccount = A.accountSheet;
A.accountSheet = () => { _crAccount(); const g = $('#sheetBody .group'); if (g) g.insertAdjacentHTML('beforeend', `<button class="lrow" ${goAttr('credits')}><span class="icon-btn line">${ico('info')}</span><span class="tx"><b>Photo credits</b><small>Where the place photos come from</small></span>${ico('chev')}</button>`); };

/* Sport pages and Explore tiles show people doing the sport. */
const _acSport = SCREENS.sport;
SCREENS.sport = p => {
  const out = _acSport(p), s = Q.sport(p.id); if (!s || !out.body || !(s.photos || []).length) return out;
  const ph = s.photos[0], c = (s.photo_credits || {})[ph];
  out.body = out.body.replace(/<div class="topbar" style="background:[^"]*">([\s\S]*?)<\/div>/, (m, inner) => `<div class="sport-hero">${art(ph, '', 'height:230px')}<span class="shade"></span><div class="topbar over-hero">${inner}</div></div>`);
  out.body = out.body.replace('<div class="sh-head"', `${creditLine(c)}<div class="sh-head"`);
  return out;
};
const _acTile = sportTile;
sportTile = (s, d) => { const html = _acTile(s, d), ph = (s.photos || [])[0]; if (!ph) return html; return html.replace('<button class="sport-tile"', `<button class="sport-tile photo-tile"`).replace('<span class="ic">', `<span class="tile-ph" aria-hidden="true">${art(ph, '', 'height:100%')}</span><span class="ic">`); };
