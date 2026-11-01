/* =====================================================================
   EXTour repeating sessions and waitlists
   - A series is a template plus a rule. Each date is a normal adventure
     (own participants, own chat) linked by series_id + occurrence_date.
     The host's app keeps the next 4 dates open (Supabase: a daily cron).
   - Waitlist: when full, people queue. A freed spot is offered to the
     first in line and held for 2 hours (less close to the start).
     Expired offers pass on. Supabase: an edge function on a schedule.
   ===================================================================== */
'use strict';

const HORIZON = 4, OFFER_HOURS = 2;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ymdIn = (iso, tz) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
const addDays = (ymd, n) => { const [y, m, d] = ymd.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.toISOString().slice(0, 10); };
const weekdayOf = ymd => { const [y, m, d] = ymd.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
const shortDay = ymd => { const [y, m, d] = ymd.split('-').map(Number); return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d))); };

const Series = {
  of: a => a && a.series_id ? Store.get('series', a.series_id) : null,
  occurrences: sid => Store.filter('adventures', a => a.series_id === sid).sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
  upcoming: sid => Series.occurrences(sid).filter(a => ['published', 'full'].includes(Q.status(a))),
  label(s) { const r = s.rule; return `${r.freq === 2 ? 'Every other' : 'Every'} ${DAYS[r.weekday]}${r.freq === 2 ? '' : ''} · ${r.t1}`; },
  dates(s, max = 60) { const r = s.rule, out = []; for (let k = 0; k < max && (!r.count || k < r.count); k++) out.push(addDays(r.starts_on, k * 7 * r.freq)); return out; },
  following: sid => !!Session.id && !!Store.get('series_follows', `sf_${sid}_${Session.id}`),
  async createFrom(f, rule) {
    const tz = (Q.dest(f.destination_id) || {}).timezone, starts_on = ymdIn(f.starts_at, tz);
    const { starts_at, ends_at, ...template } = f;
    const s = { id: uid('sr'), host_id: Session.id, provider_id: f.provider_id || null, destination_id: f.destination_id, template,
      rule: { freq: rule.freq, weekday: weekdayOf(starts_on), t1: hm(starts_at, tz), t2: hm(ends_at, tz), starts_on, count: rule.count || null }, status: 'active', created_at: nowIso() };
    await Store.put('series', s);
    const made = await Series.topUp(s, { quiet: true });
    Analytics.track('series_created', { series_id: s.id, freq: rule.freq, dates: made.length });
    return made[0];
  },
  /* Keep the next HORIZON dates open. Safe to call often: it only creates dates that do not exist yet. */
  /* One top-up at a time per series, so two triggers never create the same dates twice. */
  _busy: new Map(),
  topUp(s, opts) {
    if (!s) return Promise.resolve([]);
    const go = () => Series._topUp(Store.get('series', s.id) || s, opts || {});
    const run = (Series._busy.get(s.id) || Promise.resolve()).then(go, go);
    Series._busy.set(s.id, run.catch(() => {}));
    return run;
  },
  async _topUp(s, { quiet } = {}) {
    if (!s || s.status !== 'active' || s.host_id !== Session.id) return [];
    const tz = (Q.dest(s.destination_id) || {}).timezone, today = ymdIn(nowIso(), tz);
    const have = new Set(Series.occurrences(s.id).map(a => a.occurrence_date));
    const future = Series.occurrences(s.id).filter(a => a.occurrence_date >= today && a.status !== 'cancelled').length;
    const made = []; let open = future;
    for (const ymd of Series.dates(s)) {
      if (open >= HORIZON) break; if (ymd < today || have.has(ymd)) continue;
      const a = await _seriesCreate({ ...s.template, starts_at: zonedIso(ymd, s.rule.t1, tz), ends_at: zonedIso(ymd, s.rule.t2, tz) });
      await Store.patch('adventures', a.id, { series_id: s.id, occurrence_date: ymd });
      made.push(Store.get('adventures', a.id)); open++;
      if (!quiet) for (const f of Store.filter('series_follows', f => f.series_id === s.id)) await Notify.send(f.profile_id, 'series_new_date', { adventure_id: a.id });
    }
    return made;
  },
  async topUpMine() { for (const s of Store.filter('series', s => s.host_id === Session.id && s.status === 'active')) { try { await Series.topUp(s); } catch (e) { console.warn('series top-up', e); } } },
  async updateUpcoming(sid, patch) {
    const s = Store.get('series', sid); Policy.assert(s && s.host_id === Session.id, 'Only the host can edit the series');
    const tz = (Q.dest(s.destination_id) || {}).timezone, t1 = patch.starts_at ? hm(patch.starts_at, tz) : s.rule.t1, t2 = patch.ends_at ? hm(patch.ends_at, tz) : s.rule.t2;
    const { starts_at, ends_at, ...rest } = patch;
    await Store.patch('series', sid, { template: { ...s.template, ...rest }, rule: { ...s.rule, t1, t2 } });
    for (const o of Series.upcoming(sid)) {
      if (Q.started(o)) continue;
      try { await _seriesUpdate(o.id, { ...rest, starts_at: zonedIso(o.occurrence_date, t1, tz), ends_at: zonedIso(o.occurrence_date, t2, tz) }); }
      catch (e) { if (!e.policy) throw e; }
    }
  },
  async end(sid) {
    const s = Store.get('series', sid); Policy.assert(s && s.host_id === Session.id, 'Only the host can end the series');
    await Store.patch('series', sid, { status: 'ended' });
    for (const o of Series.upcoming(sid)) if (!Q.started(o)) await Adventures.cancel(o.id, 'The host ended this weekly session.');
  },
  async follow(sid) { const id = `sf_${sid}_${Session.id}`; if (Store.get('series_follows', id)) await Store.del('series_follows', id); else await Store.put('series_follows', { id, series_id: sid, profile_id: Session.id, created_at: nowIso() }); }
};

