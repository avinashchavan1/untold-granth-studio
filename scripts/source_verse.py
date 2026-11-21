#!/usr/bin/env python3
"""Fetch verses of the channel's base text (original script + transliteration + English) from its source site, never from memory.

  python3 scripts/source_verse.py <book> <chapter> <verse>[,<verse>...|<a>-<b>] [--json]
  e.g.  python3 scripts/source_verse.py 6 97 17          python3 scripts/source_verse.py 4 65 19-22
The page URL comes from channel.json → source.verse_url ({book}, {chapter}). The parser below fits verse pages laid out as
"<half 1> । <half 2> ॥N॥ … N. <transliteration> … N. <translation>"; adapt verses() if your source site differs.
Pages are cached in ~/.cache/source_pages.
"""
import html, json, os, re, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from channel import C

def page(book, ch):
    d = os.path.expanduser("~/.cache/source_pages"); os.makedirs(d, exist_ok=True); f = os.path.join(d, f"b{book}_c{ch}.html")
    if not os.path.exists(f):
        url = C["source"]["verse_url"].format(book=book, chapter=ch)
        rq = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (studio verse fetch)"})
        open(f, "wb").write(urllib.request.urlopen(rq, timeout=60).read())
    return open(f, encoding="utf-8", errors="ignore").read()

def verses(book, ch):
    t = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " | ", page(book, ch))))
    out = {}
    # "| <half 1> । | <half 2> ॥NN॥ | | NN. <translit half 1> , | <translit half 2>. | ... | NN. | <translation> |"
    for m in re.finditer(r"\| ([ऀ-ॿ][^|]*?[।|]) \| ([ऀ-ॿ][^|]*?॥\s*([०-९]+)\s*॥) \|(.{0,1500}?)\| (\d+)\. \| ([A-Z“\"(][^|]{5,800}?) \|", t):
        n = int(m.group(5)); deva = [m.group(1).strip(), re.sub(r"\s*॥\s*[०-९]+\s*॥", " ॥", m.group(2)).strip()]
        tl = re.search(r"\| \d+\. ([a-zāīūṛṝḷṅñṭḍṇśṣṃḥ][^|]+?) , \| ([^|]+?)\. \|", m.group(4))
        out[n] = {"ref": f"{book}.{ch}.{n}", "devanagari": deva, "translit": (tl.group(1) + ", " + tl.group(2)).strip() if tl else "", "en": m.group(6).strip()}
    return out

if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if x != "--json"]
    if len(a) < 3: sys.exit(__doc__)
    book, ch, spec = int(a[0]), int(a[1]), a[2]
    want = []
    for part in spec.split(","):
        lo, _, hi = part.partition("-"); want += list(range(int(lo), int(hi or lo) + 1))
    V = verses(book, ch); res = [V[n] for n in want if n in V]
    missing = [n for n in want if n not in V]
    if "--json" in sys.argv: print(json.dumps(res, ensure_ascii=False, indent=1))
    else:
        for v in res: print(f"{v['ref']}\n  {v['devanagari'][0]}\n  {v['devanagari'][1]}\n  {v['translit']}\n  {v['en']}\n")
    if missing: print("not found on the page:", missing, file=sys.stderr)
