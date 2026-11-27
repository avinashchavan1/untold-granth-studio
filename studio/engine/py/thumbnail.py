#!/usr/bin/env python3
"""Reel cover / thumbnail: clean engine frame (no subtitles, cards or logo) + cover typography.
   REEL=<reel dir> python3 thumbnail.py            -> out/<ID>_cover.jpg (1080x1920 JPEG, < 2 MB: Instagram cover + YouTube thumbnail)

script.json:
  "thumbnail": {"frame": "3s",                       time or frame number of the art (pick with: make_reel.py thumb <reel> 3s,26s,...)
                "hook": "Was that famous line ever really in the text?",   the reel's hook question, big (default: shot 1's English line)
                "stamp": "NOT IN THE TEXT",                  optional red stamp: the answer (myth-busters)
                "line": "No line. No spell. Just a prayer.",            the payoff, in gold
                "badge": "Source · Book 3.42–47",           the verses the reel proves it with
                "art_shift": 0}                                         optional: push the art down (px) so faces clear the title
English is the main language for every written word (covers included); the narration stays Hindi.
Layout keeps every word inside the Instagram profile-grid crop (centre 1080x1440) and above the Reels UI."""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REEL = os.path.abspath(os.environ.get("REEL") or sys.argv[1]); SERIES = os.path.dirname(os.path.dirname(REEL))
ENGINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); FONTS = [os.path.join(SERIES, "fonts"), os.path.join(ENGINE, "fonts")]
s = json.load(open(os.path.join(REEL, "src", "script.json"), encoding="utf-8")); ser = json.load(open(os.path.join(SERIES, "series.json"), encoding="utf-8"))
T = s.get("thumbnail") or sys.exit("script.json has no 'thumbnail' block (see engine/py/thumbnail.py)")
pal = ser.get("palette", {}); GOLD = pal.get("gold", "#f6c244"); IVORY = pal.get("ivory", "#fbf3df"); RED = pal.get("red", "#c81e1e"); INK = pal.get("ink", "#07061a")
W, H, SAFE_TOP, SAFE_BOT = 1080, 1920, 240, 1680
CV = ser.get("cover", {}); TF, TV = CV.get("title_font", "Cinzel.ttf"), CV.get("title_var")   # series.json → cover: {title_font, title_var, mark: "diya"|"eyes"}

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

def shadow_text(base, xy, text, f, fill, stroke=0, blur=14, anchor="ma"):
    sh = Image.new("RGBA", base.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).text(xy, text, font=f, fill=(3, 3, 14, 230), anchor=anchor, stroke_width=stroke + 4, stroke_fill=(3, 3, 14, 230))
    base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    ImageDraw.Draw(base).text(xy, text, font=f, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=rgb(INK))

def diya(d, cx, cy, s, col):
    d.chord((cx - s, cy - s * 0.55, cx + s, cy + s * 0.75), 0, 180, fill=col)
    d.polygon([(cx, cy - s * 1.25), (cx + s * 0.32, cy - s * 0.55), (cx, cy - s * 0.25), (cx - s * 0.32, cy - s * 0.55)], fill=col)

img = clean_frame().resize((W, H), Image.LANCZOS)
if T.get("art_shift", 0) < 0:      # pull the art UP (figures low in the frame would sit under the payoff line); ground gradient fills the bottom
    up = -int(T["art_shift"]); src = img; img = Image.new("RGBA", (W, H)); img.alpha_composite(src.crop((0, up, W, H)), (0, 0))
    bot = np.array(src.crop((0, H - 12, W, H)).convert("RGB")).reshape(-1, 3).mean(0); band = Image.new("RGBA", (W, up)); bd = ImageDraw.Draw(band)
    for yy in range(up): bd.line([(0, yy), (W, yy)], fill=tuple(int(v) for v in bot) + (255,))
    img.alpha_composite(band, (0, H - up))
elif T.get("art_shift", 0):          # push the art down so faces clear the title block; the sky stretches to fill the top
    sh_ = int(T["art_shift"]); src = img; img = Image.new("RGBA", (W, H)); img.alpha_composite(src.crop((0, 0, W, H - sh_)), (0, sh_))
    top = np.array(src.crop((0, 0, W, 12)).convert("RGB")).reshape(-1, 3).mean(0); mid = np.array(img.crop((0, sh_, W, sh_ + 12)).convert("RGB")).reshape(-1, 3).mean(0)
    band = Image.new("RGBA", (W, sh_ + 2)); bd = ImageDraw.Draw(band)                      # plain sky gradient (no duplicated moon or trees)
    for yy in range(sh_ + 2): k = yy / max(1, sh_); bd.line([(0, yy), (W, yy)], fill=tuple(int(top[j] * (1 - k) + mid[j] * k) for j in range(3)) + (255,))
    img.alpha_composite(band, (0, 0))
