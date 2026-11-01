/* =====================================================================
   EXTour accounts: sign up, sign in, onboarding, profile editing.
   Identity is behind AuthFlow. In the Supabase build:
     sendCode  -> supabase.auth.signInWithOtp({ email })
     verify    -> supabase.auth.verifyOtp({ email, token, type: 'email' })
     google    -> supabase.auth.signInWithOAuth({ provider: 'google' })
   Email addresses never go into the shared profiles table. In Supabase
   they live in auth.users; in this prototype, in this device only.
   ===================================================================== */
'use strict';

const LANGS = ['English', 'Spanish', 'Catalan', 'Arabic', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Polish', 'Swedish', 'Japanese'];
const NOTE_HINT = { freediving: 'e.g. AIDA 3, PB 28 m', climbing: 'e.g. leads 6b, seconds 6c', surfing: 'e.g. green waves, 7’4 board', kitesurfing: 'e.g. riding upwind, IKO 2', hiking: 'e.g. 1,500 m days', scuba: 'e.g. PADI Advanced, 40 dives' };
const VISIBILITY = [['everyone', 'Everyone on EXTour'], ['connections', 'People I have done adventures with'], ['private', 'Only me']];

const AuthFlow = {
  regKey: 'extour.v2.accounts', pending: null,
  registry() { try { return JSON.parse(ls(this.regKey) || '{}'); } catch (e) { return {}; } },
  save(r) { try { localStorage.setItem(this.regKey, JSON.stringify(r)); } catch (e) {} },
  validEmail: e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim()),
  sendCode(email) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.pending = { email: email.trim().toLowerCase(), code, expires: Date.now() + 10 * 60e3, sentAt: Date.now(), tries: 0 };
    return code;
  },
  verify(code) {
    const P = this.pending;
    if (!P) return { error: 'Send yourself a code first.' };
    if (Date.now() > P.expires) return { error: 'This code has expired. Send a new one.' };
    if (++P.tries > 5) return { error: 'Too many tries. Send a new code.' };
    if (String(code).replace(/\D/g, '') !== P.code) return { error: 'That code does not match. Check the latest email.' };
    this.pending = null;
    const acc = this.registry()[P.email];
    return { email: P.email, account: acc && Store.get('profiles', acc.profile_id) ? acc : null };
  },
  link(email, profileId, provider = 'email') { const r = this.registry(); r[email] = { profile_id: profileId, provider, created_at: nowIso() }; this.save(r); },
  unlink(profileId) { const r = this.registry(); Object.keys(r).forEach(k => { if (r[k].profile_id === profileId) delete r[k]; }); this.save(r); },
  forProfile(pid) { const r = this.registry(), e = Object.keys(r).find(k => r[k].profile_id === pid); return e ? { email: e, ...r[e] } : null; }
};

const Username = {
  clean: s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_.]/g, '').slice(0, 20),
  valid: u => /^[a-z0-9_.]{3,20}$/.test(u),
  taken: (u, except) => Store.all('profiles').some(p => p.id !== except && (p.username || '').toLowerCase() === u),
  suggest(first, last, except) { const base = Username.clean(first + (last ? '.' + last : '')) || 'adventurer'; let u = base.length >= 3 ? base : base + 'xt', n = 2; while (Username.taken(u, except)) u = base.slice(0, 17) + n++; return u; },
  check(u, except) { if (!u) return ['bad', 'Pick a username']; if (!Username.valid(u)) return ['bad', '3 to 20 letters, numbers, dots or underscores']; if (Username.taken(u, except)) return ['bad', 'Already taken']; return ['ok', 'Available']; }
};
/* Public name: first name plus last initial, so strangers do not see a full name. */
const displayName = (first, last) => `${String(first || '').trim()}${last && last.trim() ? ' ' + last.trim()[0].toUpperCase() + '.' : ''}`;
const splitName = P => { if (P.first_name != null) return [P.first_name, P.last_name || '']; const [f, ...r] = String(P.name || '').split(' '); return [f || '', r.join(' ')]; };
const isDemoProfile = pid => !AuthFlow.forProfile(pid) && !(Q.prof(pid) || {}).auth_id;
const canSeeAdventures = P => {
  if (!P || P.id === Session.id) return true;
  const v = P.visibility_upcoming || 'everyone'; if (v === 'everyone') return true; if (v === 'private') return false;
  return Store.all('adventures').some(a => { const g = Q.goingIds(a); return g.includes(P.id) && g.includes(Session.id); });
};
function completeness(P) {
  const items = [['photo', 'Add a photo', !!P.avatar], ['bio', 'Write a short bio', !!(P.bio || '').trim()], ['sports', 'Add your sports', Q.userSports(P.id).length > 0], ['languages', 'Add languages', (P.languages || []).length > 0], ['home', 'Set where you are based', !!(P.home_destination_id || P.home_location)], ['note', 'Add a highlight like a PB or grade', !!(P.note || '').trim() || Q.userSports(P.id).some(u => (u.note || '').trim())]];
  const done = items.filter(i => i[2]).length;
  return { pct: Math.round(done / items.length * 100), missing: items.filter(i => !i[2]).map(i => i[1]) };
}
function completenessCard(P) {
  const c = completeness(P); if (c.pct === 100) return '';
  return `<button class="complete" data-act="editProfile"><span class="row between"><b>Profile ${c.pct}% complete</b><span class="pill lime">Finish</span></span><span class="bar"><i style="width:${c.pct}%"></i></span><small>${esc(c.missing.slice(0, 2).join(' · '))}. Hosts approve complete profiles faster.</small></button>`;
}

