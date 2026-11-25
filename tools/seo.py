#!/usr/bin/env python3
"""Final SEO pass over every page. Run last:
  python3 tools/build_home.py && python3 tools/build_pages.py && python3 tools/rebrand.py && python3 tools/seo.py
Idempotent: the managed block between <!-- BF:SEO --> markers is rebuilt each run.
- Google Analytics on every page
- Open Graph + Twitter tags (og:image = the page's own banner photo)
- shorter titles where Google would cut them, descriptions <= 160 characters
- descriptive alt text on banner and card photos
- noindex on the 404 page; Instagram link in the school's structured data
"""
import glob, html, json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
DOMAIN = re.search(r"URL = '([^']+)'", open('tools/kit.py').read()).group(1)
GA = ('<script async src="https://www.googletagmanager.com/gtag/js?id=G-VR5PT4F97R"></script>'
      "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-VR5PT4F97R');</script>")
TITLES = {
    'learn/aida1-vs-aida2/index.html': 'AIDA 1 vs AIDA 2: Which Freediving Course First?',
    'learn/freediving-barcelona/index.html': 'Freediving in Barcelona: Your First Course Guide',
    'learn/freediving-weekend-barcelona/index.html': 'Freediving Weekend in Barcelona | Barcelona Freedivers',
    'learn/how-to-hold-your-breath-longer/index.html': 'How to Hold Your Breath Longer: The CO₂ Method',
    'learn/mammalian-dive-response/index.html': 'The Mammalian Dive Response, Explained',
    'learn/scuba-vs-freediving/index.html': 'Scuba vs Freediving: What Changes Underwater',
    'learn/why-freedive/index.html': 'Why Freedive? More Than a Breath-Hold',
    'about/shebl/index.html': 'Shebl, AIDA Instructor Trainer | Barcelona Freedivers',
    'freediving-trips/dahab/index.html': 'Dahab Freediving Trip | Red Sea · Barcelona Freedivers',
    'freediving-trips/bali/index.html': 'Indonesia Freediving Trip | Bali to Komodo',
    'freediving-trips/sri-lanka/index.html': 'Sri Lanka Freediving Trip | Mirissa to Sigiriya',
    'trips.html': 'Freediving Trips: Dahab, Indonesia & Sri Lanka',
    'about.html': 'About Shebl & Rimi | Barcelona Freedivers',
    'learn/breath-hold-training/index.html': 'Breath-Hold Training for Freediving | CO₂ & Safety',
    'learn/equalization-problems/index.html': 'Freediving Equalization Problems: Why Ears Stop',
    'learn/frenzel-equalization/index.html': 'Frenzel Equalization: Technique & Common Mistakes',
    'learn/mouthfill-equalization/index.html': 'Mouthfill Equalization for Deeper Freediving',
    'learn/shallow-water-blackout/index.html': 'Shallow Water Blackout: Risk & Prevention',
    'learn/freediving-safety/index.html': 'Freediving Safety: Buddying, Blackout & LMC',
}
def clean(s): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()
def esc(s): return html.escape(s, quote=True)
def shorten(d, n=158):
    if len(d) <= 160: return d
    cut = d[:n]; k = max(cut.rfind('. '), cut.rfind('! '), cut.rfind('? '))
    return cut[:k + 1] if k > 90 else cut[:cut.rfind(' ')].rstrip(',;:·—-') + '.'

