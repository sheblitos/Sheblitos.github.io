"""Barcelona Freedivers page kit: one page skeleton + shared building blocks.
Every page is written as <head> (SEO kept from the existing page) + blocks.
tools/rebrand.py then adds the shared header, footer, font and site.css."""
import html, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'https://freedivingbrain.com'
WA = 'https://wa.me/34603083325'
GA = ('<script async src="https://www.googletagmanager.com/gtag/js?id=G-VR5PT4F97R"></script>\n'
      "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-VR5PT4F97R');</script>")

def esc(s): return html.escape(s, quote=True)

def pic(name, alt='', cls='', pos=None, eager=False):
    path = os.path.join(ROOT, name + '.jpg')
    w, h = Image.open(path).size
    st = f' style="object-position:{pos}"' if pos else ''
    c = f' class="{cls}"' if cls else ''
    ld = 'eager" fetchpriority="high' if eager else 'lazy'
    return (f'<picture{c}><source srcset="/{name}.avif" type="image/avif"><source srcset="/{name}.webp" type="image/webp">'
            f'<img src="/{name}.jpg" alt="{esc(alt)}" width="{w}" height="{h}" loading="{ld}" decoding="async"{st}></picture>')

def head_from(path, title=None, desc=None, extra=''):
    """Keep the existing page's SEO head (title, meta, canonical, og, structured data); drop old styles/scripts."""
    full = os.path.join(ROOT, path)
    t = open(full, encoding='utf-8').read() if os.path.exists(full) else ''
    m = re.search(r'<head[^>]*>(.*?)</head>', t, re.S)
    h = m.group(1) if m else ''
    h = re.sub(r'<!-- BF:HEAD -->.*?<!-- /BF:HEAD -->', '', h, flags=re.S)
    h = re.sub(r'<style\b.*?</style>', '', h, flags=re.S)
    h = re.sub(r'<script\b(?![^>]*ld\+json)[^>]*>.*?</script>', '', h, flags=re.S)
    h = re.sub(r'<link\b(?![^>]*rel="canonical")(?![^>]*rel="alternate")[^>]*>', '', h)
    h = re.sub(r'<noscript>.*?</noscript>', '', h, flags=re.S)
    h = re.sub(r'<meta charset[^>]*>|<meta name="viewport"[^>]*>', '', h)
    h = re.sub(r'<!--.*?-->', '', h, flags=re.S)
    if title:
        h = re.sub(r'<title>.*?</title>', f'<title>{esc(title)}</title>', h, flags=re.S)
        h = re.sub(r'(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*', lambda mm: mm.group(1) + esc(title), h)
    if desc:
        h = re.sub(r'(<meta name="description" content=")[^"]*', lambda mm: mm.group(1) + esc(desc), h)
        h = re.sub(r'(<meta (?:property|name)="(?:og|twitter):description" content=")[^"]*', lambda mm: mm.group(1) + esc(desc), h)
    if '<title>' not in h and title:
        h = f'<title>{esc(title)}</title>\n<meta name="description" content="{esc(desc or "")}">' + h
    h = re.sub(r'\n\s*\n+', '\n', h).strip()
    return (f'<!DOCTYPE html>\n<html lang="en">\n<head>\n{GA}\n<meta charset="UTF-8">\n'
            f'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n{h}\n'
            f'<link rel="stylesheet" href="/type-system.css?v=5">{extra}\n</head>\n')

def page(path, body, title=None, desc=None, extra_head='', body_class=''):
    out = head_from(path, title, desc, extra_head) + f'<body{(" class=%s" % chr(34) + body_class + chr(34)) if body_class else ""}>\n{body}\n</body>\n</html>\n'
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full) or ROOT, exist_ok=True)
    open(full, 'w', encoding='utf-8').write(out)
    return path

