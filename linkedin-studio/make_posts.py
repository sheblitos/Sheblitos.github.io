#!/usr/bin/env python3
"""LinkedIn Content Studio: render post images and captions from posts.json.

Usage:
    python make_posts.py 1 5        # render posts 01 and 05
    python make_posts.py            # render every post whose source files exist

For each post it writes output/post-XX/{caption.txt,image-1.png,image-2.png},
runs an overlap/edge check on every image, checks the caption against the
voice rules, and renders review/contact-sheet.png for the batch.
"""
import json
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
FONTS, PHOTOS, OUT, REVIEW, CAPTIONS = (ROOT / p for p in ("fonts", "photos", "output", "review", "captions"))
W, H = 1080, 1350
X = 230                 # text column
RIGHT_MARGIN = 80
GX, GY0, GY1, GMAX = 150, 150, 1200, 70   # depth gauge
CONFIG = ROOT / "posts.json"
PHOTO_EXT = (".jpg", ".jpeg", ".png", ".webp")

SURFACE, DEEP, ABYSS = (26, 92, 110), (6, 16, 28), (2, 6, 12)
CREAM, DIM, ACCENT = (238, 232, 218), (150, 170, 175), (120, 200, 205)
FOOTER_NAME = "Abd-El-Rahman Shebl"
FOOTER_OS = "Go deep. Find the signal. Build the test. Bring it to the surface."


def serif(s): return ImageFont.truetype(str(FONTS / "InstrumentSerif-Regular.ttf"), s)
def serif_i(s): return ImageFont.truetype(str(FONTS / "InstrumentSerif-Italic.ttf"), s)
def mono(s): return ImageFont.truetype(str(FONTS / "DMMono-Regular.ttf"), s)
def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def depth_colors(depth):
    t0 = depth / GMAX
    return t0, lerp(SURFACE, DEEP, min(1, t0 * 1.1)), lerp(DEEP, ABYSS, t0)


class Canvas:
    """Image plus a record of every placed element, for the QA pass."""

    def __init__(self, img):
        self.img = img.convert("RGB")
        self.d = ImageDraw.Draw(self.img)
        self.boxes = []   # (name, bbox, is_text)

    def text(self, name, xy, s, font, fill, anchor="la"):
        self.d.text(xy, s, font=font, fill=fill, anchor=anchor)
        self.boxes.append((name, self.d.textbbox(xy, s, font=font, anchor=anchor), True))


# ---------------------------------------------------------------- backgrounds
def ocean_background(num, depth):
    t0, top, bot = depth_colors(depth)
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=lerp(top, bot, y / H))
    rays = Image.new("L", (W, H), 0)
    rd = ImageDraw.Draw(rays)
    random.seed(num * 7)
    for _ in range(5):
        x = random.randint(200, 1000); w = random.randint(40, 120)
        rd.polygon([(x, 0), (x + w, 0), (x + w * 3 - 300, H), (x - 300, H)], fill=int(26 * (1 - t0)))
    rays = rays.filter(ImageFilter.GaussianBlur(40))
    return Image.composite(Image.new("RGB", (W, H), (200, 235, 240)), img, rays)


def bubbles(c, num, depth, avoid):
    """Small outlined bubbles in the right third, skipping any that would touch text."""
    _, top, _ = depth_colors(depth)
    random.seed(num)
    for _ in range(38):
        x = random.randint(760, 1020); y = random.randint(120, 1150)
        r = random.choice([2, 2, 3, 3, 4, 6])
        bb = (x - r - 12, y - r - 12, x + r + 12, y + r + 12)
        if any(overlap(bb, a) for a in avoid):
            continue
        c.d.ellipse([x - r, y - r, x + r, y + r], outline=lerp(DIM, top, 0.4), width=1)


