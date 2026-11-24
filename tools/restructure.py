#!/usr/bin/env python3
"""Step 3: new site structure for Barcelona Freedivers (rebrand branch).

Menu: Beginners course · Courses · Training · Trips · Teams · About, one CTA "Book now" -> /book.
- /freediving-course-barcelona -> /beginners-course (AIDA 1 + 2 combo, EUR 445)
- /packages -> /courses (Courses start at AIDA 2), /courses/aida-1 -> /beginners-course
- /expeditions -> /trips
- Blog + Learn -> /learn (articles move to /learn/<slug>)
- Training pool/open-water -> /training; corporate team page -> /team-building;
  community page -> /about#community; Spanish pages removed
- every booking button says "Book now" and goes to /book?for=<item>
Run once; then run tools/rebrand.py to re-apply the shared header/footer."""
import glob, html, os, re, shutil, subprocess, datetime
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOMAIN = 'https://freedivingbrain.com'
log = []

def git_mv(a, b):
    os.makedirs(os.path.dirname(b) or '.', exist_ok=True)
    subprocess.run(['git', 'mv', a, b], check=True); log.append(f'moved {a} -> {b}')

def rm(p):
    if os.path.isdir(p): shutil.rmtree(p)
    elif os.path.exists(p): os.remove(p)
    else: return
    log.append(f'removed {p}')

BLOG_SLUGS = [os.path.basename(os.path.dirname(p)) for p in glob.glob('blog/*/index.html')]

# ---------- 1. moves / deletions ----------
if os.path.isdir('freediving-course-barcelona'): git_mv('freediving-course-barcelona/index.html', 'beginners-course/index.html')
if os.path.exists('packages.html'): git_mv('packages.html', 'courses/index.html')
if os.path.exists('expeditions.html'): git_mv('expeditions.html', 'trips.html')
for s in BLOG_SLUGS: git_mv(f'blog/{s}/index.html', f'learn/{s}/index.html')
if os.path.exists('blog/index.html'):
    old_learn = open('learn/index.html', encoding='utf-8').read() if os.path.exists('learn/index.html') else ''
    subprocess.run(['git', 'rm', '-q', 'learn/index.html'], check=False)
    git_mv('blog/index.html', 'learn/index.html')
community = open('barcelona/freediving-community/index.html', encoding='utf-8').read() if os.path.exists('barcelona/freediving-community/index.html') else ''
for p in ['courses/aida-1', 'training/pool', 'training/open-water', 'corporate-team-building-barcelona',
          'barcelona', 'es', 'blog', 'freediving-course-barcelona']:
    rm(p)

# ---------- 2. URL map ----------
EXACT = {
    '/packages': '/courses', '/packages.html': '/courses', '/expeditions': '/trips', '/expeditions.html': '/trips',
    '/freediving-course-barcelona': '/beginners-course', '/blog': '/learn', '/courses/aida-1': '/beginners-course',
    '/training/pool': '/training', '/training/open-water': '/training', '/training.html': '/training',
    '/corporate-team-building-barcelona': '/team-building', '/team-building.html': '/team-building',
    '/barcelona/freediving-community': '/about#community', '/programmes': '/team-building',
    '/es/apnea-barcelona': '/', '/es/curso-aida-1-barcelona': '/beginners-course',
    '/es/curso-aida-2-barcelona': '/courses/aida-2', '/es/entrenamiento-apnea-barcelona': '/training',
    '/about.html': '/about', '/faq.html': '/faq', '/index.html': '/',
}
def map_path(path, frag=''):
    p = path.rstrip('/') or '/'
    if p == '/' and frag in ('#booking',): return '/book'
    if p == '/' and frag == '#courses': return '/courses'
    if p in EXACT:
        new = EXACT[p]
        return new if '#' in new else new + frag
    m = re.match(r'^/blog/([^/]+)$', p)
    if m: return f'/learn/{m.group(1)}' + frag
    return None

def resolve(base_file, url):
    """relative url -> absolute site path (no domain)."""
    if url.startswith('/'): return url
    base = '/' + os.path.dirname(base_file)
    parts = [x for x in base.split('/') if x]
    for seg in url.split('/'):
        if seg == '..':
            if parts: parts.pop()
        elif seg in ('.', ''): continue
        else: parts.append(seg)
    return '/' + '/'.join(parts) + ('/' if url.endswith('/') else '')

