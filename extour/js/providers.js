/* =====================================================================
   EXTour provider onboarding
   - Apply in 3 steps: who you are, credentials, what you offer
   - Status: pending → verified | changes (asked to fix) | declined
   - Only verified providers are public and can list paid experiences
   - EXTour admin reviews applications; owners manage page and team
   ===================================================================== */
'use strict';

const PROV_STATUS = {
  pending: ['Under review', 'We usually answer within 2 working days.', 'warn'],
  changes: ['Changes requested', 'Update your application and send it again.', 'warn'],
  verified: ['Verified', 'Your page is live and you can list paid experiences.', 'ok'],
  declined: ['Not approved', 'You can message the EXTour team if you think this is a mistake.', 'bad'],
  paused: ['Paused', 'Your page is hidden for now.', 'bad']
};
const IDENTITY_FIELDS = ['name', 'type', 'sports', 'qualifications'];

const Providers = {
  isAdmin() {
    if (typeof SupabaseBoot !== 'undefined' && SupabaseBoot.enabled()) return !!Session.admin;
    return !!(Session.me && (Session.me.roles || []).includes('admin'));
  },
  allMine(pid = Session.id) { return Store.t.provider_members ? [...Store.t.provider_members.values()].filter(m => m.profile_id === pid) : []; },
  ownerOf(provId, pid = Session.id) { return Providers.allMine(pid).some(m => m.provider_id === provId && m.role === 'owner'); },
  memberOf(provId, pid = Session.id) { return Providers.allMine(pid).some(m => m.provider_id === provId); },
  visible(p) { return !!p && (p.status === 'verified' || !p.status || Providers.memberOf(p.id) || Providers.isAdmin()); },
  myApplication() { const m = Providers.allMine().find(m => m.role === 'owner' && (Store.get('providers', m.provider_id) || {}).status !== 'verified'); return m ? Store.get('providers', m.provider_id) : null; },
  queue() { return [...Store.t.providers.values()].filter(p => ['pending', 'changes'].includes(p.status)).sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')); },
  admins() { return [...Store.t.profiles.values()].filter(p => (p.roles || []).includes('admin')).map(p => p.id); },

  validate(f, step) {
    const e = {};
    if (step == null || step === 0) {
      if (!f.type) e.type = 'Pick what describes you best.';
      if (!f.name || f.name.trim().length < 3) e.name = 'Add the name people will see, at least 3 letters.';
      if (!f.destination_id) e.dest = 'Pick where you work.';
      if (!f.sports.length) e.sports = 'Pick at least one sport.';
      if (!f.languages.length) e.languages = 'Pick at least one language.';
    }
    if (step == null || step === 1) {
      if (!f.quals.trim()) e.quals = 'List at least one qualification, for example "AIDA Instructor".';
      if (!f.insurance) e.insurance = 'Paid listings need professional liability insurance.';
    }
    if (step == null || step === 2) {
      if (!f.description || f.description.trim().length < 40) e.description = 'Write at least 40 characters so people know what you do.';
      const offers = f.offers.filter(o => o.title.trim());
      if (!offers.length) e.offers = 'Add at least one experience with a price.';
      if (offers.some(o => !(+o.price >= 0) || o.price === '')) e.offers = 'Every experience needs a price in euros. Use 0 if it is free.';
      if (!f.editId && !f.terms) e.terms = 'Please confirm to send the application.';
    }
    return e;
  },
  toRow(f) {
    return { name: f.name.trim(), type: f.type, destination_id: f.destination_id, location: f.location.trim() || (Q.dest(f.destination_id) || {}).name || '',
      sports: [...f.sports], languages: [...f.languages], qualifications: f.quals.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 8),
      insurance: !!f.insurance, website: f.website.trim(), cert_media: [...f.certs], description: f.description.trim(),
      offers: f.offers.filter(o => o.title.trim()).slice(0, 4).map(o => ({ title: o.title.trim(), detail: o.detail.trim(), price: Math.round(+o.price) })) };
  },
  async apply(f) {
    Policy.assert(Session.id, 'Sign in to apply');
    const e = Providers.validate(f); Policy.assert(!Object.keys(e).length, Object.values(e)[0]);
    const row = Providers.toRow(f), at = nowIso();
    if (f.editId) {
      const p = Store.get('providers', f.editId); Policy.assert(Providers.ownerOf(p.id), 'Only the owner can change this provider');
      if (p.status === 'verified') { IDENTITY_FIELDS.forEach(k => delete row[k]); await Store.patch('providers', p.id, row); Analytics.track('provider_page_updated', { provider_id: p.id }); return p.id; }
      Policy.assert(['pending', 'changes'].includes(p.status), 'This application is closed');
      await Store.patch('providers', p.id, { ...row, status: 'pending', review_note: '', created_at: at });
      await Providers.tellAdmins(p.id, 'provider_applied'); Analytics.track('provider_resubmitted', { provider_id: p.id });
      return p.id;
    }
    Policy.assert(!Providers.myApplication(), 'You already have an application open');
    const id = `${slugify(row.name)}-${uid('').slice(-4)}`.replace(/-+/g, '-');
    await Store.put('providers', { id, slug: id, logo: null, lat: null, lng: null, ...row, status: 'pending', created_by: Session.id, created_at: at, verified_at: null, review_note: '' });
    await Store.put('provider_members', { id: `pm_${id}_${Session.id}`, provider_id: id, profile_id: Session.id, role: 'owner' });
    await Providers.tellAdmins(id, 'provider_applied');
    Analytics.track('provider_applied', { provider_id: id, type: row.type, sports: row.sports.join(',') });
    return id;
  },
  async tellAdmins(provider_id, type) {
    if (typeof SupabaseBoot !== 'undefined' && SupabaseBoot.enabled()) return; /* a database trigger tells the admins */
    for (const pid of Providers.admins()) await Notify.send(pid, type, { data: { provider_id } });
  },
  async review(id, decision, note = '') {
    Policy.assert(Providers.isAdmin(), 'Only the EXTour team can review providers');
    const p = Store.get('providers', id); Policy.assert(p, 'This application is gone');
    Policy.assert(['verified', 'changes', 'declined'].includes(decision), 'Unknown decision');
    Policy.assert(decision === 'verified' || note.trim().length >= 5, 'Tell them what to change, in a sentence.');
    await Store.patch('providers', id, { status: decision, review_note: note.trim().slice(0, 400), verified_at: decision === 'verified' ? nowIso() : null });
    const owner = Store.filter('provider_members', m => m.provider_id === id && m.role === 'owner')[0];
    if (owner) await Notify.send(owner.profile_id, 'provider_reviewed', { data: { provider_id: id, decision } });
    Analytics.track('provider_reviewed', { provider_id: id, decision });
  },
  async addStaff(id, handle) {
    Policy.assert(Providers.ownerOf(id), 'Only the owner can add people');
    const u = String(handle || '').trim().replace(/^@/, '').toLowerCase(); Policy.assert(u, 'Type their username');
    const P = [...Store.t.profiles.values()].find(p => (p.username || '').toLowerCase() === u); Policy.assert(P, `Nobody is called @${u}. Check the spelling on their profile.`);
    Policy.assert(!Providers.memberOf(id, P.id), `${P.name.split(' ')[0]} is already on the team`);
    await Store.put('provider_members', { id: `pm_${id}_${P.id}`, provider_id: id, profile_id: P.id, role: 'staff' });
    await Notify.send(P.id, 'provider_staff_added', { data: { provider_id: id } });
    return P;
  },
  async removeStaff(memberId) {
    const m = Store.get('provider_members', memberId); Policy.assert(m && Providers.ownerOf(m.provider_id), 'Only the owner can remove people');
    Policy.assert(m.role !== 'owner', 'The owner cannot be removed'); await Store.del('provider_members', memberId);
  }
};