def gauge(c, depth, opacity=1.0):
    _, _, bot = depth_colors(depth)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    a = int(255 * opacity)
    d.line([(GX, GY0), (GX, GY1)], fill=lerp(DIM, bot, 0.55) + (a,), width=1)
    for m in range(0, GMAX + 1, 5):
        y = GY0 + (GY1 - GY0) * m / GMAX
        L = 18 if m % 10 == 0 else 9
        d.line([(GX, y), (GX + L, y)], fill=lerp(DIM, bot, 0.45 if m % 10 == 0 else 0.65) + (a,), width=1)
    my = GY0 + (GY1 - GY0) * depth / GMAX
    d.ellipse([GX - 6, my - 6, GX + 6, my + 6], fill=ACCENT + (max(a, 200),))
    label = f"−{depth} m"
    halo = {} if opacity >= 1 else {"stroke_width": 2, "stroke_fill": DEEP + (170,)}  # readable on bright photos
    d.text((GX - 28, my), label, font=mono(20), fill=ACCENT + (255 if halo else max(a, 220),), anchor="rm", **halo)
    c.img.paste(Image.alpha_composite(c.img.convert("RGBA"), layer).convert("RGB"))
    c.boxes.append(("depth label", d.textbbox((GX - 28, my), label, font=mono(20), anchor="rm", **{k: v for k, v in halo.items() if k == "stroke_width"}), True))


def top_label(c, num, pillar, fill=DIM, depth=None):
    s = f"{num:02d} / {pillar}" + (f" / −{depth} m" if depth is not None else "")
    halo = {"stroke_width": 3, "stroke_fill": DEEP} if fill == CREAM else {}   # on photos
    c.d.text((X, 150), s, font=mono(22), fill=fill, anchor="lt", **halo)
    c.boxes.append(("top label", c.d.textbbox((X, 150), s, font=mono(22), anchor="lt", **{k: v for k, v in halo.items() if k == "stroke_width"}), True))


def footer(c):
    c.text("footer name", (X, 1205), FOOTER_NAME, mono(22), CREAM, anchor="ls")
    c.text("footer os", (X, 1245), FOOTER_OS, mono(17), DIM, anchor="ls")


# ---------------------------------------------------------------- headline block
def fit_headline(c, lines):
    size = 96 if max(len(l) for l in lines) <= 18 else 80
    maxw = W - X - RIGHT_MARGIN
    while any(c.d.textlength(l, font=serif(size)) > maxw for l in lines):
        size -= 4
    return size, int(size * 1.12)


def wrap(c, text, font, maxw):
    out, line = [], ""
    for word in text.split():
        trial = (line + " " + word).strip()
        if c.d.textlength(trial, font=font) <= maxw or not line:
            line = trial
        else:
            out.append(line); line = word
    return out + [line]


def headline_block(c, lines, sub, top_y=None, bottom_y=None):
    """Headline, accent rule, italic subline. Give top_y, or bottom_y to stack upward."""
    size, lh = fit_headline(c, lines)
    f, fs = serif(size), serif_i(36)
    sub_lines = wrap(c, sub, fs, W - X - RIGHT_MARGIN)
    sub_h = 44 * len(sub_lines)
    if top_y is None:
        top_y = bottom_y - sub_h - 75 - lh * len(lines)
    y = top_y
    for i, l in enumerate(lines):
        c.text(f"headline {i+1}", (X, y), l, f, CREAM); y += lh
    c.d.line([(X, y + 40), (X + 80, y + 40)], fill=ACCENT, width=2)
    c.boxes.append(("accent rule", (X, y + 39, X + 80, y + 41), False))
    for i, s in enumerate(sub_lines):
        c.text(f"subline {i+1}", (X, y + 75 + 44 * i), s, fs, DIM)


# ---------------------------------------------------------------- photos
def find_photo(stem):
    for ext in PHOTO_EXT:
        for p in (PHOTOS / (stem + ext), PHOTOS / (stem + ext.upper())):
            if p.exists():
                return p
    return None


