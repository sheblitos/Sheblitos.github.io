#!/usr/bin/env python3
"""Barcelona Freedivers rebrand: apply the shared header, mobile menu and
footer, the Montserrat font, the white brand palette and the new name to
every page. Safe to run again: pages already converted are re-templated
from the partials below, so editing NAV/FOOTER here and re-running updates
the whole site.

Usage:  python3 tools/rebrand.py
"""
import glob, re, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

LINKS = [("/courses", "Courses"), ("/training", "Training"),
         ("/trips", "Trips"), ("/team-building", "Teams"), ("/about", "About")]
CTA = ("/book", "Book now")

NAV = ('<!-- BF:NAV -->\n<nav id="navbar" class="bf-nav" aria-label="Main">\n'
       '  <a href="/" class="bf-logo" aria-label="Barcelona Freedivers home">'
       '<img src="/logo-mark.png" alt="" width="42" height="42">'
       '<span class="bf-word"><small>BARCELONA</small><b>FREEDIVERS</b></span></a>\n'
       '  <div class="bf-links">' + ''.join(f'<a href="{h}">{t}</a>' for h, t in LINKS) +
       f'<a href="{CTA[0]}" class="bf-cta">{CTA[1]}</a></div>\n'
       '  <button class="bf-ham" id="navHam" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="navMobile"><span></span><span></span><span></span></button>\n'
       '</nav>\n'
       '<div class="bf-mob" id="navMobile">' + ''.join(f'<a href="{h}">{t}</a>' for h, t in LINKS) +
       f'<a href="{CTA[0]}" class="bf-cta">{CTA[1]}</a></div>\n<!-- /BF:NAV -->')

FOOTER = ('<!-- BF:FOOTER -->\n<footer id="footer" class="bf-foot">\n  <div class="bf-foot-grid">\n'
          '    <div class="bf-foot-brand"><img src="/logo-full-white.png" alt="Barcelona Freedivers" width="140" height="155" loading="lazy">'
          '<p>AIDA freediving courses, training and trips in Barcelona and beyond. Calm first, depth follows.</p></div>\n'
          '    <div><h4>Courses</h4><ul><li><a href="/courses">All courses</a></li><li><a href="/courses/beginners">Beginner · AIDA 1 + 2</a></li>'
          '<li><a href="/courses/aida-3">Intermediate · AIDA 3</a></li><li><a href="/courses/aida-4">Advanced · AIDA 4</a></li>'
          '<li><a href="/courses/aida-instructor">Instructor</a></li></ul></div>\n'
          '    <div><h4>Explore</h4><ul><li><a href="/training">Training</a></li><li><a href="/trips">Trips</a></li>'
          '<li><a href="/team-building">Teams</a></li><li><a href="/learn">Learn</a></li><li><a href="/faq">FAQ</a></li></ul></div>\n'
          '    <div><h4>Contact</h4><ul><li><a href="/book">Book now</a></li><li><a href="/about">About us</a></li><li><a href="/about/shebl">Shebl</a></li>'
          '<li><a href="https://wa.me/34603083325" target="_blank" rel="noopener">WhatsApp</a></li>'
          '<li><a href="https://www.instagram.com/freediving_brain/" target="_blank" rel="noopener">Instagram</a></li>'
          '<li><a href="mailto:hello@freedivingbrain.com">Email us</a></li></ul></div>\n'
          '  </div>\n  <div class="bf-foot-bottom"><span>&copy; 2026 Barcelona Freedivers &middot; Barcelona, Spain</span>'
          '<span>AIDA freediving school</span></div>\n</footer>\n'
          '<div class="dive-rope-panel" id="diveRope" aria-hidden="true"><div class="dr-rope"></div><div id="drBubbles"></div><div class="dr-tick" data-depth="10"><span class="dr-tick-label">10m</span><i class="dr-dash"></i></div><div class="dr-tick" data-depth="20"><span class="dr-tick-label">20m</span><i class="dr-dash"></i></div><div class="dr-tick" data-depth="30"><span class="dr-tick-label">30m</span><i class="dr-dash"></i></div><div class="dr-tick" data-depth="40"><span class="dr-tick-label">40m</span><i class="dr-dash"></i></div><div class="dr-tick" data-depth="50"><span class="dr-tick-label">50m</span><i class="dr-dash"></i></div><div class="dr-tick" data-depth="60"><span class="dr-tick-label">60m</span><i class="dr-dash"></i></div>'
          '<svg class="dr-diver" id="drDiver" viewBox="-215 -215 430 430" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true">'
          '<g id="drRig"><g id="drLegs"><image id="drLegImg" xlink:href="/diver-legs-2-teal.png" href="/diver-legs-2-teal.png" x="-1.8" y="-17.7" width="167" height="34"/></g>'
          '<image id="drBody" xlink:href="/diver-body-teal.png" href="/diver-body-teal.png" x="-205.5" y="-27.3" width="207" height="39"/></g></svg></div>\n'
          '<script src="/dive-rope.js?v=1" defer></script>\n<!-- /BF:FOOTER -->')

