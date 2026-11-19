#!/usr/bin/env python3
"""Freediving Brain company page: same engine as make_posts.py, with the school's brand.

    python make_fdb.py          # render every company-page post
    python make_fdb.py 1 2      # render posts 01 and 02

Config fdb/posts.json, captions fdb/captions/, output fdb/output/, review fdb/review/.
Photos are shared with the personal studio (photos/), prefixed fdb-XX.
"""
import sys
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageFont
import make_posts as m

ROOT = Path(__file__).resolve().parent
FDB = ROOT / "fdb"
m.CONFIG, m.CAPTIONS, m.OUT, m.REVIEW = FDB / "posts.json", FDB / "captions", FDB / "output", FDB / "review"

# Brand colors from freedivingbrain.com: --surface #1c3026, --deep #0c1a15, --teal #7ecdb0, --gold #c9a84c, --txt #ece8e0
m.SURFACE, m.DEEP, m.ABYSS = (28, 48, 38), (12, 26, 21), (5, 11, 9)
m.CREAM, m.DIM, m.ACCENT = (236, 232, 224), (160, 184, 172), (126, 205, 176)
GOLD = (201, 168, 76)


@lru_cache(maxsize=None)
def _mulish(size, weight, italic=False):
    f = ImageFont.truetype(str(ROOT / "fonts" / ("Mulish-Italic-Variable.ttf" if italic else "Mulish-Variable.ttf")), size)
    f.set_variation_by_axes([weight])
    return f


m.serif = lambda s: _mulish(int(s * 0.86), 800)        # headline: Mulish ExtraBold, sized to match the layout
m.serif_i = lambda s: _mulish(int(s * 0.80), 400, True)
m.mono = lambda s: _mulish(s, 700)

LOGO = Image.open(ROOT.parent / "logo-mark.png").convert("RGBA")


def tracked(c, name, xy, text, font, fill, tracking):
    """Letter-spaced caps, like the logo wordmark."""
    x, y = xy
    x0 = x
    for ch in text:
        c.d.text((x, y), ch, font=font, fill=fill, anchor="ls", stroke_width=3, stroke_fill=m.DEEP)
        x += c.d.textlength(ch, font=font) + tracking
    c.boxes.append((name, (x0, y - font.size, x - tracking, y + 4), True))


def logo_mark(c, depth, opacity=1.0):
    """The flower-of-life mark sits where the depth gauge was."""
    size = 92
    mark = LOGO.resize((size, size), Image.LANCZOS)
    if opacity < 1:
        mark.putalpha(mark.getchannel("A").point(lambda a: int(a * max(opacity, 0.85))))
    base = c.img.convert("RGBA")
    badge = Image.new("RGBA", base.size, (0, 0, 0, 0))
    cx, cy, r = m.X - size // 2 - 34, 120 + size // 2, size // 2 + 10
    m.ImageDraw.Draw(badge).ellipse([cx - r, cy - r, cx + r, cy + r], fill=m.DEEP + (190,))
    base.alpha_composite(badge)
    base.alpha_composite(mark, (m.X - size - 34, 120))
    c.img = base.convert("RGB")
    c.d = m.ImageDraw.Draw(c.img)
    c.boxes.append(("logo", (m.X - size - 44, 110, m.X - 24, 130 + size), False))


def top_label(c, num, pillar, fill=None, depth=None):
    logo_mark(c, 0)
    tracked(c, "top label", (m.X, 178), pillar, m.mono(20), m.ACCENT if fill is None else m.ACCENT, 3)


def footer(c):
    tracked(c, "footer name", (m.X, 1205), "FREEDIVING BRAIN", _mulish(22, 700), m.CREAM, 5)
    c.d.text((m.X, 1245), "Barcelona  ·  freedivingbrain.com", font=_mulish(18, 500), fill=m.DIM, anchor="ls")
    c.boxes.append(("footer os", c.d.textbbox((m.X, 1245), "Barcelona  ·  freedivingbrain.com", font=_mulish(18, 500), anchor="ls"), True))


m.gauge, m.top_label, m.footer = (lambda c, depth, opacity=1.0: None), top_label, footer

if __name__ == "__main__":
    sys.exit(m.main(sys.argv[1:]))
