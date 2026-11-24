#!/usr/bin/env python3
"""Step 3 content: beginners course (AIDA 1+2, EUR 445), Learn hub, community on About,
the /book page, sitemap, redirects, shared nav config."""
import glob, os, re, datetime
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
log = []
def rd(p): return open(p, encoding='utf-8').read()
def wr(p, t): open(p, 'w', encoding='utf-8').write(t); log.append(f'updated {p}')
def sub(t, a, b, regex=False, flags=0):
    n = re.sub(a, b, t, flags=flags) if regex else t.replace(a, b)
    if n == t: log.append(f'  no match: {a[:70]!r}')
    return n

# ---------- Beginners course: AIDA 1 + AIDA 2, EUR 445 ----------
p = 'beginners-course/index.html'; t = rd(p)
t = re.sub(r'<title>.*?</title>', '<title>Beginners Freediving Course Barcelona | AIDA 1 + AIDA 2</title>', t, flags=re.S)
DESC = 'Learn to freedive in Barcelona. The beginners course combines AIDA 1 and AIDA 2: pool and Mediterranean open water, two certificates, all equipment included. EUR 445.'
DESC = DESC.replace('EUR 445', '€445')
t = re.sub(r'(<meta name="description" content=")[^"]*', r'\g<1>' + DESC, t)
t = re.sub(r'(<meta (?:property|name)="(?:og|twitter):description" content=")[^"]*', r'\g<1>' + DESC, t)
t = re.sub(r'(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*', r'\g<1>Beginners Freediving Course Barcelona | AIDA 1 + AIDA 2', t)
t = re.sub(r'"name":"Beginner Freediving Course \(AIDA 2\) in Barcelona","description":"[^"]*"',
           '"name":"Beginners Freediving Course (AIDA 1 + AIDA 2) in Barcelona","description":"' + DESC + '"', t)
t = sub(t, '"price":"360"', '"price":"445"')
t = re.sub(r'"courseMode":\["Online","Onsite"\]', '"courseMode":["Onsite"]', t)
t = re.sub(r'("name":"Beginner Freediving Course","item":")[^"]*', r'\1https://freedivingbrain.com/beginners-course', t)
t = t.replace('"name":"Beginner Freediving Course"', '"name":"Beginners course"')

t = sub(t, '<p class="lab-eyebrow">Beginner freediving · AIDA 2 · Barcelona</p>', '<p class="lab-eyebrow">Beginners course · AIDA 1 + AIDA 2 · Barcelona</p>')
t = sub(t, '<h1>Learn to freedive<br><span style="color:var(--gold);font-style:italic">Try it free first.</span></h1>',
        '<h1>Your first freediving course<br><span style="color:var(--gold);font-style:italic">From first breath to open water.</span></h1>')
t = sub(t, "Start with a free live online session. Love it? Join us in Barcelona for the full beginner course. Not for you? You don't pay anything.",
        'No experience needed. In 3.5 days you go from your first calm breath-hold in the pool to guided dives in the Mediterranean, and leave with two AIDA certificates.')
t = sub(t, '<div class="offer-pill"><span class="free">Online intro: free</span><span>·</span><span>Full course <b>€360</b></span></div>',
        '<div class="offer-pill"><span>AIDA 1 + AIDA 2</span><span>·</span><span>3.5 days</span><span>·</span><b>€445</b></div>')
t = re.sub(r'<a href="/book\?for=beginners" class="lab-cta">Book now</a>(\s*<a href="#how" class="lab-cta ghost">)',
           r'<a href="/book?for=beginners" class="lab-cta">Book now</a>\1', t)

# how it works
t = sub(t, 'Try it online. Then <em>meet us in the water.</em>', 'Pool first. <em>Then the sea.</em>')
t = sub(t, "No risk, no pressure. You only pay once you've met us and decided you want to carry on.",
        'Two AIDA levels in one course, in the order your body learns best. Small groups, all equipment included.')
t = re.sub(r'<p class="step-t">Free 60-minute online session</p><p class="step-d">.*?</p><span class="step-tag">[^<]*</span>',
           '<p class="step-t">Day 1 · AIDA 1 in the pool</p><p class="step-d">Breathing, relaxation and your first calm breath-holds. You feel the dive reflex and learn how freedivers keep each other safe.</p><span class="step-tag">AIDA 1 certificate</span>', t, flags=re.S)
