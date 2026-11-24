#!/usr/bin/env python3
"""Step 6: rebuild every page on the shared kit (one template).
Run: python3 tools/build_pages.py && python3 tools/rebrand.py"""
import glob, html, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
os.chdir(ROOT)
done = []

# =====================================================================
# COURSES
# =====================================================================
LEVELS = [
    ('Beginner', 'AIDA 1 + AIDA 2', '3.5 days · pool + sea · no experience needed', '€420', '/courses/beginners'),
    ('Intermediate', 'AIDA 3', '3 days · pool + sea · to ~30 m', '€460', '/courses/aida-3'),
    ('Advanced · Master', 'AIDA 4', '4 days · pool + sea · to ~40 m', '€575', '/courses/aida-4'),
    ('Instructor', 'AIDA Instructor', '10–21 days · max 3 candidates', '€1,500', '/courses/aida-instructor'),
]
def ladder():
    return '<div class="bf-levels bf-swipe">' + ''.join(
        f'<a class="bf-level" href="{h}"><span class="bf-level-n">{i}</span><span class="bf-level-name">{n}</span>'
        f'<span class="bf-level-aida">{a}</span><span class="bf-level-meta">{m}</span><span class="bf-level-price">{p}</span>'
        f'<span class="bf-level-link">Course details →</span></a>' for i, (n, a, m, p, h) in enumerate(LEVELS, 1)) + '</div>'

INCLUDED = ['All equipment', 'Small groups', 'AIDA certification', 'Pool + Mediterranean', 'Theory and course materials', 'English instruction']
COURSE_FAQ = [
    ('Do I need any experience?', 'Not for the Beginner course. It is made for complete beginners: you only need to be comfortable in the water. Each next level requires the one before it.'),
    ('Where do the courses take place?', 'In Barcelona: pool sessions first, then open-water dives in the Mediterranean.'),
    ('Are AIDA certificates recognised worldwide?', 'Yes. AIDA certificates are accepted at freediving schools, dive sites and liveaboards worldwide, and they do not expire.'),
    ('I already have a certificate from another school. Can I continue here?', 'Yes. AIDA certificates are recognised internationally, so you start from your next level. Certified freedivers can also join our training sessions.'),
]
body = (hero('commx-21', 'Freediving courses · Barcelona', 'From beginner<br><em>to instructor.</em>',
             'Four AIDA levels, taught in small groups with the same calm, mind-first method. Start as a complete beginner and go as far as you want.',
             ['AIDA certified', 'Pool + Mediterranean', 'All equipment included'],
             [btn('/book?for=beginners'), btn('#levels', 'Compare the levels', ghost=True)])
        + sec(heading('Courses', 'Choose your level', 'Each level is a full AIDA certification. AIDA 1 and AIDA 2 are always taught together as the Beginner course.') + ladder(), alt=True, sid='levels')
        + sec('<div class="bf-two">' + '<div>' + heading('Every course includes', 'Everything you need', 'Bring a swimsuit and a towel. We take care of the rest.') + '</div>'
              + '<div>' + checklist(INCLUDED) + '</div></div>')
        + sec(heading('Good to know', 'Course questions') + faq(COURSE_FAQ) + f'<p class="bf-more">{link("/faq", "All questions →")}</p>', alt=True, narrow=True)
        + book('Ready to start?', 'Book your course', 'Choose your level and tell us when you would like to come. We confirm dates within 48 hours.', 'courses'))
done.append(page('courses/index.html', body, 'AIDA Freediving Courses in Barcelona | Barcelona Freedivers',
                  'AIDA freediving courses in Barcelona: Beginner (AIDA 1 + 2) €420, Intermediate (AIDA 3) €460, Advanced (AIDA 4) €575 and Instructor €1,500. Small groups, all equipment included.'))

