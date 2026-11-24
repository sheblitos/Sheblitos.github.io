#!/usr/bin/env python3
"""Step 4 pricing: Beginner (AIDA 1+2) EUR 420, AIDA 3 EUR 460, AIDA 4 EUR 575, Instructor EUR 1,500,
AIDA 2 alone EUR 360 (AIDA 1 holders). No bundles, no 'Save EUR X'. Training: single sessions only.
Teams: price on request. Trips: price announced with dates."""
import glob, os, re
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
log = []
def rd(p): return open(p, encoding='utf-8').read()
def wr(p, t, o):
    if t != o: open(p, 'w', encoding='utf-8').write(t); log.append(f'updated {p}')
def sub(t, a, b, regex=False, flags=0, must=True):
    n = re.sub(a, b, t, flags=flags) if regex else t.replace(a, b)
    if n == t and must: log.append(f'  no match: {a[:80]!r}')
    return n
def strip_div(t, start_pat):
    m = re.search(start_pat, t)
    if not m: log.append(f'  no block {start_pat[:60]!r}'); return t
    i = m.start(); depth = 0
    for mm in re.finditer(r'<(/?)div\b[^>]*>', t[i:]):
        depth += -1 if mm.group(1) else 1
        if depth == 0: return t[:i] + t[i + mm.end():]
    return t

PAGES = [p for p in glob.glob('**/*.html', recursive=True) if not p.startswith('tools/')]

# ---- 1. new prices everywhere ----
for p in PAGES:
    t = o = rd(p)
    t = re.sub(r'(€|&euro;)\s?445\b', r'\g<1>420', t)
    t = re.sub(r'(€|&euro;)\s?430\b', r'\g<1>460', t)
    t = re.sub(r'(€|&euro;)\s?1,440\b', r'\g<1>1,500', t)
    t = re.sub(r'("price"\s*:\s*")445"', r'\g<1>420"', t)
    t = re.sub(r'("price"\s*:\s*")430"', r'\g<1>460"', t)
    t = re.sub(r'("price"\s*:\s*")1440"', r'\g<1>1500"', t)
    t = t.replace('data-price="430"', 'data-price="460"').replace('data-price="1440"', 'data-price="1500"')
    t = t.replace("'AIDA 3':430", "'AIDA 3':460").replace("'Instructor':1440", "'Instructor':1500")
    t = t.replace('430 euros', '460 euros').replace('1440 euros', '1500 euros').replace('1,440 euros', '1,500 euros')
    wr(p, t, o)

# ---- 2. Courses page: no bundles ----
p = 'courses/index.html'; t = o = rd(p)
t = sub(t, r'\s*<!-- COURSE BUNDLES -->\s*<section class="pkg-section alt" id="bundles">.*?</section>', '', regex=True, flags=re.S)
t = sub(t, r'\s*<a[^>]*href="#bundles"[^>]*>[^<]*</a>', '', regex=True, flags=re.S, must=False)
wr(p, t, o)

# ---- 3. Booking options ----
p = 'book/index.html'; t = o = rd(p)
t = sub(t, '<option value="aida-2-3">AIDA 2 + AIDA 3 · €710</option>', '')
t = sub(t, '<option value="aida-1-4">AIDA 1 to AIDA 4 · €1,310</option>', '')
t = sub(t, "<option value=\"team\">Team day or retreat for a company</option>", "<option value=\"team\">Team day or retreat for a company · price on request</option>")
t = sub(t, '<optgroup label="Winter trips · dates announced soon">', '<optgroup label="Winter trips · dates and prices announced soon">')
wr(p, t, o)

