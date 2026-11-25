#!/usr/bin/env python3
"""Step 5: new homepage (short, facts first, beginners in Barcelona, one CTA).
Writes index.html; run tools/rebrand.py afterwards for the shared header/footer."""
import json, os
from PIL import Image
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URL = 'https://freedivingbrain.com'

def pic(name, alt, cls='', pos=None, eager=False):
    w, h = Image.open(name + '.jpg').size
    st = f' style="object-position:{pos}"' if pos else ''
    c = f' class="{cls}"' if cls else ''
    ld = 'eager" fetchpriority="high' if eager else 'lazy'
    return (f'<picture{c}><source srcset="/{name}.avif" type="image/avif"><source srcset="/{name}.webp" type="image/webp">'
            f'<img src="/{name}.jpg" alt="{alt}" width="{w}" height="{h}" loading="{ld}" decoding="async"{st}></picture>')

COURSES = [
    ('Beginner', 'AIDA 1 + AIDA 2', '3.5 days · pool + sea · no experience needed', '€420', '/courses/beginners', 'beginners'),
    ('Intermediate', 'AIDA 3', '3 days · pool + sea · to ~30 m', '€460', '/courses/aida-3', 'aida-3'),
    ('Advanced · Master', 'AIDA 4', '4 days · pool + sea · to ~40 m', '€575', '/courses/aida-4', 'aida-4'),
    ('Instructor', 'AIDA Instructor', '10–21 days · max 3 candidates', '€1,500', '/courses/aida-instructor', 'instructor'),
]
FAQ = [
    ('Do I need any experience?', 'No. The Beginner course is made for complete beginners. You only need to be comfortable in the water.'),
    ('Is freediving safe?', 'Yes, when it is taught properly. Every session is led by an AIDA Instructor Trainer, in small groups, with strict buddy and safety rules from day one.'),
    ('Where do the courses take place?', 'In Barcelona: pool sessions first, then open-water dives in the Mediterranean.'),
    ('Is equipment included?', 'Yes. All equipment is included in every course price. Bring a swimsuit and a towel.'),
]

ladder = ''.join(
    f'<a class="bf-level" href="{href}"><span class="bf-level-n">{i}</span><span class="bf-level-name">{name}</span>'
    f'<span class="bf-level-aida">{aida}</span><span class="bf-level-meta">{meta}</span><span class="bf-level-price">{price}</span>'
    f'<span class="bf-level-link">Course details →</span></a>'
    for i, (name, aida, meta, price, href, _) in enumerate(COURSES, 1))
faq_html = ''.join(f'<details class="bf-faq-item"><summary>{q}</summary><p>{a}</p></details>' for q, a in FAQ)