COURSE_PAGES = {
 'courses/beginners/index.html': dict(
    level='Beginner', aida='AIDA 1 + AIDA 2', price='€420', days='3.5 days', item='beginners', img='students-buoy-2', pos='center 45%',
    title='Your first freediving course', em='From first breath to open water.',
    lead='No experience needed. In 3.5 days you go from your first calm breath-hold in the pool to guided dives in the Mediterranean, and leave with two AIDA certificates.',
    facts=['AIDA 1 + AIDA 2', '3.5 days', 'Pool + sea', '€420'],
    learn=['Breathing and relaxation before every dive', 'Longer, calmer breath-holds in the pool', 'Equalisation: clear your ears comfortably as you go down',
           'Finning and technique that save oxygen', 'Safety, rescue and the buddy system', 'Calm, guided open-water dives around 20 m'],
    steps=[('Day 1 · AIDA 1 in the pool', 'Breathing, relaxation and your first calm breath-holds. You feel the dive reflex and learn how freedivers keep each other safe.'),
           ('AIDA 2 · pool and theory', 'Equalisation, efficient finning, rescue and buddy skills, practised calmly in the pool before you head out.'),
           ('AIDA 2 · the Mediterranean', 'Guided open-water dives, building calmly towards around 20 m at your own pace.')],
    learn_img='c2s-pool', requirement='No experience needed. Comfortable in the water.',
    faq=[('Do I need any experience?', 'No. This course is made for complete beginners. You only need to be comfortable in the water.'),
         ('Can I book AIDA 1 or AIDA 2 on its own?', 'No. AIDA 1 and AIDA 2 are always taught together as one course, so you learn in the right order: pool first, then the sea.'),
         ('How deep will I go?', 'The course works towards dives of around 20 m, always at your own pace and comfort.'),
         ('Is equipment included?', 'Yes, all equipment is included in the course price.')],
    next=('Intermediate', 'AIDA 3', '/courses/aida-3'),
    seo=('Beginner Freediving Course Barcelona | AIDA 1 + AIDA 2 · €420', 'Learn to freedive in Barcelona. The Beginner course combines AIDA 1 and AIDA 2: pool and Mediterranean open water, two certificates, all equipment included. €420.')),
 'courses/aida-3/index.html': dict(
    level='Intermediate', aida='AIDA 3', price='€460', days='3 days', item='aida-3', img='commx-15', pos='center 30%',
    title='AIDA 3 freediving course', em='Where freediving starts to feel different.',
    lead='You develop freefall, refine equalisation and learn how relaxation and attention change as the dives become deeper.',
    facts=['AIDA 3', '3 days', 'Pool + sea', '€460'],
    learn=['Freefall and depth technique', 'Advanced equalisation', 'Pool performance development', 'Rescue and safety refinement', 'Mental performance protocol', 'AIDA 3 certification'],
    learn_img='commx-21', requirement='AIDA 2 (or the Beginner course) or a recognised equivalent.',
    faq=[('What changes from AIDA 2 to AIDA 3?', 'AIDA 3 develops deeper open-water technique, freefall, more advanced equalisation, stronger safety skills and more independent training awareness.'),
         ('Do I need AIDA 2 first?', 'Yes. AIDA 3 requires AIDA 2 or a recognised equivalent certification.'),
         ('Is mouthfill part of deeper freediving?', 'Mouthfill is an advanced equalisation strategy used by deeper freedivers. Whether and when it is introduced depends on your Frenzel control, depth needs and readiness.')],
    next=('Advanced · Master', 'AIDA 4', '/courses/aida-4'),
    seo=('AIDA 3 Freediving Course Barcelona | Intermediate · €460', 'AIDA 3 freediving course in Barcelona: freefall, advanced equalisation and depth to around 30 m in the Mediterranean. 3 days, €460, all equipment included.')),
 'courses/aida-4/index.html': dict(
    level='Advanced · Master', aida='AIDA 4', price='€575', days='4 days', item='aida-4', img='c2s-sea', pos='center 40%',
    title='AIDA 4 freediving course', em='The Master Freediver level.',
    lead='Go beyond completing dives: understand training, advanced rescue, deeper technique and how to coach your own progression intelligently.',
    facts=['AIDA 4', '4 days', 'Pool + sea', '€575'],
    learn=['Advanced depth development', 'Advanced rescue and safety', 'Equalisation and deep-dive strategy', 'Self-coaching and training planning', 'Pool and open-water performance', 'AIDA 4 certification'],
    learn_img='training-line', requirement='AIDA 3 and a current first aid certificate.',
    faq=[('Who is AIDA 4 for?', 'Experienced freedivers who have AIDA 3 and want to develop advanced depth, rescue, training planning and self-coaching skills.'),
         ('Is AIDA 4 only about reaching 40 metres?', 'No. Depth is only one part. Advanced rescue, technique, planning, equalisation and training intelligently are central to the Master Freediver level.'),
         ('Does AIDA 4 prepare me for instructor training?', 'Yes. It builds the technical, safety and self-coaching foundation expected before instructor-level training.')],
    next=('Instructor', 'AIDA Instructor', '/courses/aida-instructor'),
    seo=('AIDA 4 Freediving Course Barcelona | Master Freediver · €575', 'AIDA 4 Master Freediver course in Barcelona: advanced depth to around 40 m, rescue and self-coaching. 4 days, €575, all equipment included.')),
 'courses/aida-instructor/index.html': dict(
    level='Instructor', aida='AIDA Instructor', price='€1,500', days='10–21 days', item='instructor', img='instructor-students', pos='center 40%',
    title='AIDA Instructor course', em='From doing to teaching.',
    lead='A small-cohort instructor pathway for experienced freedivers ready to teach skills clearly, safely and confidently.',
    facts=['AIDA Instructor', '10–21 days', 'Max 3 candidates', '€1,500'],
    learn=['Teaching AIDA 1–3 skills and theory', 'AIDA standards and course structure', 'Safety leadership and problem solving', 'Supervised teaching practice',
           'Feedback and instructor development', 'Mentoring with AIDA Instructor Trainer Shebl'],
    learn_img='pool-coaching-session', requirement='The AIDA instructor prerequisites. Places by application.',
    faq=[('Who should apply?', 'Experienced freedivers who meet the AIDA prerequisites and are ready to move from performing skills to teaching, evaluating and managing safety.'),
         ('How long is the programme?', 'A 10–21 day mentored programme, depending on the candidate, schedule and teaching-practice plan.'),
         ('Who leads the instructor training?', 'Shebl, an AIDA Instructor Trainer and Judge, with a small-cohort mentoring approach and supervised teaching practice.')],
    next=('Training', 'Pool and open water', '/training'),
    seo=('AIDA Instructor Course Barcelona | €1,500 · Max 3 Candidates', 'Become an AIDA freediving instructor in Barcelona. 10–21 day mentored programme with AIDA Instructor Trainer Shebl, max 3 candidates, €1,500.')),
}
for path, c in COURSE_PAGES.items():
    learn_html = heading("What you'll learn", 'In this course') + checklist(c['learn'])
    body = hero(c['img'], f"{c['level']} · {c['aida']} · Barcelona", f"{c['title']}<br><em>{c['em']}</em>", c['lead'], c['facts'],
                [btn(f"/book?for={c['item']}"), btn('/courses', 'All courses', ghost=True)], pos=c['pos'],
                crumbs='<a href="/courses">Courses</a> · ' + c['level'])
    body += sec(photo_split(learn_html, c['learn_img'], ''))
    if c.get('steps'):
        body += sec(heading('How it works', 'Pool first. <em>Then the sea.</em>') + steps(c['steps']), alt=True)
    body += sec('<div class="bf-two"><div>' + heading('The course', 'At a glance') + info([
        ('Price', c['price'] + ' · all equipment included'), ('Duration', c['days']), ('Where', 'Barcelona: pool and the Mediterranean'),
        ('Group', 'Small groups' if c['item'] != 'instructor' else 'Max 3 candidates'), ('Requirement', c['requirement']), ('Instructor', 'Shebl, AIDA Instructor Trainer &amp; Judge')])
        + f'<div class="bf-actions" style="margin-top:1.5rem">{btn("/book?for=" + c["item"])}</div></div>'
        + '<div>' + heading('Good to know', 'Questions') + faq(c['faq']) + '</div></div>', alt=not c.get('steps'))
    nl, na, nh = c['next']
    body += sec(f'<a class="bf-next" href="{nh}"><span class="bf-eyebrow">Next step</span><b>{nl}</b><span>{na}</span><em>Explore →</em></a>', alt=bool(c.get('steps')))
    body += book(c['level'], f"Book {c['aida'] if c['item'] != 'beginners' else 'your Beginner course'}", 'Tell us when you would like to come. We confirm dates within 48 hours.', c['item'])
    done.append(page(path, body, *c['seo']))