/* Unverified providers stay out of Explore, search, maps and listings. */
const _pvFilter = Store.filter.bind(Store), _pvAll = Store.all.bind(Store);
Store.filter = (t, fn) => t === 'providers' ? _pvFilter(t, p => Providers.visible(p) && fn(p)) : _pvFilter(t, fn);
Store.all = t => t === 'providers' ? _pvAll(t).filter(Providers.visible) : _pvAll(t);
/* Listing as a provider needs a verified provider. */
const _pvMemberships = Policy.memberships;
Policy.memberships = pid => _pvMemberships(pid).filter(m => { const p = Store.get('providers', m.provider_id); return p && (!p.status || p.status === 'verified'); });

NOTE_TEXT.provider_applied = n => { const p = Store.get('providers', (n.data || {}).provider_id); return `<b>${esc(Q.prof(n.actor_id)?.name || 'Someone')}</b> applied as a provider: <b>${esc(p ? p.name : 'new provider')}</b>. Review it.`; };
NOTE_TEXT.provider_reviewed = n => { const p = Store.get('providers', (n.data || {}).provider_id), d = (n.data || {}).decision, nm = esc(p ? p.name : 'your provider');
  return d === 'verified' ? `<b>${nm}</b> is verified. Your page is live and you can list paid experiences.` : d === 'changes' ? `The EXTour team asked for changes to <b>${nm}</b>. Open it to see what.` : `Your application for <b>${nm}</b> was not approved.`; };
NOTE_TEXT.provider_staff_added = n => { const p = Store.get('providers', (n.data || {}).provider_id); return `<b>${esc(Q.prof(n.actor_id)?.name || 'Someone')}</b> added you to the team at <b>${esc(p ? p.name : 'a provider')}</b>.`; };