def detect_faces(img):
    """Face boxes (x0, y0, x1, y1). YuNet if the model is present (handles masks and
    profiles better), Haar cascades as a fallback."""
    try:
        import cv2
    except ImportError:
        return None
    rgb = np.asarray(img)
    scale = min(1.0, 1600 / max(rgb.shape[:2]))
    small = cv2.resize(rgb, None, fx=scale, fy=scale) if scale < 1 else rgb
    found = []
    model = ROOT / "models" / "face_detection_yunet_2023mar.onnx"
    if model.exists() and hasattr(cv2, "FaceDetectorYN"):
        bgr = cv2.cvtColor(small, cv2.COLOR_RGB2BGR)
        det = cv2.FaceDetectorYN.create(str(model), "", (bgr.shape[1], bgr.shape[0]), 0.6)
        _, faces = det.detect(bgr)
        for f in (faces if faces is not None else []):
            x, y, w, h = f[:4]
            found.append((x, y, x + w, y + h))
    elif hasattr(cv2, "CascadeClassifier"):
        g = cv2.cvtColor(small, cv2.COLOR_RGB2GRAY)
        for cascade in ("haarcascade_frontalface_default.xml", "haarcascade_profileface.xml"):
            det = cv2.CascadeClassifier(cv2.data.haarcascades + cascade)
            for (x, y, w, h) in det.detectMultiScale(g, 1.1, 6, minSize=(40, 40)):
                found.append((x, y, x + w, y + h))
    return [tuple(int(v / scale) for v in b) for b in found]


def crop_45(img, focus=None, face_y=0.32):
    """Crop to 4:5 keeping faces in frame. Returns (image, note)."""
    w, h = img.size
    faces = detect_faces(img) or []   # always detected, so QA can protect them even with a manual focus
    if focus:
        cx, cy, note = focus[0] * w, focus[1] * h, "manual focus"
    elif faces:
        x0 = min(f[0] for f in faces); y0 = min(f[1] for f in faces)
        x1 = max(f[2] for f in faces); y1 = max(f[3] for f in faces)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        note = f"{len(faces)} face(s) detected"
    else:
        cx, cy, note = w / 2, h / 2, "no face detected, centered crop: PLEASE CONFIRM"
    if w / h > 0.8:
        cw, ch = int(h * 0.8), h
        left = int(min(max(cx - cw / 2, 0), w - cw)); top = 0
    else:
        cw, ch = w, int(w * 1.25)
        left = 0; top = int(min(max(cy - ch * face_y, 0), h - ch))
    if faces:  # make sure every face is fully inside
        for f in faces:
            if f[0] < left or f[2] > left + cw or f[1] < top or f[3] > top + ch:
                note += ", WARNING: a face is cut by the crop"
                break
    out = img.crop((left, top, left + cw, top + ch))
    if cw < W:
        note += f", low resolution ({cw}px wide, upscaled)"
    k = W / cw
    mapped = [(int((f[0] - left) * k), int((f[1] - top) * k), int((f[2] - left) * k), int((f[3] - top) * k))
              for f in faces]
    mapped = [(max(0, a), max(0, b), min(W, c), min(H, d)) for a, b, c, d in mapped if c > 0 and d > 0 and a < W and b < H]
    return out.resize((W, H), Image.LANCZOS), note, mapped


def grade(img, strength=0.18):
    """Light teal grade. Never alters shapes, only color."""
    a = np.asarray(img).astype(np.float32) / 255
    lum = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2])[..., None]
    lo, hi = np.array(DEEP) / 255, np.array((205, 230, 228)) / 255
    tint = lo + (hi - lo) * lum
    return Image.fromarray((np.clip(a * (1 - strength) + tint * strength, 0, 1) * 255).astype(np.uint8))


