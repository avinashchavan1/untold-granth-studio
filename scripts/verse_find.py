#!/usr/bin/env python3
"""Find verses by word in saved base-text pages (scripts/source_verse.py output), with their refs and translations.
  python3 scripts/verse_find.py "<regex>" "<glob of saved pages, e.g. longform/LF02/research/ce_5_*.txt>"
Prints "<book.chapter.verse> | <translation>" for every verse whose text or translation matches (case-insensitive)."""
import re, sys, glob
pat=re.compile(sys.argv[1], re.I); files=sorted(glob.glob(sys.argv[2] if len(sys.argv)>2 else "ce_*.txt"), key=lambda f:[int(x) for x in re.findall(r"\d+",f)])
for f in files:
    txt=open(f).read()
    for m in re.finditer(r"^(\d+\.\d+\.\d+)\n(.*?)(?=^\d+\.\d+\.\d+\n|\Z)", txt, re.S|re.M):
        ref, body = m.group(1), m.group(2)
        en=[l.strip() for l in body.splitlines() if l.strip() and re.search(r"[A-Za-z]{4}", l) and not re.search(r"[āīūṛṃḥśṣṇñṭḍ]{2}", l.split(" ")[0])]
        if pat.search(body):
            try: print(ref, "|", (en[-1] if en else "")[:170])
            except BrokenPipeError: sys.exit(0)
