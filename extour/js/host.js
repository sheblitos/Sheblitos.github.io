/* =====================================================================
   EXTour host tools
   - Announcement: pinned in the group chat + a notification to everyone going
   - Reminder: one tap before the day (at most every 6 hours)
   - Check-in on the day: tap who is here; it pre-fills attendance on completion
   - Remove a participant: frees the spot, offers it to the waitlist
   - Hosting stats: this week, fill rate, requests waiting, recent no-shows
   ===================================================================== */
'use strict';

Object.assign(IP, {
  megaphone: '<path d="M4 10v4h3l7 4V6L7 10z"/><path d="M17.5 9.5a3.5 3.5 0 0 1 0 5"/>',
  checkin: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'
});

const REMIND_GAP_H = 6;
const Host = {
  window(a) { const t = Date.now(), s = +new Date(a.starts_at), e = +new Date(a.ends_at); return !['cancelled', 'completed'].includes(Q.status(a)) && t >= s - 3 * 36e5 && t <= e + 12 * 36e5; },
  announcements(cid) { return Q.messages(cid).filter(m => m.kind === 'announcement'); },
  latestAnnouncement(cid) { const l = Host.announcements(cid); return l[l.length - 1] || null; },
  remindedAgo(a) { return a.reminded_at ? (Date.now() - +new Date(a.reminded_at)) / 36e5 : Infinity; },
  canRemind(a) { return !Q.started(a) && ['published', 'full'].includes(Q.status(a)) && Q.going(a).length > 1 && Host.remindedAgo(a) >= REMIND_GAP_H; },

  async announce(aid, body) {
    const a = Store.get('adventures', aid); Policy.assert(Policy.canManage(a), 'Only the host can post announcements');
    body = String(body || '').trim(); Policy.assert(body.length >= 3, 'Write the announcement first'); Policy.assert(body.length <= 500, 'Keep it under 500 characters');
    const c = await Chat.ensureAdventureConversation(a), at = nowIso();
    await Store.put('messages', { id: uid('m'), conversation_id: c.id, sender_id: Session.id, kind: 'announcement', body, created_at: at });
    await Store.patch('conversations', c.id, { last_message_at: at });
    await Notify.toGroup(a, 'announcement', { conversation_id: c.id, data: { text: body.slice(0, 140) } });
    Analytics.track('host_announcement', { adventure_id: aid, length: body.length });
  },
  async remind(aid) {
    const a = Store.get('adventures', aid); Policy.assert(Policy.canManage(a), 'Only the host can send reminders');
    Policy.assert(!Q.started(a), 'It has already started');
    Policy.assert(Host.remindedAgo(a) >= REMIND_GAP_H, 'You sent a reminder recently. Try again later.');
    const c = await Chat.ensureAdventureConversation(a);
    await Chat.system(c.id, `Reminder from ${Session.me.name.split(' ')[0]}: ${dateLabel(a)} at ${hm(a.starts_at, tzOf(a))}. Meet at ${(a.meeting_point_exact || a.meeting_point || placeName(a)).replace(/[.\s]+$/, '')}.`);
    await Notify.toGroup(a, 'host_reminder', { conversation_id: c.id });
    await Store.patch('adventures', aid, { reminded_at: nowIso() });
    Analytics.track('host_reminder', { adventure_id: aid, going: Q.going(a).length });
  },
  async checkIn(partId, here) {
    const p = Store.get('adventure_participants', partId), a = p && Store.get('adventures', p.adventure_id);
    Policy.assert(Policy.canManage(a), 'Only the host can check people in'); Policy.assert(Host.window(a), 'Check-in opens 3 hours before the start');
    await Store.patch('adventure_participants', partId, { checked_in_at: here ? nowIso() : null, updated_at: nowIso() });
  },
  async remove(partId, reason) {
    const p = Store.get('adventure_participants', partId), a = p && Store.get('adventures', p.adventure_id);
    Policy.assert(Policy.canManage(a), 'Only the host can remove people'); Policy.assert(p.status === 'approved' && p.role !== 'host', 'This person is not on the adventure');
    Policy.assert(!['cancelled', 'completed'].includes(Q.status(a)), 'This adventure is closed');
    const name = ((Q.prof(p.profile_id) || {}).name || 'Someone').split(' ')[0];
    await Store.patch('adventure_participants', partId, { status: 'cancelled', removed_by_host: true, removed_reason: String(reason || '').slice(0, 200), checked_in_at: null, updated_at: nowIso() });
    const c = Chat.convFor(a.id); if (c) { await Chat.system(c.id, `${name} is no longer on this adventure.`); await Chat.removeMember(c.id, p.profile_id); }
    if (Q.status(a) === 'full') await Store.patch('adventures', a.id, { status: 'published', updated_at: nowIso() });
    await Notify.send(p.profile_id, 'removed_by_host', { adventure_id: a.id });
    await Waitlist.offerNext(Store.get('adventures', a.id));
    Analytics.track('host_removed_participant', { adventure_id: a.id, has_reason: !!reason });
  },
  stats() {
    const now = Date.now(), wk = now + 7 * 864e5, month = now - 30 * 864e5;
    const mine = Store.filter('adventures', a => a.host_id === Session.id);
    const week = mine.filter(a => ['published', 'full'].includes(Q.status(a)) && +new Date(a.ends_at) >= now && +new Date(a.starts_at) <= wk);
    const fill = week.length ? Math.round(week.reduce((n, a) => n + Math.min(1, Q.going(a).length / a.capacity), 0) / week.length * 100) : null;
    const waiting = mine.filter(a => ['published', 'full'].includes(Q.status(a))).reduce((n, a) => n + Q.pending(a).length, 0);
    const done = mine.filter(a => Q.status(a) === 'completed' && +new Date(a.starts_at) >= month);
    const noShows = done.reduce((n, a) => n + Store.filter('adventure_participants', p => p.adventure_id === a.id && p.role !== 'host' && p.attended === false).length, 0);
    const people = done.reduce((n, a) => n + Store.filter('adventure_participants', p => p.adventure_id === a.id && p.role !== 'host' && p.status === 'completed' && p.attended !== false).length, 0);
    return { week: week.length, fill, waiting, done: done.length, noShows, people, any: mine.length > 0 };
  }
};