def darken(img, overlay, bright=False):
    """Bottom gradient (transparent to navy 85% over the bottom 55%) plus a light top scrim for the label."""
    alpha = np.zeros((H, 1), np.float32)
    ys = np.arange(H)
    start, full = (H * 0.32, H * 0.66) if bright else (H * 0.45, H * 0.78)
    alpha[:, 0] = np.clip((ys - start) / (full - start), 0, 1) * 0.85
    if not overlay:  # clean mode: only enough for the footer
        start = H * 0.68
        alpha[:, 0] = np.clip((ys - start) / (H * 0.86 - start), 0, 1) * 0.85
    alpha[:, 0] = np.maximum(alpha[:, 0], np.clip(1 - ys / (H * 0.20), 0, 1) * 0.60)
    a = np.repeat(alpha, W, axis=1)[..., None]
    base = np.asarray(img).astype(np.float32)
    return Image.fromarray((base * (1 - a) + np.array(DEEP) * a).astype(np.uint8))


def busy_score(img, box):
    """Std-dev of luminance behind the text area. High means hard-to-read text."""
    region = np.asarray(img.crop(box).convert("L")).astype(np.float32)
    return float(region.std()), float(region.mean())


# ---------------------------------------------------------------- renderers
def render_graphic(p):
    c = Canvas(ocean_background(p["num"], p["depth"]))
    gauge(c, p["depth"])
    top_label(c, p.get("label_num", p["num"]), p["pillar"])
    size, lh = fit_headline(c, p["headline"])
    headline_block(c, p["headline"], p["subline"], top_y=int(H * 0.47 - lh * len(p["headline"]) / 2))
    footer(c)
    bubbles(c, p["num"], p["depth"], [b for _, b, t in c.boxes if t])
    return c, "branded graphic"


def render_photo(p, spec):
    src = find_photo(spec["src"])
    raw = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    img, note, faces = crop_45(raw, spec.get("focus"))
    overlay = spec.get("mode", "overlay") == "overlay"
    img = grade(img)
    zone = np.asarray(img.convert("L"))[int(H * 0.5):int(H * 0.75), X:W - RIGHT_MARGIN]
    bright = overlay and float(zone.mean()) > 120   # light water or sky behind the headline
    img = darken(img, overlay, bright)
    if bright:
        note += ", bright background: stronger shading"
    c = Canvas(img)
    # The gauge runs down the left edge. If it would cross a face (detected, or flagged with
    # "gauge": false for faces the detector misses), drop it and show the depth in the top label.
    gauge_zone = (GX - 110, GY0, GX + 24, GY1)
    show_gauge = spec.get("gauge", True) and not any(overlap(gauge_zone, f) for f in faces)
    if show_gauge:
        gauge(c, p["depth"], opacity=0.45)
    else:
        note += ", gauge hidden (face on the left), depth in top label"
    top_label(c, p.get("label_num", p["num"]), p["pillar"], fill=CREAM, depth=None if show_gauge else p["depth"])
    for i, f in enumerate(faces):   # faces join QA: no text may touch them
        c.boxes.append((f"face {i+1}", (f[0] - 12, f[1] - 12, f[2] + 12, f[3] + 12), False))
    if overlay:
        headline_block(c, p["headline"], p["subline"], bottom_y=1140)
        tb = [b for n, b, _ in c.boxes if n.startswith(("headline", "subline"))]
        box = (X, min(b[1] for b in tb), W - RIGHT_MARGIN, max(b[3] for b in tb))
        std, mean = busy_score(img, box)
        note += f", text area contrast std {std:.0f} / mean {mean:.0f}"
        if std > 38 or mean > 110:
            note += " -> BUSY: consider mode 'clean' + graphic as image 2"
    footer(c)
    return c, f"photo {src.name} ({'overlay' if overlay else 'clean, footer only'}; {note})"


def rounded_paste(c, im, x, y, r, outline=None, shadow=True):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.width - 1, im.height - 1], r, fill=255)
    if shadow:
        sh = Image.new("L", (W, H), 0)
        ImageDraw.Draw(sh).rounded_rectangle([x + 6, y + 16, x + im.width + 6, y + im.height + 16], r, fill=160)
        c.img = Image.composite(Image.new("RGB", (W, H), ABYSS), c.img, sh.filter(ImageFilter.GaussianBlur(20)))
    c.img.paste(im, (x, y), mask)
    c.d = ImageDraw.Draw(c.img)
    if outline:
        c.d.rounded_rectangle([x, y, x + im.width - 1, y + im.height - 1], r, outline=outline, width=1)