# ---- 4. Home + FAQ: AIDA 1 is only part of the Beginner course ----
PRICE_LINE_OLD = r'AIDA 1 — €145\. AIDA 2 — €360\. AIDA 3 — €460\. AIDA 4 — €575\. AIDA Instructor Course — €1,500\.'
PRICE_LINE_NEW = 'Beginner course (AIDA 1 + AIDA 2) — €420. AIDA 2 on its own, for AIDA 1 holders — €360. AIDA 3 — €460. AIDA 4 — €575. AIDA Instructor Course — €1,500.'
DUR_OLD = r'AIDA 1 is 1 day \(pool only\)\. AIDA 2 is 2\.5 days \(pool and Mediterranean open water\)\.'
DUR_NEW = 'The Beginner course (AIDA 1 + AIDA 2) is 3.5 days (pool and Mediterranean open water). AIDA 2 on its own is 2.5 days.'
for p in ('index.html', 'faq.html'):
    t = o = rd(p)
    t = re.sub(PRICE_LINE_OLD, PRICE_LINE_NEW, t)
    t = re.sub(DUR_OLD, DUR_NEW, t)
    t = t.replace('AIDA 1, €145 · AIDA 2, €360 · AIDA 3, €460 · AIDA 4, €575 · Instructor Course, €1,500.',
                  'Beginner course (AIDA 1 + AIDA 2), €420 · AIDA 2 on its own (for AIDA 1 holders), €360 · AIDA 3, €460 · AIDA 4, €575 · Instructor Course, €1,500.')
    t = t.replace('AIDA 1, 1 day (pool only). AIDA 2, 2.5 days (pool + Mediterranean open water).',
                  'Beginner course (AIDA 1 + AIDA 2), 3.5 days (pool + Mediterranean open water). AIDA 2 on its own, 2.5 days.')
    t = t.replace('Instructor Course, 5 to 7 days full programme.', 'Instructor Course, 10 to 21 days full programme.')
    t = t.replace('The only requirement for AIDA 1 is basic comfort in water — no prior swimming qualifications needed. AIDA 1 is designed for complete beginners',
                  'The only requirement for the Beginner course is basic comfort in water — no prior swimming qualifications needed. It is designed for complete beginners')
    t = t.replace('The only requirement for AIDA 1 is basic comfort in water, no prior swimming qualifications needed. AIDA 1 is designed for complete beginners and runs for one full day of theory and pool s',
                  'The only requirement for the Beginner course is basic comfort in water, no prior swimming qualifications needed. It is designed for complete beginners and starts with theory and pool s')
    t = t.replace('"name": "Do I need experience to join an AIDA 1 freediving course?"', '"name": "Do I need experience to join the Beginner freediving course?"')
    t = t.replace('No experience is required for AIDA 1. The only requirement is basic comfort in water — no prior swimming qualifications needed. AIDA 1 is designed for complet',
                  'No experience is required for the Beginner course (AIDA 1 + AIDA 2). The only requirement is basic comfort in water — no prior swimming qualifications needed. It is designed for complet')
    t = t.replace('Barcelona Freedivers offers AIDA 1 through AIDA 4 and the Instru', 'Barcelona Freedivers offers the Beginner course (AIDA 1 + AIDA 2), AIDA 3, AIDA 4 and the Instru')
    if p == 'index.html':
        t = t.replace('{"@type":"Offer","name":"AIDA 1 — Introduction to Freediving","price":"145","priceCurrency":"EUR"}',
                      '{"@type":"Offer","name":"Beginner course — AIDA 1 + AIDA 2","price":"420","priceCurrency":"EUR"}')
        t = re.sub(r'("name": ")AIDA 1[^"]*(".{0,400}?"price": ")145"', r'\g<1>Beginner course (AIDA 1 + AIDA 2)\g<2>420"', t, flags=re.S)
        # course cards (desktop carousel, mobile cards, details list, booking pop-up)
        t = t.replace('<span class="cc-badge">Entry &middot; Pool only</span>\n          <h3 class="cc-title">AIDA 1<span>Introduction to freediving</span></h3>\n          <p class="cc-meta">1 day &middot; No experience needed</p>\n          <p class="cc-price">&euro;145</p>',
                      '<span class="cc-badge">Beginner &middot; Pool + sea</span>\n          <h3 class="cc-title">Beginner<span>AIDA 1 + AIDA 2</span></h3>\n          <p class="cc-meta">3.5 days &middot; No experience needed</p>\n          <p class="cc-price">&euro;420</p>')
        t = t.replace('<span class="cc-badge">Foundational &middot; Open water</span>', '<span class="cc-badge">For AIDA 1 holders &middot; Open water</span>')
        t = t.replace('<p class="cc-meta">2.5 days &middot; No prior cert needed</p>', '<p class="cc-meta">2.5 days &middot; AIDA 1 or equivalent</p>')
        t = t.replace('<p class="mob-card-title">AIDA 1, Introduction to Freediving</p>\n            <p class="mob-card-meta">Pool only · 1 day<br>No experience required</p>',
                      '<p class="mob-card-title">Beginner, AIDA 1 + AIDA 2</p>\n            <p class="mob-card-meta">Pool + sea · 3.5 days<br>No experience required</p>')
        t = t.replace('<span class="mob-card-price">€145</span>', '<span class="mob-card-price">€420</span>')
        t = t.replace('<p class="ch-title">AIDA 1, Introduction to Freediving</p>\n            <p class="ch-meta">Pool only · 1 day · No experience required</p>',
                      '<p class="ch-title">Beginner, AIDA 1 + AIDA 2</p>\n            <p class="ch-meta">Pool + sea · 3.5 days · No experience required</p>')
        t = t.replace('<span class="ch-price">€145</span>', '<span class="ch-price">€420</span>')
        t = t.replace('<div class="cb-fact"><span class="cb-dot"></span>1 full day, theory and pool</div>', '<div class="cb-fact"><span class="cb-dot"></span>3.5 days: theory, pool and the Mediterranean</div>')
        t = t.replace('<div class="cb-fact"><span class="cb-dot"></span>Indoor pool, Barcelona</div>', '<div class="cb-fact"><span class="cb-dot"></span>Pool and open water, Barcelona</div>')
        t = t.replace('<div class="cb-fact"><span class="cb-dot"></span>AIDA 1 certificate included</div>', '<div class="cb-fact"><span class="cb-dot"></span>AIDA 1 and AIDA 2 certificates included</div>')
        t = t.replace('data-course="AIDA 1" data-price="145"', 'data-course="AIDA 1" data-price="420"')
        t = t.replace('<p class="bk-cc-price">€145</p>', '<p class="bk-cc-price">€420</p>')
        t = t.replace("'AIDA 1':145", "'AIDA 1':420")
    left = re.findall(r'.{40}(?:€145|"145").{20}', t)
    if left: log.append(f'  {p} still has 145: {left[:3]}')
    wr(p, t, o)