const Waitlist = {
  rows: a => Q.parts(a.id).filter(p => ['waitlisted', 'offered'].includes(p.status)).sort((x, y) => (x.waitlisted_at || x.created_at).localeCompare(y.waitlisted_at || y.created_at)),
  position(a, pid = Session.id) { const i = Waitlist.rows(a).findIndex(p => p.profile_id === pid); return i < 0 ? null : i + 1; },
  holding: a => Q.parts(a.id).filter(p => (p.status === 'offered' && new Date(p.offer_expires_at) > new Date()) || (p.status === 'requested' && p.from_waitlist)).length,
  async join(aid, message = '') {
    const a = Store.get('adventures', aid); Policy.assert(Session.id, 'Sign in to join the waitlist');
    Policy.assert(a && Q.status(a) === 'full', 'This adventure still has spots. Join it directly.');
    Policy.assert(a.host_id !== Session.id, 'You are hosting this one');
    Policy.assert(!(typeof Trust !== 'undefined' && Trust.blockedEither(a.host_id)), 'You cannot join this adventure.');
    const id = `ap_${aid}_${Session.id}`, prev = Store.get('adventure_participants', id);
    Policy.assert(!prev || prev.status === 'cancelled', 'You are already on this adventure or its waitlist');
    const at = nowIso();
    await Store.put('adventure_participants', { ...(prev || {}), id, adventure_id: aid, profile_id: Session.id, role: 'participant', status: 'waitlisted', waitlisted_at: at, message: String(message).slice(0, 500), created_at: prev ? prev.created_at : at, updated_at: at, from_waitlist: false, late_cancel: prev ? !!prev.late_cancel : false });
    Analytics.track('waitlist_joined', { adventure_id: aid });
  },
  async leave(aid) { const p = Q.myPart(Store.get('adventures', aid)); Policy.assert(p && ['waitlisted', 'offered'].includes(p.status), 'You are not on the waitlist'); await Store.patch('adventure_participants', p.id, { status: 'cancelled', updated_at: nowIso() }); await Waitlist.offerNext(Store.get('adventures', aid)); },
  /* Offer open spots to the front of the queue. */
  async offerNext(a) {
    if (!a || ['cancelled', 'completed'].includes(Q.status(a)) || Q.started(a)) return;
    let open = a.capacity - Q.going(a).length - Waitlist.holding(a);
    const recent = Date.now() - OFFER_HOURS * 36e5;
    for (const p of Waitlist.rows(a).filter(p => p.status === 'waitlisted' && !(p.offer_expired_at && new Date(p.offer_expired_at) > recent))) {
      if (open <= 0) break;
      const toStart = new Date(a.starts_at) - Date.now(), hold = Math.max(15 * 60e3, Math.min(OFFER_HOURS * 36e5, toStart - 15 * 60e3));
      await Store.patch('adventure_participants', p.id, { status: 'offered', offer_expires_at: new Date(Date.now() + hold).toISOString(), updated_at: nowIso() });
      await Notify.send(p.profile_id, 'spot_offered', { adventure_id: a.id }); open--;
    }
  },
  async claim(aid) {
    const a = Store.get('adventures', aid), p = Q.myPart(a);
    Policy.assert(p && p.status === 'offered', 'There is no spot held for you');
    Policy.assert(new Date(p.offer_expires_at) > new Date(), 'Sorry, the hold expired and the spot moved on');
    if (a.join_mode === 'instant') {
      await Store.patch('adventure_participants', p.id, { status: 'approved', updated_at: nowIso() });
      await Participation.afterApproved(a, Session.id); await Notify.send(a.host_id, 'participant_joined', { adventure_id: aid });
      Analytics.track('join_approved', { adventure_id: aid, via: 'waitlist' }); return 'approved';
    }
    await Store.patch('adventure_participants', p.id, { status: 'requested', from_waitlist: true, updated_at: nowIso() });
    await Notify.send(a.host_id, 'join_requested', { adventure_id: aid, data: { from_waitlist: true } });
    Analytics.track('join_requested', { adventure_id: aid, via: 'waitlist' }); return 'requested';
  },
  /* Expired holds go back to the end of the queue and the spot moves on. Run by the host and by the person holding it. */
  async sweep() {
    if (!Session.id) return;
    const now = new Date();
    for (const p of Store.filter('adventure_participants', p => p.status === 'offered' && new Date(p.offer_expires_at) <= now)) {
      const a = Store.get('adventures', p.adventure_id); if (!a || (a.host_id !== Session.id && p.profile_id !== Session.id)) continue;
      await Store.patch('adventure_participants', p.id, { status: 'waitlisted', waitlisted_at: nowIso(), offer_expires_at: null, offer_expired_at: nowIso(), updated_at: nowIso() });
      await Notify.send(p.profile_id, 'offer_expired', { adventure_id: a.id });
      await Waitlist.offerNext(a);
    }
  }
};

