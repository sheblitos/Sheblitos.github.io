/* =====================================================================
   EXTour suggestions
   Explainable scoring, no black box. Every point comes with a reason
   a person can read ("Marta is going", "Fits your level").
   - Suggest.adventures(): ranked for the signed-in person, with reasons
   - Suggest.people(): who to go with, based on sport, level, place, language
   - Suggest.similar(a): other dates and options like this one
   - "Not interested" hides one and down-weights that sport or type
   - Match alerts: a new adventure that fits someone well notifies them
   ===================================================================== */
'use strict';

const SG_W = { sport: 3, tryIt: 2.5, level: 1.2, here: 2, weekend: 0.6, soon: 1, habit: 0.8, friend: 1.5, host: 0.6, lang: 0.5, saved: 1, goal: 0.8, spots: 0.3 };
const SG_KEY = pid => 'extour.v2.prefs.' + pid;

const Prefs = {
  get(pid = Session.id) { try { return JSON.parse(localStorage.getItem(SG_KEY(pid)) || '{}'); } catch (e) { return {}; } },
  save(p, pid = Session.id) { try { localStorage.setItem(SG_KEY(pid), JSON.stringify(p)); } catch (e) {} },
  hide(aid) { const p = Prefs.get(), a = Store.get('adventures', aid); p.hidden = [...new Set([...(p.hidden || []), aid])].slice(-200);
    if (a) { p.less = p.less || {}; p.less['sport:' + a.sport_id] = (p.less['sport:' + a.sport_id] || 0) + 1; p.less['type:' + a.type] = (p.less['type:' + a.type] || 0) + 1; }
    Prefs.save(p); },
  lessOf(key) { const p = Prefs.get(); p.less = p.less || {}; p.less[key] = (p.less[key] || 0) + 3; Prefs.save(p); },
  reset() { Prefs.save({}); }
};