# legibility: night gradient behind the title (top) and the English line + badge (bottom)
g = Image.new("L", (1, H))
for y in range(H):
    top = max(0.0, 1 - y / 980) ** 1.25 * 0.93; bot = max(0.0, (y - 1180) / 740) ** 1.1 * 0.92
    g.putpixel((0, y), int(255 * max(top, bot)))
img.alpha_composite(Image.composite(Image.new("RGBA", (W, H), rgb(INK)), Image.new("RGBA", (W, H), (0, 0, 0, 0)), g.resize((W, H))))
d = ImageDraw.Draw(img)

# series label with the diya mark
lab = (ser.get("series_name") or ser.get("logo", "")).upper(); fl = font(TF, 34, TV or "Bold")
mw = 70 if CV.get("mark") == "eyes" else 46
lw = d.textlength(lab, font=fl) + 6 * len(lab); x0 = (W - lw - mw) / 2
if CV.get("mark") == "eyes":
    for ex in (x0 + 14, x0 + 46):
        d.ellipse((ex - 14, SAFE_TOP + 31, ex + 14, SAFE_TOP + 59), fill=rgb(IVORY), outline=rgb(INK), width=4)
        d.ellipse((ex - 2, SAFE_TOP + 35, ex + 10, SAFE_TOP + 47), fill=rgb(INK))
else: diya(d, x0 + 16, SAFE_TOP + 52, 16, rgb(GOLD))
xx = x0 + mw
for ch in lab: d.text((xx, SAFE_TOP + 30), ch, font=fl, fill=rgb(GOLD)); xx += d.textlength(ch, font=fl) + 6
y = SAFE_TOP + 96

# the hook question, big
hook = T.get("hook") or s["shots"][0].get("en", "")
fh, lines = fit(d, hook.upper(), "Montserrat.ttf", "ExtraBold", 92, 960, 2)      # two lines max keeps faces clear
lh = int(fh.size * 1.14)
for ln in lines: shadow_text(img, (W / 2, y), ln, fh, rgb(IVORY), stroke=3); y += lh
d = ImageDraw.Draw(img)

# red stamp: the answer
if T.get("stamp"):
    fs = font("Montserrat.ttf", 64, "Black"); txt = T["stamp"].upper(); tw = d.textlength(txt, font=fs) + 5 * len(txt); pw, ph = int(tw + 84), 118
    st = Image.new("RGBA", (pw + 40, ph + 40), (0, 0, 0, 0)); sd = ImageDraw.Draw(st)
    sd.rounded_rectangle((20, 20, 20 + pw, 20 + ph), 22, fill=rgb(RED), outline=rgb(IVORY), width=5)
    xx = 20 + (pw - tw) / 2
    for ch in txt: sd.text((xx, 20 + ph / 2 + 2), ch, font=fs, fill=rgb(IVORY), anchor="lm"); xx += sd.textlength(ch, font=fs) + 5
    st = st.rotate(4, resample=Image.BICUBIC, expand=True)
    shd = Image.new("RGBA", img.size, (0, 0, 0, 0)); shd.paste((3, 3, 14, 170), (int((W - st.width) / 2) + 6, y + 22), st.split()[3])
    img.alpha_composite(shd.filter(ImageFilter.GaussianBlur(10))); img.alpha_composite(st, (int((W - st.width) / 2), y + 12)); d = ImageDraw.Draw(img)

# payoff line + verse badge at the bottom of the safe area
fe, el = fit(d, T.get("line", "").upper(), TF, TV or "Black", 62, 950, 2)
fb = font("Montserrat.ttf", 31, "SemiBold"); badge = T.get("badge") or s.get("source", "")
bw, bh = d.textlength(badge, font=fb) + 70, 70; by = SAFE_BOT - 40 - bh
ey = by - 34 - len(el) * int(fe.size * 1.16)
for ln in el: shadow_text(img, (W / 2, ey), ln, fe, rgb(GOLD), stroke=2, blur=12); ey += int(fe.size * 1.16)
d = ImageDraw.Draw(img)
d.rounded_rectangle(((W - bw) / 2, by, (W + bw) / 2, by + bh), bh / 2, fill=(7, 6, 26, 215), outline=rgb(GOLD), width=3)
d.text((W / 2, by + bh / 2 + 1), badge, font=fb, fill=rgb(IVORY), anchor="mm")

out = os.path.join(REEL, "out"); os.makedirs(out, exist_ok=True); rid = s["reel"]
cover = img.convert("RGB"); p1 = os.path.join(out, f"{rid}_cover.jpg"); cover.save(p1, quality=95, subsampling=0)
print("COVER", p1, f"{os.path.getsize(p1) / 1e3:.0f} kB")