def browser_frame(shot, width, url):
    """Desktop screenshot inside a minimal browser window."""
    bar = 46
    shot = shot.resize((width, int(shot.height * width / shot.width)), Image.LANCZOS)
    win = Image.new("RGB", (width, shot.height + bar), (16, 26, 34))
    d = ImageDraw.Draw(win)
    for i, col in enumerate(((237, 106, 94), (245, 191, 79), (98, 197, 84))):
        d.ellipse([18 + i * 22, bar / 2 - 6, 30 + i * 22, bar / 2 + 6], fill=col)
    d.rounded_rectangle([100, 10, width - 24, bar - 10], 13, fill=(28, 40, 50))
    d.text((118, bar / 2), url, font=mono(16), fill=DIM, anchor="lm")
    win.paste(shot, (0, bar))
    return win


def phone_frame(shot, width):
    """Mobile screenshot inside a simple phone body."""
    bezel = 12
    inner_w = width - 2 * bezel
    shot = shot.resize((inner_w, int(shot.height * inner_w / shot.width)), Image.LANCZOS)
    status = 46   # status bar so the notch never covers the page
    screen = Image.new("RGB", (inner_w, shot.height + status), (14, 22, 26))
    screen.paste(shot, (0, status))
    body = Image.new("RGB", (width, screen.height + 2 * bezel), (10, 14, 18))
    m = Image.new("L", screen.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, screen.width - 1, screen.height - 1], 30, fill=255)
    body.paste(screen, (bezel, bezel), m)
    d = ImageDraw.Draw(body)
    d.rounded_rectangle([width / 2 - 38, bezel + 10, width / 2 + 38, bezel + 32], 11, fill=(0, 0, 0))
    return body


def render_screenshot(p, spec):
    """Desktop screenshot in a browser frame, plus an optional phone mockup overlapping it."""
    src = find_photo(spec["src"])
    shot = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    c = Canvas(ocean_background(p["num"], p["depth"]))
    gauge(c, p["depth"], opacity=0.6)
    top_label(c, p.get("label_num", p["num"]), p["pillar"])
    edge = lerp(DIM, DEEP, 0.35)
    win = browser_frame(shot, W - X - RIGHT_MARGIN + 40, spec.get("url", ""))
    wx, wy = X, 260
    rounded_paste(c, win, wx, wy, 14, outline=edge)
    c.boxes.append(("browser", (wx, wy, wx + win.width, wy + win.height), False))
    desc = f"{src.name} in a browser frame"
    if spec.get("mobile") and find_photo(spec["mobile"]):
        msrc = find_photo(spec["mobile"])
        phone = phone_frame(ImageOps.exif_transpose(Image.open(msrc)).convert("RGB"), 300)
        px, py = W - RIGHT_MARGIN + 40 - phone.width - 30, 1150 - phone.height
        rounded_paste(c, phone, px, py, 42, outline=edge)
        desc += f" + {msrc.name} on a phone"
        c.text("caption", (X, py + phone.height - 120), spec.get("note", ""), serif_i(36), DIM)
        c.text("caption 2", (X, py + phone.height - 72), spec.get("note2", ""), serif_i(36), DIM)
    footer(c)
    return c, desc + " on branded background"