const Suggest = {
  /* who I have done adventures with, most recent first */
  companions(pid = Session.id) {
    const mine = Store.filter('adventure_participants', p => p.profile_id === pid && ['approved', 'completed'].includes(p.status)).map(p => p.adventure_id);
    const host = Store.filter('adventures', a => a.host_id === pid).map(a => a.id);
    const ids = new Set([...mine, ...host]), count = {};
    ids.forEach(aid => { const a = Store.get('adventures', aid); if (!a || Q.status(a) !== 'completed') return; Q.going(a).forEach(p => { if (p.profile_id !== pid && p.attended !== false) count[p.profile_id] = (count[p.profile_id] || 0) + 1; }); });
    return count;
  },
  /* when I usually go: weekday and hour from my history */
  habits(pid = Session.id) {
    const mine = Store.filter('adventure_participants', p => p.profile_id === pid && ['approved', 'completed'].includes(p.status)).map(p => Store.get('adventures', p.adventure_id)).filter(Boolean)
      .concat(Store.filter('adventures', a => a.host_id === pid));
    const days = {}, parts = {};
    mine.forEach(a => { const d = new Date(a.starts_at), tz = tzOf(a); const wd = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: tz }).format(d); const h = +hm(a.starts_at, tz).slice(0, 2); days[wd] = (days[wd] || 0) + 1; const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; parts[part] = (parts[part] || 0) + 1; });
    return { days, parts, n: mine.length };
  },
  clashes(a) {
    const s = +new Date(a.starts_at), e = +new Date(a.ends_at);
    const mine = Store.filter('adventure_participants', p => p.profile_id === Session.id && ['approved', 'requested', 'offered'].includes(p.status)).map(p => Store.get('adventures', p.adventure_id)).concat(Store.filter('adventures', x => x.host_id === Session.id));
    return mine.find(x => x && x.id !== a.id && ['published', 'full'].includes(Q.status(x)) && +new Date(x.starts_at) < e && +new Date(x.ends_at) > s) || null;
  },
  score(a, ctx) {
    const me = Session.me; if (!me) return null;
    const r = [], add = (pts, label, kind) => { r.push({ pts, label, kind }); };
    const lv = Q.level(Session.id, a.sport_id), sp = Q.sport(a.sport_id) || {};
    /* hard filters */
    if (a.host_id === Session.id || ['host', 'approved', 'requested', 'declined', 'waitlisted', 'offered', 'completed'].includes(Q.myState(a))) return null;
    if ((ctx.prefs.hidden || []).includes(a.id)) return null;
    if (a.starts_at <= nowIso()) return null;
    const removed = Q.myPart(a); if (removed && removed.removed_by_host) return null;
    if (lv == null) return null; /* only sports you do or want to try */
    if (lv === 0 ? a.min_level > 0 : lv < a.min_level) return null;
    /* sport and level */
    if (lv === 0) add(SG_W.tryIt, `You want to try ${sp.name.toLowerCase()}`, 'sport');
    else if (lv != null) add(SG_W.sport, `You do ${sp.name.toLowerCase()}`, 'sport');
    if (lv != null) { const gap = Math.max(0, lv - a.min_level); add(SG_W.level * (1 - Math.min(gap, 3) / 4), gap === 0 ? 'Right at your level' : gap === 1 ? 'Fits your level' : 'Easy for your level', 'level'); }
    /* place and time */
    if (a.destination_id === ctx.loc) add(SG_W.here, `In ${(Q.dest(ctx.loc) || {}).name}`, 'place');
    else add(-1.5, '', 'place');
    const days = (+new Date(a.starts_at) - Date.now()) / 864e5;
    add(SG_W.soon * Math.max(0, 1 - days / 21), days < 1.5 ? 'Tomorrow or today' : days < 7 ? 'This week' : '', 'time');
    if (a.starts_at >= ctx.w0 && a.starts_at < ctx.w1) add(SG_W.weekend, 'This weekend', 'time');
    const H = ctx.habits; if (H.n >= 2) { const tz = tzOf(a), wd = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: tz }).format(new Date(a.starts_at)), h = +hm(a.starts_at, tz).slice(0, 2), part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
      const dScore = (H.days[wd] || 0) / H.n, pScore = (H.parts[part] || 0) / H.n; if (dScore + pScore > 0.6) add(SG_W.habit * Math.min(1, dScore + pScore), `You usually go on ${wd === 'Sat' || wd === 'Sun' ? wd + 's' : part + 's'}`.replace('Sats', 'Saturdays').replace('Suns', 'Sundays'), 'habit'); }
    const clash = Suggest.clashes(a); if (clash) add(-5, `Clashes with ${clash.title}`, 'clash');
    /* people */
    if (ctx.comp[a.host_id]) add(SG_W.friend, `Been out with ${((Q.prof(a.host_id) || {}).name || '').split(' ')[0]} before`, 'friends');
    const going = Q.goingIds(a).filter(x => x !== Session.id && x !== a.host_id), friends = going.filter(x => ctx.comp[x]).sort((x, y) => ctx.comp[y] - ctx.comp[x]);
    if (friends.length) add(SG_W.friend * Math.min(2, friends.length), `${friends.slice(0, 2).map(x => ((Q.prof(x) || {}).name || '').split(' ')[0]).join(' and ')} ${friends.length > 1 ? 'are' : 'is'} going`, 'friends');
    const hr = Trust.hostRating(a.host_id); if (hr && hr.count >= 2 && hr.avg >= 4.5) add(SG_W.host, `Host rated ${hr.avg.toFixed(1)}`, 'host');
    const myL = me.languages || [], hostL = (Q.prof(a.host_id) || {}).languages || [];
    const shared = hostL.find(l => myL.includes(l)); if (shared && shared !== 'English') add(SG_W.lang, `Host speaks ${shared}`, 'lang'); else if (!shared && hostL.length) add(-1, 'No shared language with the host', 'lang');
    /* what I saved and what I want */
    const saved = ctx.saved; if ((a.spot_id && saved.has('spot:' + a.spot_id)) || (a.provider_id && saved.has('provider:' + a.provider_id))) add(SG_W.saved, a.spot_id && saved.has('spot:' + a.spot_id) ? 'At a spot you saved' : 'From a school you saved', 'saved');
    const goals = me.goals || [];
    if (goals.includes('Find buddies') && a.type === 'buddy_request') add(SG_W.goal, 'Looking for a buddy, like you', 'goal');
    if (goals.includes('Take a course') && ['course', 'guided_experience'].includes(a.type)) add(SG_W.goal, 'A course, one of your goals', 'goal');
    if (ctx.followed.has(a.series_id)) add(SG_W.friend, 'A weekly session you follow', 'series');
    /* spots left */
    const left = a.capacity - Q.going(a).length; if (left > 0 && left <= 2) add(SG_W.spots, `${left} spot${left === 1 ? '' : 's'} left`, 'spots'); if (left <= 0) add(-1.2, 'Full, waitlist open', 'spots');
    /* learned dislikes */
    const less = ctx.prefs.less || {}, dis = (less['sport:' + a.sport_id] || 0) * 0.8 + (less['type:' + a.type] || 0) * 0.5; if (dis) add(-Math.min(4, dis), '', 'less');
    const total = r.reduce((n, x) => n + x.pts, 0);
    const ORDER = ['friends', 'series', 'saved', 'habit', 'goal', 'level', 'host', 'spots', 'lang', 'time', 'sport', 'place'];
    const why = r.filter(x => x.label && x.pts > 0).sort((x, y) => ORDER.indexOf(x.kind) - ORDER.indexOf(y.kind) || y.pts - x.pts).map(x => x.label);
    const warn = r.filter(x => x.label && x.pts < 0).map(x => x.label);
    return { a, total, why, warn, parts: r };
  },
  context() {
    const [w0, w1] = weekendRange();
    return { loc: curLoc(), w0, w1, prefs: Prefs.get(), habits: Suggest.habits(), comp: Suggest.companions(),
      saved: new Set(Store.filter('saved_items', s => s.profile_id === Session.id).map(s => `${s.item_type}:${s.item_id}`)),
      followed: new Set(Store.filter('series_follows', f => f.profile_id === Session.id).map(f => f.series_id)) };
  },
  adventures(n = 8, opts = {}) {
    if (!Session.me) return [];
    const ctx = Suggest.context();
    const scored = Q.listed().filter(a => !opts.dest || a.destination_id === opts.dest).map(a => Suggest.score(a, ctx)).filter(x => x && x.total > 1.5);
    /* one date per weekly series: the best-scoring one */
    const bestOf = {}; scored.forEach(x => { const k = x.a.series_id; if (k && (!bestOf[k] || bestOf[k].total < x.total)) bestOf[k] = x; });
    const list = scored.filter(x => !x.a.series_id || bestOf[x.a.series_id] === x).sort((x, y) => y.total - x.total);
    /* variety: soften repeats of the same series, host and sport */
    const out = [], seen = { host: {}, sport: {}, series: {} };
    const pool = list.slice();
    while (out.length < n && pool.length) {
      pool.forEach(x => { x.adj = x.total - 1.2 * (seen.host[x.a.host_id] || 0) - 0.6 * (seen.sport[x.a.sport_id] || 0) - 2.5 * (x.a.series_id ? (seen.series[x.a.series_id] || 0) : 0); });
      pool.sort((x, y) => y.adj - x.adj); const pick = pool.shift(); out.push(pick);
      seen.host[pick.a.host_id] = (seen.host[pick.a.host_id] || 0) + 1; seen.sport[pick.a.sport_id] = (seen.sport[pick.a.sport_id] || 0) + 1; if (pick.a.series_id) seen.series[pick.a.series_id] = (seen.series[pick.a.series_id] || 0) + 1;
    }
    return out;
  },
  people(n = 8) {
    const me = Session.me; if (!me) return [];
    const loc = curLoc(), mine = Q.userSports(Session.id).filter(u => u.level > 0), comp = Suggest.companions(), myL = me.languages || [];
    return Q.peopleIn(loc).filter(p => !Trust.blockedEither(p.id)).map(p => {
      const why = []; let pts = 0;
      const theirs = Q.userSports(p.id);
      const common = mine.map(u => [u, theirs.find(t => t.sport_id === u.sport_id)]).filter(([, t]) => t && t.level > 0);
      if (!common.length) return null;
      const [u, t] = common.sort((x, y) => Math.abs(x[0].level - x[1].level) - Math.abs(y[0].level - y[1].level))[0];
      const sp = Q.sport(u.sport_id); pts += 2 - Math.abs(u.level - t.level) * 0.7; why.push(`${LEVELS[t.level]} ${sp.name.toLowerCase()}`);
      const lang = (p.languages || []).find(l => myL.includes(l) && l !== 'English'); if (lang) { pts += 0.6; why.push(`Speaks ${lang}`); }
      if (comp[p.id]) { pts += 0.5; why.push(`${comp[p.id]} adventure${comp[p.id] > 1 ? 's' : ''} together`); }
      if (p.current_destination_id === loc && p.home_destination_id !== loc) { pts += 0.4; why.push('Visiting now'); }
      const r = Trust.reliability(p.id); if (r.score != null && r.score >= 90) { pts += 0.4; why.push(`${r.score}% reliable`); } if (r.score != null && r.score < 70) pts -= 1;
      const next = Q.listed().find(a => a.sport_id === u.sport_id && Q.goingIds(a).includes(p.id) && !['host', 'approved'].includes(Q.myState(a)));
      if (next) { pts += 0.8; why.push(`Going to ${next.title}`); }
      return { p, pts, why, sport: u.sport_id, next };
    }).filter(Boolean).sort((x, y) => y.pts - x.pts).slice(0, n);
  },
  similar(a, n = 4) {
    if (!a) return [];
    const ctx = Suggest.context();
    return Q.listed().filter(x => x.id !== a.id && x.sport_id === a.sport_id && Math.abs(x.min_level - a.min_level) <= 1 && (!a.series_id || x.series_id !== a.series_id))
      .map(x => { const s = Session.me ? Suggest.score(x, ctx) : null; const sameDest = x.destination_id === a.destination_id; return { a: x, total: (s ? s.total : 0) + (sameDest ? 2 : 0) + (x.type === a.type ? 1 : 0), why: s ? s.why : [] }; })
      .sort((x, y) => y.total - x.total).slice(0, n);
  },
  /* who to tell about a new adventure: strong fits only, one alert per person per day */
  async alertMatches(a) {
    if (!a || a.visibility !== 'public') return 0;
    const host = Session.id, today = nowIso().slice(0, 10);
    const cands = Store.filter('profiles', p => p.id !== host && (p.home_destination_id === a.destination_id || (p.location_sharing && p.current_destination_id === a.destination_id)) && !Trust.blockedEither(p.id));
    let sent = 0;
    for (const p of cands) {
      const lv = Q.level(p.id, a.sport_id); if (lv == null || (lv > 0 && lv < a.min_level) || (lv === 0 && a.min_level > 0)) continue;
      const already = Store.find('notifications', n => n.profile_id === p.id && n.type === 'suggested_adventure' && (n.created_at || '').slice(0, 10) === today); if (already) continue;
      const fit = (lv === 0 ? 2.5 : 3) + (1.2 * (1 - Math.min(Math.max(0, lv - a.min_level), 3) / 4)) + ((p.languages || []).some(l => ((Session.me || {}).languages || []).includes(l)) ? 0.5 : -1);
      if (fit < 4) continue;
      await Notify.send(p.id, 'suggested_adventure', { adventure_id: a.id, data: { reason: lv === 0 ? 'try' : 'level' } });
      if (++sent >= 10) break;
    }
    if (sent) Analytics.track('match_alerts_sent', { adventure_id: a.id, count: sent });
    return sent;
  }
};