/* ---------------------------------------------------------------------
   Profiles: full create, notes, delete
   --------------------------------------------------------------------- */
Profiles.createFull = async f => {
  const first = f.first.trim(), last = (f.last || '').trim(), username = Username.clean(f.username);
  Policy.assert(first, 'Add your first name');
  Policy.assert(Username.valid(username) && !Username.taken(username), 'Pick another username');
  Policy.assert(f.adult && f.terms, 'Confirm you are 18 or older and agree to the community rules');
  const id = uid('p'), at = nowIso(), d = Q.dest(f.home);
  let avatar = null;
  if (f.photoData) { const mid = uid('md'); await Store.put('media', { id: mid, owner_id: id, kind: 'avatar', data: f.photoData.data, w: f.photoData.w, h: f.photoData.h, created_at: at }); avatar = 'media:' + mid; }
  const p = { id, username, first_name: first, last_name: last, name: displayName(first, last), avatar, bio: '', note: '',
    home_destination_id: f.home || null, home_location: d ? `${d.name}, ${d.country}` : (f.homeOther || '').trim(),
    current_destination_id: f.home || null, location_sharing: !!f.community, visibility_upcoming: 'everyone',
    languages: f.languages, roles: ['traveler'], verified: f.email ? ['email'] : [], auth_id: Session.viewerId || null,
    goals: [...(f.goals || [])], terms_accepted_at: at, adult_confirmed_at: at, created_at: at };
  await Store.put('profiles', p);
  for (const [sid, level] of Object.entries(f.sports)) await Store.put('user_sports', { id: `us_${id}_${sid}`, profile_id: id, sport_id: sid, level, note: (f.notes[sid] || '').trim() });
  if (f.email) AuthFlow.link(f.email, id, 'email');
  Session.signInAs(id);
  Analytics.track('signup_completed', { method: f.email ? 'email' : 'local' });
  Analytics.track('onboarding_completed', { sports: Object.keys(f.sports).length, goals: (f.goals || []).length, photo: !!avatar });
  return p;
};
Profiles.saveAll = async (pid, E) => {
  Policy.assert(Policy.canEditProfile(pid), 'You can only edit your own profile');
  const first = E.first.trim(), last = E.last.trim(), username = Username.clean(E.username);
  Policy.assert(first, 'Add your first name');
  const uc = Username.check(username, pid); Policy.assert(uc[0] === 'ok', `Username: ${uc[1]}`);
  let avatar = E.photo;
  if (E.photoData) { const mid = uid('md'); await Store.put('media', { id: mid, owner_id: pid, kind: 'avatar', data: E.photoData.data, w: E.photoData.w, h: E.photoData.h, created_at: nowIso() }); avatar = 'media:' + mid; }
  const d = Q.dest(E.home);
  await Store.patch('profiles', pid, { first_name: first, last_name: last, name: displayName(first, last), username, avatar, bio: E.bio.trim().slice(0, 280), note: E.note.trim().slice(0, 40),
    home_destination_id: E.home || null, home_location: d ? `${d.name}, ${d.country}` : E.homeOther.trim(), current_destination_id: E.current || null,
    location_sharing: !!E.community, languages: E.languages, visibility_upcoming: E.visibility });
  await Profiles.setSports(pid, E.sports);
  for (const [sid, note] of Object.entries(E.notes)) { const r = Store.get('user_sports', `us_${pid}_${sid}`); if (r && (r.note || '') !== note.trim()) await Store.patch('user_sports', r.id, { note: note.trim().slice(0, 40) }); }
};
Profiles.remove = async pid => {
  Policy.assert(Policy.canEditProfile(pid), 'You can only delete your own account');
  Policy.assert(!isDemoProfile(pid), 'Demo accounts cannot be deleted');
  for (const a of Store.filter('adventures', a => a.host_id === pid && ['published', 'full'].includes(Q.status(a)))) await Adventures.cancel(a.id, 'The host deleted their account.');
  for (const r of Store.filter('adventure_participants', r => r.profile_id === pid && ['requested', 'approved'].includes(r.status))) await Store.patch('adventure_participants', r.id, { status: 'cancelled', updated_at: nowIso() });
  for (const t of ['user_sports', 'saved_items', 'conversation_members', 'notifications']) for (const r of Store.filter(t, r => r.profile_id === pid)) await Store.del(t, r.id);
  for (const m of Store.filter('media', m => m.owner_id === pid)) await Store.del('media', m.id);
  await Store.del('profiles', pid);
  AuthFlow.unlink(pid); Session.signOut();
};

/* ---------------------------------------------------------------------
   Screens
   --------------------------------------------------------------------- */