# =====================================================================
# TRAINING
# =====================================================================
def session(img, eyebrow, title, text, price, unit, items, item):
    return (f'<div class="bf-session">{pic(img, "", "bf-card-img")}<div class="bf-session-body"><p class="bf-eyebrow">{eyebrow}</p><h3>{title}</h3><p>{text}</p>'
            f'<p class="bf-session-price"><strong>{price}</strong> {unit}</p>{checklist(items)}{btn("/book?for=" + item)}</div></div>')
body = (hero('tr-openwater', 'Training · certified freedivers', 'Freediving training<br><em>in Barcelona.</em>',
             'Keep progressing after your course: pool and open-water sessions with Shebl in the water with you.',
             ['All certified levels', 'Pool ~1.5 h', 'Open water ~2 h'], [btn('/book?for=training-pool'), btn('#sessions', 'See sessions', ghost=True)], pos='center 50%')
        + sec(heading('Sessions', 'Two ways to train', 'Pay per session. Every session is confirmed within 24 hours.')
              + '<div class="bf-sessions">'
              + session('pl-band-2', 'Pool · ~1.5 hours', 'Pool training', 'Static and dynamic in Barcelona\'s indoor pool. A controlled environment with full focus on technique and breath.',
                        '€48', 'per session', ['Barcelona indoor pool', 'Static or dynamic, your choice', 'All certified levels welcome', 'Guided by Shebl'], 'training-pool')
              + session('students-buoy-openwater', 'Open water · ~2 hours', 'Mediterranean sessions', 'Buoy, line and open sea: depth repetitions, technique and the mental work of the real environment.',
                        '€72', 'per session', ['Mediterranean, buoy + line', 'All certified levels welcome', 'Safety lanyard included', 'Shebl in the water with you'], 'training-open-water')
              + '</div>', alt=True, sid='sessions')
        + sec('<a class="bf-next" href="/courses/beginners"><span class="bf-eyebrow">Not certified yet?</span><b>Start with the Beginner course</b><span>AIDA 1 + AIDA 2 · 3.5 days · €420</span><em>Course details →</em></a>')
        + book('Training', 'Book a training session', 'Choose pool or open water and tell us when you would like to train.', 'training-pool'))
done.append(page('training.html', body, 'Freediving Training Barcelona | Pool €48 · Open Water €72',
                 'Freediving training in Barcelona for certified freedivers: pool sessions €48 and Mediterranean open-water sessions €72, guided by AIDA Instructor Trainer Shebl.'))

# =====================================================================
# TRIPS
# =====================================================================
TRIPS = [
    ('/freediving-trips/dahab', 'dhj-hero', 'Dahab, Egypt', 'The Blue Hole, Ras Mohammed and the Sinai desert. 7 days of freediving in the Red Sea.', 'Winter · dates announced soon', 'center 50%'),
    ('/freediving-trips/bali', 'blj-hero', 'Indonesia', 'Bali to Labuan Bajo: Ubud, Amed, Gili Air and a 4-day liveaboard to Komodo.', 'Winter · dates announced soon', 'center 50%'),
    ('/freediving-trips/sri-lanka', 'slj-hero', 'Sri Lanka', 'Mirissa, south-coast surf, Yala, Ella and Sigiriya, with a private driver.', 'Winter · dates announced soon', 'center 50%'),
]
TRIP_FAQ = [
    ('Do I need to be a certified freediver?', 'No. Trips welcome complete beginners, experienced freedivers and anyone comfortable in the water. Shebl briefs every dive and keeps everyone at a depth that feels right.'),
    ("What's included?", 'Guided freediving with Shebl on every dive, all dive equipment, accommodation and trusted local operators at each stop, and curated land adventures.'),
    ('Who leads the trips?', 'Shebl and Rimi personally. Shebl is in the water on every dive; Rimi runs the journey end to end.'),
    ('Are the trips safe?', 'Yes. Every session runs with full safety protocols, buddy diving and emergency oxygen on site, with Shebl in the water with the group.'),
    ('How do I get a spot?', 'Tap Book now and choose your trip. Dates go to the booking list first, and small groups fill quickly. Nothing is charged until your place is confirmed.'),
]
body = (hero('exp-hero', 'Winter trips · 2026', 'Blue water.<br><em>Wild places.</em>',
             'Small-group freediving trips led by Shebl &amp; Rimi. Half the magic is underwater, the other half is at a table at sunset.',
             ['Dahab', 'Indonesia', 'Sri Lanka', 'Dates &amp; prices announced soon'], [btn('/book?for=trips'), btn('#trips', 'See the trips', ghost=True)], pos='center 55%')
        + sec(heading('Choose your trip', 'Three winter trips') + cards([(h, i, '', t, x, n, p) for h, i, t, x, n, p in TRIPS]), sid='trips')
        + sec(heading('Why these trips', 'Good dives. Great places.') + textcards([
              ('Beautiful dives', 'Chosen for water, visibility and marine life.'), ('The land is half the story', 'Deserts, ruins, safaris and jungle hikes.'),
              ('Led by Shebl &amp; Rimi', 'On every dive and dinner, with locals who open hidden doors.'), ('All levels, always safe', 'Beginners to experts, with full safety protocols.')], cols=4), alt=True)
        + sec(heading('Every trip includes', 'Everything you need') + checklist(['Guided freediving with Shebl', 'All dive equipment', 'Accommodation coordination', 'A small group of ocean lovers']))
        + sec(heading('Good to know', 'Questions before you go') + faq(TRIP_FAQ), alt=True, narrow=True)
        + book('Winter trips', 'Join a winter trip', 'Dates and prices are announced soon. Book now to get first access and hold your place.', 'trips'))