FONT_HREF = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap'
HEAD_LINKS = ('<!-- BF:HEAD -->\n<link rel="icon" type="image/png" href="/logo-mark.png">'
              '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
              f'<link rel="stylesheet" href="{FONT_HREF}">'
              '<link rel="stylesheet" href="/site.css?v=3"><script src="/site.js?v=3" defer></script>\n<!-- /BF:HEAD -->')

# pages whose first banner sits on a photo (gets light text)
PHOTO_HERO = {
    'index.html': 'class="hero"', 'courses/index.html': 'class="hero"', 'team-building/index.html': 'class="hero"',
    'trips.html': 'class="hero"', 'courses/beginners/index.html': 'class="hero course-hero"',
    'training.html': 'class="tr-hero"', 'about.html': 'class="story-hero"',
    'freediving-trips/dahab/index.html': 'class="hero"',
}

# other blocks with text laid over a photo (exact class attribute)
PHOTO_EXTRA = {
    'index.html': ['class="why"', 'class="course-card"', 'class="booking"'],
    'trips.html': ['class="exp-card"'],
    'team-building/index.html': ['class="tb-band"'],
    'courses/beginners/index.html': ['class="tb-band"'],
    'training.html': ['class="tr-photoband reveal"'],
}

HEX_MAP = {
    # dark backgrounds -> white theme
    '#0c1a15': '#ffffff', '#060d09': '#ffffff', '#08171e': '#ffffff',
    '#112620': '#f4f8f8', '#0a1410': '#f4f8f8', '#0c1a0f': '#f4f8f8', '#0d212b': '#f4f8f8',
    '#16291f': '#e9f2f2', '#0f1c14': '#e9f2f2', '#16302a': '#e9f2f2', '#123140': '#e9f2f2', '#0e1a14': '#e9f2f2',
    '#1c3026': '#e2eded', '#162018': '#e2eded', '#16302a': '#e9f2f2',
    # light text on dark -> dark ink
    '#ece8e0': '#0e2a2d', '#e2ddd4': '#0e2a2d', '#10211c': '#0e2a2d',
    # teals -> logo teal family
    '#7ecdb0': '#05565d', '#6ec4a4': '#05565d', '#a8e8cc': '#04434a', '#4aaa86': '#0a6c74', '#3d9e7a': '#0a6c74',
    '#1a6b50': '#05565d', '#218078': '#05565d', '#279185': '#04434a', '#17625b': '#05565d', '#e3b97f': '#05565d',
    '#e8f0ed': '#f4f8f8', '#f3ebdd': '#f4f8f8', '#fbf7ef': '#ffffff',
}

def recolor(css):
    for k, v in HEX_MAP.items():
        css = re.sub(re.escape(k) + r'(?![0-9a-fA-F])', v, css, flags=re.I)
    css = re.sub(r'rgba\(\s*(?:236\s*,\s*232\s*,\s*224|226\s*,\s*221\s*,\s*212)\s*,', 'rgba(14,42,45,', css)
    css = re.sub(r'rgba\(\s*126\s*,\s*205\s*,\s*176\s*,', 'rgba(5,86,93,', css)
    css = re.sub(r'rgba\(\s*201\s*,\s*168\s*,\s*76\s*,', 'rgba(5,86,93,', css)
    css = re.sub(r'rgba\(\s*227\s*,\s*185\s*,\s*127\s*,', 'rgba(5,86,93,', css)
    # dark green: inside gradients it is a photo overlay (keep dark, brand shade); elsewhere a panel (white)
    def fix_grad(m):
        return re.sub(r'rgba\(\s*(?:12\s*,\s*26\s*,\s*21|6\s*,\s*13\s*,\s*9|8\s*,\s*23\s*,\s*30)\s*,', 'rgba(3,38,42,', m.group(0))
    css = re.sub(r'(?:linear|radial)-gradient\((?:[^()]|\([^()]*\))*\)', fix_grad, css)
    css = re.sub(r'rgba\(\s*(?:12\s*,\s*26\s*,\s*21|6\s*,\s*13\s*,\s*9|8\s*,\s*23\s*,\s*30)\s*,', 'rgba(255,255,255,', css)
    return css

NAME_SUBS = [
    (r'Freediving\s*<strong>Brain</strong>', 'Barcelona Freedivers'),
    (r'Freediving\s*<span>Brain</span>', 'Barcelona Freedivers'),
    (r'FREEDIVING BRAIN', 'BARCELONA FREEDIVERS'),
    (r'Freediving Brain', 'Barcelona Freedivers'),
    (r'Freediving%20Brain', 'Barcelona%20Freedivers'),
    (r'FreedivingBrain', 'Barcelona Freedivers'),
]

def strip_block(t, start_pat, tag):
    """Remove the element that starts at regex start_pat, honouring nesting of `tag`."""
    m = re.search(start_pat, t)
    if not m:
        return t, None
    i = m.start(); depth = 0
    for mm in re.finditer(r'<(/?)%s\b[^>]*>' % tag, t[i:]):
        depth += -1 if mm.group(1) else 1
        if depth == 0:
            j = i + mm.end()
            return t[:i] + '\x00' + t[j:], i
    return t, None