const demoList = () => ['p_shebl', 'p_marta', 'p_luca', 'p_freya', 'p_leila'].map(Q.prof).filter(Boolean);
SCREENS.welcome = () => ({ nav: false, body: `<div class="welcome">
  <div class="w-hero">${art('photos/boat-crew.jpg')}<span class="shade"></span><div class="w-tx"><span class="brand" style="color:#FAFAF7">${MARK(30)}<span class="wm"><b>EX</b>Tour</span></span><h1>Find your next adventure, and the people to share it with.</h1></div></div>
  <div class="pad" style="display:grid;gap:10px;margin-top:20px">
    <button class="btn btn-primary" data-act="authStart" data-arg="signup">Create an account</button>
    <button class="btn btn-secondary" disabled aria-disabled="true"><span class="g-mark" aria-hidden="true">G</span>Continue with Google<small class="soon">At launch</small></button>
    <p style="text-align:center;font-size:14px;margin-top:4px">Already on EXTour? <button class="btn-link" data-act="authStart" data-arg="signin">Sign in</button></p>
  </div>
  <section class="sec">${secH('Just looking?', 'Explore with a demo account. Switch any time from Profile.')}
    <div class="group">${demoList().map(p => `<button class="lrow" data-act="signInAs" data-arg="${p.id}">${avatar(p.id, 44)}<span class="tx"><b>${esc(p.name)}</b><small>${esc(p.home_location || '')} · ${Q.userSports(p.id).slice(0, 2).map(u => `${LEVELS[u.level]} ${esc((Q.sport(u.sport_id) || {}).name || '').toLowerCase()}`).join(', ')}</small></span>${ico('chev')}</button>`).join('')}</div></section>
  <p class="muted pad" style="font-size:12.5px;margin-top:16px">Data: ${esc(Store.adapter.label)}.${Store.adapter.mode === 'cloud' ? ' Changes are shared with everyone who has this link.' : ' Changes stay in this browser.'}</p></div>` });

SCREENS.auth = () => {
  const S = UI.auth, signup = S.mode === 'signup';
  if (S.stage === 'email') return { nav: false, cta: `<button class="btn btn-primary btn-block" data-act="authSend">Send me a code</button>`, body: `
    <div class="topbar">${backBtn()}<h1></h1></div>
    <div class="ob-q" style="padding-top:8px"><h1>${signup ? 'Create your account' : 'Welcome back'}</h1><p>${signup ? 'We send a 6-digit code to your email. No password to remember.' : 'Enter the email you signed up with and we send you a code.'}</p></div>
    <form class="field" data-form="authEmail" novalidate><label for="authEmail">Email</label><input class="inp ${S.err ? 'bad' : ''}" id="authEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="you@example.com" value="${esc(S.email)}">${S.err ? `<span class="err">${ico('info')}${esc(S.err)}</span>` : ''}</form>
    <p class="muted pad" style="font-size:12.5px;margin-top:14px">By continuing you agree to the <button class="btn-link" data-act="rulesSheet" style="font-size:12.5px">community rules</button>. We never show your email to other people.</p>
    <p class="pad" style="font-size:14px;margin-top:18px">${signup ? 'Already have an account?' : 'New to EXTour?'} <button class="btn-link" data-act="authStart" data-arg="${signup ? 'signin' : 'signup'}">${signup ? 'Sign in' : 'Create an account'}</button></p>`,
    after: v => { const i = $('#authEmail', v); if (i) { i.focus(); i.oninput = () => { S.email = i.value; }; } } };
  const left = Math.max(0, 30 - Math.floor((Date.now() - (AuthFlow.pending ? AuthFlow.pending.sentAt : 0)) / 1000));
  return { nav: false, cta: `<button class="btn btn-primary btn-block" data-act="authVerify">${signup ? 'Continue' : 'Sign in'}</button>`, body: `
    <div class="topbar"><button class="icon-btn line" data-act="authEdit" aria-label="Change email">${ico('back')}</button><h1></h1></div>
    <div class="ob-q" style="padding-top:8px"><h1>Check your email</h1><p>We sent a 6-digit code to <b>${esc(S.email)}</b>. It works for 10 minutes.</p></div>
    <div class="pad" style="margin-top:14px"><div class="lock-note">${ico('info')}<span><b>Test version:</b> email sending connects at launch. Your code is <b class="tnum" style="letter-spacing:.12em">${AuthFlow.pending ? AuthFlow.pending.code : ''}</b>.</span></div></div>
    <form class="field" data-form="authCode" novalidate><label for="authCode">Code</label><input class="inp otp ${S.err ? 'bad' : ''}" id="authCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" value="${esc(S.code)}">${S.err ? `<span class="err">${ico('info')}${esc(S.err)}</span>` : ''}</form>
    <div class="pad row" style="margin-top:14px;gap:16px"><button class="btn-link" data-act="authResend" id="resendBtn" ${left ? 'disabled' : ''}>${left ? `Resend in ${left}s` : 'Send a new code'}</button><button class="btn-link" data-act="authEdit">Use another email</button></div>`,
    after: v => { const i = $('#authCode', v); if (i) { i.focus(); i.oninput = () => { S.code = i.value.replace(/\D/g, '').slice(0, 6); if (S.code !== i.value) i.value = S.code; if (S.code.length === 6) A.authVerify(); }; }
      clearInterval(UI.authTimer); UI.authTimer = setInterval(() => { const b = $('#resendBtn'); if (!b) return clearInterval(UI.authTimer); const l = Math.max(0, 30 - Math.floor((Date.now() - (AuthFlow.pending ? AuthFlow.pending.sentAt : 0)) / 1000)); b.disabled = !!l; b.textContent = l ? `Resend in ${l}s` : 'Send a new code'; if (!l) clearInterval(UI.authTimer); }, 1000); } };
};