done.append(page('trips.html', body, 'Freediving Trips | Dahab, Indonesia & Sri Lanka · Barcelona Freedivers',
                 'Small-group winter freediving trips to Dahab, Indonesia and Sri Lanka, led by Shebl & Rimi. All levels welcome; dates and prices announced soon.'))

# ---- Indonesia & Sri Lanka on the trip template (same components as Dahab) ----
def trip_page(path, slug, img, crumb, eyebrow, title, sub, desc, facts, intro_h, intro_lead, intro_body, pillars, stops, foot, item, more):
    fct = ''.join(f'<li>{f}</li>' for f in facts)
    pil = ''.join(f'<li><b>{a}</b><span>{b}</span></li>' for a, b in pillars)
    stp = ''.join(f'<article><figure>{pic(si, sa)}</figure><h3><small>Stop {i:02d}</small>{sn}</h3><p>{st}</p></article>' for i, (si, sa, sn, st) in enumerate(stops, 1))
    mor = ''.join(f'<a href="{h}">{t}</a>' for h, t in more)
    body = f'''<section class="hero photo-hero">
  <div class="hero-media">{pic(img, title, eager=True)}</div>
  <div class="hero-copy"><div class="wrap">
    <p class="crumbs"><a href="/trips">Trips</a> · {crumb}</p>
    <p class="eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    <p class="hero-sub">{sub}</p>
    <p class="hero-desc">{desc}</p>
    <ul class="facts">{fct}</ul>
    <div class="hero-actions"><a href="/book?for={item}" class="btn btn-primary">Book now</a><a class="btn btn-ghost" href="#journey">See the journey</a></div>
    <p class="hero-status">Dates and prices are announced soon. Book now and you'll hear first.</p>
  </div></div>
</section>
<section class="sec"><div class="wrap intro"><div>
  <p class="eyebrow">{crumb}</p><h2 class="h2">{intro_h}</h2><p class="lead">{intro_lead}</p><p class="body">{intro_body}</p>
  <ul class="pillars">{pil}</ul>
</div><figure>{pic(stops[1][0], stops[1][1])}</figure></div></section>
<section class="sec sec-alt" id="journey"><div class="wrap">
  <p class="eyebrow">The journey</p><h2 class="h2">Stop by <em>stop</em></h2>
  <div class="why cols-3">{stp}</div>
  <p class="note" style="margin-top:2rem">{foot}</p>
</div></section>
<section class="sec"><div class="wrap">
  <p class="eyebrow">Every trip includes</p><h2 class="h2">What's <em>included</em></h2>
  {checklist(['Guided freediving with Shebl on every dive', 'All dive equipment', 'Accommodation coordination', 'Trusted local operators at each stop', 'Curated land adventures', 'A small group of ocean lovers'])}
</div></section>
''' + book('Winter trip', f'Join the {crumb} trip', 'Dates and prices are announced soon. Book now to get first access and hold your place.', item) + f'''
<section class="sec" style="padding-top:clamp(3rem,6vw,4.5rem)"><div class="wrap">
  <h2 class="h2" style="font-size:var(--text-xl)">More from <em>Barcelona Freedivers</em></h2>
  <nav class="more" aria-label="Other trips and courses">{mor}</nav>
</div></section>'''
    return body