# ---------- blocks ----------
def hero(img, eyebrow, title, lead='', facts=(), actions=(), pos='center 40%', small=True, crumbs=None):
    f = ''.join(f'<li>{x}</li>' for x in facts)
    a = ''.join(actions)
    c = f'<p class="bf-crumbs">{crumbs}</p>' if crumbs else ''
    return (f'<section class="bf-hero photo-hero{" bf-hero-sm" if small else ""}">\n  {pic(img, "", "bf-hero-img", pos, eager=True)}\n'
            f'  <div class="bf-hero-inner">{c}<p class="bf-eyebrow">{eyebrow}</p><h1>{title}</h1>'
            + (f'<p class="bf-hero-lead">{lead}</p>' if lead else '')
            + (f'<ul class="bf-facts">{f}</ul>' if facts else '')
            + (f'<div class="bf-actions">{a}</div>' if actions else '') + '</div>\n</section>')

def plain_head(eyebrow, title, lead=''):
    return (f'<section class="bf-sec bf-pagehead"><div class="bf-wrap"><p class="bf-eyebrow">{eyebrow}</p><h1>{title}</h1>'
            + (f'<p class="bf-lead">{lead}</p>' if lead else '') + '</div></section>')

def btn(href, label='Book now', ghost=False):
    return f'<a href="{href}" class="bf-btn{" bf-btn-ghost" if ghost else ""}">{label}</a>'

def link(href, label): return f'<a href="{href}" class="bf-link">{label}</a>'

def sec(inner, alt=False, narrow=False, sid=None):
    i = f' id="{sid}"' if sid else ''
    return f'<section class="bf-sec{" bf-sec-alt" if alt else ""}"{i}><div class="bf-wrap{" bf-narrow" if narrow else ""}">{inner}</div></section>'

def heading(eyebrow, title, lead=''):
    return f'<p class="bf-eyebrow">{eyebrow}</p><h2>{title}</h2>' + (f'<p class="bf-lead">{lead}</p>' if lead else '')

def checklist(items): return '<ul class="bf-check">' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'

def steps(items): return '<ol class="bf-steps">' + ''.join(f'<li><b>{a}</b><span>{b}</span></li>' for a, b in items) + '</ol>'

def info(pairs): return '<dl class="bf-info">' + ''.join(f'<div><dt>{a}</dt><dd>{b}</dd></div>' for a, b in pairs) + '</dl>'

def photo_split(text_html, img, alt='', pos=None, sub=None):
    s = pic(sub[0], sub[1], 'bf-photo-sub') if sub else ''
    return f'<div class="bf-split"><div>{text_html}</div><div class="bf-photo-stack{" bf-single" if not sub else ""}">{pic(img, alt, "bf-photo-main", pos)}{s}</div></div>'

def cards(items, swipe=True):
    """items: (href, img, alt, title, text, note, pos)"""
    out = ''
    for href, img, alt, title, text, note, pos in items:
        out += (f'<a class="bf-card" href="{href}">{pic(img, alt, "bf-card-img", pos)}<span class="bf-card-body"><b>{title}</b>'
                f'<span>{text}</span>' + (f'<em>{note}</em>' if note else '') + '</span></a>')
    return f'<div class="bf-cards{" bf-swipe" if swipe else ""}">{out}</div>'

def textcards(items, cols=3, swipe=True):
    out = ''.join(f'<div class="bf-tcard"><b>{a}</b><span>{b}</span></div>' for a, b in items)
    return f'<div class="bf-tcards bf-cols-{cols}{" bf-swipe" if swipe else ""}">{out}</div>'

def faq(items):
    return '<div class="bf-faq">' + ''.join(f'<details class="bf-faq-item"><summary>{q}</summary><p>{a}</p></details>' for q, a in items) + '</div>'

def book(eyebrow, title, text, item, sid='book'):
    return (f'<!-- BF:BOOK -->\n<section class="bf-book" id="{sid}">\n  <div class="bf-book-inner">\n'
            f'    <p class="bf-book-eyebrow">{eyebrow}</p>\n    <h2>{title}</h2>\n    <p>{text}</p>\n'
            f'    <a href="/book{("?for=" + item) if item else ""}" class="bf-btn">Book now</a>\n'
            f'    <p class="bf-book-alt">Prefer to talk first? <a href="{WA}" target="_blank" rel="noopener">Message us on WhatsApp</a></p>\n'
            '  </div>\n</section>\n<!-- /BF:BOOK -->')