SCREENS.onboarding = () => {
  const O = UI.ob, step = O.step, E = O.errors || {}, picked = Object.keys(O.sports), N = 5;
  const err = k => E[k] ? `<span class="err">${ico('info')}${E[k]}</span>` : '';
  const head = `<div class="ob-top">${step > 0 ? `<button class="icon-btn line" data-act="obStep" data-arg="-1" aria-label="Back">${ico('back')}</button>` : backBtn()}<div class="progress"><i style="width:${(step + 1) / N * 100}%"></i></div><span class="mono muted">${step + 1}/${N}</span></div>`;
  let body = '', cta = `<button class="btn btn-primary btn-block" data-act="obStep" data-arg="1">Continue</button>`;
  if (step === 0) {
    const uc = Username.check(Username.clean(O.username));
    body = `<div class="ob-q"><h1>Who are you?</h1><p>Hosts see this when you ask to join. Only your first name and last initial are public.</p></div>
      <div class="field" style="justify-items:start"><label class="avatar-up" for="obphoto">${O.photoData ? `<img src="${O.photoData.data}" alt="">` : `${ico('plus')}<span>Photo</span>`}</label><input type="file" id="obphoto" accept="image/*" hidden><span class="hint">Optional. A clear face photo gets more approvals.</span></div>
      <div class="field two-col"><div><label for="obfirst">First name</label><input class="inp ${E.first ? 'bad' : ''}" id="obfirst" autocomplete="given-name" maxlength="30" value="${esc(O.first)}"></div><div><label for="oblast">Last name <span style="font-weight:600">Optional</span></label><input class="inp" id="oblast" autocomplete="family-name" maxlength="30" value="${esc(O.last)}"></div></div>${err('first')}
      <div class="field"><label for="obuser">Username</label><div class="uname"><span>@</span><input class="inp ${E.username ? 'bad' : ''}" id="obuser" autocapitalize="off" spellcheck="false" maxlength="20" value="${esc(O.username)}"></div><span class="uname-st ${uc[0]}" id="obuserSt">${O.username ? uc[1] : 'Letters, numbers, dots or underscores'}</span>${err('username')}</div>
      <p class="pad muted" style="font-size:13px;margin-top:10px">Shown as <b id="obShown">${esc(displayName(O.first, O.last) || 'your name')}</b></p>`;
  }
  if (step === 1) {
    body = `<div class="ob-q"><h1>Where are you based?</h1><p>We show what is happening near you first.</p></div>
      <div class="field"><div class="chips">${Q.destsSorted().map(d => `<button class="chip" aria-pressed="${O.home === d.id}" data-act="ob" data-arg="home:${d.id}">${esc(d.name)}</button>`).join('')}<button class="chip" aria-pressed="${O.home === ''}" data-act="ob" data-arg="home:">Somewhere else</button></div>
        ${O.home === '' ? `<input class="inp ${E.home ? 'bad' : ''}" id="obhome" maxlength="50" placeholder="City and country, e.g. Lyon, France" value="${esc(O.homeOther)}">` : ''}${err('home')}</div>
      <div class="field"><span class="lab">Languages you speak</span><div class="chips">${[...new Set([...LANGS, ...O.languages])].map(l => `<button class="chip" aria-pressed="${O.languages.includes(l)}" data-act="obLang" data-arg="${esc(l)}">${esc(l)}</button>`).join('')}</div>
        <div class="row" style="gap:8px"><input class="inp" id="oblangadd" maxlength="24" placeholder="Another language" style="flex:1"><button class="btn btn-secondary btn-sm" data-act="obLangAdd">Add</button></div>${err('languages')}</div>`;
  }
  if (step === 2) {
    body = `<div class="ob-q"><h1>What are you into?</h1><p>Pick what you do and what you want to try.</p></div><div class="field"><div class="sport-grid">${Q.sportsActive().map(s => `<button class="sport-pick" style="${sportStyle(s)}" aria-pressed="${s.id in O.sports}" data-act="obSport" data-arg="${s.id}"><span class="ic">${ico(s.icon, 24)}</span>${esc(s.name)}</button>`).join('')}</div>${err('sports')}</div>`;
    cta = `<button class="btn btn-primary btn-block" data-act="obStep" data-arg="1" ${picked.length ? '' : 'disabled'}>Continue${picked.length ? ` with ${picked.length}` : ''}</button>`;
  }
  if (step === 3) {
    body = `<div class="ob-q"><h1>How far along are you?</h1><p>Be honest. It decides who you are matched with, and it matters for safety.</p></div>
      <div class="pad" style="margin-top:8px">${picked.map(k => `<div class="ob-lv"><span class="row">${stag(k)}</span><div class="chips">${LEVELS.map((l, i) => `<button class="chip" aria-pressed="${O.sports[k] === i}" data-act="obLevel" data-arg="${k}:${i}">${l}</button>`).join('')}</div>
        ${O.sports[k] >= 1 ? `<input class="inp" id="obnote-${k}" maxlength="40" placeholder="Optional: ${esc(NOTE_HINT[k] || 'a certification or highlight')}" value="${esc(O.notes[k] || '')}">` : ''}</div>`).join('')}</div>`;
  }
  if (step === 4) {
    const goals = [['Find buddies', 'users'], ['Discover destinations', 'globe'], ['Join adventures', 'cal'], ['Learn a sport', 'level'], ['Find instructors', 'shield'], ['Travel for adventure', 'route']];
    body = `<div class="ob-q"><h1>Almost there</h1><p>What are you looking for? Pick as many as you like.</p></div>
      <div class="field"><div class="chips">${goals.map(([g, i]) => `<button class="chip" aria-pressed="${O.goals.has(g)}" data-act="obGoal" data-arg="${g}">${ico(i)}${g}</button>`).join('')}</div></div>
      <div class="field"><span class="lab">Privacy</span><label class="ck"><input type="checkbox" id="obcommunity" ${O.community ? 'checked' : ''}>Show me in the community of places I am in. People can see my first name, sports and levels.</label></div>
      <div class="field"><span class="lab">Before you start</span>
        <label class="ck"><input type="checkbox" id="obadult" ${O.adult ? 'checked' : ''}>I am 18 or older.</label>
        <label class="ck"><input type="checkbox" id="obterms" ${O.terms ? 'checked' : ''}><span>I agree to the <button type="button" class="btn-link" data-act="rulesSheet">community rules</button>, including that I am responsible for my own safety and honest about my level.</span></label>${err('terms')}</div>`;
    cta = `<button class="btn btn-primary btn-block" data-act="obDone" id="obDoneBtn" ${O.adult && O.terms ? '' : 'disabled'}>Create my profile</button>`;
  }
  return { nav: false, cta, body: head + body, after: v => {
    const bind = (id, fn) => { const el = $('#' + id, v); if (el) el.oninput = () => fn(el.value, el); };
    bind('obfirst', x => { O.first = x; if (!O.userTouched) { O.username = Username.suggest(O.first, O.last); const u = $('#obuser'); if (u) u.value = O.username; } refreshUser(); });
    bind('oblast', x => { O.last = x; if (!O.userTouched) { O.username = Username.suggest(O.first, O.last); const u = $('#obuser'); if (u) u.value = O.username; } refreshUser(); });
    bind('obuser', (x, el) => { O.userTouched = true; O.username = Username.clean(x); if (el.value !== O.username) el.value = O.username; refreshUser(); });
    bind('obhome', x => { O.homeOther = x; });
    v.querySelectorAll('[id^="obnote-"]').forEach(el => el.oninput = () => { O.notes[el.id.slice(7)] = el.value; });
    ['obcommunity', 'obadult', 'obterms'].forEach(id => { const el = $('#' + id, v); if (el) el.onchange = () => { O[id.slice(2)] = el.checked; const b = $('#obDoneBtn'); if (b) b.disabled = !(O.adult && O.terms); }; });
    function refreshUser() { const st = $('#obuserSt'), c = Username.check(O.username); if (st) { st.className = 'uname-st ' + c[0]; st.textContent = c[1]; } const sh = $('#obShown'); if (sh) sh.textContent = displayName(O.first, O.last) || 'your name'; }
  } };
};