/* ---------------------------------------------------------------------
   Form state
   --------------------------------------------------------------------- */
function paFromProvider(p) {
  return { step: 0, editId: p.id, verified: p.status === 'verified', type: p.type, name: p.name, destination_id: p.destination_id, location: p.location || '', sports: [...(p.sports || [])], languages: [...(p.languages || [])],
    quals: (p.qualifications || []).join('\n'), insurance: !!p.insurance, website: p.website || '', certs: [...(p.cert_media || [])], description: p.description || '',
    offers: (p.offers || []).map(o => ({ title: o.title, detail: o.detail || '', price: String(o.price) })).concat([{ title: '', detail: '', price: '' }]).slice(0, 4), terms: true, errors: {} };
}
function paNew() {
  const me = Session.me || {}, us = Q.userSports(Session.id);
  return { step: 0, editId: null, verified: false, type: '', name: '', destination_id: me.home_destination_id || '', location: me.home_location || '', sports: us.slice(0, 1).map(u => u.sport_id), languages: [...(me.languages || ['English'])],
    quals: '', insurance: false, website: '', certs: [], description: '', offers: [{ title: '', detail: '', price: '' }, { title: '', detail: '', price: '' }], terms: false, errors: {} };
}

/* ---------------------------------------------------------------------
   Screens
   --------------------------------------------------------------------- */
function provStatusCard(p, full) {
  const [t, sub, tone] = PROV_STATUS[p.status] || PROV_STATUS.verified;
  return `<div class="prov-status ${tone}"><span class="mono">${esc(t)}</span><b>${esc(p.name)}</b><small>${esc(sub)}</small>${p.review_note && ['changes', 'declined'].includes(p.status) ? `<p class="note">“${esc(p.review_note)}”<span>EXTour team</span></p>` : ''}${full || ''}</div>`;
}

SCREENS.proInfo = () => {
  const app = Session.id && Providers.myApplication();
  const steps = [['Apply', 'Tell us who you are, your qualifications and what you offer. 5 minutes.'], ['We check', 'A real person reviews it, usually within 2 working days. We may ask for a certificate.'], ['Go live', 'Your page appears on Explore and you can list courses, guided days and trips.']];
  const checks = ['A current instructor or guide qualification for each sport you list', 'Professional liability insurance', 'A clear description and real prices', 'One real person we can talk to'];
  return { nav: false, cta: app ? `<button class="btn btn-primary btn-block" ${goAttr('proHome', { id: app.id })}>View your application</button>` : `<button class="btn btn-primary btn-block" data-act="paStart">Apply as a provider</button>`, body: `
    <div class="topbar">${backBtn()}<h1>For instructors and schools</h1></div>
    <div class="page-h"><h1>Teach, guide or run trips?</h1><p>Instructors, coaches, guides, schools and clubs can list paid experiences on EXTour. Community adventures stay free for everyone.</p></div>
    ${app ? `<div class="pad" style="margin-top:14px">${provStatusCard(app)}</div>` : ''}
    <section class="sec">${secH('How it works')}<div class="group">${steps.map(([t, d], i) => `<div class="lrow"><span class="step-n">${i + 1}</span><span class="tx"><b>${t}</b><small>${d}</small></span></div>`).join('')}</div></section>
    <section class="sec">${secH('What we check')}<ul class="checks pad">${checks.map(c => `<li>${ico('shield')}<span>${c}</span></li>`).join('')}</ul></section>
    <section class="sec">${secH('What it costs')}<p class="pad muted" style="font-size:14px;line-height:1.5">Free during the pilot in Barcelona and Dahab. People book with you by message and pay you directly. When payments arrive in the app, we will tell you the fee before anything changes.</p></section>` };
};

