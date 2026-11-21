"""Channel brand kit: avatar (1080²), YouTube banner (2560×1440), video watermark (300² transparent).
Reads channel.json (name, brand.tagline) and two art frames from your reels: brand/banner_left.png, brand/banner_right.png
(1080×1920 stills, e.g. from make_reel.py thumb candidates). Run from brand/: python3 make_brand.py"""
import json, math, os, random
CHN = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "channel.json"), encoding="utf-8"))
WORDS = CHN["name"].upper().split(); TOP, BOT = (WORDS[0], " ".join(WORDS[1:])) if len(WORDS) > 1 else (WORDS[0], "")
TAGLINE = CHN.get("brand", {}).get("tagline", "").upper()
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
GOLD, GOLD_D, IVORY, NIGHT, NIGHT2 = (230, 180, 80), (168, 116, 26), (246, 241, 230), (11, 10, 24), (27, 24, 56)
def font(name, size, var=None):
    f = ImageFont.truetype(name, size)
    if var:
        try: f.set_variation_by_name(var)
        except Exception: pass
    return f
def vgrad(w, h, top, bot):
    g = Image.new("RGB", (1, h)); [g.putpixel((0, y), tuple(int(top[i] + (bot[i] - top[i]) * y / (h - 1)) for i in range(3))) for y in range(h)]; return g.resize((w, h))
def glow(size, center, radius, color, alpha):
    m = Image.new("L", size, 0); d = ImageDraw.Draw(m); cx, cy = center
    for r in range(radius, 0, -6): d.ellipse((cx - r, cy - r * 0.8, cx + r, cy + r * 0.8), fill=int(alpha * (1 - r / radius) ** 1.6 * 255))
    layer = Image.new("RGB", size, color); return layer, m.filter(ImageFilter.GaussianBlur(radius / 8))
def diya(s):
    """gold oil lamp (bowl + wick flame), supersampled; returns RGBA of size s×s"""
    S = s * 4; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    # flame glow
    gl = Image.new("L", (S, S), 0); ImageDraw.Draw(gl).ellipse((S*.30, S*.06, S*.70, S*.58), fill=150); gl = gl.filter(ImageFilter.GaussianBlur(S * .07))
    im.paste(Image.new("RGBA", (S, S), (255, 205, 110, 255)), (0, 0), gl)
    # flame (teardrop)
    pts = []
    for i in range(80):
        t = i / 79 * 2 * math.pi; x = math.sin(t) * (0.5 - 0.5 * math.cos(t)) ** 0.9; y = -math.cos(t)
        pts.append((S * .5 + x * S * .085, S * .36 + y * S * .17))
    d.polygon(pts, fill=(255, 196, 70, 255))
    inner = [(S * .5 + (p[0] - S * .5) * .55, S * .43 + (p[1] - S * .36) * .55) for p in pts]; d.polygon(inner, fill=(255, 246, 214, 255))
    # bowl
    d.chord((S*.16, S*.36, S*.84, S*.86), 0, 180, fill=GOLD + (255,))
    d.chord((S*.22, S*.42, S*.78, S*.78), 0, 180, fill=GOLD_D + (255,))
    d.ellipse((S*.16, S*.56, S*.84, S*.66), fill=(250, 214, 130, 255))
    d.ellipse((S*.20, S*.575, S*.80, S*.645), fill=(120, 74, 18, 255))
    d.polygon([(S*.80, S*.60), (S*.93, S*.55), (S*.84, S*.64)], fill=GOLD + (255,))   # spout
    return im.resize((s, s), Image.LANCZOS)
def paper_texture(size, seed=3):
    random.seed(seed); n = Image.effect_noise(size, 24).convert("L").filter(ImageFilter.GaussianBlur(1.2)); return n