SCREENS.editProfile = (p) => {
  const E = UI.ep; if (!E) return notFound('Nothing to edit');
  const P = Session.me, uc = Username.check(Username.clean(E.username), P.id), X = E.errors || {}, acc = AuthFlow.forProfile(P.id), demo = isDemoProfile(P.id);
  const err = k => X[k] ? `<span class="err">${ico('info')}${X[k]}</span>` : '';
  const photoSrc = E.photoData ? E.photoData.data : mediaSrc(E.photo);
  const sec = (title, inner, id = '') => `<section class="ep-sec" ${id ? `id="${id}"` : ''}><h2>${title}</h2>${inner}</section>`;
  return { nav: false, cta: `<button class="btn btn-secondary" data-act="epBack">Cancel</button><button class="btn btn-primary btn-block" data-act="epSave" id="epSave" ${epDirty() ? '' : 'disabled'}>Save changes</button>`, body: `
    <div class="topbar"><button class="icon-btn line" data-act="epBack" aria-label="Back">${ico('back')}</button><h1>Edit profile</h1></div>
    ${sec('Photo', `<div class="row" style="gap:16px"><label class="avatar-up big" for="epphoto">${photoSrc ? `<img src="${esc(photoSrc)}" alt="">` : `${ico('plus')}<span>Photo</span>`}</label><input type="file" id="epphoto" accept="image/*" hidden><span style="display:grid;gap:6px;justify-items:start"><label class="btn btn-secondary btn-sm" for="epphoto">${photoSrc ? 'Change photo' : 'Add a photo'}</label>${photoSrc ? '<button class="btn-link" data-act="epPhotoRemove">Remove</button>' : ''}</span></div>`)}
    ${sec('About you', `<div class="field two-col" style="padding:0"><div><label for="epfirst">First name</label><input class="inp ${X.first ? 'bad' : ''}" id="epfirst" maxlength="30" value="${esc(E.first)}"></div><div><label for="eplast">Last name</label><input class="inp" id="eplast" maxlength="30" value="${esc(E.last)}"></div></div>${err('first')}
      <p class="hint">Shown as <b id="epShown">${esc(displayName(E.first, E.last))}</b></p>
      <div class="field" style="padding:0"><label for="epuser">Username</label><div class="uname"><span>@</span><input class="inp" id="epuser" autocapitalize="off" spellcheck="false" maxlength="20" value="${esc(E.username)}"></div><span class="uname-st ${uc[0]}" id="epuserSt">${uc[1]}</span></div>
      <div class="field" style="padding:0"><label for="epbio">Bio <span style="font-weight:600" id="epbioN">${E.bio.length}/280</span></label><textarea class="inp" id="epbio" maxlength="280" placeholder="What you do, what you are working on, what you want from a session">${esc(E.bio)}</textarea></div>
      <div class="field" style="padding:0"><label for="epnote">Highlight <span style="font-weight:600">Shown under your name</span></label><input class="inp" id="epnote" maxlength="40" placeholder="e.g. AIDA Instructor, PB 38 m" value="${esc(E.note)}"></div>`)}
    ${sec('Where', `<div class="field" style="padding:0"><span class="lab">Based in</span><div class="chips">${Q.destsSorted().map(d => `<button class="chip" aria-pressed="${E.home === d.id}" data-act="ep" data-arg="home:${d.id}">${esc(d.name)}</button>`).join('')}<button class="chip" aria-pressed="${E.home === ''}" data-act="ep" data-arg="home:">Somewhere else</button></div>${E.home === '' ? `<input class="inp" id="ephome" maxlength="50" placeholder="City and country" value="${esc(E.homeOther)}">` : ''}</div>
      <div class="field" style="padding:0"><span class="lab">Right now I am in</span><div class="chips"><button class="chip" aria-pressed="${!E.current || E.current === E.home}" data-act="ep" data-arg="current:">At home</button>${Q.destsSorted().filter(d => d.id !== E.home).map(d => `<button class="chip" aria-pressed="${E.current === d.id}" data-act="ep" data-arg="current:${d.id}">${esc(d.name)}</button>`).join('')}</div></div>
      <label class="ck"><input type="checkbox" id="epcommunity" ${E.community ? 'checked' : ''}>Show me in the community of the place I am in</label>`)}
    ${sec('Languages', `<div class="chips">${[...new Set([...LANGS, ...E.languages])].map(l => `<button class="chip" aria-pressed="${E.languages.includes(l)}" data-act="epLang" data-arg="${esc(l)}">${esc(l)}</button>`).join('')}</div>`)}
    ${sec('Sports and levels', `${Object.keys(E.sports).length ? Object.keys(E.sports).map(k => `<div class="ob-lv"><div class="row between">${stag(k)}<button class="btn-link" data-act="epSportDel" data-arg="${k}" style="font-size:13px">Remove</button></div><div class="chips">${LEVELS.map((l, i) => `<button class="chip" aria-pressed="${E.sports[k] === i}" data-act="epLevel" data-arg="${k}:${i}">${l}</button>`).join('')}</div>${E.sports[k] >= 1 ? `<input class="inp" id="epnote-${k}" maxlength="40" placeholder="Optional: ${esc(NOTE_HINT[k] || 'a certification or highlight')}" value="${esc(E.notes[k] || '')}">` : ''}</div>`).join('') : '<p class="muted" style="font-size:14px">No sports yet.</p>'}
      ${Q.sportsActive().some(s => !(s.id in E.sports)) ? `<div class="field" style="padding:0;margin-top:6px"><span class="lab">Add a sport</span><div class="chips">${Q.sportsActive().filter(s => !(s.id in E.sports)).map(s => `<button class="chip" data-act="epSportAdd" data-arg="${s.id}">${ico('plus')}${esc(s.name)}</button>`).join('')}</div></div>` : ''}
      <p class="hint">Levels are self-declared. Certifications are checked in a later release.</p>`, 'sports')}
    ${sec('Privacy', `<div class="field" style="padding:0"><span class="lab">Who can see your upcoming adventures</span><div style="display:grid;gap:8px">${VISIBILITY.map(([v, t]) => `<button class="choice" aria-pressed="${E.visibility === v}" data-act="ep" data-arg="visibility:${v}"><span class="tx"><b>${t}</b></span><span class="tick">${ico('check')}</span></button>`).join('')}</div></div>
      <p class="hint">Hosts always see your profile, sports and levels when you ask to join. Your email is never shown.</p>`)}
    ${sec('Account', `<div class="sumbox"><div class="r"><span>Signed in with</span><b>${acc ? 'Email code' : demo ? 'Demo account' : 'This device'}</b></div>${acc ? `<div class="r"><span>Email</span><b>${esc(acc.email.replace(/^(.).*(@.*)$/, '$1•••$2'))}</b></div>` : ''}<div class="r"><span>Member since</span><b>${new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(new Date(P.created_at))}</b></div></div>
      <div class="row" style="gap:10px;margin-top:4px"><button class="btn btn-secondary btn-sm" data-act="signOut">${ico('logout')}Sign out</button><button class="btn btn-sm btn-danger-soft" data-act="deleteSheet" ${demo ? 'disabled title="Demo accounts cannot be deleted"' : ''}>${ico('trash')}Delete account</button></div>
      ${demo ? '<p class="hint">Demo accounts are shared by everyone testing EXTour, so they cannot be deleted.</p>' : ''}`)}
    <div style="height:20px"></div>`,
    after: v => {
      const bind = (id, k, extra) => { const el = $('#' + id, v); if (el) el.oninput = () => { E[k] = el.value; extra && extra(el); epMark(); }; };
      bind('epfirst', 'first', () => { const s = $('#epShown'); if (s) s.textContent = displayName(E.first, E.last); });
      bind('eplast', 'last', () => { const s = $('#epShown'); if (s) s.textContent = displayName(E.first, E.last); });
      bind('epuser', 'username', el => { E.username = Username.clean(el.value); if (el.value !== E.username) el.value = E.username; const st = $('#epuserSt'), c = Username.check(E.username, Session.id); if (st) { st.className = 'uname-st ' + c[0]; st.textContent = c[1]; } });
      bind('epbio', 'bio', el => { const n = $('#epbioN'); if (n) n.textContent = `${el.value.length}/280`; });
      bind('epnote', 'note'); bind('ephome', 'homeOther');
      v.querySelectorAll('[id^="epnote-"]').forEach(el => el.oninput = () => { E.notes[el.id.slice(7)] = el.value; epMark(); });
      const c = $('#epcommunity', v); if (c) c.onchange = () => { E.community = c.checked; epMark(); };
      if (p.focus) { const s = $('#' + p.focus, v); if (s) setTimeout(() => s.scrollIntoView({ block: 'start' }), 60); p.focus = null; }
    } };
};
function epSnapshot(P) {
  const [f, l] = splitName(P), us = Q.userSports(P.id);
  return { first: f, last: l, username: P.username || '', bio: P.bio || '', note: P.note || '', photo: P.avatar || null, photoData: null,
    home: P.home_destination_id || '', homeOther: P.home_destination_id ? '' : (P.home_location || ''), current: P.current_destination_id && P.current_destination_id !== P.home_destination_id ? P.current_destination_id : '',
    community: !!P.location_sharing, languages: [...(P.languages || [])], sports: Object.fromEntries(us.map(u => [u.sport_id, u.level])), notes: Object.fromEntries(us.map(u => [u.sport_id, u.note || ''])), visibility: P.visibility_upcoming || 'everyone', errors: {} };
}
const epKey = E => JSON.stringify({ ...E, errors: null, photoData: E.photoData ? E.photoData.data.length : null });
function epDirty() { return UI.ep && UI.ep0 && epKey(UI.ep) !== UI.ep0; }
function epMark() { const b = $('#epSave'); if (b) b.disabled = !epDirty(); }

