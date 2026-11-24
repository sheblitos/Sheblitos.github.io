#!/usr/bin/env python3
"""Merge the beginners course into Courses: one ladder Beginner -> Intermediate -> Advanced (Master) -> Instructor."""
import glob, os, re, subprocess
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
log = []
def rd(p): return open(p, encoding='utf-8').read()
def wr(p, t): open(p, 'w', encoding='utf-8').write(t); log.append(f'updated {p}')
def sub(t, a, b, regex=False, flags=0):
    n = re.sub(a, b, t, flags=flags) if regex else t.replace(a, b)
    if n == t: log.append(f'  no match: {a[:70]!r}')
    return n

# 1. move the beginner page under /courses
if os.path.exists('beginners-course/index.html'):
    os.makedirs('courses/beginners', exist_ok=True)
    subprocess.run(['git', 'mv', 'beginners-course/index.html', 'courses/beginners/index.html'], check=True)
    os.rmdir('beginners-course'); log.append('moved beginners-course -> courses/beginners')

# 2. links everywhere
for f in [p for p in glob.glob('**/*.html', recursive=True) if not p.startswith('tools/')] + ['sitemap.xml', 'site.js']:
    t = rd(f); n = re.sub(r'/beginners-course(?=["#?/\'<\s]|$)', '/courses/beginners', t)
    if n != t: wr(f, n)

# 3. Courses page: four-level ladder
p = 'courses/index.html'; t = rd(p)
t = re.sub(r'\n    <div class="pkg-card">\s*<p class="pkg-name">AIDA 2</p>.*?</div>\s*(?=\n    <div class="pkg-card">)', '\n', t, count=1, flags=re.S)
t = sub(t, '<p class="pkg-name">Beginners course</p>\n      <p class="pkg-tag">AIDA 1 + AIDA 2 · no experience needed</p>',
        '<p class="pkg-name">Beginner</p>\n      <p class="pkg-tag">AIDA 1 + AIDA 2 · no experience needed</p>')
t = sub(t, '<p class="pkg-name">AIDA 3</p>\n      <p class="pkg-tag">Advanced · AIDA 2 required</p>',
        '<p class="pkg-name">Intermediate</p>\n      <p class="pkg-tag">AIDA 3 · AIDA 2 required</p>')
t = sub(t, '<p class="pkg-name">AIDA 4</p>\n      <p class="pkg-tag">Master · AIDA 3 + EFR</p>',
        '<p class="pkg-name">Advanced · Master</p>\n      <p class="pkg-tag">AIDA 4 · AIDA 3 + first aid</p>')
t = sub(t, '<p class="pkg-name">AIDA Instructor</p>\n      <p class="pkg-tag">Professional · by application</p>',
        '<p class="pkg-name">Instructor</p>\n      <p class="pkg-tag">AIDA Instructor · by application</p>')
t = sub(t, '<p class="section-tag">AIDA courses</p>', '<p class="section-tag">Freediving courses</p>')
t = sub(t, '<h2>From first breath.<br><em>To master freediver.</em></h2>', '<h2>From beginner<br><em>to instructor.</em></h2>')
t = sub(t, '<p class="draft-note">Current Barcelona pricing. Contact us to confirm upcoming course dates and availability.</p>',
        '<p class="draft-note">Already have AIDA 1 or an equivalent certificate? <a href="/courses/aida-2">Book AIDA 2 on its own</a> (€360). We confirm course dates within 48 hours.</p>')
if '.pkg-ladder' not in t:
    t = t.replace('<div class="pkg-grid reveal">', '<div class="pkg-grid pkg-ladder reveal">', 1)
    t = t.replace('</head>', '<style>\n.pkg-grid.pkg-ladder{grid-template-columns:repeat(4,1fr)}\n@media (max-width:1100px) and (min-width:681px){.pkg-grid.pkg-ladder{grid-template-columns:repeat(2,1fr)}}\n.draft-note a{color:var(--teal);font-weight:600}\n</style>\n</head>', 1)
wr(p, t)