/* People the host removed cannot ask again. */
const _hostJoin = Participation.join;
Participation.join = async (aid, msg) => {
  const p = Q.myPart(Store.get('adventures', aid));
  Policy.assert(!(p && p.removed_by_host), 'The host removed you from this adventure, so you cannot rejoin it.');
  return _hostJoin(aid, msg);
};

NOTE_TEXT.announcement = n => { const a = Store.get('adventures', n.adventure_id); return `<b>${esc(Q.prof(n.actor_id)?.name || 'The host')}</b> posted in <b>${esc(a ? a.title : 'your adventure')}</b>: “${esc(((n.data || {}).text) || '')}”`; };
NOTE_TEXT.host_reminder = n => { const a = Store.get('adventures', n.adventure_id); return a ? `Reminder: <b>${esc(a.title)}</b> is ${dateLabel(a).toLowerCase()} at ${hm(a.starts_at, tzOf(a))}. ${esc(a.meeting_point_exact || a.meeting_point || '')}` : 'Reminder about your adventure.'; };
NOTE_TEXT.removed_by_host = n => { const a = Store.get('adventures', n.adventure_id); return `The host took you off <b>${esc(a ? a.title : 'an adventure')}</b>. Other adventures are on Explore.`; };

/* ---------------------------------------------------------------------
   UI pieces
   --------------------------------------------------------------------- */
const agoShort = iso => { const h = (Date.now() - +new Date(iso)) / 36e5; return h < 1 ? `${Math.max(1, Math.round(h * 60))} min ago` : `${Math.round(h)} h ago`; };

