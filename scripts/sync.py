#!/usr/bin/env python3
"""Sync the studio folder -> the channel's studio database (Supabase REST, upserts on natural keys).
   python3 scripts/sync.py [studio_dir]          everything (series, channels, cast, locations, docs, plan, produced reels)
   python3 scripts/sync.py [studio_dir] A04      also mark/refresh one produced reel
The Supabase secret key is injected by the environment proxy (header apikey); never put it in code."""
import json, os, re, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from channel import C, SID, SUPA, STUDIO, HANDLES
URL = SUPA + "/rest/v1/"
ST = sys.argv[1] if len(sys.argv) > 1 and not re.match(r"^[A-Z]\d", sys.argv[1]) else STUDIO; SER = os.path.join(ST, "series", SID)
H = {"apikey": os.environ.get("SUPABASE_SECRET", "proxy-injected"), "Content-Type": "application/json"}
def api(method, path, body=None, prefer=None):
    h = dict(H); h["Prefer"] = prefer or "return=representation"
    rq = urllib.request.Request(URL + path, json.dumps(body, ensure_ascii=False).encode() if body is not None else None, h, method=method)
    try: r = urllib.request.urlopen(rq, timeout=60).read(); return json.loads(r) if r else None
    except urllib.error.HTTPError as e: sys.exit(f"{method} {path}: {e.code} {e.read().decode()[:400]}")
def upsert(table, rows, on): return api("POST", f"{table}?on_conflict={on}", rows, "resolution=merge-duplicates,return=representation")

sj = json.load(open(os.path.join(SER, "series.json")))
_cal = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "calendar.json")   # Autopilot reads the same calendar as the Timeline page
if os.path.exists(_cal): sj = {**sj, "calendar": json.load(open(_cal))}
upsert("series", [{"id": SID, "name": C["series"]["name"], "book": C["series"]["book"], "edition": sj["source"]["edition"], "config": sj}], "id")
upsert("channels", [{"platform": p, "handle": h["handle"], "url": h["url"]} for p, h in HANDLES.items()], "platform")
META = sj.get("cast_meta", {})          # series.json: { names: {key: display name}, first_reel: {key: code}, rig_keys: {key: CH key}, major_extra: [keys] }
# cast
cast = json.load(open(os.path.join(SER, "cast", "cast.json")))["voices"]; mc = sj.get("major_characters", {})
major = set(mc.get("locked", [])) | set(mc.get("ask_user_when_first_needed", []))
NAMES = dict(META.get("names", {})); FIRST = dict(META.get("first_reel", {}))
looks = {m.group(1): m.group(2) for m in re.finditer(r"^\s+(\w+):\s+(\{ kind:[^\n]*\}),", open(os.path.join(SER, "art", "chars.js")).read(), re.M)}
# portraits, voice samples, appearances and who chose the look (scripts/cast_media.py -> cast/looks.json)
lj = json.load(open(os.path.join(SER, "cast", "looks.json"))) if os.path.exists(os.path.join(SER, "cast", "looks.json")) else {}
RIGKEY = dict(META.get("rig_keys", {}))
def look_of(k):
    L = dict(lj.get(k, {})); L["rig"] = looks.get(RIGKEY.get(k, k), ""); return L
def voice_of(k):
    v = dict(cast.get(k, {})); L = lj.get(k, {})
    if L.get("voice_sample"): v["sample"] = L["voice_sample"]; v["sample_line"] = L.get("voice_line")
    return v
def first_of(k): ins = lj.get(k, {}).get("appears_in") or []; return FIRST.get(k) or (ins[0] if ins else None)
rows = [{"series_id": SID, "key": k, "name": NAMES.get(k, k.title()), "tier": "major" if k in major else "minor",
         "status": "provisional" if "PROVISIONAL" in str(v.get("chosen", "")) else "locked", "voice": voice_of(k), "look": look_of(k),
         "first_reel": first_of(k)} for k, v in cast.items()]
for k, L in lj.items():
    if k in cast: continue
    is_major = k in major or k in META.get("major_extra", [])
    rows.append({"series_id": SID, "key": k, "name": NAMES.get(k, k.title()), "tier": "major" if is_major else "minor",
                 "status": "provisional" if (is_major and L.get("look_chosen") == "claude") else "locked", "voice": {}, "look": look_of(k), "first_reel": first_of(k)})
rows += [{"series_id": SID, "key": k, "name": k.title(), "tier": "major", "status": "needed", "voice": {}, "look": {}, "first_reel": None} for k in sorted(major - set(cast) - set(lj))]
upsert("characters", rows, "series_id,key")
upsert("locations", [{"series_id": SID, "key": L["key"], "name": L["name"], "builder": L["builder"], "description": L.get("description", "")} for L in sj.get("locations", [])], "series_id,key")   # series.json → locations
upsert("docs", [{"series_id": sid, "slug": slug, "title": t, "kind": kind, "body_md": open(p).read()} for slug, t, kind, p, sid in [
    ("style-guide", "Studio style guide", "style_guide", os.path.join(SER, "STYLE_GUIDE.md") if os.path.exists(os.path.join(SER, "STYLE_GUIDE.md")) else os.path.join(ST, "STYLE_GUIDE.md"), None),   # a series may ship its own guide
    ("make-reel-skill", "make-reel workflow", "skill", os.path.join(ST, ".claude/skills/make-reel/SKILL.md"), None),
    ("studio-readme", "Studio engine README", "readme", os.path.join(ST, "README.md"), None),
    ("plan", C["series"]["name"] + " — the plan", "plan", os.path.join(SER, sj.get("plan_file", "PLAN.md")), SID)]], "slug")
