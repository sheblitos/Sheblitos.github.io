/* =====================================================================
   EXTour trust and safety
   Reviews after an adventure, reliability from attendance, report and
   block, attendance check at completion, safety plans.
   Mirrors the reviews, blocks and reports tables in supabase/schema.sql.
   ===================================================================== */
'use strict';

const LATE_CANCEL_HOURS = 12;
const REPORT_REASONS = ['Unsafe behaviour in the water or on the wall', 'Not honest about their level', 'Harassment or disrespect', 'No-show or repeated late cancels', 'Spam, sales or scam', 'Something else'];
const SAFETY_HINT = {
  freediving: 'One up, one down. Safety meets the diver at a third of their depth. Lanyards below 15 m. Buoy and flag. Max depth 30 m.',
  climbing: 'Partner checks before every pitch: knot, harness, belay device. Helmets on. Turn-around time 14:00.',
  surfing: 'Stay within sight of each other. Agree on a regroup point on the beach. Out of the water if it gets bigger than the group is comfortable with.',
  kitesurfing: 'Nobody launches alone. Check the wind forecast and the self-rescue plan before rigging.',
  hiking: 'Stay together at junctions. Turn-around time agreed at the start. Share the route with someone not coming.',
  scuba: 'Buddy checks before entry. Agree on max depth, gas turn pressure and signals.'
};