ind = trip_page('freediving-trips/bali/index.html', 'bali', 'blj-hero', 'Indonesia', 'Bali to Labuan Bajo · winter trip', 'Indonesia Freediving Trip',
    'A journey across the Indonesian archipelago', 'Bali to Labuan Bajo, 600 km east: Ubud temples, world-class freediving and a 4-day liveaboard ending at Komodo.',
    ['Bali → Labuan Bajo', 'Beginners &amp; certified freedivers', '4-day liveaboard', 'Small group', 'Led by Shebl &amp; Rimi'],
    'Freediving plus <em>adventure</em>', 'Bali combines serious freediving infrastructure with reef diving, warm water and easy access to a much wider Indonesia journey.',
    'Amed on Bali\'s northeast coast is one of the island\'s best-known freediving bases, with calm-water days and depth close to shore. Manta rays and other pelagic wildlife may be encountered, but sightings depend on season and conditions and are never guaranteed.',
    [('Amed', 'Calm water and depth close to shore'), ('USAT Liberty wreck', '30 m of WWII steel covered in reef'), ('Gili Air', 'Turtles on every dive'), ('Liveaboard', 'Four days through rich water'), ('Komodo', 'Padar Island and Pink Beach'), ('Local partners', 'Trusted schools at every stop')],
    [('blj-ubud', 'Rice terraces in Ubud', 'Ubud', 'Start here. Temples, rice terraces, morning markets and good food.'),
     ('blj-amed', 'The coast at Amed', 'Amed', 'Freediving on the quiet northeast coast with Ocean Prana Bali, ten minutes from the USAT Liberty wreck.'),
     ('blj-gili', 'Gili Air beach', 'Gili Air', 'No motorbikes, no noise, no rush: diving with Pacific Freedive Academy.'),
     ('blj-liveaboard', 'The liveaboard boat', 'The liveaboard', 'Four days aboard with Dewi through the richest water of the trip.'),
     ('blj-komodo', 'Komodo National Park', 'Komodo &amp; Labuan Bajo', 'Padar Island at sunrise, Pink Beach and Komodo dragons on Rinca.')],
    'Local partners: Ocean Prana Bali (Amed) · Pacific Freedive Academy (Gili Air) · Dewi (liveaboard). Full logistics between every stop.',
    'trip-indonesia', [('/freediving-trips/dahab', 'Dahab trip'), ('/freediving-trips/sri-lanka', 'Sri Lanka trip'), ('/trips', 'All trips'), ('/courses', 'Courses in Barcelona')])
done.append(page('freediving-trips/bali/index.html', ind, 'Indonesia Freediving Trip | Bali to Komodo · Barcelona Freedivers',
    'Winter freediving trip across Indonesia with Barcelona Freedivers: Ubud, Amed, Gili Air and a 4-day liveaboard to Komodo. Small group, led by Shebl & Rimi.',
    extra_head='\n<link rel="stylesheet" href="/trip.css?v=3">'))

sl = trip_page('freediving-trips/sri-lanka/index.html', 'sri-lanka', 'slj-hero', 'Sri Lanka', 'South coast to hill country · winter trip', 'Sri Lanka Freediving Trip',
    'The itinerary has a shape. The road has room.', 'Whale watching off Mirissa, south-coast surf, leopards in Yala and tea country at Ella. A private driver handles everything.',
    ['Mirissa &amp; the south coast', 'Beginners &amp; certified freedivers', 'Private driver', 'Small group', 'Led by Shebl &amp; Rimi'],
    'Freediving plus <em>the whole island</em>', 'The water is only one part of the journey: south-coast diving, surf, wildlife, tea country and inland culture in one trip.',
    'Mirissa gives access to warm Indian Ocean water and healthy reef. Whale-watching trips run seasonally from the south coast; sightings are never guaranteed and responsible operators matter. Trip timing follows the monsoon cycle.',
    [('Warm Indian Ocean', 'Reef freediving from Mirissa'), ('Seasonal whales', 'With responsible operators'), ('Surf', 'Breaks for every level'), ('Yala', 'Leopards and elephants'), ('Ella', 'Waterfalls and tea country'), ('Sigiriya', 'The rock fortress at sunrise')],
    [('slj-mirissa', 'Mirissa coast', 'Mirissa &amp; the south coast', 'Your base for the first days: whale watching, warm water, reef and surf.'),
     ('slj-yala', 'Yala National Park', 'Yala', 'The great wild park at dawn: leopards, elephants and sloth bears.'),
     ('slj-ella', 'Ella hill country', 'Ella', 'Waterfall hikes, the Nine Arch Bridge and the blue train through the tea.'),
     ('slj-tea', 'Tea estates', 'Nuwara Eliya', 'Tea estates at altitude, cool air and endless green.'),
     ('slj-sigiriya', 'Sigiriya rock', 'Sigiriya', 'The rock fortress, climbed at first light.')],
    'Private driver · full logistics airport to airport · local partners for freediving, surf school and whale watching.',
    'trip-sri-lanka', [('/freediving-trips/dahab', 'Dahab trip'), ('/freediving-trips/bali', 'Indonesia trip'), ('/trips', 'All trips'), ('/courses', 'Courses in Barcelona')])
done.append(page('freediving-trips/sri-lanka/index.html', sl, 'Sri Lanka Freediving Trip | Mirissa to Sigiriya · Barcelona Freedivers',
    'Winter freediving trip to Sri Lanka with Barcelona Freedivers: Mirissa, whale watching, surf, Yala, Ella and Sigiriya. Small group, led by Shebl & Rimi.',
    extra_head='\n<link rel="stylesheet" href="/trip.css?v=3">'))

