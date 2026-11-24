#!/usr/bin/env python3
"""Step 2 removals (live site and rebrand branch):
athlete programme, judge tool, ADHD/PTSD articles. Teams stays as the B2B offer."""
import os, re, shutil
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
log = []

def edit(path, fn):
    if not os.path.exists(path):
        log.append(f'missing {path}'); return
    t = open(path, encoding='utf-8').read(); n = fn(t)
    if n != t:
        open(path, 'w', encoding='utf-8').write(n); log.append(f'updated {path}')

def sub(t, old, new, regex=False, flags=0, label=None):
    n = re.sub(old, new, t, flags=flags) if regex else t.replace(old, new)
    if n == t: log.append(f'  no match: {(label or old)[:70]!r}')
    return n

# ---- Team building: corporate only ----
def team(t):
    t = sub(t, r'\s*<a href="#athletic" class="xp-card teal">.*?</a>', '', regex=True, flags=re.S, label='athletic card')
    t = sub(t, r'<!-- ATHLETIC EXPERIENCE -->\s*<section[^>]*id="athletic".*?</section>\s*', '', regex=True, flags=re.S, label='athletic section')
    t = sub(t, r'\s*<details class="faq-item"><summary>Can you tailor it for a sports team or individual athlete\?</summary>.*?</details>', '', regex=True, flags=re.S, label='athlete faq')
    t = sub(t, r'\s*<option>Athletic performance &mdash; sports team</option>', '', regex=True)
    t = sub(t, r'\s*<option>Athletic performance &mdash; individual athlete</option>', '', regex=True)
    t = sub(t, 'e.g. 8-12, or 1 athlete', 'e.g. 8-12 people')
    t = sub(t, 'Company / team / sport', 'Company / team')
    # the one remaining audience card becomes a wide card
    t = sub(t, '<div class="xp-fork reveal">', '<div class="xp-fork xp-single reveal">')
    t = sub(t, r'(<a href="#team" class="xp-card">\s*<picture class="xp-img">.*?</picture>)(.*?)(\s*</a>)',
            lambda m: m.group(1) + '<div class="xp-body">' + m.group(2) + '</div>' + m.group(3), regex=True, flags=re.S, label='corporate card body')
    if '.xp-single' not in t.split('</head>')[0]:
        t = t.replace('</head>', '''<style>
.xp-fork.xp-single{display:block}
.xp-fork.xp-single .xp-card{flex-direction:row;padding:0;overflow:hidden}
.xp-fork.xp-single .xp-img{flex:0 0 52%;margin:0;height:380px;min-height:0}
.xp-fork.xp-single .xp-body{padding:2.5rem;display:flex;flex-direction:column;justify-content:center}
@media (max-width:760px){.xp-fork.xp-single{display:block !important;margin-right:0 !important;padding-right:0 !important}.xp-fork.xp-single .xp-card{flex-direction:column}.xp-fork.xp-single .xp-img{min-height:0;height:200px}.xp-fork.xp-single .xp-body{padding:1.5rem}}
</style>
</head>''', 1)
    return t
edit('team-building/index.html', team)

edit('index.html', lambda t: sub(t, 'for companies, startups &amp; sports teams.', 'for companies and startups.'))
edit('learn/mental-training-freediving/index.html', lambda t: sub(t, '<strong>Teams & athletic performance</strong>', '<strong>Team building</strong>'))

# ---- Blog index: remove ADHD / PTSD cards ----
def blog(t):
    for slug in ('freediving-and-adhd', 'freediving-and-ptsd'):
        t = sub(t, r'\s*<a class="article-card" href="\.\./blog/%s/">.*?</a>' % slug, '', regex=True, flags=re.S, label=slug)
    return t
edit('blog/index.html', blog)

# ---- Sitemap ----
def sitemap(t):
    for p in ('athlete-mental-performance', 'judge', 'blog/freediving-and-adhd', 'blog/freediving-and-ptsd'):
        t = re.sub(r'\s*<url><loc>[^<]*/%s/?</loc>.*?</url>' % re.escape(p), '', t, flags=re.S)
    return t
edit('sitemap.xml', sitemap)

# ---- Redirects for removed pages ----
RULES = [('/athlete-mental-performance', '/team-building'), ('/judge', '/'), ('/judge/*', '/'),
         ('/blog/freediving-and-adhd', '/blog'), ('/blog/freediving-and-ptsd', '/blog')]
def toml(t):
    if '/athlete-mental-performance' in t: return t
    add = '\n# Removed pages\n'
    for src, dst in RULES:
        for s in ([src, src + '/'] if not src.endswith('*') else [src]):
            add += f'[[redirects]]\n  from = "{s}"\n  to = "{dst}"\n  status = 301\n  force = true\n\n'
    return t.rstrip('\n') + '\n' + add
edit('netlify.toml', toml)

# ---- Delete pages ----
for d in ('athlete-mental-performance', 'judge', 'blog/freediving-and-adhd', 'blog/freediving-and-ptsd'):
    if os.path.isdir(d):
        shutil.rmtree(d); log.append(f'removed {d}/')
if os.path.exists('aida-judge-og.png'):
    os.remove('aida-judge-og.png'); log.append('removed aida-judge-og.png')

print('\n'.join(log))
