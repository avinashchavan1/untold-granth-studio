#!/usr/bin/env python3
"""Wide (16:9) YouTube thumbnail for full-length videos: REEL=<reel dir> python3 thumbnail_wide.py -> out/<ID>_thumb_wide.jpg (1280x720, < 2 MB).
script.json → thumbnail: {frame: "40s" (art-only frame), hook, stamp, line, badge, side: "left"|"right" (where the text goes; faces on the other side)}."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter
from PIL import ImageFont
# ---- helpers shared with thumbnail.py (copied, so importing it doesn't build the 9:16 cover) ----
REEL = os.path.abspath(os.environ.get("REEL") or sys.argv[1]); SERIES = os.path.dirname(os.path.dirname(REEL))
ENGINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); FONTS = [os.path.join(SERIES, "fonts"), os.path.join(ENGINE, "fonts")]
s = json.load(open(os.path.join(REEL, "src", "script.json"), encoding="utf-8")); ser = json.load(open(os.path.join(SERIES, "series.json"), encoding="utf-8"))
T = s.get("thumbnail") or sys.exit("script.json has no 'thumbnail' block (see engine/py/thumbnail.py)")
pal = ser.get("palette", {}); GOLD = pal.get("gold", "#f6c244"); IVORY = pal.get("ivory", "#fbf3df"); RED = pal.get("red", "#c81e1e"); INK = pal.get("ink", "#07061a")
W, H, SAFE_TOP, SAFE_BOT = 1080, 1920, 240, 1680

def font(name, size, var=None):
    for d in FONTS:
        p = os.path.join(d, name)
        if os.path.exists(p):
            f = ImageFont.truetype(p, size)
            if var:
                try: f.set_variation_by_name(var)
                except Exception: pass
            return f
    sys.exit(f"font {name} missing")
def rgb(h, a=255): h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)

def clean_frame():
    fr = str(T.get("frame", "3s")); fps = 24
    n = round(float(fr[:-1]) * fps) if fr.endswith("s") else int(fr)
    p = os.path.join(REEL, "frames", f"clean_{n:04d}.png")
    if not os.path.exists(p):
        subprocess.run(["node", os.path.join(ENGINE, "js", "render.js"), "clean", str(n)], env=dict(os.environ, REEL=REEL), check=True, stdout=subprocess.DEVNULL)
    return Image.open(p).convert("RGBA")

def wrap(d, text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if cur and d.textlength(t, font=f) > maxw: lines.append(cur); cur = w
        else: cur = t
    return lines + ([cur] if cur else [])

def fit(d, text, name, var, start, maxw, max_lines):
    size = start
    while size > 40:
        f = font(name, size, var); ls = wrap(d, text, f, maxw)
        if len(ls) <= max_lines and all(d.textlength(l, font=f) <= maxw for l in ls): return f, ls
        size -= 6
    return f, ls
import types; T0 = types.SimpleNamespace(**{k: v for k, v in globals().items()})
T0.T = T; OUT = os.path.join(T0.REEL, "out", f"{s['reel']}_thumb_wide.jpg")
im = T0.clean_frame().convert("RGB").resize((1280, 720), Image.LANCZOS).convert("RGBA")
side = T.get("side", "left"); x0 = 50 if side == "left" else 640
sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
for i in range(640):   # darken the text side for contrast
    a = int(200 * (1 - i / 640) ** 1.4); x = i if side == "left" else 1279 - i; d.line([(x, 0), (x, 720)], fill=(7, 6, 26, a))
im = Image.alpha_composite(im, sh); d = ImageDraw.Draw(im)
def txt(xy, t, f, col, stroke=8): d.text(xy, t, font=f, fill=T0.rgb(col), stroke_width=stroke, stroke_fill=T0.rgb(T0.INK))
y = 60
if T.get("stamp"): f = T0.font("Montserrat.ttf", 30, "ExtraBold"); txt((x0, y), T["stamp"], f, T0.GOLD, 5); y += 56
f, ls = T0.fit(d, T["hook"], "Cinzel.ttf", "Black", 120, 580, 3)
for l in ls: txt((x0, y), l, f, T0.IVORY, 9); y += int(f.size * 1.08)
if T.get("line"): f2, l2 = T0.fit(d, T["line"], "Montserrat.ttf", "ExtraBold", 44, 560, 2); y += 10; [txt((x0, y + i * int(f2.size * 1.15)), l, f2, T0.GOLD, 6) for i, l in enumerate(l2)]
if T.get("badge"):
    fb = T0.font("Montserrat.ttf", 28, "ExtraBold"); w = d.textlength(T["badge"], font=fb) + 40; bx = x0; by = 640
    d.rounded_rectangle([bx, by, bx + w, by + 50], 25, fill=T0.rgb(T0.RED)); d.text((bx + 20, by + 9), T["badge"], font=fb, fill=(255, 255, 255))
im.convert("RGB").save(OUT, quality=92); print("wide thumbnail", OUT, f"{os.path.getsize(OUT) / 1e6:.2f} MB")