# plan rows
KIND = {"M": "myth_buster", "R": "reveal", "D": "dialogue"}; rows = []
for n, r in enumerate([r for r in open(os.path.join(SER, sj.get("plan_file", "PLAN.md"))).read().splitlines() if re.match(r"^\| [A-Z]+\d{1,4} \|", r)], 1):
    c = [x.strip() for x in r.strip("|").split("|")]
    rows.append({"series_id": SID, "code": c[0], "plan_no": n, "title": c[1], "kind": KIND.get(c[2]), "source_ref": c[3], "art_cost": c[4], "plan_note": c[5] if len(c) > 5 else ""})
upsert("reels", rows, "series_id,code")
# produced reels
STAGE = json.load(open(os.path.join(SER, "reels", "stages.json"))) if os.path.exists(os.path.join(SER, "reels", "stages.json")) else {}
ORDER = ["idea", "researching", "scripted", "voiced", "rendered", "review", "approved", "published"]
for code, stage in STAGE.items():
    s = json.load(open(os.path.join(SER, "reels", code, "src", "script.json"), encoding="utf-8"))
    tlp = os.path.join(SER, "reels", code, "src", "timeline.json"); tl = json.load(open(tlp)) if os.path.exists(tlp) else {}
    rowp = os.path.join(ST, "publish", "desk", "rows", code + ".json"); caps = json.load(open(rowp))["captions"] if os.path.exists(rowp) else {}
    rendered = stage not in ("idea", "researching", "scripted", "voiced")
    cur = api("GET", f"reels?select=id,stage,captions&series_id=eq.{SID}&code=eq.{code}") or [{}]
    edited = cur[0].get("id") and api("GET", f"activity?select=id&reel_id=eq.{cur[0]['id']}&action=eq.captions%20edited&limit=1")
    if cur[0].get("captions") and (edited or not caps): caps = cur[0]["captions"]   # captions edited in the app win; otherwise the studio's latest
    if cur[0].get("stage") in ORDER and stage in ORDER and ORDER.index(cur[0]["stage"]) > ORDER.index(stage): stage = cur[0]["stage"]   # never move a reel backwards
    extra = {"kind": "longform"} if s.get("kind") == "longform" else {}   # full-length videos: posted from the app like reels, YouTube only
    rec = upsert("reels", [{**extra, "series_id": SID, "code": code, "title": s["title"], "stage": stage, "hook_hi": s["shots"][0]["hi"], "hook_en": s["shots"][0]["en"],
                            "length_s": round(tl.get("total", 0), 2) if rendered else None, "script": s, "captions": caps, "hashtags": s.get("hashtags", []), "verify_note": s.get("verify_note")}], "series_id,code")[0]
    api("DELETE", f"claims?reel_id=eq.{rec['id']}", prefer="return=minimal")
    if s.get("claims"): api("POST", "claims", [{"reel_id": rec["id"], "position": i, "claim": c["claim"], "ref": c["ref"], "quote_sa": c.get("quote_sa"), "verified": bool(c.get("verified")), "sources": c.get("sources", [])} for i, c in enumerate(s["claims"])], "return=minimal")
    if rendered:
        api("POST", "publications?on_conflict=reel_id,platform", [{"reel_id": rec["id"], "platform": p, "state": "todo"} for p in (("youtube",) if extra else ("instagram", "youtube", "facebook"))], "resolution=ignore-duplicates,return=minimal")
    print("synced", code, stage, len(s.get("claims", [])), "claims")
api("POST", "activity", [{"actor": "claude", "action": "sync", "detail": {"reels": list(STAGE)}}], "return=minimal")
print("SYNC OK")

# full-length videos: studio/series/<id>/longform/<code>/longform.json -> longform_videos (the app's Long-form page)
LFD = os.path.join(SER, "longform")
if os.path.isdir(LFD):
    lrows = []
    for code in sorted(os.listdir(LFD)):
        f = os.path.join(LFD, code, "longform.json")
        if not os.path.exists(f): continue
        d = json.load(open(f, encoding="utf-8"))
        lrows.append({"series_id": SID, "code": d.get("code", code), "title": d["title"], "subtitle": d.get("subtitle"), "stage": d.get("stage", "researching"),
                      "plan": d, "updated_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()})
    if lrows: upsert("longform_videos", lrows, "series_id,code"); print(f"longform: {len(lrows)} video(s)")