SCREENS.proApply = () => {
  const F = UI.pa || (UI.pa = paNew()), step = F.step, E = F.errors || {}, N = 3, lock = F.verified;
  const err = k => E[k] ? `<span class="err">${ico('info')}${E[k]}</span>` : '';
  const head = `<div class="ob-top">${step > 0 ? `<button class="icon-btn line" data-act="paStep" data-arg="-1" aria-label="Back">${ico('back')}</button>` : backBtn()}<div class="progress"><i style="width:${(step + 1) / N * 100}%"></i></div><span class="mono muted">${step + 1}/${N}</span></div>`;
  const lockNote = lock ? `<p class="lock-note">${ico('lock')}<span>Name, type, sports and qualifications are verified. To change them, message the EXTour team.</span></p>` : '';
  let body = '';
  if (step === 0) body = `<div class="ob-q"><h1>${F.editId ? (lock ? 'Edit your page' : 'Update your application') : 'Who are you?'}</h1><p>This is what people see on your provider page.</p></div>${lock ? `<div class="pad">${lockNote}</div>` : ''}
    <div class="field"><span class="lab">You are a</span><div class="chips">${Object.entries(PROV_TYPES).map(([k, v]) => `<button class="chip" aria-pressed="${F.type === k}" data-act="paSet" data-arg="type:${k}" ${lock ? 'disabled' : ''}>${v}</button>`).join('')}</div>${err('type')}</div>
    <div class="field"><label for="paname">Name on EXTour</label><input class="inp ${E.name ? 'bad' : ''}" id="paname" maxlength="48" value="${esc(F.name)}" placeholder="Blau Apnea, or your own name" ${lock ? 'disabled' : ''}>${err('name')}</div>
    <div class="field"><span class="lab">Where you work</span><div class="chips">${_pvAll('destinations').map(d => `<button class="chip" aria-pressed="${F.destination_id === d.id}" data-act="paSet" data-arg="destination_id:${d.id}">${esc(d.name)}</button>`).join('')}</div>${err('dest')}
      <input class="inp" id="paloc" maxlength="60" value="${esc(F.location)}" placeholder="Town or harbour, for example Port Ginesta" style="margin-top:8px"></div>
    <div class="field"><span class="lab">Sports you teach or guide</span><div class="sport-grid">${Q.sportsActive().map(s => `<button class="sport-pick" style="${sportStyle(s)}" aria-pressed="${F.sports.includes(s.id)}" data-act="paSport" data-arg="${s.id}" ${lock ? 'disabled' : ''}><span class="ic">${ico(s.icon, 24)}</span>${esc(s.name)}</button>`).join('')}</div>${err('sports')}</div>
    <div class="field"><span class="lab">Languages you teach in</span><div class="chips">${[...new Set([...LANGS, ...F.languages])].map(l => `<button class="chip" aria-pressed="${F.languages.includes(l)}" data-act="paLang" data-arg="${esc(l)}">${esc(l)}</button>`).join('')}</div>${err('languages')}</div>`;
  if (step === 1) body = `<div class="ob-q"><h1>Your credentials</h1><p>We check these before your page goes live. Only the EXTour team sees certificate photos.</p></div>${lock ? `<div class="pad">${lockNote}</div>` : ''}
    <div class="field"><label for="paquals">Qualifications <span style="font-weight:600">One per line</span></label><textarea class="inp ${E.quals ? 'bad' : ''}" id="paquals" rows="4" maxlength="600" placeholder="AIDA Instructor (2022)&#10;Rescue and oxygen first aid" ${lock ? 'disabled' : ''}>${esc(F.quals)}</textarea>${err('quals')}</div>
    <div class="field"><span class="lab">Certificates <span style="font-weight:600">Optional, speeds up the review</span></span><div class="cert-row">${F.certs.map((r, i) => `<span class="cert"><img src="${mediaSrc(r) || ''}" alt="Certificate ${i + 1}"><button data-act="paCertDel" data-arg="${i}" aria-label="Remove certificate ${i + 1}">${ico('x', 14)}</button></span>`).join('')}${F.certs.length < 4 ? `<label class="cert add" for="pacert">${ico('plus')}<span>Add photo</span></label><input type="file" id="pacert" accept="image/*" hidden>` : ''}</div></div>
    <div class="field"><label class="ck"><input type="checkbox" id="painsurance" ${F.insurance ? 'checked' : ''}><span>I have professional liability insurance that covers what I list</span></label>${err('insurance')}</div>
    <div class="field"><label for="paweb">Website or Instagram <span style="font-weight:600">Optional</span></label><input class="inp" id="paweb" maxlength="80" value="${esc(F.website)}" placeholder="instagram.com/yourschool"></div>`;
  if (step === 2) body = `<div class="ob-q"><h1>What you offer</h1><p>Shown on your page. You add dates later from the + button.</p></div>
    <div class="field"><label for="padesc">About you</label><textarea class="inp ${E.description ? 'bad' : ''}" id="padesc" rows="4" maxlength="500" placeholder="Who you teach, where, group size, what makes a day with you good">${esc(F.description)}</textarea>${err('description')}</div>
    <div class="field"><span class="lab">Experiences and prices</span><div style="display:grid;gap:10px">${F.offers.map((o, i) => `<div class="offer-edit"><input class="inp" data-offer="${i}:title" maxlength="40" value="${esc(o.title)}" placeholder="Experience ${i + 1}, for example AIDA 2 course"><div class="two-col"><input class="inp" data-offer="${i}:detail" maxlength="40" value="${esc(o.detail)}" placeholder="3 days, to 20 m"><div class="eur"><span>€</span><input class="inp" data-offer="${i}:price" inputmode="numeric" maxlength="5" value="${esc(o.price)}" placeholder="0"></div></div></div>`).join('')}</div>
      ${F.offers.length < 4 ? `<button class="btn-link" data-act="paOfferAdd" style="justify-self:start">${ico('plus', 14)} Add another</button>` : ''}${err('offers')}</div>
    ${F.editId ? '' : `<div class="field"><label class="ck"><input type="checkbox" id="paterms" ${F.terms ? 'checked' : ''}><span>The details are true, and I will run every listing with the safety standards of my qualification.</span></label>${err('terms')}</div>`}`;
  const last = step === N - 1;
  return { nav: false, cta: `<button class="btn btn-primary btn-block" data-act="${last ? 'paSubmit' : 'paStep'}" data-arg="1">${last ? (F.editId ? (lock ? 'Save page' : 'Send again') : 'Send application') : 'Continue'}</button>`, body: head + body,
    after: v => {
      const bind = (id, key) => { const el = $('#' + id, v); if (el) el.oninput = () => { F[key] = el.value; }; };
      bind('paname', 'name'); bind('paloc', 'location'); bind('paquals', 'quals'); bind('paweb', 'website'); bind('padesc', 'description');
      ['insurance', 'terms'].forEach(k => { const el = $('#pa' + k, v); if (el) el.onchange = () => { F[k] = el.checked; }; });
      v.querySelectorAll('[data-offer]').forEach(el => { el.oninput = () => { const [i, k] = el.dataset.offer.split(':'); F.offers[+i][k] = k === 'price' ? el.value.replace(/\D/g, '') : el.value; if (k === 'price') el.value = F.offers[+i][k]; }; });
    } };
};