def process(path):
    t = open(path, encoding='utf-8').read()
    if 'http-equiv="refresh"' in t[:3000]:
        return False
    orig = t
    judge = path.startswith('judge/')

    # remove earlier template runs
    t = re.sub(r'<!-- BF:NAV -->.*?<!-- /BF:NAV -->', '\x00', t, flags=re.S)
    t = re.sub(r'<!-- BF:FOOTER -->.*?<!-- /BF:FOOTER -->', '\x01', t, flags=re.S)
    t = re.sub(r'<!-- BF:HEAD -->.*?<!-- /BF:HEAD -->\n?', '', t, flags=re.S)

    if not judge:
        if '\x00' not in t:
            if '<header class="nav">' in t:
                t, _ = strip_block(t, r'<header class="nav">', 'header')
            else:
                t, _ = strip_block(t, r'<nav(?![^>]*class="(?:more|tabs)")(?![^>]*aria-label="Footer")[^>]*>', 'nav')
            # old mobile menus
            for pat in (r'<div class="nav-mobile"[^>]*>',):
                t, _ = strip_block(t, pat, 'div')
                t = t.replace('\x00\x00', '\x00')
            if '\x00' not in t:
                t = re.sub(r'(<body[^>]*>)', lambda m: m.group(1) + '\n\x00', t, count=1)
        t = t.replace('\x00', NAV, 1).replace('\x00', '')
        if '\x01' not in t:
            # last footer on the page
            ms = list(re.finditer(r'<footer\b[^>]*>', t))
            if ms:
                start = ms[-1].start(); end = t.index('</footer>', start) + len('</footer>')
                t = t[:start] + '\x01' + t[end:]
            else:
                t = t.replace('</body>', '\x01\n</body>', 1)
        t = t.replace('\x01', FOOTER)

    # fonts: Montserrat only
    t = re.sub(r'<link[^>]*fonts\.googleapis\.com/css2\?family=Mulish[^>]*>', '', t)
    t = re.sub(r'<noscript>\s*</noscript>', '', t)
    t = re.sub(r"'Mulish'|\"Mulish\"|\bMulish\b", 'Montserrat', t)
    t = t.replace('font-family:Georgia,serif', 'font-family:Montserrat,system-ui,sans-serif')
    t = re.sub(r'font-family:\s*-apple-system,"Segoe UI",system-ui,sans-serif', 'font-family:Montserrat,system-ui,sans-serif', t)

    # colours
    t = recolor(t)
    if judge:
        t = re.sub(r'@media\(prefers-color-scheme:dark\)\{:root\{.*?\}\}', '', t, flags=re.S)

    # name
    for a, b in NAME_SUBS:
        t = re.sub(a, b, t)

    # photo banners
    if path in PHOTO_HERO:
        cls = PHOTO_HERO[path]
        if 'photo-hero' not in t:
            t = t.replace(cls, cls[:-1] + ' photo-hero"', 1)
    if path.startswith('learn/') and path != 'learn/index.html':
        t = re.sub(r'class="article-hero"', 'class="article-hero photo-hero"', t, count=1)
    for cls in PHOTO_EXTRA.get(path, ()):
        t = re.sub(re.escape(cls[:-1]) + r'(?!\s*photo-hero)"', cls[:-1] + ' photo-hero"', t)

    # old seven-circle logo artwork -> new logo mark
    t = re.sub(r'<a href="#" class="nav-logo" aria-label="Barcelona Freedivers" onclick="return false;"[^>]*>.*?</a>',
               '<span class="bf-modal-logo"><img src="/logo-mark.png" alt="" width="34" height="34">Barcelona Freedivers</span>', t, flags=re.S)
    t = re.sub(r'<svg((?:\s+class="[^"]*")?)[^>]*viewBox="0 0 100 100"[^>]*>(?:(?!</svg>).)*cx="69\.9"(?:(?!</svg>).)*</svg>',
               lambda m: f'<img{m.group(1)} src="/logo-mark.png" alt="" width="56" height="56" style="display:block;margin:0 auto">', t, flags=re.S)

    # blog index used its own nav id
    t = t.replace("getElementById('nav').classList.toggle('scrolled'", "getElementById('navbar').classList.toggle('scrolled'")

    # shared head
    t = t.replace('</head>', HEAD_LINKS + '\n</head>', 1)

    if t != orig:
        open(path, 'w', encoding='utf-8').write(t)
        return True
    return False

def main():
    files = sorted(glob.glob('**/*.html', recursive=True))
    changed = [f for f in files if not f.startswith(('tools/', 'node_modules/')) and process(f)]
    for css in ('trip.css', 'type-system.css'):
        s = open(css).read(); n = recolor(s)
        n = re.sub(r"'Mulish'", "'Montserrat'", n)
        if n != s:
            open(css, 'w').write(n); changed.append(css)
    print(f'{len(changed)} files updated')
    for f in changed:
        print('  ', f)

if __name__ == '__main__':
    main()