def render_photo_top(p, spec):
    """Wide photo shown whole across the top, fading into the ocean background, headline below.
    For landscape group shots where a 4:5 crop would cut people out."""
    src = find_photo(spec["src"])
    raw = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    pure = spec.get("pure")   # breathing photos: true colors, no grade, no dark scrim
    ph = raw.resize((W, int(raw.height * W / raw.width)), Image.LANCZOS)
    if not pure:
        ph = grade(ph)
    ph_h = min(ph.height, int(H * (0.85 if spec.get("no_headline") else 0.62)))
    y0 = min(int(ph.height * spec.get("crop_top", 0)), max(0, ph.height - ph_h))   # start lower in tall photos
    ph = ph.crop((0, y0, W, y0 + ph_h))
    c = Canvas(ocean_background(p["num"], p["depth"]))
    fade = Image.new("L", (W, ph_h), 255)
    fd = ImageDraw.Draw(fade)
    for y in range(ph_h - 180, ph_h):
        fd.line([(0, y), (W, y)], fill=int(255 * (ph_h - y) / 180))
    c.img.paste(ph, (0, 0), fade)
    scrim = np.asarray(c.img).astype(np.float32)
    ys = np.arange(H)[:, None, None]
    a = np.clip(1 - ys / (H * 0.20), 0, 1) * (0 if pure else 0.55)
    c.img = Image.fromarray((scrim * (1 - a) + np.array(DEEP) * a).astype(np.uint8))
    c.d = ImageDraw.Draw(c.img)
    faces = []
    for f in detect_faces(raw) or []:
        k = W / raw.width
        x0_, y0_, x1_, y1_ = (int(v * k) for v in f)
        faces.append((x0_, y0_ - y0, x1_, y1_ - y0))
    top_label(c, p.get("label_num", p["num"]), p["pillar"], fill=CREAM, depth=p["depth"])
    for i, f in enumerate(faces):
        if f[1] < ph_h:
            c.boxes.append((f"face {i+1}", (f[0] - 8, f[1] - 8, f[2] + 8, f[3] + 8), False))
    if not spec.get("no_headline"):   # second image of a post: photo + footer only
        headline_block(c, p["headline"], p["subline"], bottom_y=1140)
    footer(c)
    return c, f"photo {src.name} shown whole at the top ({len(faces)} faces), headline below"


def render_raw(spec):
    """A finished slide or photo used as is (fitted to 4:5), e.g. an already designed graphic."""
    src = find_photo(spec["src"])
    im = ImageOps.fit(ImageOps.exif_transpose(Image.open(src)).convert("RGB"), (W, H), Image.LANCZOS)
    return Canvas(im), f"{src.name} used as is"


def build_carousel(p, folder):
    """LinkedIn document post: cover (image-1) plus every image in photos/<carousel>/, as one PDF."""
    slides = [Image.open(folder / "image-1.png").convert("RGB")]
    for f in sorted((PHOTOS / p["carousel"]).iterdir()):
        if f.suffix.lower() in PHOTO_EXT:
            slides.append(ImageOps.fit(ImageOps.exif_transpose(Image.open(f)).convert("RGB"), (W, H), Image.LANCZOS))
    out = folder / "carousel.pdf"
    slides[0].save(out, save_all=True, append_images=slides[1:], resolution=150)
    return out, len(slides)


# ---------------------------------------------------------------- QA
def overlap(a, b):
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


def qa(c):
    issues = []
    for name, b, is_text in c.boxes:
        if name.startswith("face"):
            continue
        if b[0] < 40 or b[1] < 40 or b[2] > W - 40 or b[3] > H - 40:
            issues.append(f"{name} too close to the edge {b}")
        if is_text and name != "depth label" and b[2] > W - RIGHT_MARGIN:
            issues.append(f"{name} passes the right margin {b}")
    if any(n == "depth label" and b[2] > GX - 10 for n, b, _ in c.boxes):
        issues.append("depth label touches the gauge line")
    for i, (n1, b1, _) in enumerate(c.boxes):
        for n2, b2, _ in c.boxes[i + 1:]:
            if n1.startswith("face") and n2.startswith("face"):
                continue
            if overlap(b1, b2):
                hint = " (use mode 'clean' or set 'focus')" if "face" in n1 + n2 else ""
                issues.append(f"{n1} overlaps {n2}{hint}")
    return issues


