#!/usr/bin/env python3
"""AIDA 1 and AIDA 2 are only sold together (Beginner course, EUR 420). Remove standalone AIDA 2."""
import glob, os, re, subprocess
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
log = []
def rd(p): return open(p, encoding='utf-8').read()
def wr(p, t, o):
    if t != o: open(p, 'w', encoding='utf-8').write(t); log.append(f'updated {p}')
def sub(t, a, b, regex=False, flags=0):
    n = re.sub(a, b, t, flags=flags) if regex else t.replace(a, b)
    if n == t: log.append(f'  no match: {a[:80]!r}')
    return n
def strip_block(t, start_pat, tag):
    m = re.search(start_pat, t)
    if not m: log.append(f'  no block {start_pat[:60]!r}'); return t
    i = m.start(); depth = 0
    for mm in re.finditer(r'<(/?)%s\b[^>]*>' % tag, t[i:]):
        depth += -1 if mm.group(1) else 1
        if depth == 0: return t[:i] + t[i + mm.end():]
    return t

# 1. delete the AIDA 2 page, redirect, sitemap, links
if os.path.exists('courses/aida-2/index.html'):
    subprocess.run(['git', 'rm', '-q', '-r', 'courses/aida-2'], check=True); log.append('removed courses/aida-2')
PAGES = [p for p in glob.glob('**/*.html', recursive=True) if not p.startswith('tools/')]
for p in PAGES:
    t = o = rd(p); t = re.sub(r'/courses/aida-2(?=["#?/\'<\s])', '/courses/beginners', t); wr(p, t, o)
t = o = rd('sitemap.xml'); t = re.sub(r'\s*<url><loc>[^<]*/courses/aida-2</loc>.*?</url>', '', t); wr('sitemap.xml', t, o)
t = o = rd('netlify.toml')
t = t.replace('to = "/courses/aida-2"', 'to = "/courses/beginners"')
if 'from = "/courses/aida-2"' not in t:
    t = t.rstrip('\n') + '\n\n# AIDA 2 is only sold inside the Beginner course\n'
    for s in ('/courses/aida-2', '/courses/aida-2/'):
        t += f'[[redirects]]\n  from = "{s}"\n  to = "/courses/beginners"\n  status = 301\n  force = true\n\n'
wr('netlify.toml', t, o)

# 2. Courses page note, booking option, beginner FAQ
p = 'courses/index.html'; t = o = rd(p)
t = sub(t, r'<p class="draft-note"><span>Already have AIDA 1.*?</span></p>',
        '<p class="draft-note"><span>AIDA 1 and AIDA 2 are always taught together as the Beginner course. We confirm course dates within 48 hours.</span></p>', regex=True, flags=re.S)
wr(p, t, o)
p = 'book/index.html'; t = o = rd(p)
t = sub(t, '<option value="aida-2">AIDA 2 only, for AIDA 1 holders · €360</option>', ''); wr(p, t, o)
p = 'courses/beginners/index.html'; t = o = rd(p)
t = sub(t, r'<summary>Can I book AIDA 1 on its own\?</summary><p>.*?</p>',
        '<summary>Can I book AIDA 1 or AIDA 2 on its own?</summary><p>No. AIDA 1 and AIDA 2 are always taught together as one course, so you learn in the right order: pool first, then the sea.</p>', regex=True, flags=re.S)
wr(p, t, o)

# 3. Home + FAQ text and structured data
for p in ('index.html', 'faq.html'):
    t = o = rd(p)
    t = t.replace(' AIDA 2 on its own, for AIDA 1 holders — €360.', '')
    t = t.replace(' · AIDA 2 on its own (for AIDA 1 holders), €360', '')
    t = t.replace(' AIDA 2 on its own is 2.5 days.', '').replace(' AIDA 2 on its own, 2.5 days.', '')
    t = re.sub(r'\s*\{"@type":"Offer","name":"AIDA 2 — Freediver","price":"360","priceCurrency":"EUR"\},?', '', t)
    if p == 'index.html':
        # course list structured data: drop the AIDA 2 item
        import json
        def fix_list(m):
            data = json.loads(m.group(1))
            if data.get('@type') != 'ItemList': return m.group(0)
            items = [i for i in data['itemListElement'] if not i['item']['name'].startswith('AIDA 2')]
            for n, i in enumerate(items, 1): i['position'] = n
            data['itemListElement'] = items
            return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + '</script>'
        t = re.sub(r'<script type="application/ld\+json">(\{"@context": "https://schema.org", "@type": "ItemList".*?)</script>', fix_list, t, count=1, flags=re.S)
        # visible course cards
        t = strip_block(t, r'<article class="course-card photo-hero" data-ci="ci2"', 'article')
        k = t.find('<p class="mob-card-title">AIDA 2, Freediver</p>')
        if k > 0:
            s = t.rfind('<div class="mob-course-card">', 0, k)
            t = t[:s] + strip_block(t[s:], r'<div class="mob-course-card">', 'div').lstrip()
        else: log.append('  no mobile AIDA 2 card')
        t = re.sub(r'\s*<!-- AIDA 2 -->\s*(?=<article class="course-item reveal" id="ci2">)', '\n    ', t)
        t = strip_block(t, r'<article class="course-item reveal" id="ci2">', 'article')
        t = t.replace("{id:'ci2', name:'AIDA 2'},", '')
        # renumber the visible course lists 1..n
        for cls in ('mob-card-num', 'ch-num'):
            cnt = [0]
            def renum(m):
                cnt[0] += 1; return m.group(1) + str(cnt[0]) + m.group(2)
            t = re.sub(r'(<span class="%s"[^>]*>)\d+(</span>)' % cls, renum, t)
    left = re.findall(r'.{30}€360.{20}', t)
    if left: log.append(f'  {p} still mentions €360: {left[:3]}')
    wr(p, t, o)

# 4. Learn article
p = 'learn/aida1-vs-aida2/index.html'; t = o = rd(p)
t = sub(t, '<tr><td>Price at Barcelona Freedivers</td><td>Part of the Beginner course (AIDA 1 + AIDA 2), €420</td><td>€360 on its own, for AIDA 1 holders</td></tr>',
        '<tr><td>Price at Barcelona Freedivers</td><td colspan="2">Taught together as the Beginner course (AIDA 1 + AIDA 2), €420</td></tr>')
t = sub(t, r'\s*<div>\s*<p class="price-item-tag">AIDA 2 on its own</p>.*?</div>', '', regex=True, flags=re.S)
wr(p, t, o)
print('\n'.join(log))
