/* =====================================================================
   EXTour: from listing to a concrete plan
   - Cards say level, kind (community or pro) and spots at a glance
   - List filters: when, at my level, kind
   - Detail: "How joining works" before, "Your plan" after
   - A confirmation screen after joining or requesting, with next steps
   - Honest labels: demo data marked, no "verified" without a real check
   - Funnel events: join clicked, declined, left, cancelled, check-in, return
   ===================================================================== */
'use strict';

const PRO_TYPES = ['course', 'guided_experience', 'trip', 'retreat', 'camp', 'competition'];
const kindOf = a => a.type === 'buddy_request' ? 'buddy' : PRO_TYPES.includes(a.type) ? 'pro' : 'community';
const KIND_LABEL = { buddy: 'Buddy request', community: 'Community session', pro: 'Class or guided' };
const spotsLeft = a => Math.max(0, a.capacity - Q.going(a).length);
const firstName = pid => ((Q.prof(pid) || {}).name || 'The host').split(' ')[0];
const daysUntil = a => Math.round((dayIndex(a.starts_at, tzOf(a)) - dayIndex(nowIso(), tzOf(a))));
const whenWords = a => { const d = daysUntil(a); return d <= 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`; };

/* ---------------------------------------------------------------------
   Cards: one line that answers level, kind and spots
   --------------------------------------------------------------------- */
function planLine(a) {
  const st = Q.status(a), left = spotsLeft(a);
  const spots = st === 'cancelled' ? 'Cancelled' : st === 'completed' ? 'Done' : st === 'full' || left === 0 ? 'Full, waitlist open' : `${left} spot${left === 1 ? '' : 's'} left`;
  return `<span class="plan-line"><span>${esc(MIN_LEVELS[a.min_level] || 'All levels')}</span><span>${KIND_LABEL[kindOf(a)]}</span><span class="${left === 0 || st === 'full' ? 'warn' : ''}">${spots}</span></span>`;
}
const _plRow = advRow;
advRow = (a, extra = '') => _plRow(a, planLine(a) + extra);
const _plMini = advMini;
advMini = a => _plMini(a).replace(/(<h3>[\s\S]*?<\/h3>)/, `$1${planLine(a)}`);

/* ---------------------------------------------------------------------
   List: plan-style filters
   --------------------------------------------------------------------- */
const WHEN = [['today', 'Today'], ['tomorrow', 'Tomorrow'], ['weekend', 'This weekend'], ['week', 'Next 7 days']];
const KINDS = [['community', 'Community'], ['buddy', 'Buddy requests'], ['pro', 'Classes and guided']];
SCREENS.list = p => {
  let l = Q.listed().filter(a => (!p.dest || a.destination_id === p.dest) && (!p.sport || a.sport_id === p.sport));
  if (p.when) {
    if (p.when === 'weekend') { const [w0, w1] = weekendRange(); l = l.filter(a => a.starts_at >= w0 && a.starts_at < w1); }
    else l = l.filter(a => { const d = daysUntil(a); return p.when === 'today' ? d === 0 : p.when === 'tomorrow' ? d === 1 : d >= 0 && d <= 7; });
  }
  if (p.kind) l = l.filter(a => kindOf(a) === p.kind);
  if (p.buddy) l = l.filter(a => a.type === 'buddy_request');
  if (p.free) l = l.filter(a => !(a.price > 0));
  if (p.mine && Session.id) l = l.filter(a => { const lv = Q.level(Session.id, a.sport_id); return lv != null && (lv === 0 ? a.min_level === 0 : lv >= a.min_level); });
  const title = `${p.sport ? esc(Q.sport(p.sport).name) + ' · ' : ''}${p.dest ? esc(Q.dest(p.dest).name) : 'All adventures'}`;
  const chip = (k, v, t) => `<button class="chip" aria-pressed="${p[k] === v}" data-act="setP" data-arg="${k}:${p[k] === v ? '' : v}">${t}</button>`;
  const any = p.when || p.kind || p.mine || p.free || p.buddy;
  return { body: `<div class="topbar">${backBtn()}<h1>${title}</h1></div>
    <div class="filter-rows">
      <div class="chips scroll" role="group" aria-label="When">${WHEN.map(([v, t]) => chip('when', v, t)).join('')}</div>
      <div class="chips scroll" role="group" aria-label="Kind and level">${Session.id ? chip('mine', '1', 'At my level') : ''}${KINDS.map(([v, t]) => chip('kind', v, t)).join('')}${chip('free', '1', 'Free only')}</div>
    </div>
    <p class="pad muted" style="font-size:13px;margin-top:10px">${l.length} plan${l.length === 1 ? '' : 's'}${any ? ` · <button class="btn-link" data-act="listClear">Clear filters</button>` : ''}</p>
    ${l.length ? `<div class="stack" style="margin-top:8px">${l.map(a => advRow(a)).join('')}</div>` : emptyState('filter', 'Nothing matches yet', 'Try another day or clear a filter. Or start the plan yourself.', `<button class="btn btn-primary btn-sm" data-act="startCreate" data-arg="${p.sport || ''}">Create an adventure</button>`)}` };
};

/* ---------------------------------------------------------------------
   Detail: before and after joining
   --------------------------------------------------------------------- */
function howJoining(a) {
  const st = Q.status(a), me = Q.myState(a), host = firstName(a.host_id);
  if (['host', 'approved', 'completed', 'requested', 'declined', 'waitlisted', 'offered'].includes(me) || ['cancelled', 'completed'].includes(st) || Policy.canManage(a)) return '';
  const steps = st === 'full'
    ? ['It is full right now. Join the waitlist.', 'If a spot opens, we hold it for you and tell you straight away.']
    : a.join_mode === 'instant'
      ? [a.requirements.length ? 'Tap Join and confirm you meet the requirements.' : 'Tap Join and confirm.', 'You are in straight away. The group chat and exact meeting point open.', `${host} and the group see your name, level and languages.`]
      : [`Send a short request. ${host} sees your level, languages and reliability.`, `${host} accepts or declines. You get a notification either way.`, 'Once you are in, the group chat and exact meeting point open.'];
  return `<div class="blk how-join"><h2>${st === 'full' ? 'How the waitlist works' : a.join_mode === 'instant' ? 'How joining works' : 'How requesting works'}</h2>
    <ol>${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    ${a.price > 0 && a.provider_id ? `<p class="muted" style="font-size:13px">€${a.price}, paid to ${esc((Q.prov(a.provider_id) || {}).name || 'the provider')} directly. EXTour takes no payment.</p>` : '<p class="muted" style="font-size:13px">Free. Hosts can note shared costs, like pool entry.</p>'}</div>`;
}
const calKey = id => 'extour.v2.cal.' + Session.id + '.' + id;
function yourPlan(a) {
  const me = Q.myState(a), st = Q.status(a);
  if (st === 'cancelled') return `<div class="plan-card cancelled"><span class="mono">Cancelled</span><b>The host cancelled this one.</b><small>Similar adventures are below.</small></div>`;
  if (me === 'requested') return `<div class="plan-card wait"><span class="mono">Request sent</span><b>Waiting for ${esc(firstName(a.host_id))} to reply</b><small>You get a notification when they do. It is in Adventures, Requests. You can cancel any time.</small></div>`;
  if (me !== 'approved' || Q.started(a)) return '';
  const c = Chat.convFor(a.id), saidHi = !!(c && Q.messages(c.id).some(m => m.sender_id === Session.id && m.kind === 'text'));
  let cal = false; try { cal = !!localStorage.getItem(calKey(a.id)); } catch (e) {}
  const items = [
    [cal, 'Add it to your calendar', `data-act="calSheet" data-arg="${a.id}"`],
    [saidHi, 'Say hi in the group chat', goAttr('chat', { id: `c_${a.id}` })],
    [false, a.equipment.length ? `Pack: ${a.equipment.slice(0, 2).join(', ')}` : 'Check the requirements below', 'data-act="planScroll"'],
  ];
  const done = items.filter(i => i[0]).length;
  return `<div class="plan-card"><span class="mono">You're going · ${whenWords(a)}</span><b>${dateLabel(a)} at ${hm(a.starts_at, tzOf(a))}</b>
    <small>${esc(a.meeting_point_exact || a.meeting_point || placeName(a))}</small>
    <div class="plan-steps">${items.map(([ok, t, attr]) => `<button class="plan-step ${ok ? 'ok' : ''}" ${attr}><span class="box">${ok ? ico('check', 14) : ''}</span><span>${esc(t)}</span></button>`).join('')}</div>
    <small style="opacity:.8">${done} of ${items.length} ready. Can't make it? Leave early so someone else gets the spot.</small></div>`;
}
const _plAdv = SCREENS.adv;
SCREENS.adv = p => {
  const out = _plAdv(p), a = Store.get('adventures', p.id); if (!a || !out.body) return out;
  const plan = yourPlan(a); if (plan) out.body = out.body.replace('<div class="facts-grid">', `<div class="pad" style="margin-top:6px">${plan}</div><div class="facts-grid">`);
  const how = howJoining(a); if (how) out.body = out.body.replace('<div class="blk"><h2>Overview</h2>', how + '<div class="blk"><h2>Overview</h2>');
  out.body = out.body.replace('<div class="blk"><h2>Bring</h2>', '<div class="blk" id="bringBlk"><h2>Bring</h2>');
  return out;
};

/* ---------------------------------------------------------------------
   Confirmation after joining or requesting
   --------------------------------------------------------------------- */
function confirmSheet(a, status) {
  const host = firstName(a.host_id);
  if (status === 'approved') return `<div class="sbody confirm"><span class="big-check">${ico('check', 28)}</span><div><h3>You're in</h3><p class="sub">${esc(a.title)} · ${dateLabel(a)} at ${hm(a.starts_at, tzOf(a))}</p></div>
    <div class="group" style="margin:0">
      <button class="lrow" data-act="calSheet" data-arg="${a.id}"><span class="icon-btn line">${ico('cal')}</span><span class="tx"><b>Add to calendar</b><small>So you don't double-book</small></span>${ico('chev')}</button>
      <button class="lrow" ${goAttr('chat', { id: `c_${a.id}` })}><span class="icon-btn line">${ico('msg')}</span><span class="tx"><b>Say hi to the group</b><small>The exact meeting point is pinned there</small></span>${ico('chev')}</button></div>
    <button class="btn btn-secondary" data-act="closeSheet">Done</button></div>`;
  return `<div class="sbody confirm"><span class="big-check">${ico('send', 26)}</span><div><h3>Request sent to ${esc(host)}</h3><p class="sub">${esc(a.title)} · ${dateLabel(a)} at ${hm(a.starts_at, tzOf(a))}</p></div>
    <ol class="next-steps"><li>${esc(host)} sees your message, level and reliability.</li><li>You get a notification when they accept or decline.</li><li>If you are in, the chat and exact meeting point open.</li></ol>
    <p class="muted" style="font-size:13px">Find it any time in Adventures, Requests.</p>
    <button class="btn btn-primary" data-act="closeSheet">Got it</button></div>`;
}
Object.assign(A, {
  confirmJoin: id => run(async () => { const st = await Participation.join(id); openSheet(confirmSheet(Store.get('adventures', id), st)); render('none'); }),
  sendRequest: id => { const msg = ($('#reqmsg') || {}).value || ''; run(async () => { const st = await Participation.join(id, msg); openSheet(confirmSheet(Store.get('adventures', id), st)); render('none'); }); },
  planScroll: () => { const b = $('#bringBlk') || $('.blk h2'); if (b) b.scrollIntoView({ block: 'center', behavior: 'smooth' }); },
  listClear: () => { const c = cur(); if (c) c.p = { dest: c.p.dest, sport: c.p.sport }; render('none'); }
});
const _plJoin = A.join;
A.join = id => { Analytics.track('join_clicked', { adventure_id: id }); return _plJoin(id); };
const _plCal = A.calSheet;
A.calSheet = id => { try { localStorage.setItem(calKey(id), nowIso()); } catch (e) {} Analytics.track('calendar_opened', { adventure_id: id }); return _plCal(id); };

/* ---------------------------------------------------------------------
   Funnel events the brief asks for
   --------------------------------------------------------------------- */
const _plDecline = Participation.decline;
Participation.decline = async id => { const p = Store.get('adventure_participants', id); const r = await _plDecline(id); Analytics.track('join_declined', { adventure_id: p && p.adventure_id }); return r; };
const _plLeave = Participation.leave;
Participation.leave = async aid => { const r = await _plLeave(aid); Analytics.track('participant_left', { adventure_id: aid, hours_before: Math.round((+new Date(Store.get('adventures', aid).starts_at) - Date.now()) / 36e5) }); return r; };
const _plCancel = Adventures.cancel;
Adventures.cancel = async (id, why) => { const r = await _plCancel(id, why); Analytics.track('adventure_cancelled', { adventure_id: id, going: Q.going(Store.get('adventures', id)).length }); return r; };
if (typeof Host !== 'undefined') { const _plCheck = Host.checkIn; Host.checkIn = async (pid, here) => { const r = await _plCheck(pid, here); if (here) { const p = Store.get('adventure_participants', pid); Analytics.track('checkin_confirmed', { adventure_id: p && p.adventure_id }); } return r; }; }
/* A return visit: same person back after 12 hours or more. */
(function trackReturn() {
  try { const k = 'extour.v2.lastvisit', last = +localStorage.getItem(k) || 0, now = Date.now(); if (last && now - last > 12 * 36e5) setTimeout(() => Session.id && Analytics.track('return_visit', { hours_away: Math.round((now - last) / 36e5) }), 1500); localStorage.setItem(k, String(now)); } catch (e) {}
})();

/* ---------------------------------------------------------------------
   Honest labels
   --------------------------------------------------------------------- */
const isDemo = () => !(typeof SupabaseBoot !== 'undefined' && SupabaseBoot.enabled());
const _plExplore = SCREENS.explore;
SCREENS.explore = () => { const out = _plExplore(); if (out.body && isDemo()) out.body = out.body.replace('<div class="hello">', '<p class="demo-note">Test version · people, activities and reviews here are demo examples</p><div class="hello">'); return out; };