SCREENS.proHome = p => {
  const P = Store.get('providers', p.id); if (!P || !Providers.memberOf(P.id)) return notFound('This provider is not available');
  const owner = Providers.ownerOf(P.id), team = _pvFilter('provider_members', m => m.provider_id === P.id), live = P.status === 'verified';
  const upcoming = Store.filter('adventures', a => a.provider_id === P.id && ['published', 'full'].includes(Q.status(a))).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const btn = live ? `<div class="row" style="margin-top:10px"><button class="btn btn-secondary btn-sm btn-block" ${goAttr('provider', { id: P.id })}>View public page</button>${owner ? `<button class="btn btn-secondary btn-sm btn-block" data-act="paEdit" data-arg="${P.id}">${ico('edit')}Edit page</button>` : ''}</div>`
    : owner && P.status === 'changes' ? `<button class="btn btn-primary btn-sm btn-block" data-act="paEdit" data-arg="${P.id}" style="margin-top:10px">Update application</button>`
    : owner && P.status === 'pending' ? `<button class="btn btn-secondary btn-sm btn-block" data-act="paEdit" data-arg="${P.id}" style="margin-top:10px">${ico('edit')}Edit before review</button>` : '';
  return { nav: false, body: `
    <div class="topbar">${backBtn()}<h1>Your provider</h1></div>
    <div class="pad" style="margin-top:6px">${provStatusCard(P, btn)}</div>
    ${live ? `<section class="sec">${secH('Upcoming dates', upcoming.length ? `${upcoming.length} listed` : '')}${upcoming.length ? `<div class="stack">${upcoming.slice(0, 4).map(a => advRow(a)).join('')}</div>` : emptyState('cal', 'No dates yet', 'List your first course or guided day.', '')}<div class="pad" style="margin-top:10px"><button class="btn btn-primary btn-block" data-act="startProFor" data-arg="${P.id}">${ico('plus')}List an experience</button></div></section>` : ''}
    <section class="sec">${secH('Team', live ? 'Staff can list dates for this provider' : 'You can add staff once you are verified')}<div class="group">${team.map(m => personRow(m.profile_id, `<span class="pill">${m.role}</span>${owner && m.role !== 'owner' ? `<button class="icon-btn line" data-act="pvStaffDel" data-arg="${m.id}" aria-label="Remove from team">${ico('x')}</button>` : ''}`)).join('')}</div>
      ${owner && live ? `<form class="pad row" data-form="pvStaff" data-arg="${P.id}" style="gap:8px;margin-top:10px"><div class="uname" style="flex:1"><span>@</span><input class="inp" id="pvstaff" autocapitalize="off" spellcheck="false" maxlength="20" placeholder="username" aria-label="Username to add"></div><button class="btn btn-secondary btn-sm" type="submit">Add</button></form>` : ''}</section>
    <section class="sec">${secH('Application')}<div class="sumbox">
      <div class="r"><span>Type</span><b>${esc(PROV_TYPES[P.type] || P.type)}</b></div>
      <div class="r"><span>Where</span><b>${esc(P.location || (Q.dest(P.destination_id) || {}).name || '')}</b></div>
      <div class="r"><span>Sports</span><b>${esc(P.sports.map(x => (Q.sport(x) || {}).name).join(', '))}</b></div>
      <div class="r"><span>Insurance</span><b>${P.insurance ? 'Yes' : 'No'}</b></div>
      <div class="r"><span>Certificates</span><b>${(P.cert_media || []).length}</b></div>
      <div class="r"><span>Sent</span><b>${P.created_at ? agoText(P.created_at) : '–'}</b></div></div></section>` };
};

