#!/usr/bin/env python3
"""Step 1 trust fixes (works on both the live site and the rebrand branch):
end the €294 offer, Rimi naming, Shebl's dates, winter trips only
(Dahab, Sri Lanka, Indonesia), Tenerife trip removed."""
import os, re, sys
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
log = []

def edit(path, fn):
    if not os.path.exists(path):
        log.append(f'missing {path}'); return
    t = open(path, encoding='utf-8').read(); n = fn(t)
    if n != t:
        open(path, 'w', encoding='utf-8').write(n); log.append(f'updated {path}')

def sub(t, old, new, regex=False, flags=0):
    n = re.sub(old, new, t, flags=flags) if regex else t.replace(old, new)
    if n == t: log.append(f'  no match: {old[:70]!r}')
    return n

def strip_div(t, start):
    i = t.find(start)
    if i < 0: log.append(f'  no block: {start[:60]!r}'); return t
    depth = 0
    for m in re.finditer(r'<(/?)div\b[^>]*>', t[i:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return t[:i] + t[i + m.end():]
    return t

# 1. Beginner course: offer ended, back to €360, free online session stays
def course(t):
    t = sub(t, 'Intro price €294, pay only if you continue.', 'Full course €360, and you only pay if you continue.')
    t = sub(t, '"price":"294"', '"price":"360"')
    t = sub(t, '"category":"Intro offer"', '"category":"Course"')
    t = sub(t, r'<span>Full course <s>€360</s> <b>€294</b></span><span>·</span><span>Until 20 Nov, limited seats</span>',
            '<span>Full course <b>€360</b></span>')
    t = sub(t, '<span class="step-tag">€294 until 20 Nov</span>', '<span class="step-tag">€360 · all equipment included</span>')
    t = sub(t, '<span class="price-badge">Intro offer · until 20 November</span>', '<span class="price-badge">Online intro free</span>')
    t = sub(t, '<div class="price-row"><span class="price-old">€360</span><span class="price-new">€294</span></div>',
            '<div class="price-row"><span class="price-new">€360</span></div>')
    t = sub(t, '<p class="price-save">Save €66 · limited seats</p>', '<p class="price-save">Pay only if you continue to Barcelona</p>')
    t = sub(t, r'\s*<details class="faq-item"><summary>How long is the €294 offer\?</summary>.*?</details>', '', regex=True, flags=re.S)
    t = sub(t, '<b>€294</b> until 20 Nov', 'Full course <b>€360</b>')
    t = sub(t, '&middot; Limited seats', '&middot; Reply within 48 hours')
    t = sub(t, 'you join the full course in Barcelona at the intro price.', 'you join the full course in Barcelona.')
    t = t.replace("then €294 in Barcelona", "then €360 in Barcelona")
    return t
edit('freediving-course-barcelona/index.html', course)

# 2. About: Rimi + Shebl's dates
def about(t):
    t = sub(t, 'Architect and Product Design Lead by profession, Reem is', 'Architect and Product Design Lead by profession, Rimi is')
    t = sub(t, 'He has been teaching freediving since 2021, with five years in Dahab',
            'Freediving since 2021 and teaching since 2022, he spent five years in Dahab')
    t = re.sub(r'from the Red Sea to Bali, Sri Lanka and Tenerife', 'in Dahab, Sri Lanka and Indonesia', t)
    return t
edit('about.html', about)
edit('freediving-trips/dahab/index.html',
     lambda t: t.replace('<div><b>5 yrs</b><span>Coaching full-time</span></div>', '<div><b>Since 2022</b><span>Teaching freediving</span></div>'))

# 3. Home: Shebl's numbers, trips line
def home(t):
    t = sub(t, r'<p class="kpi-num">5 yrs</p><p class="kpi-label">Coaching full-time</p>',
            '<p class="kpi-num">Since 2022</p><p class="kpi-label">Teaching freediving</p>', regex=True)
    t = sub(t, r'<p class="kpi-num">Age 4</p><p class="kpi-label">In the water since</p>',
            '<p class="kpi-num">Age 4</p><p class="kpi-label">Swimming since</p>', regex=True)
    t = sub(t, 'Dahab, Bali, Sri Lanka, Tenerife, dive trips led personally by Shebl &amp; Rimi.',
            'Winter trips to Dahab, Sri Lanka and Indonesia, led personally by Shebl &amp; Rimi.')
    t = re.sub(r'\.exp-card\.tenerife::before\s*\{[^}]*\}\n?', '', t)
    return t
edit('index.html', home)

# 4. Travel page: three winter trips, no Tenerife, Bali card named Indonesia
def travel(t):
    t = sub(t, 'Small-group freediving expeditions to Dahab, Bali, Sri Lanka and Tenerife.',
            'Small-group winter freediving trips to Dahab, Sri Lanka and Indonesia.')
    t = sub(t, 'Four destinations. Small groups.', 'Three winter trips. Small groups.')
    t = sub(t, 'runs expeditions to four destinations:', 'runs winter trips to three destinations:')
    t = sub(t, r'\s*Tenerife, Spain — [^"]*?metres\.', '', regex=True)
    t = sub(t, r'\s*<strong[^>]*>Tenerife, Spain</strong>[^<]*', '', regex=True)
    t = sub(t, 'Four destinations.<br><em>Pick yours.</em>', 'Three winter trips.<br><em>Pick yours.</em>')
    t = sub(t, 'Trips run June, December 2026. Get in touch to hear about dates first.',
            'Winter trips. Dates announced soon: register your interest to hear first.')
    t = sub(t, r'\s*<article class="exp-card[^"]*" style="[^"]*ten-beach[^"]*">.*?</article>', '', regex=True, flags=re.S)
    t = t.replace('<!-- ── TENERIFE ── -->\n', '')
    t = strip_div(t, '<div class="dest trip" id="tenerife">')
    t = sub(t, '          <option>Tenerife, Canary Islands</option>\n', '')
    t = sub(t, '<h3 class="exp-card-title">Bali<span>Indonesia &middot; Bali to Flores</span></h3>',
            '<h3 class="exp-card-title">Indonesia<span>Bali to Flores &middot; Winter</span></h3>')
    t = sub(t, '<h3 class="trip-name">Bali</h3>', '<h3 class="trip-name">Indonesia</h3>')
    t = sub(t, '>Enquire, Bali<', '>Enquire, Indonesia<')
    t = sub(t, '<option>Bali, Indonesia</option>', '<option>Indonesia (Bali to Flores)</option>')
    return t
edit('expeditions.html', travel)

# 5. Dahab page: no link to Tenerife
edit('freediving-trips/dahab/index.html',
     lambda t: sub(t, r'\s*<a href="/freediving-trips/tenerife/">Tenerife Freediving Camp</a>', '', regex=True))

# 6. Sitemap + redirect, remove the page
edit('sitemap.xml', lambda t: re.sub(r'\s*<url><loc>[^<]*/freediving-trips/tenerife</loc>.*?</url>', '', t, flags=re.S))
def toml(t):
    if '/freediving-trips/tenerife' in t: return t
    return t.rstrip('\n') + '''

# Tenerife trip discontinued
[[redirects]]
  from = "/freediving-trips/tenerife"
  to = "/expeditions"
  status = 301
  force = true

[[redirects]]
  from = "/freediving-trips/tenerife/"
  to = "/expeditions"
  status = 301
  force = true
'''
edit('netlify.toml', toml)
if os.path.exists('freediving-trips/tenerife/index.html'):
    os.remove('freediving-trips/tenerife/index.html'); os.rmdir('freediving-trips/tenerife'); log.append('removed freediving-trips/tenerife/')

print('\n'.join(log))