NOTE_TEXT.suggested_adventure = n => { const a = Store.get('adventures', n.adventure_id); if (!a) return 'A new adventure fits you.'; const tr = (n.data || {}).reason === 'try';
  return `New and a good fit: <b>${esc(a.title)}</b>, ${dateLabel(a)} at ${hm(a.starts_at, tzOf(a))}. ${tr ? `A good first ${esc((Q.sport(a.sport_id) || {}).name.toLowerCase())} session.` : 'At your level.'}`; };

/* New adventures alert the people they fit (not series top-ups, not buddy requests of one). */
const _sgCreate = Adventures.create;
Adventures.create = async (...args) => {
  const r = await _sgCreate(...args);
  try { const id = typeof r === 'string' ? r : r && r.id; const a = id && Store.get('adventures', id); if (a && !a.series_id) await Suggest.alertMatches(a); } catch (e) { console.warn('match alerts', e); }
  return r;
};

/* ---------------------------------------------------------------------
   UI
   --------------------------------------------------------------------- */
const whyChips = (s, max = 2) => s && s.why.length ? `<span class="why-row">${s.why.slice(0, max).map(w => `<span class="why-chip">${esc(w)}</span>`).join('')}</span>` : '';
function sgCard(s, rank) {
  const a = s.a;
  return `<div class="sg-card"><a class="adv-mini" role="button" tabindex="0" ${goAttr('adv', { id: a.id })} data-sg="${rank}">
    ${art(a.cover, '', 'height:128px').replace(/<\/div>$/, `<div class="ov on-art">${stag(a.sport_id)}</div></div>`)}
    <div class="body"><span class="mono muted">${dateLabel(a)} · ${hm(a.starts_at, tzOf(a))}</span><h3>${esc(a.title)}</h3>${whyChips(s)}
    <div class="row between"><span class="cap-wrap">${capMeter(a)}${Q.going(a).length >= a.capacity ? 'Full' : `${Q.going(a).length}/${a.capacity}`}</span><span class="price">${priceLabel(a)}</span></div></div></a>
    <button class="sg-more" data-act="sgMenu" data-arg="${a.id}" aria-label="Why this, or hide it">${ico('more')}</button></div>`;
}
function picksSection() {
  if (!Session.me) return '';
  const L = curLoc(), list = Suggest.adventures(8, { dest: L });
  UI.sgShown = list.map(s => s.a.id);
  if (!list.length) return `<section class="sec">${secH('Picked for you')}${emptyState('star', 'Nothing that fits you yet', 'Add your sports and levels, or try another place.', `<button class="btn btn-secondary btn-sm" data-act="editSports">Update my sports</button>`)}</section>`;
  return `<section class="sec">${secH('Picked for you', 'From your sports, level, people and plans', `<button class="see" ${goAttr('sgAll')}>See why</button>`)}<div class="rail-x">${list.map(sgCard).join('')}</div></section>`;
}
function peopleSection() {
  const list = Suggest.people(8); if (!list.length) return '';
  return `<section class="sec">${secH('People you could go with', `${esc((Q.dest(curLoc()) || {}).name || '')}, matched on sport, level and language`)}<div class="rail-x">${list.map(x => `<button class="sg-person" ${goAttr('person', { id: x.p.id })}>${avatar(x.p.id, 52)}<b>${esc(x.p.name.split(' ')[0])}</b><small>${esc(x.why[0])}</small>${x.why[1] ? `<span class="why-chip">${esc(x.why[1])}</span>` : ''}</button>`).join('')}</div></section>`;
}