# 4. level names on each course page
EYEBROWS = {
    'courses/beginners/index.html': ('<p class="lab-eyebrow">Beginners course · AIDA 1 + AIDA 2 · Barcelona</p>', '<p class="lab-eyebrow">Beginner course · AIDA 1 + AIDA 2 · Barcelona</p>'),
    'courses/aida-2/index.html': ('<p class="eyebrow">Freediver · Beginner-friendly · Barcelona</p>', '<p class="eyebrow">For AIDA 1 holders · Barcelona</p>'),
    'courses/aida-3/index.html': ('<p class="eyebrow">Advanced · AIDA 2 required · Barcelona</p>', '<p class="eyebrow">Intermediate · AIDA 2 required · Barcelona</p>'),
    'courses/aida-4/index.html': ('<p class="eyebrow">Master · AIDA 3 + first aid requirements · Barcelona</p>', '<p class="eyebrow">Advanced · Master freediver · AIDA 3 + first aid · Barcelona</p>'),
    'courses/aida-instructor/index.html': ('<p class="eyebrow">Professional · By application · Barcelona</p>', '<p class="eyebrow">Instructor · By application · Barcelona</p>'),
}
for p, (a, b) in EYEBROWS.items():
    wr(p, sub(rd(p), a, b))
p = 'courses/beginners/index.html'; t = rd(p)
t = t.replace('"name":"Beginners course","item":"https://freedivingbrain.com/courses/beginners"',
              '"name":"Courses","item":"https://freedivingbrain.com/courses"},{"@type":"ListItem","position":3,"name":"Beginner course","item":"https://freedivingbrain.com/courses/beginners"')
wr(p, t)

# 5. booking page options
p = 'book/index.html'; t = rd(p)
t = re.sub(r'<optgroup label="Beginners">.*?</optgroup><optgroup label="Courses">.*?</optgroup>',
           '<optgroup label="Courses">'
           '<option value="beginners">Beginner · AIDA 1 + AIDA 2 · €445</option>'
           '<option value="aida-3">Intermediate · AIDA 3 · €430</option>'
           '<option value="aida-4">Advanced · AIDA 4 · €575</option>'
           '<option value="instructor">Instructor · AIDA Instructor · €1,440</option>'
           '<option value="aida-2">AIDA 2 only, for AIDA 1 holders · €360</option>'
           '<option value="aida-2-3">AIDA 2 + AIDA 3 · €710</option>'
           '<option value="aida-1-4">AIDA 1 to AIDA 4 · €1,310</option>'
           '</optgroup>', t, flags=re.S)
wr(p, t)

# 6. redirects
toml = rd('netlify.toml')
toml = toml.replace('to = "/beginners-course"', 'to = "/courses/beginners"')
if 'from = "/beginners-course"' not in toml:
    toml = toml.rstrip('\n') + '\n\n# Beginner course moved under Courses\n'
    for s in ('/beginners-course', '/beginners-course/'):
        toml += f'[[redirects]]\n  from = "{s}"\n  to = "/courses/beginners"\n  status = 301\n  force = true\n\n'
open('netlify.toml', 'w').write(toml); log.append('updated netlify.toml')

# 7. shared menu + footer
p = 'tools/rebrand.py'; t = rd(p)
t = t.replace('LINKS = [("/courses/beginners", "Beginners course"), ("/courses", "Courses"), ("/training", "Training"),',
              'LINKS = [("/courses", "Courses"), ("/training", "Training"),')
t = re.sub(r"'    <div><h4>Courses</h4><ul>.*?</ul></div>\\n'",
           "'    <div><h4>Courses</h4><ul><li><a href=\"/courses\">All courses</a></li><li><a href=\"/courses/beginners\">Beginner · AIDA 1 + 2</a></li>'\n"
           "          '<li><a href=\"/courses/aida-3\">Intermediate · AIDA 3</a></li><li><a href=\"/courses/aida-4\">Advanced · AIDA 4</a></li>'\n"
           "          '<li><a href=\"/courses/aida-instructor\">Instructor</a></li></ul></div>\\n'", t, count=1, flags=re.S)
t = t.replace("'beginners-course/index.html'", "'courses/beginners/index.html'")
wr(p, t)
p = 'site.js'; t = rd(p)
t = t.replace("['/courses/beginners','/courses/beginners'],", '')
wr(p, t)
print('\n'.join(log))