/* ---------------------------------------------------------------------
   Hooks into existing services
   --------------------------------------------------------------------- */
const _seriesCreate = Adventures.create, _seriesUpdate = Adventures.update;
Adventures.create = async f => {
  const C = UI.cf;
  if (C && !C.editId && C.repeat && C.repeat !== 'none' && f.type !== 'buddy_request' && !C._repeating) {
    C._repeating = true;
    try { const first = await Series.createFrom(f, { freq: C.repeat === 'w2' ? 2 : 1, count: C.repeatCount || null }); C.seriesMade = Series.upcoming(first.series_id).length; return first; }
    finally { C._repeating = false; }
  }
  return _seriesCreate(f);
};
Adventures.update = async (id, patch) => {
  const C = UI.cf, a = Store.get('adventures', id);
  if (C && C.editId === id && C.seriesScope === 'all' && a && a.series_id) return Series.updateUpcoming(a.series_id, patch);
  await _seriesUpdate(id, patch);
  if (patch.capacity != null) await Waitlist.offerNext(Store.get('adventures', id));
};
const _wlLeave = Participation.leave;
Participation.leave = async aid => { await _wlLeave(aid); await Waitlist.offerNext(Store.get('adventures', aid)); };
const _wlMy = Q.myAdventures;
Q.myAdventures = () => {
  const M = _wlMy(), me = Session.id;
  const wl = Store.filter('adventure_participants', p => p.profile_id === me && ['waitlisted', 'offered'].includes(p.status)).map(p => Store.get('adventures', p.adventure_id)).filter(a => a && !['completed', 'cancelled'].includes(Q.status(a)));
  M.requests = [...wl.filter(a => Q.myState(a) === 'offered'), ...M.requests, ...wl.filter(a => Q.myState(a) === 'waitlisted')];
  return M;
};

/* Run the host's top-up once per session, and sweep expired holds every minute. */
let seriesToppedFor = null, sweepBusy = false;
Store.listeners.add(() => {
  if (Store.status !== 'ready' || !Session.id) return;
  if (seriesToppedFor !== Session.id) { seriesToppedFor = Session.id; Series.topUpMine(); }
});
setInterval(() => { if (sweepBusy || Store.status !== 'ready') return; sweepBusy = true; Waitlist.sweep().catch(() => {}).finally(() => { sweepBusy = false; }); }, 60e3);

/* ---------------------------------------------------------------------
   UI pieces
   --------------------------------------------------------------------- */