t = re.sub(r'<p class="step-t">You decide</p><p class="step-d">.*?</p><span class="step-tag">[^<]*</span>',
           '<p class="step-t">AIDA 2 · pool and theory</p><p class="step-d">Equalisation, efficient finning, rescue and buddy skills, practised calmly in the pool before you head out.</p><span class="step-tag">Technique &amp; safety</span>', t, flags=re.S)
t = re.sub(r'<p class="step-t">Barcelona: pool \+ sea</p><p class="step-d">.*?</p><span class="step-tag">[^<]*</span>',
           '<p class="step-t">AIDA 2 · the Mediterranean</p><p class="step-d">Guided open-water dives, building calmly towards around 20 m at your own pace.</p><span class="step-tag">AIDA 2 certificate</span>', t, flags=re.S)
t = t.replace('<div class="step free">', '<div class="step">')

# offer card
t = sub(t, '<p class="section-tag">The offer</p>', '<p class="section-tag">The course</p>')
t = sub(t, 'Pay only if you <em>want to continue.</em>', 'One course. <em>Two certificates.</em>')
t = re.sub(r'<div class="promise">.*?</div>',
           '<div class="promise"><p>From never having freedived<br><em>to diving in the open sea.</em></p><span>AIDA 1 and AIDA 2 together, taught as one course by an AIDA Instructor Trainer. Everything is included: pool sessions, open-water dives, equipment and both certificates.</span></div>', t, count=1, flags=re.S)
t = sub(t, '<span class="price-badge">Online intro free</span>', '<span class="price-badge">Beginners course</span>')
t = sub(t, '<p class="price-name">Beginner Freediving Course (AIDA 2)</p>', '<p class="price-name">AIDA 1 + AIDA 2</p>')
t = sub(t, '<p class="price-sub">60-min online intro + 2.5 days in Barcelona</p>', '<p class="price-sub">3.5 days · pool + Mediterranean · Barcelona</p>')
t = sub(t, '<div class="price-row"><span class="price-new">€360</span></div>', '<div class="price-row"><span class="price-new">€445</span></div>')
t = sub(t, '<p class="price-save">Pay only if you continue to Barcelona</p>', '<p class="price-save">No experience needed</p>')
t = sub(t, '<li class="hl">Free 60-minute live online session with Shebl</li>', '<li class="hl">AIDA 1 and AIDA 2 certificates</li>')
t = sub(t, '<li>AIDA 2 certificate</li>\n', '')
t = sub(t, '<p class="price-fine">You only pay if you continue to Barcelona.</p>', '<p class="price-fine">We confirm your dates within 48 hours.</p>')

# FAQ
t = re.sub(r'\s*<details class="faq-item"><summary>What happens in the free online session\?</summary>.*?</details>', '', t, flags=re.S)
t = re.sub(r'\s*<details class="faq-item"><summary>What if I don\'t want to continue\?</summary>.*?</details>', '', t, flags=re.S)
t = re.sub(r'<summary>Do I need any experience\?</summary><p>.*?</p>',
           '<summary>Do I need any experience?</summary><p>No. This course is made for complete beginners. You only need to be comfortable in the water.</p>', t, flags=re.S)
t = re.sub(r'(<details class="faq-item"><summary>Is equipment included\?</summary>.*?</details>)',
           r'\1\n    <details class="faq-item"><summary>Can I book AIDA 1 on its own?</summary><p>No. AIDA 1 is part of the beginners course. If you already have AIDA 1 or an equivalent certificate, you can book <a href="/courses/aida-2">AIDA 2</a> on its own.</p></details>', t, flags=re.S)
# sticky mobile bar
t = re.sub(r'<p>Online intro <b>free</b><br>Full course <b>€360</b></p><a href="[^"]*" tabindex="-1">[^<]*</a>',
           '<p>Beginners course<br><b>€445</b> · AIDA 1 + 2</p><a href="/book?for=beginners" tabindex="-1">Book now</a>', t)
# copy that still mentions the online session
t = t.replace("const fd", "const fd")
wr(p, t)