# ---- 5. Learn article: AIDA 1 vs AIDA 2 ----
p = 'learn/aida1-vs-aida2/index.html'; t = o = rd(p)
t = sub(t, '<tr><td>Price at Barcelona Freedivers</td><td>€145</td><td>€360</td></tr>',
        '<tr><td>Price at Barcelona Freedivers</td><td>Part of the Beginner course (AIDA 1 + AIDA 2), €420</td><td>€360 on its own, for AIDA 1 holders</td></tr>')
t = sub(t, r'<div class="price-block">.*?</div>\s*</div>',
        '<div class="price-block">\n    <div>\n      <p class="price-item-tag">Beginner course · AIDA 1 + AIDA 2</p>\n      <p class="price-item-n">€420</p>\n      <p class="price-item-l">3.5 days · Pool + Mediterranean · All equipment included · Both certificates</p>\n    </div>\n    <div>\n      <p class="price-item-tag">AIDA 2 on its own</p>\n      <p class="price-item-n">€360</p>\n      <p class="price-item-l">For AIDA 1 holders · 2.5 days · Pool + Mediterranean · All equipment included</p>\n    </div>\n  </div>',
        regex=True, flags=re.S)
wr(p, t, o)

# ---- 6. Training: single sessions only ----
p = 'training.html'; t = o = rd(p)
for _ in range(2):
    t = re.sub(r'\s*<!-- Pack × 3[^>]*-->', '', t, count=1)
    t = strip_div(t, r'<div class="pkg-card featured reveal" style="transition-delay:\.1s">')
    t = re.sub(r'\s*<!-- Pack × 6[^>]*-->', '', t, count=1)
    t = strip_div(t, r'<div class="pkg-card reveal" style="transition-delay:\.2s">')
if '.pkg-grid.bf-single' not in t:
    t = t.replace('<div class="pkg-grid">', '<div class="pkg-grid bf-single">')
    t = t.replace('</head>', '<style>\n.pkg-grid.bf-single{grid-template-columns:minmax(0,440px) !important;justify-content:start}\n</style>\n</head>', 1)
left = re.findall(r'Pack ·|Save €|per session', t)
if left: log.append(f'  training leftovers: {left}')
wr(p, t, o)

# ---- 7. Teams: price on request; Trips: prices with dates ----
p = 'team-building/index.html'; t = o = rd(p)
t = sub(t, '<p class="ctc-tag">1 day · Barcelona</p>', '<p class="ctc-tag">1 day · Barcelona · price on request</p>')
t = sub(t, '<p class="ctc-tag">Multiple days · Barcelona or abroad</p>', '<p class="ctc-tag">Multiple days · Barcelona or abroad · price on request</p>')
wr(p, t, o)
p = 'trips.html'; t = o = rd(p)
t = sub(t, 'Winter trips. Dates announced soon: register your interest to hear first.', 'Winter trips. Dates and prices announced soon. Book now to hear first.')
wr(p, t, o)

print('\n'.join(log))