ld = [
    {"@context": "https://schema.org", "@type": "SportsActivityLocation", "name": "Barcelona Freedivers",
     "description": "AIDA freediving school in Barcelona: courses from beginner to instructor, pool and open-water training, winter trips and team days.",
     "url": URL + "/", "logo": URL + "/logo-full.png", "image": URL + "/og-image.jpg", "telephone": "+34603083325",
     "address": {"@type": "PostalAddress", "addressLocality": "Barcelona", "addressCountry": "ES"},
     "founder": {"@type": "Person", "name": "Abdelrahman Shebl", "jobTitle": "AIDA Instructor Trainer"},
     "makesOffer": [{"@type": "Offer", "name": f"{n} — {a}", "price": p.replace('€', '').replace(',', ''), "priceCurrency": "EUR", "url": URL + h}
                    for n, a, _, p, h, _ in COURSES]},
    {"@context": "https://schema.org", "@type": "FAQPage",
     "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]},
]

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-VR5PT4F97R"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-VR5PT4F97R');</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="google-site-verification" content="pM-Q4COXMF1RaXnDa1TjGoto4Wmm2b0T_fFWu_de0FQ" />
<title>Freediving Courses in Barcelona | Barcelona Freedivers</title>
<meta name="description" content="Learn to freedive in Barcelona. AIDA courses from beginner to instructor in the pool and the Mediterranean. Beginner course (AIDA 1 + 2) €420, no experience needed.">
<link rel="canonical" href="{URL}/">
<meta property="og:type" content="website">
<meta property="og:url" content="{URL}/">
<meta property="og:title" content="Freediving Courses in Barcelona | Barcelona Freedivers">
<meta property="og:description" content="AIDA freediving courses from beginner to instructor, in the pool and the Mediterranean. Small groups, all equipment included.">
<meta property="og:image" content="{URL}/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" as="image" type="image/avif" href="/commx-21.avif">
<link rel="stylesheet" href="/type-system.css?v=5">
{''.join('<script type="application/ld+json">' + json.dumps(x, ensure_ascii=False) + '</script>' for x in ld)}
</head>
<body class="bf-home">

<!-- HERO -->
<section class="bf-hero photo-hero">
  {pic('commx-21', 'Two freedivers descending together along the line', 'bf-hero-img', 'center 40%', eager=True)}
  <div class="bf-hero-inner">
    <p class="bf-eyebrow">AIDA freediving school · Barcelona</p>
    <h1>Learn to freedive<br><em>in Barcelona.</em></h1>
    <p class="bf-hero-lead">Calm, small-group AIDA courses in the pool and the Mediterranean. No experience needed.</p>
    <p class="bf-hero-offer"><strong>Beginner course</strong><span>AIDA 1 + AIDA 2</span><span>3.5 days</span><span>€420</span></p>
    <div class="bf-actions"><a href="/book?for=beginners" class="bf-btn">Book now</a><a href="/courses" class="bf-btn bf-btn-ghost">See all courses</a></div>
  </div>
</section>

<!-- TRUST -->
<ul class="bf-trust">
  <li><strong>160+</strong> freedivers certified</li>
  <li><strong>AIDA</strong> Instructor Trainer &amp; Judge</li>
  <li><strong>Small</strong> groups</li>
  <li><strong>All</strong> equipment included</li>
</ul>

<!-- BEGINNER COURSE -->
<section class="bf-sec">
  <div class="bf-wrap bf-split">
    <div>
      <p class="bf-eyebrow">Start here</p>
      <h2>Your first freediving course</h2>
      <p class="bf-lead">AIDA 1 and AIDA 2 in one course: pool first, then the sea. You leave with two AIDA certificates and the calm to keep going.</p>
      <ol class="bf-steps">
        <li><b>Day 1 · Pool</b><span>Breathing, relaxation and your first calm breath-holds.</span></li>
        <li><b>Technique &amp; safety</b><span>Equalisation, finning, rescue and buddy skills.</span></li>
        <li><b>The Mediterranean</b><span>Guided open-water dives, building towards around 20 m.</span></li>
      </ol>
      <p class="bf-price-line"><strong>€420</strong> · 3.5 days · all equipment included</p>
      <div class="bf-actions"><a href="/book?for=beginners" class="bf-btn">Book now</a><a href="/courses/beginners" class="bf-link">Course details →</a></div>
    </div>
    <div class="bf-photo-stack">
      {pic('students-buoy-openwater', 'Students smiling at the buoy in open water', 'bf-photo-main', 'center 40%')}
      {pic('c2s-pool', 'Two divers practising in the pool', 'bf-photo-sub')}
    </div>
  </div>
</section>

<!-- LEVELS -->
<section class="bf-sec bf-sec-alt">
  <div class="bf-wrap">
    <p class="bf-eyebrow">Courses</p>
    <h2>From beginner to instructor</h2>
    <p class="bf-lead">Four AIDA levels, taught with the same calm, mind-first method.</p>
    <div class="bf-levels bf-swipe">{ladder}</div>
  </div>
</section>

<!-- MORE -->
<section class="bf-sec">
  <div class="bf-wrap">
    <p class="bf-eyebrow">More with us</p>
    <h2>Keep diving after your course</h2>
    <div class="bf-cards bf-swipe">
      <a class="bf-card" href="/training">{pic('tr-pool', 'Pool training session', 'bf-card-img')}<span class="bf-card-body"><b>Training</b><span>Pool and open-water sessions for certified freedivers.</span><em>From €48 per session</em></span></a>
      <a class="bf-card" href="/trips">{pic('dhj-hero', 'Dahab coastline from above', 'bf-card-img', 'center 50%')}<span class="bf-card-body"><b>Winter trips</b><span>Dahab, Sri Lanka and Indonesia, led by Shebl &amp; Rimi.</span><em>Dates announced soon</em></span></a>
      <a class="bf-card" href="/team-building">{pic('tb-corporate-team', 'A team smiling together in the water', 'bf-card-img', 'center 45%')}<span class="bf-card-body"><b>Teams</b><span>Team days and retreats for companies.</span><em>Price on request</em></span></a>
    </div>
  </div>
</section>

<!-- INSTRUCTORS -->
<section class="bf-sec bf-sec-alt">
  <div class="bf-wrap">
    <p class="bf-eyebrow">Your instructors</p>
    <h2>Taught by Shebl &amp; Rimi</h2>
    <div class="bf-people bf-swipe">
      <a class="bf-person" href="/about/shebl">{pic('shebl', 'Shebl', 'bf-person-img')}<span><b>Shebl</b><em>AIDA Instructor Trainer &amp; Judge · Founder</em><span>Freediving since 2021 and teaching since 2022. He teaches every level, from beginner to instructor, and has certified more than 160 freedivers.</span></span></a>
      <a class="bf-person" href="/about">{pic('rimi', 'Rimi', 'bf-person-img', 'center 25%')}<span><b>Rimi</b><em>Assistant Instructor &amp; AIDA Judge</em><span>The first and deepest Iraqi female freediver, and the architect behind every Barcelona Freedivers trip.</span></span></a>
    </div>
    <p class="bf-more"><a href="/about" class="bf-link">Our story →</a></p>
  </div>
</section>

<!-- FAQ -->
<section class="bf-sec">
  <div class="bf-wrap bf-narrow">
    <p class="bf-eyebrow">Good to know</p>
    <h2>Questions before you start</h2>
    <div class="bf-faq">{faq_html}</div>
    <p class="bf-more"><a href="/faq" class="bf-link">All questions →</a></p>
  </div>
</section>

<!-- BF:BOOK -->
<section class="bf-book" id="book">
  <div class="bf-book-inner">
    <p class="bf-book-eyebrow">Ready to start?</p>
    <h2>Book your first freediving course</h2>
    <p>Tell us when you would like to come. We confirm dates within 48 hours.</p>
    <a href="/book?for=beginners" class="bf-btn">Book now</a>
    <p class="bf-book-alt">Prefer to talk first? <a href="https://wa.me/34603083325" target="_blank" rel="noopener">Message us on WhatsApp</a></p>
  </div>
</section>
<!-- /BF:BOOK -->

</body>
</html>
'''
open('index.html', 'w', encoding='utf-8').write(page)
print('index.html written', len(page))