# ---------- avatar ----------
A = 1080; av = vgrad(A, A, (24, 20, 52), NIGHT)
gl, m = glow((A, A), (A // 2, A // 2 - 40), 520, (230, 170, 70), 0.55); av.paste(gl, (0, 0), m)
d = ImageDraw.Draw(av)
d.ellipse((60, 60, A - 60, A - 60), outline=GOLD_D, width=10); d.ellipse((92, 92, A - 92, A - 92), outline=(90, 70, 40), width=3)
lamp = diya(640); av.paste(lamp, ((A - 640) // 2, 150), lamp)
f = font("Cinzel.ttf", 118, "Black"); t = TOP; w = d.textlength(t, font=f); d.text(((A - w) / 2, 690), t, font=f, fill=GOLD)
f2 = font("Cinzel.ttf", 82, "Bold"); t2 = BOT; w2 = d.textlength(t2, font=f2); d.text(((A - w2) / 2, 820), t2, font=f2, fill=IVORY)
tex = paper_texture((A, A)); av = Image.composite(ImageChops.multiply(av, Image.merge("RGB", [tex.point(lambda v: 200 + v // 5)] * 3)), av, Image.new("L", (A, A), 90))
av.save("avatar_1080.png"); av.resize((800, 800), Image.LANCZOS).save("youtube_profile_800.png")

# ---------- YouTube banner ----------
W, H = 2560, 1440; ban = vgrad(W, H, (16, 14, 40), NIGHT)
random.seed(7); d = ImageDraw.Draw(ban)
for _ in range(260):
    x, y, r = random.randrange(W), random.randrange(H), random.choice([1, 1, 2, 2, 3]); d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 240, 210))
def panel(path, crop, height, flip=False):
    im = Image.open(path).convert("RGB").crop(crop); im = im.resize((int(im.width * height / im.height), height), Image.LANCZOS)
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im
def feather(w, h, side, fade):
    m = Image.new("L", (w, h), 255); dd = ImageDraw.Draw(m)
    for i in range(fade):
        a = int(255 * i / fade); x = (w - fade + i) if side == "right" else (fade - 1 - i)
        dd.line([(x, 0), (x, h)], fill=a if False else 255 - a + 0)
    return m
left = panel("banner_left.png", (0, 200, 1080, 1540), H)            # a clean art frame (no logo, no subtitle)
right = panel("banner_right.png", (0, 200, 1080, 1360), H, flip=True)  # a second frame, mirrored
def fmask(im, fade_side, fade=520):
    w, h = im.size; m = Image.new("L", (w, h), 255); dd = ImageDraw.Draw(m)
    for i in range(fade):
        x = w - fade + i if fade_side == "right" else fade - 1 - i; dd.line([(x, 0), (x, h)], fill=int(255 * (1 - i / fade) ** 1.4))
    return m
ban.paste(left, (-40, 0), fmask(left, "right", 560)); ban.paste(right, (1480, 0), fmask(right, "left", 560))
# darken behind the text block so it reads on every device
vm = Image.new("L", (W, H), 0); ImageDraw.Draw(vm).ellipse((W/2-980, H/2-330, W/2+980, H/2+330), fill=190); vm = vm.filter(ImageFilter.GaussianBlur(140))
ban.paste(Image.new("RGB", (W, H), NIGHT), (0, 0), vm)
gl, m = glow((W, H), (W // 2, H // 2 - 60), 700, (230, 170, 70), 0.22); ban.paste(gl, (0, 0), m)
d = ImageDraw.Draw(ban)
# center band (YouTube safe area: 1546×423 centered)
lamp = diya(150); ban.paste(lamp, ((W - 150) // 2, 476), lamp)
f = font("Cinzel.ttf", 136, "Black"); t = CHN["name"].upper(); w = d.textlength(t, font=f)
d.text(((W - w) / 2 + 4, 612), t, font=f, fill=(0, 0, 0)); d.text(((W - w) / 2, 606), t, font=f, fill=GOLD)
d.line([(W / 2 - 380, 772), (W / 2 + 380, 772)], fill=GOLD_D, width=3)
fh = font("Cinzel.ttf", 58, "Bold"); th = TAGLINE; w = d.textlength(th, font=fh); d.text(((W - w) / 2, 782), th, font=fh, fill=IVORY)
fe = font("Montserrat.ttf", 36, "SemiBold"); te = "Real stories from the original texts · verse on screen"; w = d.textlength(te, font=fe); d.text(((W - w) / 2, 862), te, font=fe, fill=(220, 210, 190))
ban.save("youtube_banner_2560x1440.jpg", quality=92)
# safe-area preview (what phones show)
prev = ban.crop(((W - 1546) // 2, (H - 423) // 2, (W + 1546) // 2, (H + 423) // 2)); prev.save("_banner_mobile_view.jpg", quality=85)

# ---------- watermark (YouTube video watermark, transparent) ----------
wm = Image.new("RGBA", (300, 300), (0, 0, 0, 0)); dw = ImageDraw.Draw(wm)
dw.ellipse((6, 6, 294, 294), fill=(11, 10, 24, 210), outline=GOLD_D + (255,), width=6)
lamp = diya(220); wm.paste(lamp, (40, 30), lamp); wm.save("youtube_watermark_300.png")
print("ok")