const holdUntil = p => p && p.offer_expires_at ? clock(p.offer_expires_at) : '';
const _statePill = statePill;
statePill = a => { const me = Q.myState(a); if (me === 'waitlisted') return `<span class="pill warn">Waitlist #${Waitlist.position(a)}</span>`; if (me === 'offered') return `<span class="pill lime">Spot held for you</span>`; return _statePill(a); };
function requestLabel(a) {
  const me = Q.myState(a), p = Q.myPart(a);
  if (me === 'offered') return `<span class="role" style="color:var(--ok)">Spot held for you until ${holdUntil(p)}</span>`;
  if (me === 'waitlisted') return `<span class="role" style="color:var(--warn)">Waitlist · #${Waitlist.position(a)} of ${Waitlist.rows(a).length}</span>`;
  return `<span class="role" style="color:var(--warn)">${p && p.from_waitlist ? 'From the waitlist · ' : ''}Waiting for ${esc(hostName(a).split(' ')[0])}</span>`;
}
function claimCta(a) { return Q.myState(a) === 'offered' ? `<button class="btn btn-primary btn-sm btn-block" data-act="wlClaim" data-arg="${a.id}">${ico('check')}Claim my spot</button>` : ''; }

function seriesBlock(a) {
  const s = Series.of(a); if (!s) return '';
  const others = Series.upcoming(s.id).filter(o => o.id !== a.id).slice(0, 4);
  return `<div class="blk"><div class="series-card"><div class="row between"><span class="pill dark">${ico('refresh')}${esc(Series.label(s))}</span>${a.host_id === Session.id ? '' : `<button class="btn btn-secondary btn-sm" data-act="seriesFollow" data-arg="${s.id}">${Series.following(s.id) ? ico('check') + 'Following' : ico('bell') + 'Follow'}</button>`}</div>
    ${others.length ? `<span class="lab" style="font-size:12.5px;font-weight:800;color:var(--stone-ink)">Other dates</span><div class="date-row">${others.map(o => { const left = o.capacity - Q.going(o).length; return `<button class="date-chip" ${goAttr('adv', { id: o.id })}><b>${shortDay(o.occurrence_date)}</b><small class="${left ? '' : 'full'}">${left ? `${left} spot${left > 1 ? 's' : ''}` : 'Full · waitlist'}</small>${statePill(o) ? '<i class="dot-mine"></i>' : ''}</button>`; }).join('')}</div>` : ''}
    ${a.host_id === Session.id ? '' : `<p class="hint">Follow to hear when new dates open. Each date is booked on its own.</p>`}</div></div>`;
}
function waitlistSection(a) {
  const rows = Waitlist.rows(a); if (!rows.length && Q.status(a) !== 'full') return '';
  return `<section class="sec">${secH('Waitlist', rows.length ? `${rows.length} waiting · first in line gets a free spot, held for ${OFFER_HOURS} hours` : 'Nobody waiting yet')}${rows.length ? `<div class="group">${rows.map((p, i) => personRow(p.profile_id, p.status === 'offered' ? `<span class="pill lime">Held until ${holdUntil(p)}</span>` : `<span class="pill">#${i + 1}</span>`)).join('')}</div>` : ''}</section>`;
}
function seriesManage(a) {
  const s = Series.of(a); if (!s) return '';
  const up = Series.upcoming(s.id);
  return `<section class="sec">${secH('Weekly session', esc(Series.label(s)) + (s.status === 'ended' ? ' · ended' : ''))}<div class="group">
    ${up.map(o => `<button class="lrow" ${goAttr('manage', { id: o.id })}><span class="stamp ${o.id === a.id ? 'dark' : ''}"><span class="d">${stamp(o).d}</span><span class="n">${stamp(o).n}</span></span><span class="tx"><b>${dateLabel(o)}</b><small>${Q.going(o).length} / ${o.capacity} going${Q.pending(o).length ? ` · ${Q.pending(o).length} waiting for you` : ''}${Waitlist.rows(o).length ? ` · ${Waitlist.rows(o).length} on waitlist` : ''}</small></span>${ico('chev')}</button>`).join('')}
  </div>${s.status === 'active' ? `<div class="group" style="margin-top:10px">
    <button class="lrow" data-act="seriesEditAll" data-arg="${a.id}"><span class="icon-btn line">${ico('edit')}</span><span class="tx"><b>Edit all upcoming dates</b><small>Plan, time, level, safety plan. Everyone going is told.</small></span>${ico('chev')}</button>
    <button class="lrow" data-act="seriesSkip" data-arg="${a.id}"><span class="icon-btn line">${ico('x')}</span><span class="tx"><b>Skip ${dateLabel(a)}</b><small>Cancels only this date. The series continues.</small></span>${ico('chev')}</button>
    <button class="lrow" data-act="seriesEndSheet" data-arg="${s.id}"><span class="icon-btn line" style="color:var(--bad)">${ico('trash')}</span><span class="tx"><b style="color:var(--bad)">End the series</b><small>Cancels all upcoming dates</small></span>${ico('chev')}</button></div>` : ''}</section>`;
}