SCREENS.proReview = p => {
  if (!Providers.isAdmin()) return notFound('Only the EXTour team can see this');
  const tab = p.tab || 'pending', all = _pvAll('providers'), list = all.filter(x => tab === 'pending' ? ['pending', 'changes'].includes(x.status) : x.status === tab).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  const n = s => all.filter(x => s === 'pending' ? ['pending', 'changes'].includes(x.status) : x.status === s).length;
  return { nav: false, body: `
    <div class="topbar">${backBtn()}<h1>Provider applications</h1></div>
    <div class="tabs-line" role="tablist" style="margin-top:8px">${[['pending', 'To review'], ['verified', 'Verified'], ['declined', 'Declined']].map(([t, l]) => `<button role="tab" aria-selected="${tab === t}" data-act="setP" data-arg="tab:${t}">${l} <span class="muted">${n(t)}</span></button>`).join('')}</div>
    ${list.length ? `<div class="group" style="margin-top:14px">${list.map(x => { const o = _pvFilter('provider_members', m => m.provider_id === x.id && m.role === 'owner')[0]; return `<button class="lrow" ${goAttr('proReviewOne', { id: x.id })}>${avatar('prov:' + x.id, 44, { sq: true })}<span class="tx"><b>${esc(x.name)}</b><small>${esc(PROV_TYPES[x.type] || x.type)} · ${esc((Q.dest(x.destination_id) || {}).name || '')} · ${esc(x.sports.map(s => (Q.sport(s) || {}).name).join(', '))}</small><small>${x.status === 'changes' ? 'Waiting for their changes' : `by ${esc(o ? (Q.prof(o.profile_id) || {}).name : 'someone')} · ${x.created_at ? agoText(x.created_at) : ''}`}</small></span>${ico('chev')}</button>`; }).join('')}</div>`
      : emptyState('check', tab === 'pending' ? 'All caught up' : 'Nothing here yet', tab === 'pending' ? 'New applications show up here and in your notifications.' : '')}` };
};

SCREENS.proReviewOne = p => {
  if (!Providers.isAdmin()) return notFound('Only the EXTour team can see this');
  const P = Store.get('providers', p.id); if (!P) return notFound('This application is gone');
  const o = _pvFilter('provider_members', m => m.provider_id === P.id && m.role === 'owner')[0], open = ['pending', 'changes'].includes(P.status);
  return { nav: false, cta: open ? `<button class="btn btn-secondary btn-block" data-act="pvDecide" data-arg="${P.id}:changes">Ask for changes</button><button class="btn btn-primary btn-block" data-act="pvApprove" data-arg="${P.id}">${ico('check')}Verify</button>` : '', body: `
    <div class="topbar">${backBtn()}<h1>Review</h1><span class="pill ${(PROV_STATUS[P.status] || [])[2] || ''}">${esc((PROV_STATUS[P.status] || ['?'])[0])}</span></div>
    <div class="page-h"><h1>${esc(P.name)}</h1><p>${esc(PROV_TYPES[P.type] || P.type)} · ${esc(P.location || '')} · ${esc(P.languages.join(', '))}</p></div>
    ${o ? `<section class="sec">${secH('Applicant')}<div class="group">${personRow(o.profile_id, `<button class="icon-btn line" data-act="dm" data-arg="${o.profile_id}" aria-label="Message applicant">${ico('msg')}</button>`)}</div></section>` : ''}
    <section class="sec">${secH('Checklist')}<ul class="checks pad">
      <li>${ico(P.qualifications.length ? 'check' : 'x')}<span>${P.qualifications.length} qualification${P.qualifications.length === 1 ? '' : 's'} listed</span></li>
      <li>${ico(P.insurance ? 'check' : 'x')}<span>${P.insurance ? 'Says they have liability insurance' : 'No insurance'}</span></li>
      <li>${ico((P.cert_media || []).length ? 'check' : 'info')}<span>${(P.cert_media || []).length ? `${P.cert_media.length} certificate photo${P.cert_media.length === 1 ? '' : 's'}` : 'No certificate photos. Ask for one if unsure.'}</span></li>
      <li>${ico(P.website ? 'check' : 'info')}<span>${P.website ? esc(P.website) : 'No website or Instagram'}</span></li></ul></section>
    <section class="sec">${secH('Qualifications')}<ul class="checks pad">${P.qualifications.map(q => `<li>${ico('shield')}<span>${esc(q)}</span></li>`).join('')}</ul>
      ${(P.cert_media || []).length ? `<div class="cert-row pad" style="margin-top:10px">${P.cert_media.map((r, i) => `<span class="cert big"><img src="${mediaSrc(r) || ''}" alt="Certificate ${i + 1}"></span>`).join('')}</div>` : ''}</section>
    <section class="sec">${secH('Sports')}<div class="row pad" style="flex-wrap:wrap;gap:6px">${P.sports.map(x => `<span class="pill">${esc((Q.sport(x) || {}).name || x)}</span>`).join('')}</div></section>
    <section class="sec">${secH('About')}<p class="pad" style="font-size:14.5px;line-height:1.5">${esc(P.description || '')}</p></section>
    <section class="sec">${secH('Experiences')}<div class="group">${(P.offers || []).map(x => `<div class="offer"><span class="tx"><b>${esc(x.title)}</b><small>${esc(x.detail || '')}</small></span><span class="price">€${x.price}</span></div>`).join('')}</div></section>
    ${P.review_note ? `<section class="sec">${secH('Last note to them')}<p class="pad muted">“${esc(P.review_note)}”</p></section>` : ''}
    ${open ? `<div class="pad" style="margin:14px 0 6px"><button class="btn-link" data-act="pvDecide" data-arg="${P.id}:declined" style="color:var(--bad);font-size:13.5px">Decline this application</button></div>` : P.status === 'verified' ? `<div class="pad" style="margin:14px 0 6px"><button class="btn-link" data-act="pvDecide" data-arg="${P.id}:declined" style="color:var(--bad);font-size:13.5px">Remove verification</button></div>` : ''}` };
};