# =====================================================================
# TEAMS
# =====================================================================
TEAM_FAQ = [
    ('Do we need any freediving experience?', 'None at all. Every experience starts dry, on the mat, and builds gently from there.'),
    ('What about non-swimmers or people nervous in water?', "They're fully included. Every part of the day has a dry equivalent, so anyone can take part and get the same lessons."),
    ('Is it safe?', 'Yes. Every session is led in person by Shebl, an AIDA Instructor Trainer, with strict buddy and safety protocols, shallow controlled water and small groups.'),
    ('Can this be a one-day experience or a retreat?', 'Both. We run full-day team experiences (morning to afternoon) and multi-day retreats in Barcelona or abroad.'),
]
body = (hero('dt-buoy', 'Teams · companies', 'Team building<br><em>in Barcelona &amp; beyond.</em>',
             'One-day team experiences and multi-day retreats. Build trust, communication and calm under pressure through freediving and breathwork.',
             ['1-day team experience', 'Custom retreats', 'Price on request'], [btn('/book?for=team'), btn('#formats', 'See formats', ghost=True)], pos='center 40%')
        + sec(heading('Choose your format', 'One day or a full retreat') + textcards([
              ('Team Building Day · 1 day · Barcelona', 'Morning to afternoon. Breathwork on land, buddy work in the pool, an optional guided sea session, then a debrief your team can use on Monday.'),
              ('Custom Retreats · multiple days', 'A full retreat in Barcelona or abroad, designed around your team.')], cols=2, swipe=False), sid='formats')
        + sec(photo_split(heading('Why freediving', 'One breath teaches you to relax.', 'Underwater, in a new environment, everyone meets their own stress response. Freediving teaches you to stay relaxed in it, and to help each other do the same.')
              + steps([('Breathe', 'Slow breathing settles the nervous system.'), ('Hold', 'A calm breath-hold shows how you react under pressure.'),
                       ('Decide', 'Clear, calm choices in an unfamiliar place.'), ('Support', 'Buddies help each other find their calm.')]),
              'tb-corporate-team', 'A team smiling together in the water', 'center 45%'), alt=True)
        + sec(heading('Trust', "Trust you can't build in a meeting room",
              'In the water, we build a calm, safe space together. Everyone shows care, gives trust and shares one goal: the deepest state of relaxation. Titles and departments fade away.')
              + cards([('#formats', 'commx-53', '', 'Better communication', 'Reading each other without words, and speaking clearly when it counts.', '', None),
                       ('#formats', 'comm-sunset', '', 'Stronger trust', 'Bonds built by supporting each other in the water.', '', 'center 50%'),
                       ('#formats', 'commx-22', '', 'Calm under pressure', 'A simple way to settle the body, in a dive or a deadline.', '', None)]))
        + sec(heading('The day', 'What you actually do') + steps([
              ('Dry, breathe &amp; regulate', 'We start on the mat: breathwork, relaxation and down-regulating on command.'),
              ('Pool, in pairs', 'Relaxed breath-holds, partner drills and communication under a little pressure.'),
              ('Open water &amp; debrief', 'An optional, fully guided dive, then how to use it on Monday.')])
              + '<p class="bf-note">No one sits it out: every part of the day has a dry equivalent. Led personally by Shebl &amp; Rimi.</p>', alt=True)
        + sec(heading('Good to know', 'Questions people ask first') + faq(TEAM_FAQ), narrow=True)
        + book('For companies', 'Plan your team day', 'Tell us about your team, timing and goals. We reply within 48 hours.', 'team'))
done.append(page('team-building/index.html', body))

# =====================================================================
# ABOUT + SHEBL
# =====================================================================
def person(img, name, role, paras, href=None, pos=None):
    p = ''.join(f'<p>{x}</p>' for x in paras)
    l = f'<p>{link(href, "Read Shebl’s instructor profile →")}</p>' if href else ''
    return f'<div class="bf-profile">{pic(img, name, "bf-profile-img", pos)}<div><b>{name}</b><em>{role}</em>{p}{l}</div></div>'
body = (hero('about-hero', 'Our story', 'The people behind<br><em>Barcelona Freedivers.</em>',
             'It started in Dahab, on the Red Sea. We met in the water, fell in love, and built a freediving school.', [], [btn('/book'), btn('#team', 'Meet Shebl &amp; Rimi', ghost=True)], pos='center 40%')
        + sec(heading('Your instructors', 'Shebl &amp; Rimi')
              + person('shebl', 'Shebl', 'Founder · AIDA Instructor Trainer &amp; Judge', [
                  'An AIDA Instructor Trainer, the highest teaching level in AIDA, Shebl teaches every level, from beginner courses to the AIDA Instructor Course, and has certified more than 160 freedivers. He is also an AIDA Freediving Judge at competitions.',
                  'Freediving since 2021 and teaching since 2022, he spent five years in Dahab on the Red Sea before bringing Barcelona Freedivers to Barcelona. On every trip, in Dahab, Sri Lanka and Indonesia, he is in the water leading the dives.'], '/about/shebl')
              + person('rimi', 'Rimi', 'Assistant Instructor · AIDA Judge · Trips', [
                  'An Architect and Product Design Lead by profession, Rimi is the first and deepest Iraqi female freediver. An Assistant Instructor and AIDA Freediving Judge, she is also a world traveller who has lived in six countries and explored more than 45. At Barcelona Freedivers, she is the architect behind every trip and adventure.'], pos='center 25%'), sid='team')
        + sec(heading('From Dahab to the world', 'Where we dive', "We've dived with whales, mantas and dolphins around the world. Now based in Barcelona, teaching and running freediving trips.")
              + cards([('/freediving-trips/dahab', 'dest-dahab', '', 'Egypt &amp; Dahab', "Shebl's home water, every reef and canyon.", '', None),
                       ('/freediving-trips/bali', 'dest-bali', '', 'Indonesia &amp; Bali', 'Drop-offs, shipwrecks and hidden gems across Bali, Lombok and Komodo.', '', None),
                       ('/freediving-trips/sri-lanka', 'card-srilanka', '', 'Sri Lanka', 'Depth and surf on the coast; jungle and wild elephants inland.', '', None)]), alt=True)
        + sec(heading('Community', 'A freediving community in Barcelona', 'Freediving is built on trust, so we want people to meet reliable buddies, train together and keep the sport social as well as safe.')
              + textcards([('Find buddies', 'Meet other freedivers for pool sessions, open-water dives and shared training. Nobody should practise breath-hold diving alone.'),
                           ('Train together', 'Dry practice, stretching, pool training and Mediterranean sessions, matched to your certification and experience.'),
                           ('Start freediving', 'Not certified yet? Meet people in the sport and join the Beginner course when you are ready.')]), sid='community')
        + book('Ready to dive?', 'First breath or your hundredth', "There's a spot for you. Tell us what you'd like to do and we'll reply within 48 hours.", ''))