/* adventure detail: series dates and waitlist CTA */
const _advScreen = SCREENS.adv;
SCREENS.adv = p => {
  const out = _advScreen(p), a = Store.get('adventures', p.id); if (!a || !out.body) return out;
  out.body = out.body.replace('<div class="blk"><h2>Overview</h2>', seriesBlock(a) + '<div class="blk"><h2>Overview</h2>');
  const st = Q.status(a), me = Q.myState(a), mp = Q.myPart(a), waiting = Waitlist.rows(a).length;
  const info = `<span class="cta-info"><b>${priceLabel(a)}</b><small>${waiting ? `${waiting} on the waitlist` : 'Full'} · ${hm(a.starts_at, tzOf(a))}</small></span>`;
  if (me === 'offered') out.cta = `<span class="cta-info"><b>Spot open</b><small>Held until ${holdUntil(mp)}</small></span><button class="btn btn-primary btn-block" data-act="wlClaim" data-arg="${a.id}">${a.join_mode === 'instant' ? 'Claim my spot' : 'Claim and ask the host'}</button>`;
  else if (me === 'waitlisted' && st === 'published') out.cta = `<span class="cta-info"><b>A spot is open</b><small>Anyone can take it now</small></span><button class="btn btn-primary btn-block" data-act="wlJoinNow" data-arg="${a.id}">${a.join_mode === 'instant' ? 'Join now' : 'Request the spot'}</button>`;
  else if (me === 'waitlisted') out.cta = `${info}<button class="btn btn-secondary btn-block" data-act="wlLeave" data-arg="${a.id}">Waitlist #${Waitlist.position(a)} · Leave</button>`;
  else if (st === 'full' && !['host', 'approved', 'requested', 'declined', 'guest'].includes(me) && !Policy.canManage(a)) out.cta = `${info}<button class="btn btn-primary btn-block" data-act="wlJoin" data-arg="${a.id}">Join the waitlist</button>`;
  return out;
};
/* host management: series dates and waitlist */
const _manageScreen = SCREENS.manage;
SCREENS.manage = p => {
  const out = _manageScreen(p), a = Store.get('adventures', p.id); if (!a || !out.body || !Policy.canManage(a)) return out;
  const marker = '<section class="sec"><div class="sec-h"><div><h2>Actions</h2>';
  out.body = out.body.replace(marker, waitlistSection(a) + seriesManage(a) + marker);
  return out;
};
/* create: repeat option on step 2, series message on success */
const _createScreen = SCREENS.create;
SCREENS.create = () => {
  const out = _createScreen(), C = UI.cf; if (!C || !out.body) return out;
  if (C.done && C.seriesMade) {
    const a = Store.get('adventures', C.done), s = Series.of(a);
    if (a && s) out.body = out.body.replace('<h1>Your adventure is live</h1>', '<h1>Your weekly session is live</h1>').replace(/<p>[^<]*can see it on Explore[^<]*<\/p>/, `<p>${esc(Series.label(s))}. The next ${C.seriesMade} dates are open for booking, and new ones are added as the weeks pass.</p>`);
    return out;
  }
  if (C.step === 2 && !C.editId && C.type !== 'buddy_request') {
    const tz = (Q.dest(C.destination_id) || {}).timezone, rep = C.repeat || 'none';
    const preview = rep === 'none' || !C.date ? [] : Array.from({ length: Math.min(4, C.repeatCount || 4) }, (_, k) => shortDay(addDays(C.date, k * 7 * (rep === 'w2' ? 2 : 1))));
    const field = `<div class="field"><span class="lab">Repeat</span><div class="chips">${[['none', 'Does not repeat'], ['w1', 'Every week'], ['w2', 'Every 2 weeks']].map(([v, t]) => `<button class="chip" aria-pressed="${rep === v}" data-act="cfRepeat" data-arg="${v}">${v === 'none' ? '' : ico('refresh')}${t}</button>`).join('')}</div>
      ${rep !== 'none' ? `<div class="chips">${[[4, '4 dates'], [8, '8 dates'], [12, '12 dates'], [0, 'Until I stop']].map(([n, t]) => `<button class="chip" aria-pressed="${(C.repeatCount || 0) === n}" data-act="cfRepeatCount" data-arg="${n}">${t}</button>`).join('')}</div>
      <span class="hint">${preview.join(' · ')}${(C.repeatCount || 0) === 0 || C.repeatCount > 4 ? ' · …' : ''}. The next 4 dates open for booking, new ones are added as weeks pass. Each date has its own group and chat.</span>` : ''}</div>`;
    out.body = out.body.replace('<div class="field"><span class="lab">Price</span>', field + '<div class="field"><span class="lab">Price</span>');
  }
  if (C.editId && C.step === 1 && C.seriesScope === 'all') out.body = out.body.replace('<h1>Edit adventure</h1>', '<h1>Edit all upcoming dates</h1>');
  return out;
};