def remap_links(f, t):
    def href(m):
        q, url = m.group(1), m.group(2)
        if re.match(r'^(https?:|mailto:|tel:|#|data:|javascript:|\{|\$)', url): return m.group(0)
        path, _, frag = url.partition('#'); frag = '#' + frag if frag else ''
        path, _, query = path.partition('?')
        if not path: return m.group(0)
        absu = resolve(f, path)
        if not re.search(r'\.(html?)$|/$|^/[^.]*$', absu): return m.group(0)   # assets
        new = map_path(absu, frag)
        if new is None:
            new = (absu.rstrip('/') or '/') if absu.endswith('/') or absu.endswith('.html') else absu
            new = re.sub(r'/index\.html$', '', new) or '/'
            new = re.sub(r'\.html$', '', new)
            new += frag
        if query: new = new.split('#')[0] + '?' + query + ('#' + new.split('#')[1] if '#' in new else '')
        return f'href={q}{new}{q}'
    t = re.sub(r'href=(["\'])([^"\']*)\1', href, t)
    def dom(m):
        path = m.group(1) or '/'
        new = map_path(path.split('#')[0])
        return DOMAIN + (new if new else path)
    t = re.sub(re.escape(DOMAIN) + r'(/[^"\'\s<>)\\]*)?', dom, t)
    t = re.sub(r'\s*<link rel="alternate" hreflang="[^"]*"[^>]*>', '', t)
    return t

pages = [p for p in glob.glob('**/*.html', recursive=True) if not p.startswith('tools/')]
for f in pages:
    t = open(f, encoding='utf-8').read(); n = remap_links(f, t)
    if n != t: open(f, 'w', encoding='utf-8').write(n)

# courses/index.html moved one level down: make its relative assets absolute
def absolutize(t):
    return re.sub(r'((?:src|srcset|href)=["\']|url\([\'"]?|,\s*)\./', r'\1/', t)
for f in ['courses/index.html']:
    t = open(f).read(); open(f, 'w').write(absolutize(t))

# ---------- 3. booking band replaces the page forms ----------
def band(eyebrow, title, text, item, sid):
    return (f'<!-- BF:BOOK -->\n<section class="bf-book" id="{sid}">\n  <div class="bf-book-inner">\n'
            f'    <p class="bf-book-eyebrow">{eyebrow}</p>\n    <h2>{title}</h2>\n    <p>{text}</p>\n'
            f'    <a href="/book?for={item}" class="bf-btn">Book now</a>\n'
            '    <p class="bf-book-alt">Prefer to talk first? <a href="https://wa.me/34603083325" target="_blank" rel="noopener">Message us on WhatsApp</a></p>\n'
            '  </div>\n</section>\n<!-- /BF:BOOK -->')

def replace_section(t, sid, new):
    m = re.search(r'<section\b[^>]*\bid="%s"[^>]*>' % sid, t)
    if not m: log.append(f'  no section #{sid}'); return t
    i = m.start(); depth = 0
    for mm in re.finditer(r'<(/?)section\b[^>]*>', t[i:]):
        depth += -1 if mm.group(1) else 1
        if depth == 0:
            return t[:i] + new + t[i + mm.end():]
    return t

BANDS = {
    'courses/index.html': ('enquire', ('Ready to start?', 'Book your course', 'Choose your level and tell us when you would like to come. We confirm dates within 48 hours.', 'courses')),
    'team-building/index.html': ('enquire', ('For companies', 'Plan your team day', 'Tell us about your team, timing and goals. We reply within 48 hours.', 'team')),
    'trips.html': ('enquire', ('Winter trips', 'Join a winter trip', 'Dates are announced soon. Book now to get first access and hold your place.', 'trips')),
    'freediving-trips/dahab/index.html': ('enquire', ('Dahab · winter trip', 'Join the Dahab trip', 'Dates are announced soon. Book now to get first access and hold your place.', 'trip-dahab')),
    'beginners-course/index.html': ('apply', ('Beginners course', 'Book your beginners course', 'Tell us when you would like to start. We confirm dates within 48 hours.', 'beginners')),
}
for f, (sid, args) in BANDS.items():
    t = open(f).read()
    if 'BF:BOOK' not in t:
        t = replace_section(t, sid, band(*args, sid)); open(f, 'w').write(t)