# ---------- Learn hub (former blog index) + the 9 guides ----------
p = 'learn/index.html'; t = rd(p)
t = re.sub(r'<title>.*?</title>', '<title>Learn Freediving | Guides & Articles · Barcelona Freedivers</title>', t, flags=re.S)
t = re.sub(r'(<meta name="description" content=")[^"]*', r'\1Freediving guides and articles: equalisation, safety, breath-hold, the dive reflex and the mental side of freediving, by Barcelona Freedivers.', t)
t = sub(t, '<p class="blog-hero-label">The Barcelona Freedivers Blog</p>', '<p class="blog-hero-label">Learn</p>')
t = sub(t, '<h1>Science, method,<br><em>and the quiet mind</em></h1>', '<h1>Guides and articles<br><em>for every freediver</em></h1>')
t = sub(t, '<p>Articles on the physiology, technique, and mental game of freediving, written from the water up.</p>',
        '<p>Technique, safety and the mental side of freediving, from your first breath-hold to deeper diving.</p>')
GUIDES = [
    ('freediving-equalization', 'Equalisation', 'Freediving equalization: from Frenzel to deeper diving', 'How equalisation changes with depth, and how to build a technique that keeps working as you go deeper.', 'c2s-sea'),
    ('frenzel-equalization', 'Equalisation', 'Frenzel equalization for freediving', 'The core technique behind comfortable freediving, and the most common mistakes.', 'training-line'),
    ('equalization-problems', 'Equalisation', 'Why your equalization stops working', 'The usual reasons ears stop clearing at depth, and what to work on.', 'commx-15'),
    ('mouthfill-equalization', 'Equalisation', 'Mouthfill equalization for deeper freediving', 'What the mouthfill is for, when to take it and how to control it.', 'commx-21'),
    ('freediving-safety', 'Safety', 'Freediving safety: the systems that make the sport possible', 'Buddying, blackout, LMC and recovery: the rules every freediver lives by.', 'students-buoy-2'),
    ('shallow-water-blackout', 'Safety', 'Shallow water blackout in freediving', 'Why it happens, who is at risk and how it is prevented.', 'comm-dahab-buoy'),
    ('breath-hold-training', 'Training', 'Breath-hold training: train the response, not the struggle', 'CO₂ tolerance, relaxation and safer ways to train your breath-hold.', 'pl-band-3'),
    ('mental-training-freediving', 'Mental training', 'Mental training: calm is a performance skill', 'Focus, attention and staying calm when the urge to breathe arrives.', 'pool-coaching-session'),
]
from PIL import Image
cards = ''
for slug, tag, title, ex, img in GUIDES:
    w, h = Image.open(img + '.jpg').size
    cards += (f'\n  <a class="article-card" href="/learn/{slug}">\n    <div class="ac-img">\n      <picture><source srcset="/{img}.avif" type="image/avif"><source srcset="/{img}.webp" type="image/webp">'
              f'<img src="/{img}.jpg" alt="" width="{w}" height="{h}" loading="lazy" decoding="async"></picture>\n    </div>\n'
              f'    <div class="ac-body">\n      <p class="ac-tag">Guide · {tag}</p>\n      <h2 class="ac-title">{title}</h2>\n'
              f'      <p class="ac-excerpt">{ex}</p>\n      <p class="ac-meta">Guide &nbsp;·&nbsp; Abdelrahman Shebl</p>\n    </div>\n  </a>\n')
if '/learn/freediving-safety"' not in t:
    t = sub(t, '<section class="blog-grid">', '<section class="blog-grid">' + cards)
t = re.sub(r'<section class="blog-cta">.*?</section>',
           '<section class="blog-cta">\n  <h2>Ready to learn in the water?</h2>\n  <p>The beginners course takes you from your first breath-hold to the open sea in 3.5 days.</p>\n  <a href="/book?for=beginners" class="btn-primary">Book now</a>\n</section>', t, flags=re.S)
wr(p, t)

# ---------- About: community section ----------
p = 'about.html'; t = rd(p)
if 'id="community"' not in t:
    comm = '''
<!-- COMMUNITY -->
<section class="bf-community" id="community">
  <div class="bf-community-inner">
    <p class="bf-book-eyebrow">Community</p>
    <h2>A freediving community in Barcelona</h2>
    <p>Freediving is built on trust, so we want people to meet reliable buddies, train together and keep the sport social as well as safe.</p>
    <div class="bf-community-grid">
      <div><h3>Find buddies</h3><p>Meet other freedivers for pool sessions, open-water dives and shared training. Nobody should practise breath-hold diving alone.</p></div>
      <div><h3>Train together</h3><p>Dry practice, stretching, pool training and Mediterranean sessions, matched to your certification and experience.</p></div>
      <div><h3>Start freediving</h3><p>Not certified yet? Meet people in the sport and join the beginners course when you are ready.</p></div>
    </div>
  </div>
</section>
'''
    t = t.replace('<!-- BF:FOOTER -->', comm + '\n<!-- BF:FOOTER -->', 1)
    wr(p, t)