/* Provider page: a manage banner for the team; unverified pages only for the team and admins. */
const _pvPage = SCREENS.provider;
SCREENS.provider = p => {
  const P = Store.get('providers', p.id);
  if (P && !Providers.visible(P)) return notFound('This provider is not available');
  const out = _pvPage(p); if (!P || !out.body) return out;
  if (P.status && P.status !== 'verified') out.body = out.body.replace(`${ico('shield')}Listed provider`, `${ico('clock')}${esc((PROV_STATUS[P.status] || ['Not live'])[0])}, not public yet`);
  if (Providers.memberOf(P.id)) out.body = out.body.replace('<div class="prov-head">', `<div class="pad" style="margin:10px 0"><button class="today-card" ${goAttr('proHome', { id: P.id })}><span class="icon-btn" style="background:var(--lime);color:var(--forest)">${ico('gear')}</span><span class="tx"><span class="mono">${Providers.ownerOf(P.id) ? 'You own this page' : 'You are on the team'}</span><b>Manage provider</b><small>Dates, team and page details</small></span>${ico('chev')}</button></div><div class="prov-head">`);
  return out;
};

/* ---------------------------------------------------------------------
   Entry points
   --------------------------------------------------------------------- */
const _pvOpenCreate = A.openCreate, _pvAccount = A.accountSheet;
Object.assign(A, {
  openCreate: () => {
    _pvOpenCreate();
    const app = Session.id && Providers.myApplication(), link = $('#sheetBody [data-go="proInfo"]');
    if (app && link) link.outerHTML = `<button class="create-opt" ${goAttr('proHome', { id: app.id })}><span class="ic">${ico('clock', 26)}</span><span><b>Your provider application</b><small>${esc(app.name)} · ${esc((PROV_STATUS[app.status] || ['Open'])[0])}</small></span></button>`;
  },
  accountSheet: () => {
    _pvAccount();
    const g = $('#sheetBody .group'); if (!g) return;
    const mine = Providers.allMine().map(m => Store.get('providers', m.provider_id)).filter(Boolean), q = Providers.isAdmin() ? Providers.queue().filter(p => p.status === 'pending').length : -1;
    const rows = mine.map(p => `<button class="lrow" ${goAttr('proHome', { id: p.id })}><span class="icon-btn line">${ico('shield')}</span><span class="tx"><b>${esc(p.name)}</b><small>${esc((PROV_STATUS[p.status] || PROV_STATUS.verified)[0])} · ${Providers.ownerOf(p.id) ? 'owner' : 'staff'}</small></span>${ico('chev')}</button>`).join('')
      + (mine.length ? '' : `<button class="lrow" ${goAttr('proInfo')}><span class="icon-btn line">${ico('shield')}</span><span class="tx"><b>Become a provider</b><small>List courses, guided days and trips</small></span>${ico('chev')}</button>`)
      + (q >= 0 ? `<button class="lrow" ${goAttr('proReview')}><span class="icon-btn line">${ico('check')}</span><span class="tx"><b>Review providers</b><small>${q ? `${q} waiting` : 'All caught up'} · EXTour team</small></span>${q ? `<span class="badge-n">${q}</span>` : ico('chev')}</button>` : '');
    g.insertAdjacentHTML('afterbegin', rows);
  },
  paStart: () => { if (!Session.id) { toast('Sign in first, then apply'); return; } const app = Providers.myApplication(); if (app) { push('proHome', { id: app.id }); return; } UI.pa = paNew(); push('proApply'); },
  paEdit: id => { const p = Store.get('providers', id); if (!p) return; UI.pa = paFromProvider(p); push('proApply'); },
  paSet: arg => { const [k, ...r] = arg.split(':'); UI.pa[k] = r.join(':'); if (UI.pa.errors) delete UI.pa.errors[k === 'destination_id' ? 'dest' : k]; render('none'); },
  paSport: id => { const F = UI.pa; F.sports = F.sports.includes(id) ? F.sports.filter(x => x !== id) : [...F.sports, id]; render('none'); },
  paLang: l => { const F = UI.pa; F.languages = F.languages.includes(l) ? F.languages.filter(x => x !== l) : [...F.languages, l]; render('none'); },
  paOfferAdd: () => { if (UI.pa.offers.length < 4) UI.pa.offers.push({ title: '', detail: '', price: '' }); render('none'); },
  paCertDel: i => { UI.pa.certs.splice(+i, 1); render('none'); },
  paStep: d => {
    const F = UI.pa;
    if (+d < 0) { F.step = Math.max(0, F.step - 1); F.errors = {}; render('pop'); return; }
    F.errors = F.verified ? {} : Providers.validate(F, F.step); if (F.verified && F.step === 0 && !F.destination_id) F.errors = { dest: 'Pick where you work.' };
    if (Object.keys(F.errors).length) { render('none'); const e = $('.err'); if (e) e.scrollIntoView({ block: 'center' }); return; }
    F.step++; render('push');
  },
  paSubmit: () => {
    const F = UI.pa; F.errors = Providers.validate(F, 2); if (F.verified) delete F.errors.terms;
    if (Object.keys(F.errors).length) { render('none'); return; }
    run(async () => { const id = await Providers.apply(F); const wasEdit = F.editId; UI.pa = null; const st = UI.stacks[UI.tab]; while (st.length > 1 && ['proApply', 'proInfo', 'proHome'].includes(st[st.length - 1].s)) st.pop(); push('proHome', { id }); return wasEdit; },
      r => r ? (Store.get('providers', r) || {}).status === 'verified' ? 'Page updated' : 'Sent again. We will look at it soon.' : 'Application sent. We usually answer within 2 working days.');
  },
  pvApprove: id => run(async () => { await Providers.review(id, 'verified'); }, 'Verified. They can list paid experiences now.'),
  pvDecide: arg => { const [id, d] = arg.split(':'), P = Store.get('providers', id);
    openSheet(`<div class="sbody"><div><h3>${d === 'changes' ? 'Ask for changes' : P.status === 'verified' ? 'Remove verification?' : 'Decline application?'}</h3><p class="sub">${d === 'changes' ? 'They see this note and can send the application again.' : 'They see this note. Their page stays hidden.'}</p></div><div class="field" style="padding:0"><label for="pvnote">Note to ${esc(P.name)}</label><textarea class="inp" id="pvnote" rows="3" maxlength="400" placeholder="${d === 'changes' ? 'Please add a photo of your AIDA instructor card and your insurance provider.' : 'We could not confirm the qualifications listed.'}"></textarea></div><button class="btn btn-primary" ${d === 'changes' ? '' : 'style="background:var(--bad);color:#fff"'} data-act="pvDecideDo" data-arg="${arg}">${d === 'changes' ? 'Send note' : 'Decline'}</button><button class="btn btn-secondary" data-act="closeSheet">Cancel</button></div>`); },
  pvDecideDo: arg => { const [id, d] = arg.split(':'), note = (($('#pvnote') || {}).value || '').trim(); run(async () => { await Providers.review(id, d, note); closeSheet(); }, d === 'changes' ? 'Sent. It is back with them.' : 'Declined. They have been told.'); },
  pvStaffDel: id => run(() => Providers.removeStaff(id), 'Removed from the team'),
  startProFor: id => { const pr = Store.get('providers', id); if (!pr) return; A.startPro(); if (UI.cf && UI.cf.provider_id !== id) { A.cf(`provider_id:${id}`); } }
});

/* staff form + certificate upload */
document.addEventListener('submit', e => {
  const f = e.target; if (f.dataset.form !== 'pvStaff') return; e.preventDefault(); e.stopPropagation();
  const i = $('#pvstaff'), v = i ? i.value : ''; run(async () => { const P = await Providers.addStaff(f.dataset.arg, v); if (i) i.value = ''; return P; }, P => `${P.name.split(' ')[0]} is on the team now`);
}, true);
document.addEventListener('change', e => {
  if (e.target.id !== 'pacert' || !e.target.files[0]) return; const file = e.target.files[0]; toast('Uploading certificate…');
  run(async () => { const ref = await Media.upload(file, 'certificate'); UI.pa.certs.push(ref); render('none'); }, 'Certificate added');
});