/* ---------------------------------------------------------------------
   Actions
   --------------------------------------------------------------------- */
const RULES = [['Be honest about your level', 'Matching and safety depend on it. Hosts can decline if a session is beyond you.'], ['You are responsible for your own safety', 'EXTour connects people. It does not check skills or supervise sessions. Agree on a plan before you start.'], ['Show up or cancel early', 'Cancel at least 12 hours before so someone else can take the spot.'], ['Respect hosts, places and locals', 'Leave spots cleaner than you found them and follow local rules.'], ['Keep chats about the adventure', 'No spam, sales or harassment. Report anything that feels wrong.']];
Object.assign(A, {
  authStart: mode => { UI.auth = { mode, stage: 'email', email: (UI.auth && UI.auth.email) || '', code: '', err: '' }; closeSheet(); UI.stacks[UI.tab] = [UI.stacks[UI.tab][0], { s: 'auth' }]; render('push'); },
  authSend: () => { const S = UI.auth, i = $('#authEmail'); if (i) S.email = i.value; if (!AuthFlow.validEmail(S.email)) { S.err = 'Enter a valid email, like you@example.com'; render('none'); return; } S.err = ''; S.code = ''; AuthFlow.sendCode(S.email); S.stage = 'code'; render('none'); },
  authResend: () => { AuthFlow.sendCode(UI.auth.email); UI.auth.code = ''; UI.auth.err = ''; render('none'); toast('New code sent'); },
  authEdit: () => { UI.auth.stage = 'email'; UI.auth.err = ''; clearInterval(UI.authTimer); render('none'); },
  authVerify: () => {
    const S = UI.auth, i = $('#authCode'); if (i) S.code = i.value.replace(/\D/g, '');
    if (S.code.length !== 6) { S.err = 'Enter the 6 digits from the email'; render('none'); return; }
    const r = AuthFlow.verify(S.code); if (r.error) { S.err = r.error; S.code = ''; render('none'); return; }
    clearInterval(UI.authTimer);
    if (r.account) { Session.signInAs(r.account.profile_id); if (!(UI.pendingLink && openDeepLink(UI.pendingLink))) render('tab'); toast(`Welcome back, ${Session.me.name.split(' ')[0]}`); return; }
    if (S.mode === 'signin') toast('No account for this email on this device yet. Let’s create one.');
    UI.ob = { step: 0, email: r.email, first: '', last: '', username: '', userTouched: false, photoData: null, home: curLoc(), homeOther: '', languages: ['English'], sports: {}, notes: {}, goals: new Set(['Find buddies', 'Join adventures']), community: true, adult: false, terms: false, errors: {} };
    UI.stacks[UI.tab] = [UI.stacks[UI.tab][0], { s: 'onboarding' }]; render('push');
  },
  startSignup: () => A.authStart('signup'),
  rulesSheet: () => openSheet(`<div class="sbody"><div><h3>Community rules</h3><p class="sub">Short on purpose. They apply to everyone, hosts included.</p></div><div style="display:grid;gap:12px">${RULES.map(([t, d]) => `<div class="row" style="align-items:flex-start;gap:12px"><span class="icon-btn line" style="width:34px;height:34px;flex:none">${ico('check')}</span><span><b style="font-weight:800">${t}</b><br><span class="muted" style="font-size:13.5px">${d}</span></span></div>`).join('')}</div><button class="btn btn-primary" data-act="closeSheet">Got it</button></div>`),
  obStep: d => {
    const O = UI.ob; d = +d;
    if (d > 0) {
      const e = {};
      if (O.step === 0) { if (!O.first.trim()) e.first = 'Add your first name.'; const c = Username.check(Username.clean(O.username)); if (c[0] !== 'ok') e.username = c[1] + '.'; }
      if (O.step === 1) { if (O.home === '' && !O.homeOther.trim()) e.home = 'Add your city, or pick one of the places above.'; if (!O.languages.length) e.languages = 'Pick at least one language.'; }
      if (O.step === 2 && !Object.keys(O.sports).length) e.sports = 'Pick at least one sport.';
      if (Object.keys(e).length) { O.errors = e; render('none'); return; }
    }
    O.errors = {}; O.step = Math.max(0, Math.min(4, O.step + d)); if (O.step === 0 && !O.username) O.username = Username.suggest(O.first, O.last); render('none'); const v = $('#viewport .view:not(.leaving)'); if (v) v.scrollTop = 0;
  },
  ob: arg => { const [k, v] = arg.split(':'); UI.ob[k] = v; UI.ob.errors = {}; render('none'); },
  obLang: l => { const L = UI.ob.languages; UI.ob.languages = L.includes(l) ? L.filter(x => x !== l) : [...L, l]; render('none'); },
  obLangAdd: () => { const i = $('#oblangadd'), v = i && i.value.trim(); if (v && !UI.ob.languages.includes(v)) UI.ob.languages.push(v.charAt(0).toUpperCase() + v.slice(1)); render('none'); },
  obDone: () => { const O = UI.ob; if (!(O.adult && O.terms)) { O.errors = { terms: 'Tick both boxes to continue.' }; render('none'); return; }
    run(async () => { await Profiles.createFull(O); if (!(UI.pendingLink && openDeepLink(UI.pendingLink))) render('tab'); }, () => `Welcome to EXTour, ${O.first.trim()}`); },
  editProfile: () => { closeSheet(); const P = Session.me; UI.ep = epSnapshot(P); UI.ep0 = epKey(UI.ep); push('editProfile', {}); },
  editSports: () => { closeSheet(); const P = Session.me; UI.ep = epSnapshot(P); UI.ep0 = epKey(UI.ep); push('editProfile', { focus: 'sports' }); },
  ep: arg => { const [k, ...r] = arg.split(':'); UI.ep[k] = r.join(':'); render('none'); },
  epLang: l => { const L = UI.ep.languages; UI.ep.languages = L.includes(l) ? L.filter(x => x !== l) : [...L, l]; render('none'); },
  epLevel: arg => { const [k, i] = arg.split(':'); UI.ep.sports[k] = +i; render('none'); },
  epSportAdd: k => { UI.ep.sports[k] = 0; render('none'); },
  epSportDel: k => { delete UI.ep.sports[k]; delete UI.ep.notes[k]; render('none'); },
  epPhotoRemove: () => { UI.ep.photo = null; UI.ep.photoData = null; render('none'); },
  epBack: () => { if (!epDirty()) return back(); openSheet(`<div class="sbody"><div><h3>Discard your changes?</h3><p class="sub">You edited your profile but did not save.</p></div><button class="btn btn-primary" data-act="epSave">Save changes</button><button class="btn btn-secondary" data-act="epDiscard">Discard</button></div>`); },
  epDiscard: () => { closeSheet(); UI.ep = null; back(); },
  epSave: () => { const E = UI.ep, e = {}; if (!E.first.trim()) e.first = 'Add your first name.'; if (Object.keys(e).length) { E.errors = e; closeSheet(); render('none'); return; }
    run(async () => { await Profiles.saveAll(Session.id, E); closeSheet(); UI.ep = null; back(); }, 'Profile saved'); },
  deleteSheet: () => openSheet(`<div class="sbody"><div><h3>Delete your account?</h3><p class="sub">Your profile, sports, saved items and photos are removed. Adventures you host are cancelled and everyone going is told. This cannot be undone.</p></div><label class="ck"><input type="checkbox" id="delOk" onchange="document.getElementById('delBtn').disabled=!this.checked">I understand this is permanent</label><button class="btn btn-primary" id="delBtn" style="background:var(--bad);color:#fff" data-act="deleteAccount" disabled>Delete my account</button><button class="btn btn-secondary" data-act="closeSheet">Keep my account</button></div>`),
  deleteAccount: () => run(async () => { await Profiles.remove(Session.id); closeSheet(); render('tab'); }, 'Your account was deleted')
});

/* photo pickers for onboarding and edit profile (encoded on the device, saved on submit) */
document.addEventListener('change', e => {
  const t = e.target; if (!(t.id === 'obphoto' || t.id === 'epphoto') || !t.files[0]) return;
  e.stopImmediatePropagation();
  const f = t.files[0]; if (!/^image\//.test(f.type || 'image/')) return toast('Pick a photo, for example a JPEG or PNG');
  Media.encode(f, 360).then(enc => { if (t.id === 'obphoto') UI.ob.photoData = enc; else UI.ep.photoData = enc; render('none'); }).catch(() => toast('This photo format did not open. Try a JPEG or PNG.'));
}, true);
/* Enter in the email or code field submits */
document.addEventListener('submit', e => { const f = e.target.closest('form[data-form]'); if (!f) return; if (f.dataset.form === 'authEmail') { e.preventDefault(); A.authSend(); } if (f.dataset.form === 'authCode') { e.preventDefault(); A.authVerify(); } }, true);