# ---------- /book page ----------
OPTIONS = [
    ('Beginners', [('beginners', 'Beginners course · AIDA 1 + AIDA 2 · €445')]),
    ('Courses', [('aida-2', 'AIDA 2 · €360'), ('aida-3', 'AIDA 3 · €430'), ('aida-4', 'AIDA 4 · €575'),
                 ('aida-2-3', 'AIDA 2 + AIDA 3 · €710'), ('aida-1-4', 'AIDA 1 to AIDA 4 · €1,310'), ('instructor', 'AIDA Instructor course · €1,440')]),
    ('Training', [('training-pool', 'Pool training'), ('training-open-water', 'Open-water training')]),
    ('Winter trips · dates announced soon', [('trip-dahab', 'Dahab, Egypt'), ('trip-indonesia', 'Indonesia'), ('trip-sri-lanka', 'Sri Lanka')]),
    ('Teams', [('team', 'Team day or retreat for a company')]),
    ('Other', [('other', 'Not sure yet / a question')]),
]
opts = ''.join('<optgroup label="%s">%s</optgroup>' % (g, ''.join(f'<option value="{v}">{l}</option>' for v, l in items)) for g, items in OPTIONS)
book = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Book now | Barcelona Freedivers</title>
<meta name="description" content="Book a freediving course, training session, winter trip or team day with Barcelona Freedivers. We reply within 48 hours.">
<link rel="canonical" href="https://freedivingbrain.com/book">
<link rel="stylesheet" href="/type-system.css?v=5">
</head>
<body>
<main class="bf-bookpage">
  <div class="bf-bookpage-intro">
    <p class="bf-book-eyebrow">Book now</p>
    <h1>Tell us what you'd like to do</h1>
    <p>Choose a course, training, trip or team day. We reply within 48 hours to confirm dates and details.</p>
    <ul class="bf-bookpage-points"><li>Small groups</li><li>All equipment included on courses</li><li>Reply within 48 hours</li></ul>
    <p class="bf-book-alt">Prefer to talk first? <a href="https://wa.me/34603083325" target="_blank" rel="noopener">Message us on WhatsApp</a></p>
  </div>
  <form class="bf-form" id="bookForm" novalidate>
    <p hidden><label>Leave this empty <input name="bot-field"></label></p>
    <label class="bf-field bf-full"><span>What would you like to book?</span>
      <select name="booking" id="bookItem" required><option value="">Choose one</option>{opts}</select></label>
    <label class="bf-field"><span>Name</span><input type="text" name="name" autocomplete="name" required></label>
    <label class="bf-field"><span>Email</span><input type="email" name="email" autocomplete="email" required></label>
    <label class="bf-field"><span>WhatsApp (optional)</span><input type="tel" name="phone" autocomplete="tel" placeholder="+34 ..."></label>
    <label class="bf-field"><span>Preferred dates</span><input type="text" name="dates" placeholder="e.g. next month, weekends, flexible"></label>
    <label class="bf-field bf-full" id="groupField" hidden><span>Group size</span><input type="text" name="group-size" placeholder="Roughly how many people?"></label>
    <label class="bf-field bf-full"><span>Anything we should know?</span><textarea name="message" rows="3" placeholder="Questions, experience, goals..."></textarea></label>
    <button type="submit" class="bf-btn bf-full" id="bookSend">Book now</button>
    <p class="bf-form-note bf-full" id="bookNote">We'll reply within 48 hours.</p>
  </form>