NOTE_TEXT.spot_offered = n => { const a = Store.get('adventures', n.adventure_id), p = a && Q.myPart(a); return `A spot opened on <b>${esc(a ? a.title : 'an adventure')}</b>. It is held for you${p && p.offer_expires_at ? ` until ${clock(p.offer_expires_at)}` : ''}.`; };
NOTE_TEXT.offer_expired = n => { const a = Store.get('adventures', n.adventure_id); return `Your hold on <b>${esc(a ? a.title : 'an adventure')}</b> expired. The spot is open to everyone now, and you are still on the waitlist.`; };
NOTE_TEXT.series_new_date = n => { const a = Store.get('adventures', n.adventure_id); return a ? `New date for <b>${esc(a.title)}</b>: ${dateLabel(a)} at ${hm(a.starts_at, tzOf(a))}.` : 'A new date was added.'; };

Object.assign(A, {
  wlJoin: id => run(() => Waitlist.join(id), () => `You are #${Waitlist.position(Store.get('adventures', id))} on the waitlist. We tell you the moment a spot opens.`),
  wlLeave: id => run(() => Waitlist.leave(id), 'You left the waitlist'),
  wlJoinNow: id => run(async () => { const p = Q.myPart(Store.get('adventures', id)); if (p) await Store.patch('adventure_participants', p.id, { status: 'cancelled', updated_at: nowIso() }); return Participation.join(id, 'From the waitlist'); }, s => s === 'approved' ? 'You are in. The adventure chat is open.' : 'Request sent to the host.'),
  wlClaim: id => run(() => Waitlist.claim(id), r => r === 'approved' ? 'The spot is yours. The adventure chat is open.' : 'Sent to the host. You are first in line.'),
  cfRepeat: v => { UI.cf.repeat = v; if (v !== 'none' && UI.cf.repeatCount == null) UI.cf.repeatCount = 8; render('none'); },
  cfRepeatCount: n => { UI.cf.repeatCount = +n; render('none'); },
  seriesFollow: sid => run(() => Series.follow(sid), () => Series.following(sid) ? 'Following. You will hear about new dates.' : 'Unfollowed'),
  seriesEditAll: id => { UI.cf = { ...fromAdventure(Store.get('adventures', id)), seriesScope: 'all' }; push('create'); },
  seriesSkip: id => openSheet(`<div class="sbody"><div><h3>Skip ${dateLabel(Store.get('adventures', id))}?</h3><p class="sub">Everyone going and waiting is told. The other dates stay as they are.</p></div><div class="field" style="padding:0"><label for="skipwhy">Reason <span style="font-weight:600">Optional</span></label><input class="inp" id="skipwhy" maxlength="140" placeholder="Swell too big this week"></div><button class="btn btn-primary" data-act="seriesSkipGo" data-arg="${id}">Skip this date</button><button class="btn btn-secondary" data-act="closeSheet">Keep it</button></div>`),
  seriesSkipGo: id => { const why = (($('#skipwhy') || {}).value || '').trim(); run(async () => { await Adventures.cancel(id, why ? `Skipped this week. ${why}` : 'Skipped this week. The series continues.'); closeSheet(); }, 'Date skipped'); },
  seriesEndSheet: sid => openSheet(`<div class="sbody"><div><h3>End this weekly session?</h3><p class="sub">All upcoming dates are cancelled and everyone going is told. Past dates stay in everyone's history.</p></div><button class="btn btn-primary" style="background:var(--bad);color:#fff" data-act="seriesEnd" data-arg="${sid}">End the series</button><button class="btn btn-secondary" data-act="closeSheet">Keep it going</button></div>`),
  seriesEnd: sid => run(async () => { await Series.end(sid); closeSheet(); }, 'Series ended')
});