function hostStatsCard() {
  const s = Host.stats(); if (!s.any) return '';
  const cell = (k, v, sub, warn) => `<div><span class="mono">${k}</span><b class="tnum"${warn ? ' style="color:var(--bad)"' : ''}>${v}</b><small>${sub}</small></div>`;
  return `<div class="host-stats" aria-label="Hosting this week">
    ${cell('7 days', s.week, s.week === 1 ? 'session' : 'sessions')}
    ${cell('Filled', s.fill == null ? '–' : s.fill + '%', 'of spots')}
    ${cell('Waiting', s.waiting, s.waiting === 1 ? 'request' : 'requests', false)}
    ${cell('No-shows', s.noShows, s.people ? `of ${s.people + s.noShows}, 30 days` : 'last 30 days', s.noShows > 0)}
  </div>`;
}

function checkinBanner(a) {
  if (!Host.window(a)) return '';
  const g = Q.going(a).filter(p => p.role !== 'host'), here = g.filter(p => p.checked_in_at).length;
  return `<div class="pad"><button class="today-card" ${goAttr('checkin', { id: a.id })}><span class="icon-btn" style="background:var(--lime);color:var(--forest)">${ico('checkin')}</span><span class="tx"><span class="mono">${Q.started(a) ? 'Happening now' : 'Today'}</span><b>Check in your group</b><small>${here} of ${g.length} here</small></span>${ico('chev')}</button></div>`;
}

const _hostManage = SCREENS.manage;
SCREENS.manage = p => {
  const out = _hostManage(p), a = Store.get('adventures', p.id); if (!a || !out.body || !Policy.canManage(a)) return out;
  const closed = ['cancelled', 'completed'].includes(Q.status(a)), going = Q.going(a);
  /* today banner under the adventure card */
  out.body = out.body.replace(/(<\/span><\/span><\/button><\/div>)/, `$1${checkinBanner(a)}`);
  /* confirmed list with a menu per person */
  out.body = out.body.replace(/<section class="sec"><div class="sec-h"><div><h2>Confirmed<\/h2>[\s\S]*?<\/section>/, `<section class="sec">${secH('Confirmed', `${going.length} of ${a.capacity}`)}<div class="group">${going.map(r => personRow(r.profile_id, r.role === 'host' ? '<span class="pill">Host</span>' : `${r.checked_in_at ? '<span class="pill ok">Here</span>' : ''}${closed ? '' : `<button class="icon-btn line" data-act="partMenu" data-arg="${r.id}" aria-label="Options for ${esc((Q.prof(r.profile_id) || {}).name || 'this person')}">${ico('more')}</button>`}`)).join('')}</div></section>`);
  /* host actions on top of the list */
  if (!closed) {
    const ago = Host.remindedAgo(a), cid = `c_${a.id}`, last = Host.latestAnnouncement(cid);
    const rows = `<button class="lrow" data-act="annSheet" data-arg="${a.id}"><span class="icon-btn line">${ico('megaphone')}</span><span class="tx"><b>Post an announcement</b><small>${last ? `Last one ${agoShort(last.created_at)}` : 'Pinned in the chat, everyone gets notified'}</small></span>${ico('chev')}</button>
      ${Q.started(a) ? '' : `<button class="lrow" data-act="hostRemind" data-arg="${a.id}" ${Host.canRemind(a) ? '' : 'aria-disabled="true"'}><span class="icon-btn line">${ico('bell')}</span><span class="tx"><b>Send a reminder</b><small>${ago < REMIND_GAP_H ? `Sent ${agoShort(a.reminded_at)}` : going.length > 1 ? 'Date, time and meeting point to everyone going' : 'Nobody to remind yet'}</small></span>${ico('chev')}</button>`}
      ${Host.window(a) ? `<button class="lrow" ${goAttr('checkin', { id: a.id })}><span class="icon-btn line">${ico('checkin')}</span><span class="tx"><b>Check in</b><small>Tap who has arrived</small></span>${ico('chev')}</button>` : ''}`;
    out.body = out.body.replace(/(<h2>Actions<\/h2>[\s\S]*?<div class="group">)/, `$1${rows}`);
  }
  return out;
};

