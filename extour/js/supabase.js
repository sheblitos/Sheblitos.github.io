/* =====================================================================
   EXTour on Supabase
   Active only when js/config.js has supabaseUrl + supabaseAnonKey and
   supabase-js is loaded. Otherwise the prototype adapters run as before.
   - SupabaseAdapter: same 4 methods as LocalAdapter/CloudAdapter
   - Real sign-in: 6-digit email code (signInWithOtp/verifyOtp), Google
   - Writes the database owns (full status, waitlist offers, expiry) are
     skipped here because triggers in supabase/schema.sql do them.
   ===================================================================== */
'use strict';

const SB_CONF = window.EXTOUR_CONFIG || {};
const SupabaseBoot = {
  enabled: () => !!(SB_CONF.supabaseUrl && SB_CONF.supabaseAnonKey && window.supabase && window.supabase.createClient),
  sb: null,
  async start() {
    const sb = SupabaseBoot.sb = window.supabase.createClient(SB_CONF.supabaseUrl, SB_CONF.supabaseAnonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
    Store.adapter = SupabaseAdapter;
    const { data } = await sb.auth.getSession();
    Session.viewerId = data.session ? data.session.user.id : null;
    await SupabaseAdapter.load(sb);
    await SupabaseBoot.checkAdmin();
    Store.status = 'ready';
    Session.restore();
    document.documentElement.classList.add('live-mode');
    sb.auth.onAuthStateChange((ev, session) => {
      Session.viewerId = session ? session.user.id : null;
      if (ev === 'SIGNED_IN') SupabaseBoot.checkAdmin().then(() => scheduleRender());
      if (ev === 'SIGNED_IN' && !Session.me) { Session.restore(); if (!Session.me && session) SupabaseBoot.toOnboarding(session.user.email); else render('tab'); }
      if (ev === 'SIGNED_OUT') { Session.signOut(); render('tab'); }
    });
    if (data.session && !Session.me) SupabaseBoot.toOnboarding(data.session.user.email);
  },
  async checkAdmin() { if (!Session.viewerId) { Session.admin = false; return; } const { data } = await SupabaseBoot.sb.rpc('is_admin'); Session.admin = !!data; },
  toOnboarding(email) {
    UI.ob = { step: 0, email, first: '', last: '', username: '', userTouched: false, photoData: null, home: 'barcelona', homeOther: '', languages: ['English'], sports: {}, notes: {}, goals: new Set(['Find buddies', 'Join adventures']), community: true, adult: false, terms: false, errors: {} };
    UI.tab = 'explore'; UI.stacks.explore = [{ s: 'explore' }, { s: 'onboarding' }]; render('push');
  }
};

const SERVER_OWNED = (t, patch) =>
  (t === 'adventures' && Object.keys(patch).every(k => k === 'status' || k === 'updated_at') && ['full', 'published'].includes(patch.status)) ||
  (t === 'adventure_participants' && (patch.status === 'offered' || 'offer_expired_at' in patch));

const SupabaseAdapter = {
  mode: 'supabase', label: 'EXTour cloud', sb: null,
  async load(sb) {
    this.sb = sb;
    await Promise.all(TABLES.map(async t => {
      const rows = []; let from = 0;
      for (;;) { const { data, error } = await sb.from(t).select('*').range(from, from + 999); if (error) { console.warn('load', t, error.message); break; } rows.push(...data); if (data.length < 1000) break; from += 1000; }
      Store.t[t] = new Map(rows.map(r => [r.id, r]));
    }));
    sb.channel('extour-db').on('postgres_changes', { event: '*', schema: 'public' }, p => {
      const t = p.table; if (!Store.t[t]) return;
      if (p.eventType === 'DELETE') Store.t[t].delete(p.old.id); else Store.t[t].set(p.new.id, p.new);
      Store.changed();
    }).subscribe();
  },
  async check(res) { if (res.error) { const e = new Error(res.error.message); e.code = res.error.code; throw e; } },
  async put(t, row) { if (SERVER_OWNED(t, row)) return; return this.check(await this.sb.from(t).upsert(row)); },
  async patch(t, id, patch) { if (SERVER_OWNED(t, patch)) return; return this.check(await this.sb.from(t).update(patch).eq('id', id)); },
  async del(t, id) { return this.check(await this.sb.from(t).delete().eq('id', id)); }
};

/* Waitlist offers and expiry happen in the database (triggers + cron). */
if (SupabaseBoot.enabled()) {
  /* Only the signed-in account decides who you are, never a saved id. */
  Session.restore = function () { this._id = null; if (this.viewerId) { const own = Store.find('profiles', p => p.auth_id === this.viewerId); if (own) this._id = own.id; } };
  if (typeof Waitlist !== 'undefined') { Waitlist.offerNext = async () => {}; Waitlist.sweep = async () => {}; }
  /* "Would go again" is private; read counts through the again_stats function. */
  if (typeof Trust !== 'undefined') {
    const again = new Map(), asked = new Set();
    Trust.again = pid => {
      if (!asked.has(pid)) { asked.add(pid); SupabaseBoot.sb && SupabaseBoot.sb.rpc('again_stats', { pid }).then(({ data }) => { const r = data && data[0]; again.set(pid, r && +r.total ? { yes: +r.yes, count: +r.total } : null); scheduleRender(); }); }
      return again.get(pid) || null;
    };
  }

  /* Real email codes */
  Object.assign(A, {
    authSend: async () => {
      const S = UI.auth, i = $('#authEmail'); if (i) S.email = i.value.trim();
      if (!AuthFlow.validEmail(S.email)) { S.err = 'Enter a valid email, like you@example.com'; render('none'); return; }
      S.err = ''; S.sending = true; render('none');
      const { error } = await SupabaseBoot.sb.auth.signInWithOtp({ email: S.email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname } });
      S.sending = false;
      if (error) { S.err = /rate/i.test(error.message) ? 'Too many codes in a short time. Wait a minute and try again.' : 'We could not send the code. Check the email and try again.'; render('none'); return; }
      AuthFlow.pending = { email: S.email, code: '', sentAt: Date.now() }; S.code = ''; S.stage = 'code'; render('none');
    },
    authResend: () => A.authSend(),
    authVerify: async () => {
      const S = UI.auth, i = $('#authCode'); if (i) S.code = i.value.replace(/\D/g, '');
      if (S.code.length !== 6) { S.err = 'Enter the 6 digits from the email'; render('none'); return; }
      const { data, error } = await SupabaseBoot.sb.auth.verifyOtp({ email: S.email, token: S.code, type: 'email' });
      if (error) { S.err = /expired/i.test(error.message) ? 'This code has expired. Send a new one.' : 'That code does not match. Check the latest email.'; S.code = ''; render('none'); return; }
      clearInterval(UI.authTimer);
      Session.viewerId = data.user.id; Session.restore();
      if (Session.me) { Session._id && Session.signInAs(Session._id); render('tab'); toast(`Welcome back, ${Session.me.name.split(' ')[0]}`); }
      else SupabaseBoot.toOnboarding(data.user.email);
    },
    authGoogle: async () => { const { error } = await SupabaseBoot.sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } }); if (error) toast('Google sign-in is not available yet.'); },
    signOut: async () => { closeSheet(); await SupabaseBoot.sb.auth.signOut(); Session.admin = false; Session.signOut(); render('tab'); }
  });

  /* Live mode screens: no demo accounts, real code delivery, Google when configured */
  const _welcome = SCREENS.welcome;
  SCREENS.welcome = () => { const out = _welcome(); out.body = out.body.replace(/<section class="sec">[\s\S]*?Just looking\?[\s\S]*?<\/section>/, '').replace(/<p class="muted pad" style="font-size:12.5px;margin-top:16px">Data:[\s\S]*?<\/p>/, '');
    if (SB_CONF.google) out.body = out.body.replace(/<button class="btn btn-secondary" disabled aria-disabled="true"><span class="g-mark"[\s\S]*?<\/button>/, '<button class="btn btn-secondary" data-act="authGoogle"><span class="g-mark" aria-hidden="true">G</span>Continue with Google</button>');
    return out; };
  const _auth = SCREENS.auth;
  SCREENS.auth = () => { const out = _auth(); out.body = out.body.replace(/<div class="pad" style="margin-top:14px"><div class="lock-note">[\s\S]*?<\/div><\/div>/, '');
    if (UI.auth && UI.auth.sending) out.cta = '<button class="btn btn-primary btn-block" disabled>Sending…</button>'; return out; };
}