const _sgExplore = SCREENS.explore;
SCREENS.explore = () => {
  const out = _sgExplore(); if (!out.body || !Session.me) return out;
  const marker = '<button class="search-big"';
  const i = out.body.indexOf(marker); if (i < 0) return out;
  /* picks right under the search; people after "Popular near you" */
  const j = out.body.indexOf('</div>', out.body.indexOf('<div class="quick3">')) + 6;
  out.body = out.body.slice(0, j) + picksSection() + out.body.slice(j);
  out.body = out.body.replace(/(<section class="sec"><div class="sec-h"><div><h2>Find your crew<\/h2>)/, peopleSection() + '$1');
  out.track = out.track || ['suggestions_shown', { count: (UI.sgShown || []).length, ids: (UI.sgShown || []).slice(0, 5).join(',') }];
  return out;
};

/* "Why am I seeing this" and the full explained list */
SCREENS.sgAll = () => {
  const list = Suggest.adventures(20, { dest: curLoc() }), P = Prefs.get();
  return { nav: false, body: `<div class="topbar">${backBtn()}<h1>Picked for you</h1></div>
    <div class="page-h"><h1>Why these?</h1><p>We rank adventures on your sports and level, where you are, when you usually go, people you have been out with, and what you saved. Nothing is paid placement.</p></div>
    ${list.length ? `<div class="stack" style="margin-top:12px">${list.map(s => `<div class="host-item">${advRow(s.a)}<div class="sg-why">${s.why.map(w => `<span class="why-chip">${esc(w)}</span>`).join('')}${s.warn.map(w => `<span class="why-chip warn">${esc(w)}</span>`).join('')}</div></div>`).join('')}</div>` : emptyState('star', 'Nothing that fits yet', 'Update your sports and levels to get suggestions.')}
    ${(P.hidden || []).length || Object.keys(P.less || {}).length ? `<div class="pad" style="margin-top:16px"><button class="btn btn-secondary btn-block" data-act="sgReset">Reset what you hid (${(P.hidden || []).length})</button></div>` : ''}` };
};