changed = 0
for f in sorted(glob.glob('**/*.html', recursive=True)):
    if f.startswith('tools/'): continue
    t = o = open(f, encoding='utf-8').read()
    if 'http-equiv="refresh"' in t[:3000]: continue
    t = re.sub(r'<!-- BF:SEO -->.*?<!-- /BF:SEO -->\n?', '', t, flags=re.S)
    # title / description
    if f in TITLES:
        t = re.sub(r'<title>.*?</title>', f'<title>{esc(TITLES[f])}</title>', t, count=1, flags=re.S)
    title = clean((re.search(r'<title>(.*?)</title>', t, re.S) or [0, ''])[1])
    m = re.search(r'<meta name="description" content="([^"]*)"', t)
    desc = html.unescape(m.group(1)) if m else ''
    if desc and len(desc) > 160:
        desc = shorten(desc); t = t.replace(m.group(0), f'<meta name="description" content="{esc(desc)}"')
    # drop old social tags; the managed block rewrites them consistently
    t = re.sub(r'\s*<meta (?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>', '', t)
    canon = (re.search(r'<link rel="canonical" href="([^"]*)"', t) or [0, ''])[1]
    body = t[t.find('<body'):]
    # alt text: banner photos take the H1, card photos take the card title
    h1 = clean((re.search(r'<h1[^>]*>(.*?)</h1>', body, re.S) or [0, ''])[1])
    def fill(seg, alt):
        return re.sub(r'(<img\b[^>]*?) alt=""', lambda mm: f'{mm.group(1)} alt="{esc(alt)}"', seg, count=1)
    t = re.sub(r'<picture class="bf-hero-img">.*?</picture>', lambda mm: fill(mm.group(0), h1 + ', Barcelona Freedivers'), t, flags=re.S)
    t = re.sub(r'<a class="bf-card" href="[^"]*">.*?</a>', lambda mm: fill(mm.group(0), clean((re.search(r'<b>(.*?)</b>', mm.group(0), re.S) or [0, ''])[1])), t, flags=re.S)
    t = re.sub(r'<div class="bf-session">.*?</h3>', lambda mm: fill(mm.group(0), clean(re.search(r'<h3>(.*?)</h3>', mm.group(0)).group(1))), t, flags=re.S)
    t = re.sub(r'<picture class="bf-photo-main">.*?</picture>', lambda mm: fill(mm.group(0), 'Freediving course in Barcelona: ' + h1), t, flags=re.S)
    t = re.sub(r'<figure class="reveal">\s*<picture>.*?</picture>', lambda mm: fill(mm.group(0), h1), t, flags=re.S)
    # page's own image for social previews
    body = t[t.find('<body'):]
    im = re.search(r'<picture class="bf-hero-img">.*?<img src="([^"]+)"', body, re.S) or \
         re.search(r'<div class="hero-media">.*?<img src="([^"]+)"', body, re.S) or \
         re.search(r'<div class="bf-wrap bf-narrow bf-article-fig">.*?<img src="([^"]+)"', body, re.S) or \
         re.search(r'<div class="bf-photo-stack[^"]*">.*?<img src="([^"]+)"', body, re.S)
    img = DOMAIN + (im.group(1) if im and im.group(1).startswith('/') else '/og-image.jpg')
    ogtype = 'article' if f.startswith('learn/') and f != 'learn/index.html' else 'website'
    block = [GA] if 'G-VR5PT4F97R' not in t else []
    block += [f'<meta property="og:type" content="{ogtype}">', '<meta property="og:site_name" content="Barcelona Freedivers">',
              f'<meta property="og:title" content="{esc(title)}">', f'<meta property="og:description" content="{esc(desc)}">',
              f'<meta property="og:image" content="{esc(img)}">'] + ([f'<meta property="og:url" content="{esc(canon)}">'] if canon else []) + [
              '<meta name="twitter:card" content="summary_large_image">', f'<meta name="twitter:title" content="{esc(title)}">',
              f'<meta name="twitter:description" content="{esc(desc)}">', f'<meta name="twitter:image" content="{esc(img)}">']
    if f == '404.html':
        block.append('<meta name="robots" content="noindex">')
    t = t.replace('</head>', '<!-- BF:SEO -->\n' + '\n'.join(block) + '\n<!-- /BF:SEO -->\n</head>', 1)
    # school data: link to Instagram
    if f == 'index.html' and '"sameAs"' not in t:
        t = t.replace('"telephone": "+34603083325",', '"telephone": "+34603083325", "sameAs": ["https://www.instagram.com/freediving_brain/"],', 1)
    if t != o:
        open(f, 'w', encoding='utf-8').write(t); changed += 1
print(changed, 'pages updated')
