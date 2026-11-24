#!/usr/bin/env python3
"""Move the site from freedivingbrain.com to barcelonafreedivers.com.

Run ONLY after barcelonafreedivers.com is connected to the Netlify site
(Netlify > Domain management > Add domain, then DNS set as Netlify shows),
and freedivingbrain.com is still attached as a domain alias.

  python3 tools/switch-domain.py            # links, canonical URLs, sitemap, CNAME, redirect
  python3 tools/switch-domain.py --email    # also switch hello@ to the new domain
                                            # (only once that mailbox exists)
"""
import glob, os, re, sys

OLD, NEW = 'freedivingbrain.com', 'barcelonafreedivers.com'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
switch_email = '--email' in sys.argv

files = [f for f in glob.glob('**/*', recursive=True)
         if os.path.isfile(f) and f.endswith(('.html', '.xml', '.txt', '.css', '.js', '.json'))
         and not f.startswith('tools/')]
changed = 0
for f in files:
    t = open(f, encoding='utf-8').read()
    n = t
    if not switch_email:
        # protect the mailbox address while swapping URLs
        n = n.replace('@' + OLD, '@\x00OLD\x00')
    n = re.sub(r'(https?://)(www\.)?' + re.escape(OLD), r'\1' + NEW, n)
    n = n.replace(OLD, NEW)
    n = n.replace('@\x00OLD\x00', '@' + OLD)
    if n != t:
        open(f, 'w', encoding='utf-8').write(n); changed += 1

open('CNAME', 'w').write(NEW + '\n')

toml = open('netlify.toml').read()
rule = f'''
# Old domain -> new domain (keep freedivingbrain.com attached in Netlify as an alias)
[[redirects]]
  from = "https://{OLD}/*"
  to = "https://{NEW}/:splat"
  status = 301
  force = true

[[redirects]]
  from = "https://www.{OLD}/*"
  to = "https://{NEW}/:splat"
  status = 301
  force = true
'''
if f'https://{OLD}/*' not in toml:
    # domain redirects must come before the other rules
    head, sep, rest = toml.partition('[[redirects]]')
    toml = head + rule.lstrip('\n') + '\n' + sep + rest
    open('netlify.toml', 'w').write(toml)

print(f'{changed} files updated, CNAME and netlify.toml set for {NEW}'
      + ('' if switch_email else f' (email addresses kept on {OLD})'))