SCREENS.checkin = p => {
  const a = Store.get('adventures', p.id); if (!a) return notFound('This adventure is not available');
  if (!Policy.canManage(a)) return notFound('Only the host can check people in');
  const g = Q.going(a).filter(x => x.role !== 'host'), here = g.filter(x => x.checked_in_at).length, open = Host.window(a);
  return { nav: false, cta: open && Q.started(a) ? `<button class="btn btn-primary btn-block" data-act="completeSheet" data-arg="${a.id}">${ico('check')}Finish and mark attendance</button>` : `<button class="btn btn-secondary btn-block" data-back>Done</button>`, body: `
    <div class="topbar">${backBtn()}<h1>Check in</h1><span class="pill ${here === g.length && g.length ? 'ok' : ''}">${here} of ${g.length}</span></div>
    <div class="pad"><p class="muted" style="font-size:13.5px">${esc(a.title)} · ${timeLabel(a)} · ${esc(a.meeting_point_exact || a.meeting_point || placeName(a))}</p></div>
    ${open ? '' : `<div class="pad"><p class="lock-note">${ico('clock')}<span>Check-in opens 3 hours before the start.</span></p></div>`}
    ${g.length ? `<div class="group" style="margin-top:12px">${g.map(x => { const P = Q.prof(x.profile_id) || { name: 'Someone' }; const on = !!x.checked_in_at; return `<div class="lrow">${avatar(x.profile_id, 44)}<span class="tx"><b>${esc(P.name)}</b><small>${on ? `Arrived ${hm(x.checked_in_at, tzOf(a))}` : 'Not here yet'}</small></span><button class="chip" aria-pressed="${on}" data-act="hostCheck" data-arg="${x.id}:${on ? 0 : 1}" ${open ? '' : 'disabled'} style="min-width:84px;justify-content:center">${on ? `${ico('check', 14)}Here` : 'Mark here'}</button></div>`; }).join('')}</div>` : emptyState('users', 'Nobody else is going', 'Share the adventure to fill the spots.')}
    ${g.length && open && here < g.length ? `<div class="pad" style="margin-top:14px"><button class="btn btn-secondary btn-block" ${goAttr('chat', { id: `c_${a.id}` })}>${ico('msg')}Message the group</button></div>` : ''}` };
};