</main>
<script>
(function(){{
  var sel=document.getElementById('bookItem'), group=document.getElementById('groupField'), form=document.getElementById('bookForm');
  var want=new URLSearchParams(location.search).get('for');
  if(want==='courses') want='';
  if(want==='trips') want='trip-dahab';
  if(want==='training') want='training-pool';
  if(want && sel.querySelector('option[value="'+want+'"]')) sel.value=want;
  function upd(){{ group.hidden=!/^(team|trip-)/.test(sel.value); }}
  sel.addEventListener('change',upd); upd();
  form.addEventListener('submit',function(e){{
    e.preventDefault();
    if(form.querySelector('[name="bot-field"]').value) return;
    if(!form.checkValidity()){{ form.reportValidity(); return; }}
    var fd=new FormData(form); fd.delete('bot-field');
    fd.set('booking', sel.options[sel.selectedIndex].text);
    fd.append('_subject','New booking request: '+sel.options[sel.selectedIndex].text);
    fd.append('_template','table'); fd.append('_captcha','false');
    fd.append('_autoresponse','Thanks for booking with Barcelona Freedivers! We have your request and will reply within 48 hours to confirm dates and details.');
    var btn=document.getElementById('bookSend'); btn.disabled=true; btn.textContent='Sending...';
    fetch('https://formsubmit.co/ajax/hello@freedivingbrain.com',{{method:'POST',headers:{{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'}},body:new URLSearchParams(fd).toString()}})
      .then(function(r){{ if(!r.ok) throw 0; btn.textContent='Sent! We\\'ll reply within 48 hours.'; }})
      .catch(function(){{ btn.disabled=false; btn.textContent='Book now'; document.getElementById('bookNote').innerHTML='Something went wrong. Please try again or <a href="https://wa.me/34603083325">message us on WhatsApp</a>.'; }});
  }});
}})();
</script>
</body>
</html>
'''
os.makedirs('book', exist_ok=True)
if not os.path.exists('book/index.html'):
    open('book/index.html', 'w').write(book); log.append('created book/index.html')

# ---------- sitemap ----------
today = datetime.date.today().isoformat()
urls = []
for f in sorted(glob.glob('**/*.html', recursive=True)):
    if f.startswith('tools/') or f in ('404.html',): continue
    if 'http-equiv="refresh"' in rd(f)[:3000]: continue
    path = '/' + re.sub(r'(index)?\.html$', '', f).rstrip('/')
    path = path if path != '/' else '/'
    pr = '1.0' if path == '/' else ('0.9' if path in ('/beginners-course', '/courses', '/book') else ('0.6' if path.startswith('/learn/') else '0.8'))
    urls.append(f'  <url><loc>https://freedivingbrain.com{path if path!="/" else "/"}</loc><lastmod>{today}</lastmod><changefreq>monthly</changefreq><priority>{pr}</priority></url>')
open('sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(urls) + '\n</urlset>\n')
log.append(f'sitemap: {len(urls)} urls')

# ---------- redirects ----------
toml = rd('netlify.toml')
toml = re.sub(r'\[\[redirects\]\]\s*from = "/blog/?(?::slug/?)?"\s*to = "/blog/[^"]*"\s*status = 200\s*', '', toml)
toml = toml.replace('to = "/blog/mammalian-dive-response"', 'to = "/learn/mammalian-dive-response"')
toml = toml.replace('to = "/blog"', 'to = "/learn"').replace('to = "/expeditions"', 'to = "/trips"')
RULES = [('/freediving-course-barcelona', '/beginners-course'), ('/packages', '/courses'), ('/packages.html', '/courses'),
         ('/expeditions', '/trips'), ('/expeditions.html', '/trips'), ('/blog', '/learn'), ('/blog/*', '/learn/:splat'),
         ('/courses/aida-1', '/beginners-course'), ('/training/pool', '/training'), ('/training/open-water', '/training'),
         ('/corporate-team-building-barcelona', '/team-building'), ('/barcelona/freediving-community', '/about#community'),
         ('/es/apnea-barcelona', '/'), ('/es/curso-aida-1-barcelona', '/beginners-course'), ('/es/curso-aida-2-barcelona', '/courses/aida-2'),
         ('/es/entrenamiento-apnea-barcelona', '/training'), ('/es/*', '/')]
if '/beginners-course' not in toml:
    add = '\n# Step 3 site structure\n'
    for src, dst in RULES:
        for s in ([src] if src.endswith(('*', '.html')) else [src, src + '/']):
            add += f'[[redirects]]\n  from = "{s}"\n  to = "{dst}"\n  status = 301\n  force = true\n\n'
    toml = toml.rstrip('\n') + '\n' + add
open('netlify.toml', 'w').write(toml); log.append('updated netlify.toml')
print('\n'.join(log))