done.append(page('about.html', body))

GUIDES4 = [('/learn/freediving-equalization', 'Equalisation guide', 'Frenzel, pressure and deeper equalisation.'), ('/learn/freediving-safety', 'Safety guide', 'Buddying, hypoxia, LMC and blackout.'),
           ('/learn/breath-hold-training', 'Breath-hold training', 'CO₂, relaxation and safer training principles.'), ('/learn/mental-training-freediving', 'Mental training', 'Calm, focus and performance under pressure.')]
body = (sec('<div class="bf-split bf-profile-hero"><div><p class="bf-crumbs"><a href="/about">About</a> · Shebl</p><p class="bf-eyebrow">Founder · AIDA Instructor Trainer · Judge</p><h1>Shebl</h1>'
            '<p class="bf-lead">Freediving instructor, educator and founder of Barcelona Freedivers, focused on the mental game, equalisation, safe progression and helping divers understand why a dive works, not only whether they reached the target.</p>'
            + info([('Certified', '160+ freedivers'), ('Teaching', 'Since 2022, beginner to instructor'), ('Roles', 'AIDA Instructor Trainer · AIDA Judge'), ('Based', 'Barcelona · five years in Dahab')])
            + f'<div class="bf-actions" style="margin-top:1.5rem">{btn("/book")}</div></div>'
            + f'<div class="bf-photo-stack bf-single">{pic("shebl", "Shebl", "bf-photo-main", "center 30%", eager=True)}</div></div>')
        + sec('<div class="bf-two"><div>' + heading('From Dahab to Barcelona', 'How it started',
              'Shebl built his freediving teaching experience in Dahab, on the Red Sea, in one of the sport’s best-known depth-training environments. After certifying more than 160 freedivers across every level, he brought Barcelona Freedivers to Barcelona, combining recognised AIDA education with a strong mental-performance framework.')
              + '</div><div>' + heading('Teaching philosophy', 'Calm is a technical skill',
              'The goal is not to make a student fight harder for metres. It is to make technique, safety, equalisation and mental state clear enough that progression becomes repeatable.') + '</div></div>', alt=True)
        + sec(heading('Areas of focus', 'What he teaches') + checklist(['AIDA education from beginner to instructor', 'Equalisation, Frenzel and advanced depth technique', 'Safety, rescue and buddy systems',
              'Breath-hold physiology and the dive reflex', 'Mental performance and nervous-system regulation', 'Pool and open-water training']))
        + sec(heading("Shebl's guides", 'Read and learn') + '<div class="bf-tcards bf-cols-4 bf-swipe">' + ''.join(
              f'<a class="bf-tcard" href="{h}"><b>{t}</b><span>{d}</span></a>' for h, t, d in GUIDES4) + '</div>', alt=True)
        + book('Train with Shebl', 'Start with the Beginner course', 'Or choose any level from Intermediate to Instructor.', 'beginners'))
done.append(page('about/shebl/index.html', body))

# =====================================================================
# FAQ
# =====================================================================
FAQS = [
 ('Getting started', [
   ('Do I need experience to start?', 'None at all. The Beginner course (AIDA 1 + AIDA 2) is designed for complete beginners: you only need basic comfort in water. All equipment is provided, in small groups with personal attention.'),
   ('I can barely hold my breath for 30 seconds. Can I still do this?', "Yes, and that's exactly where most students start. The urge to breathe is triggered by CO₂, not lack of oxygen, and your mind can learn to work with it. By the end of the first pool session most students hold their breath for well over two minutes."),
   ('Is freediving safe?', 'Freediving is safe when practised with proper training, a qualified buddy and the right protocols, all covered from your first course. Every session is supervised by an AIDA Instructor Trainer, and we teach you to never dive alone.')]),
 ('Courses', [
   ('What is an AIDA freediving course?', 'An internationally recognised certification covering breath-hold technique, safety, equalisation and the mental game. We offer the Beginner course (AIDA 1 + AIDA 2), AIDA 3, AIDA 4 and the Instructor course, in Barcelona\'s pool and the Mediterranean.'),
   ('How long does each course take?', 'Beginner (AIDA 1 + AIDA 2): 3.5 days. AIDA 3: 3 days. AIDA 4: 4 days. Instructor: 10 to 21 days. All include equipment and AIDA certification on completion.'),
   ('How deep do you dive?', 'The Beginner course works towards around 20 m, AIDA 3 around 30 m and AIDA 4 around 40 m. Depth is always a consequence of calm, never the goal itself.'),
   ('Are AIDA certifications recognised internationally?', 'Yes. They are accepted worldwide at dive sites, liveaboards and freediving schools, and they do not expire.'),
   ('I have a certificate from another school. Can I continue here?', 'Yes. Your certificate transfers directly and you start from your next level. Certified freedivers can also join our training sessions.')]),
 ('Prices &amp; booking', [
   ('How much do courses cost?', 'Beginner (AIDA 1 + AIDA 2) €420 · AIDA 3 €460 · AIDA 4 €575 · Instructor €1,500. All equipment is included. Training: pool €48, open water €72 per session.'),
   ('How do I book?', 'Tap Book now, choose what you would like to do and when. We confirm dates within 48 hours, and nothing is charged until your place is confirmed.'),
   ('When are the course dates?', 'Courses run throughout the year in Barcelona. Book now or message us and we will confirm the next available dates.')]),
 ('Our method', [
   ('What is the Barcelona Freedivers method?', "It uses the mammalian dive response, the body's built-in reaction to immersion, together with structured breathing and nervous-system regulation. Depth and breath-hold time are by-products of calm, not willpower.")]),
]
faq_body = ''.join(f'<h2 class="bf-faq-group">{g}</h2>' + faq(items) for g, items in FAQS)
body = (plain_head('Questions', 'Everything you need to know<br><em>before you dive in.</em>', "Can't find your answer? Ask us directly: there's no such thing as a stupid question before your first dive.")
        + sec(faq_body, narrow=True)
        + sec(f'<div class="bf-contact"><b>Still have a question?</b><span>Message us on WhatsApp or email <a href="mailto:shebl@freedivingbrain.com">shebl@freedivingbrain.com</a>.</span>{btn(WA, "WhatsApp us")}</div>', alt=True, narrow=True)
        + book('Ready to start?', 'Book your first freediving course', 'Tell us when you would like to come. We confirm dates within 48 hours.', 'beginners'))