# ---------- 4. one CTA: "Book now" ----------
BOOK_LABELS = {
    'reserve your place', "reserve your spot, it's free", 'reserve', 'reserve your place, free', 'book your place',
    'enquire', 'enquire now', 'register your interest', 'request package details', 'book my free online session',
    'design your experience', 'plan your team experience', 'build a custom format', 'see expedition options',
    'plan your barcelona dives', 'discuss a team experience', 'get in touch', 'explore aida courses in barcelona',
    'explore barcelona courses', 'train with barcelona freedivers in barcelona', 'book session', 'book pack',
    'apply for instructor course', 'enquire, dahab', 'enquire, indonesia', 'enquire, sri lanka', 'join the next trip',
}
NAME_FOR = {'aida 1': 'beginners', 'first breath': 'beginners', 'waitlist': 'beginners', 'aida 2': 'aida-2', 'aida 3': 'aida-3',
            'aida 4': 'aida-4', 'instructor': 'instructor', 'instructor course': 'instructor', 'aida instructor': 'instructor',
            'depth path': 'aida-2-3', 'full pathway': 'aida-1-4'}
PAGE_FOR = {'courses/aida-2/index.html': 'aida-2', 'courses/aida-3/index.html': 'aida-3', 'courses/aida-4/index.html': 'aida-4',
            'courses/aida-instructor/index.html': 'instructor', 'team-building/index.html': 'team', 'trips.html': 'trips',
            'freediving-trips/dahab/index.html': 'trip-dahab', 'freediving-trips/bali/index.html': 'trip-indonesia',
            'freediving-trips/sri-lanka/index.html': 'trip-sri-lanka', 'training.html': 'training',
            'beginners-course/index.html': 'beginners', 'courses/index.html': 'courses'}

def norm(label):
    s = html.unescape(re.sub(r'<[^>]+>', ' ', label))
    s = re.sub(r'[→←›»]|&rarr;', ' ', s)
    s = re.sub(r',?\s*€[\d,.]+', '', s)
    return re.sub(r'\s+', ' ', s).strip().lower()

def cta(f, t):
    default = PAGE_FOR.get(f, 'beginners' if f.startswith('learn/') else '')
    def rep(m):
        tag, attrs, inner = m.group(1), m.group(2), m.group(3)
        lab = norm(inner)
        base = re.sub(r'^reserve (aida \d)$', 'reserve', lab)
        if lab not in BOOK_LABELS and base not in BOOK_LABELS: return m.group(0)
        if 'type="submit"' in attrs: return m.group(0)
        item = default
        oc = re.search(r"open(?:Modal|Booking|TrModal)\('([^']*)'", attrs)
        if oc:
            key = oc.group(1).lower()
            if key.startswith('open water'): item = 'training-open-water'
            elif key.startswith('pool'): item = 'training-pool'
            else: item = NAME_FOR.get(key, item)
        rl = re.match(r'reserve (aida \d)', lab)
        if rl: item = NAME_FOR[rl.group(1)]
        if lab.startswith('enquire, '): item = {'enquire, dahab': 'trip-dahab', 'enquire, indonesia': 'trip-indonesia', 'enquire, sri lanka': 'trip-sri-lanka'}[lab]
        cls = re.search(r'class="([^"]*)"', attrs)
        cls = cls.group(1) if cls else 'btn-primary'
        href = '/book' + (f'?for={item}' if item else '')
        return f'<a href="{href}" class="{cls}">Book now</a>'
    return re.sub(r'<(a|button)\b([^>]*)>(.*?)</\1>', rep, t, flags=re.S)

for f in [p for p in glob.glob('**/*.html', recursive=True) if not p.startswith('tools/')]:
    t = open(f).read()
    body_start = t.find('<body')
    head, body = t[:body_start], t[body_start:]
    # keep shared partials out of it
    n = head + cta(f, body)
    # hero / sticky "Reserve" style links that used javascript to open pop-ups
    n = n.replace('<a class="sticky-cta-btn" id="stickyCtaBtn" href="#" onclick="stickyCtaAction();return false;">Reserve</a>',
                  '<a class="sticky-cta-btn" id="stickyCtaBtn" href="/book">Book now</a>')
    n = n.replace('<a href="#" class="btn-ghost" onclick="openModal(\'General Inquiry\');return false;">Ask a question</a>',
                  '<a href="https://wa.me/34603083325" class="btn-ghost" target="_blank" rel="noopener">Ask a question</a>')
    if n != t: open(f, 'w').write(n)

print('\n'.join(log))