const Trust = {
  blockId: (a, b) => `bl_${a}_${b}`,
  iBlocked: pid => !!Session.id && !!Store.get('blocks', Trust.blockId(Session.id, pid)),
  blockedEither: pid => !!Session.id && !!pid && pid !== Session.id && (!!Store.get('blocks', Trust.blockId(Session.id, pid)) || !!Store.get('blocks', Trust.blockId(pid, Session.id))),
  /* Reliability: show-ups out of everything a person committed to. Hosting a completed adventure counts as showing up. */
  reliability(pid) {
    const parts = Store.filter('adventure_participants', p => p.profile_id === pid && p.role !== 'host');
    const done = parts.filter(p => p.status === 'completed');
    const attended = done.filter(p => p.attended !== false).length, noShows = done.filter(p => p.attended === false).length, late = parts.filter(p => p.late_cancel).length;
    const hosted = Store.filter('adventures', a => a.host_id === pid && a.status === 'completed').length;
    const committed = attended + noShows + late + hosted;
    if (committed < 3) return { score: null, label: 'New member', attended, noShows, late, hosted, committed };
    const score = Math.round((attended + hosted) / committed * 100);
    return { score, label: `${score}% reliable`, attended, noShows, late, hosted, committed };
  },
  hostReviews(pid) { return Store.filter('reviews', r => r.subject_type === 'adventure' && r.stars && (Store.get('adventures', r.subject_id) || {}).host_id === pid).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
  hostRating(pid) { const r = Trust.hostReviews(pid); return r.length ? { avg: r.reduce((n, x) => n + x.stars, 0) / r.length, count: r.length } : null; },
  again(pid) { const r = Store.filter('reviews', r => r.subject_type === 'person' && r.subject_id === pid && r.again != null); return r.length ? { yes: r.filter(x => x.again).length, count: r.length } : null; },
  reviewedBy: (aid, pid) => Store.filter('reviews', r => r.adventure_id === aid && r.author_id === pid).length > 0,
  canReview(a, pid = Session.id) {
    if (!a || Q.status(a) !== 'completed') return false;
    if (a.host_id === pid) return Q.going(a).some(p => p.profile_id !== pid && p.attended !== false);
    const p = Q.myPart(a, pid); return !!p && p.status === 'completed' && p.attended !== false;
  },
  reviewDue: a => Trust.canReview(a) && !Trust.reviewedBy(a.id, Session.id)
};

/* ---------------------------------------------------------------------
   Services
   --------------------------------------------------------------------- */
const Reviews = {
  async submit(aid, { stars, text, people }) {
    const a = Store.get('adventures', aid); Policy.assert(Trust.canReview(a), 'Only people who were there can review this adventure');
    const at = nowIso(), host = a.host_id === Session.id;
    if (!host) { Policy.assert(stars >= 1 && stars <= 5, 'Pick 1 to 5 stars'); await Store.put('reviews', { id: `rv_${aid}_${Session.id}_adventure_${aid}`, adventure_id: aid, author_id: Session.id, subject_type: 'adventure', subject_id: aid, stars, again: null, text: String(text || '').trim().slice(0, 400), created_at: at }); }
    for (const [pid, again] of Object.entries(people || {})) {
      if (again == null || pid === Session.id || !Q.goingIds(a).includes(pid)) continue;
      await Store.put('reviews', { id: `rv_${aid}_${Session.id}_person_${pid}`, adventure_id: aid, author_id: Session.id, subject_type: 'person', subject_id: pid, stars: null, again: !!again, text: '', created_at: at });
    }
    Analytics.track('review_submitted', { adventure_id: aid, stars: stars || null });
  }
};
const Safety = {
  async report(entity_type, entity_id, reason, details) {
    Policy.assert(Session.id, 'Sign in to report'); Policy.assert(reason, 'Pick a reason');
    await Store.put('reports', { id: uid('rp'), reporter_id: Session.id, entity_type, entity_id, reason, details: String(details || '').trim().slice(0, 1000), status: 'open', created_at: nowIso() });
  },
  async block(pid) { Policy.assert(Session.id && pid && pid !== Session.id, 'Pick someone else'); await Store.put('blocks', { id: Trust.blockId(Session.id, pid), blocker_id: Session.id, blocked_id: pid, created_at: nowIso() }); },
  async unblock(pid) { await Store.del('blocks', Trust.blockId(Session.id, pid)); }
};

/* Blocks apply everywhere: listings, requests, joining and messages. */
const _listed = Q.listed, _pending = Q.pending, _peopleIn = Q.peopleIn;
Q.listed = () => _listed().filter(a => !Trust.blockedEither(a.host_id));
Q.pending = a => _pending(a).filter(p => !Trust.blockedEither(p.profile_id));
Q.peopleIn = d => _peopleIn(d).filter(p => !Trust.blockedEither(p.id));
const _join = Participation.join;
Participation.join = async (aid, message) => { const a = Store.get('adventures', aid); Policy.assert(!(a && Trust.blockedEither(a.host_id)), 'You cannot join this adventure.'); return _join(aid, message); };
const _openDirect = Chat.openDirect;
Chat.openDirect = async other => { Policy.assert(!Trust.blockedEither(other), 'You cannot message this person.'); return _openDirect(other); };
const _send = Chat.send;
Chat.send = async (cid, body) => {
  const c = Store.get('conversations', cid);
  if (c && c.type === 'direct') { const o = (Store.find('conversation_members', m => m.conversation_id === cid && m.profile_id !== Session.id) || {}).profile_id; Policy.assert(!Trust.blockedEither(o), 'You cannot message this person.'); }
  return _send(cid, body);
};
/* Late cancellation: leaving within 12 hours of the start counts against reliability. */
const _leave = Participation.leave;
Participation.leave = async aid => {
  const a = Store.get('adventures', aid), late = a && (new Date(a.starts_at) - Date.now()) < LATE_CANCEL_HOURS * 36e5;
  await _leave(aid);
  if (late) { const p = Q.myPart(a); if (p) await Store.patch('adventure_participants', p.id, { late_cancel: true }); }
};
/* Completion with attendance: the host confirms who showed up, then everyone is asked for a review. */
Adventures.completeWithAttendance = async (id, att) => {
  const a = Store.get('adventures', id); Policy.assert(Policy.canManage(a), 'Only the host can mark it completed'); Policy.assert(Q.started(a), 'You can mark it completed once it has started');
  for (const p of Q.going(a)) { const attended = p.role === 'host' ? true : att[p.profile_id] !== false; await Store.patch('adventure_participants', p.id, { status: 'completed', attended, updated_at: nowIso() }); }
  for (const p of _pending(a)) await Store.patch('adventure_participants', p.id, { status: 'declined', updated_at: nowIso() });
  await Store.patch('adventures', id, { status: 'completed', updated_at: nowIso() });
  for (const p of Q.going(a)) if (p.profile_id !== Session.id && p.attended !== false) await Notify.send(p.profile_id, 'review_request', { adventure_id: id });
  Analytics.track('adventure_completed', { adventure_id: id, participants: Q.going(a).filter(p => p.attended !== false).length, no_shows: Object.values(att).filter(v => v === false).length });
};
NOTE_TEXT.review_request = n => { const a = Store.get('adventures', n.adventure_id); return `How was <b>${esc(a ? a.title : 'your adventure')}</b>? Rate it in 10 seconds.`; };

/* ---------------------------------------------------------------------
   Components used by app.js templates
   --------------------------------------------------------------------- */
function trustPills(pid) {
  const r = Trust.reliability(pid), ag = Trust.again(pid);
  return `<span class="pill ${r.score == null ? '' : r.score >= 90 ? 'ok' : r.score >= 75 ? 'warn' : 'bad'}">${ico('shield')}${r.label}</span>${ag ? `<span class="pill">${ag.yes} of ${ag.count} would go again</span>` : ''}${r.noShows ? `<span class="pill bad">${r.noShows} no-show${r.noShows > 1 ? 's' : ''}</span>` : ''}`;
}
const starsRow = (n, size = 13) => `<span class="mini-stars" aria-label="${n.toFixed(1)} out of 5">${[1, 2, 3, 4, 5].map(i => `<svg class="ico" viewBox="0 0 24 24" style="width:${size}px;height:${size}px;${i <= Math.round(n) ? '' : 'opacity:.25'}" aria-hidden="true">${IP.star}</svg>`).join('')}</span>`;
function hostRatingInline(pid) { const h = Trust.hostRating(pid); return h ? `${starsRow(h.avg, 12)} ${h.avg.toFixed(1)} · ${h.count} review${h.count > 1 ? 's' : ''}` : ''; }
function trustSummary(pid) {
  const P = Q.prof(pid); if (!P) return '';
  if (Trust.iBlocked(pid)) return `<div class="blocked-note">${ico('lock')}<span><b>You blocked ${esc(P.name.split(' ')[0])}.</b> They cannot message you, join your adventures or see yours.</span><button class="btn btn-secondary btn-sm" data-act="unblock" data-arg="${pid}">Unblock</button></div>`;
  const r = Trust.reliability(pid), h = Trust.hostRating(pid), ag = Trust.again(pid);
  return `<div class="trust-row"><div><span class="mono">Reliability</span><b class="tnum">${r.score == null ? 'New' : r.score + '%'}</b><small>${r.score == null ? 'Fewer than 3 adventures' : `${r.attended + r.hosted} of ${r.committed} shown up`}</small></div>
    <div><span class="mono">As host</span><b class="tnum">${h ? h.avg.toFixed(1) : '–'}</b><small>${h ? `${h.count} review${h.count > 1 ? 's' : ''}` : 'No reviews yet'}</small></div>
    <div><span class="mono">Would go again</span><b class="tnum">${ag ? Math.round(ag.yes / ag.count * 100) + '%' : '–'}</b><small>${ag ? `from ${ag.count} ${ag.count > 1 ? 'people' : 'person'}` : 'No ratings yet'}</small></div></div>`;
}
function reviewsSection(pid) {
  const list = Trust.hostReviews(pid).filter(r => r.text).slice(0, 4);
  if (!list.length) return '';
  return `<section class="sec">${secH('What people say', 'Reviews of adventures they hosted')}<div class="rail-x">${list.map(r => { const a = Store.get('adventures', r.subject_id) || {}, w = Q.prof(r.author_id) || { name: 'Someone' };
    return `<div class="review"><div class="row">${avatar(r.author_id, 32)}<span style="flex:1;min-width:0"><b style="font-weight:800;font-size:14px;display:block">${esc(w.name.split(' ')[0])}</b><small>${esc(a.title || '')}</small></span>${starsRow(r.stars)}</div><p>${esc(r.text)}</p></div>`; }).join('')}</div></section>`;
}
function safetyBlock(a) {
  const plan = (a.safety_plan || '').trim();
  return `<div class="blk"><h2>Safety plan</h2>${plan ? `<div class="safety">${ico('shield')}<span>${esc(plan)}</span></div>` : `<p class="muted" style="font-size:14px">The host has not written a safety plan yet. Agree on one with the group before you start.</p>`}
    <p class="muted" style="font-size:12.5px;margin-top:10px">EXTour connects people. It does not check skills or supervise sessions. Levels are self-declared. In an emergency call 112.</p>
    ${a.host_id !== Session.id ? `<button class="btn-link" data-act="reportSheet" data-arg="adventure:${a.id}" style="font-size:13px;margin-top:10px">${ico('flag', '14')} Report this adventure</button>` : ''}</div>`;
}
function reviewCta(a) {
  if (Trust.reviewDue(a)) return `<button class="btn btn-primary btn-sm btn-block" ${goAttr('review', { id: a.id })}>${ico('star')}${a.host_id === Session.id ? 'Rate your group' : 'Review this adventure'}</button>`;
  const mine = Store.find('reviews', r => r.adventure_id === a.id && r.author_id === Session.id && r.subject_type === 'adventure');
  return mine ? `<span class="muted" style="font-size:12.5px;font-weight:700;padding:0 4px">You rated it ${starsRow(mine.stars, 12)}</span>` : (Trust.reviewedBy(a.id, Session.id) ? '<span class="muted" style="font-size:12.5px;font-weight:700;padding:0 4px">Thanks for rating your group</span>' : '');
}

/* ---------------------------------------------------------------------
   Screens
   --------------------------------------------------------------------- */
SCREENS.review = (p) => {
  const a = Store.get('adventures', p.id); if (!a) return notFound('This adventure is not available');
  if (!Trust.canReview(a)) return notFound('You cannot review this one', 'Only people who were there can leave a review.');
  const host = a.host_id === Session.id, V = UI.rv && UI.rv.id === a.id ? UI.rv : (UI.rv = { id: a.id, stars: 0, text: '', people: {} });
  const others = Q.going(a).filter(x => x.profile_id !== Session.id && x.attended !== false).map(x => x.profile_id);
  return { nav: false, cta: `<button class="btn btn-primary btn-block" data-act="rvSubmit" ${host || V.stars ? '' : 'disabled'}>Send review</button>`, body: `
    <div class="topbar">${backBtn()}<h1>${host ? 'Rate your group' : 'How was it?'}</h1></div>
    <div class="pad"><div class="adv-row">${art(a.cover)}<span class="tx">${stag(a.sport_id)}<h3>${esc(a.title)}</h3><span class="sub">${dateLabel(a)} · hosted by ${esc(hostName(a))}</span></span></div></div>
    ${host ? '' : `<div class="field"><span class="lab">The adventure</span><div class="stars" role="radiogroup" aria-label="Stars">${[1, 2, 3, 4, 5].map(n => `<button class="${n <= V.stars ? 'on' : ''}" data-act="rvStar" data-arg="${n}" role="radio" aria-checked="${n === V.stars}" aria-label="${n} star${n > 1 ? 's' : ''}">${ico('star')}</button>`).join('')}</div>
      <label for="rvtext" class="lab" style="margin-top:6px">What should the next person know? <span style="font-weight:600">Public, optional</span></label><textarea class="inp" id="rvtext" maxlength="400" placeholder="How it was run, the conditions, whether it matched the level">${esc(V.text)}</textarea></div>`}
    ${others.length ? `<div class="field"><span class="lab">Would you go with them again?</span><span class="hint">Private. Never shown to them, only counted in their reliability.</span>
      <div class="group" style="margin:0">${others.map(pid => `<div class="lrow">${avatar(pid, 40)}<span class="tx"><b>${esc((Q.prof(pid) || {}).name || 'Someone')}</b><small>${pid === a.host_id ? 'Host' : 'In your group'}</small></span><span class="row" style="gap:6px"><button class="chip" aria-pressed="${V.people[pid] === true}" data-act="rvAgain" data-arg="${pid}:1">Yes</button><button class="chip" aria-pressed="${V.people[pid] === false}" data-act="rvAgain" data-arg="${pid}:0">No</button></span></div>`).join('')}</div></div>` : ''}
    <div class="pad" style="margin-top:14px"><button class="btn-link" data-act="reportSheet" data-arg="adventure:${a.id}" style="font-size:13px">${ico('flag', '14')} Something went wrong? Report it</button></div>`,
    after: v => { const t = $('#rvtext', v); if (t) t.oninput = () => { V.text = t.value; }; } };
};

/* ---------------------------------------------------------------------
   Actions
   --------------------------------------------------------------------- */
Object.assign(A, {
  rvStar: n => { UI.rv.stars = +n; render('none'); },
  rvAgain: arg => { const [pid, v] = arg.split(':'); const cur = UI.rv.people[pid], val = v === '1'; UI.rv.people[pid] = cur === val ? undefined : val; render('none'); },
  rvSubmit: () => { const V = UI.rv; run(async () => { await Reviews.submit(V.id, V); UI.rv = null; back(); }, 'Thanks. Your review helps the next person decide.'); },
  completeSheet: id => {
    const a = Store.get('adventures', id); if (!Q.started(a)) return toast('You can mark it completed once it has started');
    const g = Q.going(a).filter(p => p.role !== 'host'); UI.att = Object.fromEntries(g.map(p => [p.profile_id, true]));
    const rowsHtml = () => g.map(p => `<div class="lrow">${avatar(p.profile_id, 40)}<span class="tx"><b>${esc((Q.prof(p.profile_id) || {}).name || 'Someone')}</b></span><span class="row" style="gap:6px"><button class="chip" aria-pressed="${UI.att[p.profile_id]}" data-act="attSet" data-arg="${p.profile_id}:1">Showed up</button><button class="chip" aria-pressed="${!UI.att[p.profile_id]}" data-act="attSet" data-arg="${p.profile_id}:0">No-show</button></span></div>`).join('');
    UI.attRows = rowsHtml;
    openSheet(`<div class="sbody"><div><h3>Who showed up?</h3><p class="sub">This keeps reliability honest. People marked as no-show are not asked for a review.</p></div><div class="group" style="margin:0" id="attRows">${g.length ? rowsHtml() : '<p class="muted" style="padding:12px 0">Nobody else was confirmed.</p>'}</div><button class="btn btn-primary" data-act="completeAdv" data-arg="${id}">Mark completed</button><button class="btn btn-secondary" data-act="closeSheet">Not yet</button></div>`);
  },
  attSet: arg => { const [pid, v] = arg.split(':'); UI.att[pid] = v === '1'; const r = $('#attRows'); if (r && UI.attRows) r.innerHTML = UI.attRows(); },
  completeAdv: id => run(async () => { await Adventures.completeWithAttendance(id, UI.att || {}); closeSheet(); push('review', { id }); }, 'Completed. Now rate your group.'),
  reportSheet: arg => { const [type, ...r] = arg.split(':'), id = r.join(':'); UI.rep = { type, id, reason: '', block: false };
    const label = type === 'person' ? ((Q.prof(id) || {}).name || 'this person') : type === 'adventure' ? 'this adventure' : 'this';
    const draw = () => `<div class="sbody"><div><h3>Report ${esc(label)}</h3><p class="sub">Reports are private. The person is not told who reported them.</p></div>
      <div style="display:grid;gap:8px">${REPORT_REASONS.map(x => `<button class="choice" aria-pressed="${UI.rep.reason === x}" data-act="repReason" data-arg="${esc(x)}"><span class="tx"><b style="font-weight:700">${esc(x)}</b></span><span class="tick">${ico('check')}</span></button>`).join('')}</div>
      <div class="field" style="padding:0"><label for="repdet">What happened? <span style="font-weight:600">Optional</span></label><textarea class="inp" id="repdet" maxlength="1000"></textarea></div>
      ${type === 'person' && id !== Session.id ? `<label class="ck"><input type="checkbox" id="repblock" ${UI.rep.block ? 'checked' : ''} onchange="UI.rep.block=this.checked">Also block ${esc(label.split(' ')[0])}</label>` : ''}
      <button class="btn btn-primary" data-act="repSend" ${UI.rep.reason ? '' : 'disabled'}>Send report</button><p class="muted" style="font-size:12.5px">If someone is in danger right now, call 112.</p></div>`;
    UI.repDraw = draw; openSheet(draw()); },
  repReason: r => { const d = ($('#repdet') || {}).value || ''; UI.rep.reason = r; openSheet(UI.repDraw()); const t = $('#repdet'); if (t) t.value = d; },
  repSend: () => { const R = UI.rep, det = ($('#repdet') || {}).value || ''; run(async () => { await Safety.report(R.type, R.id, R.reason, det); if (R.block && R.type === 'person') await Safety.block(R.id); closeSheet(); }, () => R.block ? 'Report sent and person blocked. We review reports within 24 hours.' : 'Thanks. We review reports within 24 hours.'); },
  personMenu: pid => { const P = Q.prof(pid) || {}, blocked = Trust.iBlocked(pid);
    openSheet(`<div class="sbody"><div><h3>${esc(P.name || 'This person')}</h3></div><div class="group" style="margin:0">
      <button class="lrow" data-act="share" data-arg="u.${pid}"><span class="icon-btn line">${ico('share')}</span><span class="tx"><b>Share profile</b></span>${ico('chev')}</button>
      <button class="lrow" data-act="reportSheet" data-arg="person:${pid}"><span class="icon-btn line">${ico('flag')}</span><span class="tx"><b>Report</b><small>Private, reviewed within 24 hours</small></span>${ico('chev')}</button>
      <button class="lrow" data-act="${blocked ? 'unblock' : 'blockConfirm'}" data-arg="${pid}"><span class="icon-btn line" style="color:var(--bad)">${ico('lock')}</span><span class="tx"><b style="color:var(--bad)">${blocked ? 'Unblock' : 'Block'}</b><small>${blocked ? 'They can message you and join your adventures again' : 'They cannot message you, join your adventures or see yours'}</small></span>${ico('chev')}</button></div></div>`); },
  blockConfirm: pid => openSheet(`<div class="sbody"><div><h3>Block ${esc(((Q.prof(pid) || {}).name || '').split(' ')[0])}?</h3><p class="sub">They will not be told. You stop seeing each other's adventures, requests and messages.</p></div><button class="btn btn-primary" style="background:var(--bad);color:#fff" data-act="block" data-arg="${pid}">Block</button><button class="btn btn-secondary" data-act="closeSheet">Cancel</button></div>`),
  block: pid => run(async () => { await Safety.block(pid); closeSheet(); }, 'Blocked'),
  unblock: pid => run(async () => { await Safety.unblock(pid); closeSheet(); }, 'Unblocked')
});