/* Completion: check-ins pre-fill who showed up. */
const _hostCompleteSheet = A.completeSheet;
Object.assign(A, {
  completeSheet: id => {
    _hostCompleteSheet(id);
    const a = Store.get('adventures', id), g = a ? Q.going(a).filter(p => p.role !== 'host') : [];
    if (UI.att && g.some(p => p.checked_in_at)) { g.forEach(p => { UI.att[p.profile_id] = !!p.checked_in_at; }); const r = $('#attRows'); if (r && UI.attRows) r.innerHTML = UI.attRows(); const s = $('#sheetBody .sub'); if (s) s.textContent = 'Pre-filled from check-in. People marked as no-show are not asked for a review.'; }
  },
  hostCheck: arg => { const [id, v] = arg.split(':'); run(() => Host.checkIn(id, v === '1')); },
  hostRemind: id => { const a = Store.get('adventures', id); if (!Host.canRemind(a)) return toast(Host.remindedAgo(a) < REMIND_GAP_H ? `You sent one ${agoShort(a.reminded_at)}. Next one in ${Math.ceil(REMIND_GAP_H - Host.remindedAgo(a))} h.` : 'Nobody to remind yet'); run(() => Host.remind(id), `Reminder sent to ${Q.going(a).length - 1} ${Q.going(a).length - 1 === 1 ? 'person' : 'people'}`); },
  annSheet: id => openSheet(`<div class="sbody"><div><h3>Announcement</h3><p class="sub">Pinned at the top of the chat. Everyone going gets a notification.</p></div><div class="field" style="padding:0"><label for="anntext">Message</label><textarea class="inp" id="anntext" maxlength="500" rows="4" placeholder="Visibility is great today. Bring a 5 mm suit, we meet 15 minutes earlier."></textarea></div><button class="btn btn-primary" data-act="annSend" data-arg="${id}">${ico('megaphone')}Post to the group</button><button class="btn btn-secondary" data-act="closeSheet">Cancel</button></div>`),
  annSend: id => { const t = (($('#anntext') || {}).value || '').trim(); if (t.length < 3) return toast('Write the announcement first'); run(async () => { await Host.announce(id, t); closeSheet(); }, 'Posted. Everyone going has been notified.'); },
  partMenu: id => { const p = Store.get('adventure_participants', id), P = p && Q.prof(p.profile_id); if (!P) return; const first = esc(P.name.split(' ')[0]);
    openSheet(`<div class="sbody"><div><h3>${esc(P.name)}</h3><p class="sub">${p.checked_in_at ? `Checked in ${hm(p.checked_in_at, tzOf(Store.get('adventures', p.adventure_id)))}` : 'Confirmed'}</p></div><div class="group" style="margin:0">
      <button class="lrow" ${goAttr('person', { id: p.profile_id })}><span class="icon-btn line">${ico('user')}</span><span class="tx"><b>View profile</b></span>${ico('chev')}</button>
      <button class="lrow" data-act="dm" data-arg="${p.profile_id}"><span class="icon-btn line">${ico('msg')}</span><span class="tx"><b>Message ${first}</b></span>${ico('chev')}</button>
      <button class="lrow" data-act="removeSheet" data-arg="${id}"><span class="icon-btn line" style="color:var(--bad)">${ico('x')}</span><span class="tx"><b style="color:var(--bad)">Remove from adventure</b><small>Frees the spot for the waitlist</small></span>${ico('chev')}</button></div></div>`); },
  removeSheet: id => { const p = Store.get('adventure_participants', id), P = p && Q.prof(p.profile_id); if (!P) return;
    openSheet(`<div class="sbody"><div><h3>Remove ${esc(P.name.split(' ')[0])}?</h3><p class="sub">They leave the group chat and cannot ask to join this date again. The spot goes to the waitlist or back on Explore.</p></div><div class="field" style="padding:0"><label for="rmwhy">Reason <span style="font-weight:600">Optional, for your records</span></label><input class="inp" id="rmwhy" maxlength="200" placeholder="Level does not match, asked to swap dates"></div><button class="btn btn-primary" style="background:var(--bad);color:#fff" data-act="removeDo" data-arg="${id}">Remove</button><button class="btn btn-secondary" data-act="closeSheet">Keep them</button></div>`); },
  removeDo: id => { const why = (($('#rmwhy') || {}).value || '').trim(); run(async () => { await Host.remove(id, why); closeSheet(); }, 'Removed. The spot is open again.'); }
});

/* Chat: the latest announcement stays pinned under the plan. */
const _hostChat = SCREENS.chat;
SCREENS.chat = p => {
  const out = _hostChat(p), c = Store.get('conversations', p.id); if (!c || !out.body || c.type !== 'adventure') return out;
  const last = Host.latestAnnouncement(c.id); if (!last) return out;
  const who = last.sender_id === Session.id ? 'You' : ((Q.prof(last.sender_id) || {}).name || 'Host').split(' ')[0];
  out.body = out.body.replace('<div class="pinned">', `<div class="pinned"><div class="ann-pin" role="note"><span class="mono">${ico('megaphone', 13)} Announcement · ${esc(who)} · ${agoShort(last.created_at)}</span><p>${esc(last.body)}</p></div>`);
  return out;
};

/* Hosting tab: stats on top. */
const _hostMy = SCREENS.my;
SCREENS.my = p => {
  const out = _hostMy(p); if ((p.tab || 'upcoming') !== 'hosting' || !out.body) return out;
  const card = hostStatsCard(); if (!card) return out;
  out.body = out.body.replace(/(<div class="tabs-line"[\s\S]*?<\/div>)/, `$1<div class="pad" style="margin-top:14px">${card}</div>`);
  return out;
};