faqld = '<script type="application/ld+json">' + __import__('json').dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
    {"@type": "Question", "name": html.unescape(q), "acceptedAnswer": {"@type": "Answer", "text": html.unescape(a)}} for _, items in FAQS for q, a in items]}, ensure_ascii=False) + '</script>'
p = page('faq.html', body)
t = open(p).read(); t = re.sub(r'<script type="application/ld\+json">\{"@context":\s*"https://schema.org",\s*"@type":\s*"FAQPage".*?</script>', '', t, flags=re.S)
open(p, 'w').write(t.replace('</head>', faqld + '\n</head>', 1)); done.append(p)

# =====================================================================
# LEARN: hub + articles
# =====================================================================
import json
CARDS = json.load(open('tools/content/learn/_cards.json'))
body = (plain_head('Learn', 'Guides and articles<br><em>for every freediver.</em>', 'Technique, safety and the mental side of freediving, from your first breath-hold to deeper diving.')
        + sec(cards([(c['href'], c['img'], '', esc(c['title']), esc(c['ex']), esc(c['tag']), None) for c in CARDS], swipe=False), alt=True)
        + book('Ready to learn in the water?', 'Book your first freediving course', 'The Beginner course takes you from your first breath-hold to the open sea in 3.5 days.', 'beginners'))
done.append(page('learn/index.html', body, 'Learn Freediving | Guides & Articles · Barcelona Freedivers'))

def article(slug):
    path = f'learn/{slug}/index.html'
    d = json.load(open(f'tools/content/learn/{slug}.json'))
    tag, h1, lead, img, content = d['tag'], d['h1'], d['lead'], d['img'], d['content']
    words = len(re.sub(r'<[^>]+>', ' ', content).split())
    mins = max(2, round(words / 220))
    plain_title = html.unescape(re.sub(r'<[^>]+>', ' ', h1)); plain_title = re.sub(r'\s+', ' ', plain_title).strip()
    card = next((c for c in CARDS if c['slug'] == slug), None)
    if not img and card: img = card['img']
    others = [c for c in CARDS if c['slug'] != slug]
    k = [c['slug'] for c in CARDS].index(slug) if card else 0
    rel = (others[k % len(others):] + others)[:3]
    head = (f'<section class="bf-sec bf-article-head"><div class="bf-wrap bf-narrow"><p class="bf-crumbs"><a href="/learn">Learn</a> · {esc(tag)}</p>'
            f'<h1>{h1}</h1>' + (f'<p class="bf-lead">{lead}</p>' if lead else '') +
            f'<p class="bf-article-meta">Abdelrahman Shebl · AIDA Instructor Trainer · {mins} min read</p></div></section>')
    fig = f'<div class="bf-wrap bf-narrow bf-article-fig">{pic(img, plain_title, "", "center 45%")}</div>' if img else ''
    body = (head + fig + f'<article class="bf-sec bf-prose-sec"><div class="bf-wrap bf-narrow bf-prose">{content}</div></article>'
            + sec(heading('Keep reading', 'Related articles') + cards([(c['href'], c['img'], '', esc(c['title']), esc(c['ex']), '', None) for c in rel]), alt=True)
            + book('Learn in the water', 'Book your first freediving course', 'The Beginner course (AIDA 1 + AIDA 2) takes you from your first breath-hold to the open sea in 3.5 days.', 'beginners'))
    return page(path, body)
for c in CARDS:
    done.append(article(c['slug']))

# =====================================================================
# 404
# =====================================================================
body = (sec('<div class="bf-404"><img src="/logo-mark.png" alt="" width="64" height="64"><p class="bf-eyebrow">Error 404</p><h1>You\'ve drifted<br><em>off the line.</em></h1>'
            '<p class="bf-lead">This page is deeper than we go. Let\'s get you back to the surface.</p>'
            f'<div class="bf-actions">{btn("/", "Back to homepage")}{btn("/courses", "View courses", ghost=True)}</div></div>', narrow=True))
done.append(page('404.html', body, 'Page not found | Barcelona Freedivers', 'This page does not exist.'))

print(len(done), 'pages rebuilt')
for d in done: print('  ', d)