def check_caption(text):
    issues = []
    if len(text) > 1300:
        issues.append(f"{len(text)} characters (limit ~1300)")
    for ch, label in (("—", "em dash"), ("–", "en dash")):
        if ch in text:
            issues.append(f"contains an {label}")
    if any(l.lstrip().startswith(("- ", "• ", "* ")) for l in text.splitlines()):
        issues.append("contains bullet points")
    lines = [l for l in text.strip().splitlines() if l.strip()]
    tags = lines[-1].split() if lines else []
    if len(tags) != 3 or not all(t.startswith("#") for t in tags):
        issues.append("last line should be exactly 3 hashtags")
    if any("#" in l for l in lines[:-1]):
        issues.append("hashtag inside the text")
    return issues


# ---------------------------------------------------------------- main
def contact_sheet(rendered):
    tw, th, pad, lab = 324, 405, 24, 54
    cols = min(4, max(1, len(rendered)))
    rows = (len(rendered) + cols - 1) // cols
    sheet = Image.new("RGB", (pad + cols * (tw + pad), pad + rows * (th + lab + pad)), (18, 22, 26))
    d = ImageDraw.Draw(sheet)
    for i, (label, path) in enumerate(rendered):
        x = pad + (i % cols) * (tw + pad); y = pad + (i // cols) * (th + lab + pad)
        sheet.paste(Image.open(path).resize((tw, th), Image.LANCZOS), (x, y))
        d.text((x, y + th + 12), label, font=mono(16), fill=CREAM)
    REVIEW.mkdir(exist_ok=True)
    out = REVIEW / "contact-sheet.png"
    sheet.save(out)
    return out


def main(argv):
    cfg = json.loads(CONFIG.read_text())["posts"]
    wanted = {int(a) for a in argv}
    rendered, problems = [], 0
    for p in cfg:
        if wanted and p["num"] not in wanted:
            continue
        missing = [s[k] for s in p["images"] for k in ("src", "mobile") if k in s and not find_photo(s[k])]
        if missing:
            print(f"post {p['num']:02d}: skipped, waiting for photos/{', photos/'.join(missing)}.(jpg|png|webp)")
            continue
        folder = OUT / f"post-{p['num']:02d}"
        folder.mkdir(parents=True, exist_ok=True)
        print(f"post {p['num']:02d} | {p['pillar']} | -{p['depth']} m")
        cap_src = CAPTIONS / f"post-{p['num']:02d}.txt"
        if cap_src.exists():
            text = cap_src.read_text().strip() + "\n"
            (folder / "caption.txt").write_text(text)
            issues = check_caption(text)
            problems += len(issues)
            print(f"  caption.txt  {len(text.strip())} chars" + ("  ISSUES: " + "; ".join(issues) if issues else "  ok"))
        else:
            print(f"  caption: missing captions/{cap_src.name}"); problems += 1
        for i, spec in enumerate(p["images"], 1):
            fn = {"graphic": lambda s: render_graphic(p),
                  "photo": lambda s: render_photo_top(p, s) if s.get("mode") == "top" else render_photo(p, s),
                  "screenshot": lambda s: render_screenshot(p, s),
                  "raw": lambda s: render_raw(s)}[spec["type"]]
            c, desc = fn(spec)
            path = folder / f"image-{i}.png"
            c.img.save(path, optimize=True)
            issues = qa(c)
            problems += len(issues)
            print(f"  {path.name}  {desc}" + ("\n    QA: " + "\n    QA: ".join(issues) if issues else "  QA ok"))
            rendered.append((f"post-{p['num']:02d} / image-{i}", path))
        if p.get("carousel"):
            out, n = build_carousel(p, folder)
            print(f"  {out.name}  {n} slides (upload as a LinkedIn document post)")
    if rendered:
        print(f"contact sheet: {contact_sheet(rendered).relative_to(ROOT)}")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