Object.assign(A, {
  sgMenu: id => { const a = Store.get('adventures', id); if (!a) return; const s = Suggest.score(a, Suggest.context()); const sp = Q.sport(a.sport_id) || {};
    openSheet(`<div class="sbody"><div><h3>Why you see this</h3><p class="sub">${esc(a.title)}</p></div>
      <div class="sg-why" style="padding:0">${(s ? s.why : []).map(w => `<span class="why-chip">${esc(w)}</span>`).join('') || '<span class="muted">It is happening near you.</span>'}${(s ? s.warn : []).map(w => `<span class="why-chip warn">${esc(w)}</span>`).join('')}</div>
      <div class="group" style="margin:0">
        <button class="lrow" data-act="sgHide" data-arg="${a.id}"><span class="icon-btn line">${ico('x')}</span><span class="tx"><b>Not interested</b><small>Hide this one and show fewer like it</small></span></button>
        <button class="lrow" data-act="sgLess" data-arg="sport:${a.sport_id}"><span class="icon-btn line">${ico(sp.icon || 'layers')}</span><span class="tx"><b>Less ${esc((sp.name || '').toLowerCase())}</b><small>You can still find it in Explore</small></span></button></div></div>`); },
  sgHide: id => { Prefs.hide(id); Analytics.track('suggestion_hidden', { adventure_id: id }); closeSheet(); render('none'); toast('Hidden. You will see fewer like this.'); },
  sgLess: key => { Prefs.lessOf(key); Analytics.track('suggestion_less', { key }); closeSheet(); render('none'); toast('Got it. Fewer of those.'); },
  sgReset: () => { Prefs.reset(); render('none'); toast('Suggestions reset'); }
});

/* track clicks on picks with their rank */
document.addEventListener('click', e => { const t = e.target.closest('[data-sg]'); if (!t) return; const a = t.closest('.sg-card'); Analytics.track('suggestion_clicked', { rank: +t.dataset.sg, adventure_id: (UI.sgShown || [])[+t.dataset.sg] }); }, true);

/* Adventure page: similar options at the end */
const _sgAdv = SCREENS.adv;
SCREENS.adv = p => {
  const out = _sgAdv(p), a = Store.get('adventures', p.id); if (!a || !out.body) return out;
  const sim = Suggest.similar(a, 4); if (!sim.length) return out;
  out.body += `<section class="sec">${secH(Q.status(a) === 'full' ? 'Full? Try these' : 'Similar adventures', `More ${esc((Q.sport(a.sport_id) || {}).name.toLowerCase())} at this level`)}<div class="stack">${sim.map(s => advRow(s.a, s.why[0] ? `<span class="why-row"><span class="why-chip">${esc(s.why[0])}</span></span>` : '')).join('')}</div></section>`;
  return out;
};
