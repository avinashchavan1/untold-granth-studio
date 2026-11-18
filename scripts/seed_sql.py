#!/usr/bin/env python3
"""Build seed SQL for the studio database from the local studio folder (series.json, cast.json, scripts, docs, plan).
usage: python3 scripts/seed_sql.py <studio dir> > seed.sql     (idempotent: upserts on natural keys)"""
import json, os, re, sys
ST = sys.argv[1] if len(sys.argv) > 1 else "/home/user/studio"
SER = os.path.join(ST, "series", "untold-ramayana")
def q(s): return "null" if s is None else "$q$" + str(s) + "$q$"
def j(o): return "$j$" + json.dumps(o, ensure_ascii=False) + "$j$::jsonb"
def arr(xs): return "array[" + ",".join(q(x) for x in xs) + "]::text[]" if xs else "'{}'::text[]"
out = []
sj = json.load(open(os.path.join(SER, "series.json")))
out.append(f"insert into public.series (id,name,book,edition,config) values ('untold-ramayana','Untold Ramayana','Valmiki Ramayana',{q(sj['source']['edition'])},{j(sj)}) on conflict (id) do update set config=excluded.config, edition=excluded.edition;")
for p, h, u in [("instagram", "@untoldgranth.official", "https://www.instagram.com/untoldgranth.official/"), ("youtube", "@untoldgranth", "https://www.youtube.com/@untoldgranth")]:
    out.append(f"insert into public.channels (platform,handle,url) values ('{p}',{q(h)},{q(u)}) on conflict (platform) do update set handle=excluded.handle, url=excluded.url;")
# ---- cast ----
cast = json.load(open(os.path.join(SER, "cast", "cast.json")))["voices"]
major = set(sj.get("major_characters", {}).get("locked", [])) | set(sj.get("major_characters", {}).get("ask_user_when_first_needed", []))
NAMES = {"narrator": "Narrator (Rudra)", "rama": "Rama", "sita": "Sita", "lakshmana": "Lakshmana", "maricha": "Maricha", "shabari": "Shabari", "gautama": "Gautama"}
FIRST = {"narrator": "A01", "rama": "A01", "sita": "A01", "lakshmana": "A01", "maricha": "A01", "shabari": "A02", "gautama": "A03"}
chars = js = open(os.path.join(SER, "art", "chars.js")).read()
looks = {m.group(1): m.group(2) for m in re.finditer(r"^\s+(\w+):\s+(\{ kind:[^\n]*\}),", chars, re.M)}
for k, v in cast.items():
    tier = "major" if k in major else "minor"; status = "provisional" if "PROVISIONAL" in str(v.get("chosen", "")) else "locked"
    look = {"rig": looks.get({"lakshmana": "lak"}.get(k, k), "")}
    out.append(f"insert into public.characters (series_id,key,name,tier,status,voice,look,first_reel) values ('untold-ramayana',{q(k)},{q(NAMES.get(k, k.title()))},'{tier}','{status}',{j(v)},{j(look)},{q(FIRST.get(k))}) on conflict (series_id,key) do update set voice=excluded.voice, look=excluded.look, tier=excluded.tier, status=excluded.status;")
for k in sorted(major - set(cast)):
    out.append(f"insert into public.characters (series_id,key,name,tier,status) values ('untold-ramayana',{q(k)},{q(k.title())},'major','needed') on conflict (series_id,key) do nothing;")
# ---- locations ----
for k, n, b, d in [("hermitage", "Panchavati hermitage (dusk / night / end)", "buildHermitage(tod)", "Hut, mango tree, Godavari river band, moon; used for A01 and the end card."),
                   ("hook", "Hook ground shot", "buildHook()", "Low angle on the ground before the hut, dusk."),
                   ("forest", "Dandaka forest", "buildForest()", "Layered trunks with mist; chases and walks."),
                   ("doorway", "Hut doorway", "buildDoorway(tod)", "Close on the door and thatch fringe."),
                   ("manuscript", "Palm-leaf manuscript", "buildManuscript()", "Source card and 'not in Valmiki' card."),
                   ("pampa", "Shabari's hermitage, Lake Pampa", "buildPampa(tod)", "West bank of Pampa: lotus lake, hut, sages' glowing altar, wet bark robes, fruit basket.")]:
    out.append(f"insert into public.locations (series_id,key,name,builder,description) values ('untold-ramayana',{q(k)},{q(n)},{q(b)},{q(d)}) on conflict (series_id,key) do update set name=excluded.name, builder=excluded.builder, description=excluded.description;")
# ---- docs ----
for slug, title, kind, path, sid in [("style-guide", "Studio style guide", "style_guide", os.path.join(ST, "STYLE_GUIDE.md"), None),
                                     ("make-reel-skill", "make-reel workflow (skill)", "skill", os.path.join(ST, ".claude/skills/make-reel/SKILL.md"), None),
                                     ("studio-readme", "Studio engine README", "readme", os.path.join(ST, "README.md"), None),
                                     ("plan-100", "Untold Ramayana — plan for the next 100 reels", "plan", os.path.join(SER, "PLAN_100.md"), "untold-ramayana")]:
    out.append(f"insert into public.docs (series_id,slug,title,kind,body_md) values ({q(sid)},{q(slug)},{q(title)},'{kind}',{q(open(path).read())}) on conflict (slug) do update set body_md=excluded.body_md, title=excluded.title;")
# ---- reels from the plan ----
plan = open(os.path.join(SER, "PLAN_100.md")).read()
KIND = {"M": "myth_buster", "R": "reveal", "D": "dialogue"}
rows = [r for r in plan.splitlines() if re.match(r"^\| A\d{2,3} \|", r)]
for n, r in enumerate(rows, 1):
    c = [x.strip() for x in r.strip("|").split("|")]
    code, title, kind, where, art, note = c[0], c[1], c[2], c[3], c[4], c[5] if len(c) > 5 else ""
    out.append(f"insert into public.reels (series_id,code,plan_no,title,kind,source_ref,art_cost,plan_note) values ('untold-ramayana',{q(code)},{n},{q(title)},{('%s' % q(KIND.get(kind))) if kind in KIND else 'null'},{q(where)},{q(art)},{q(note)}) on conflict (series_id,code) do update set plan_no=excluded.plan_no, source_ref=excluded.source_ref, art_cost=excluded.art_cost, plan_note=excluded.plan_note;")
# ---- produced reels: full script, captions, claims, publications ----
STAGE = {"A01": "review", "A02": "review", "A03": "scripted"}
for code, stage in STAGE.items():
    sp = os.path.join(SER, "reels", code, "src", "script.json"); s = json.load(open(sp, encoding="utf-8"))
    tlp = os.path.join(SER, "reels", code, "src", "timeline.json"); tl = json.load(open(tlp)) if os.path.exists(tlp) and stage != "scripted" else None
    row = os.path.join(ST, "publish", "desk", "rows", code + ".json"); caps = json.load(open(row))["captions"] if os.path.exists(row) else {}
    length = round(tl["total"], 2) if tl else None
    out.append(f"""insert into public.reels (series_id,code,title,stage,hook_hi,hook_en,length_s,script,timeline,captions,hashtags,verify_note) values ('untold-ramayana',{q(code)},{q(s['title'])},'{stage}',{q(s['shots'][0]['hi'])},{q(s['shots'][0]['en'])},{length if length else 'null'},{j(s)},{j(tl) if tl else 'null'},{j(caps)},{arr(s.get('hashtags', []))},{q(s.get('verify_note'))})
 on conflict (series_id,code) do update set title=excluded.title, stage=excluded.stage, hook_hi=excluded.hook_hi, hook_en=excluded.hook_en, length_s=excluded.length_s, script=excluded.script, timeline=excluded.timeline, captions=excluded.captions, hashtags=excluded.hashtags, verify_note=excluded.verify_note;""")
    rid = f"(select id from public.reels where series_id='untold-ramayana' and code={q(code)})"
    out.append(f"delete from public.claims where reel_id={rid};")
    for i, c in enumerate(s.get("claims", [])):
        out.append(f"insert into public.claims (reel_id,position,claim,ref,quote_sa,verified,sources) values ({rid},{i},{q(c['claim'])},{q(c['ref'])},{q(c.get('quote_sa'))},{'true' if c.get('verified') else 'false'},{arr(c.get('sources', []))});")
    if stage == "review":
        for p in ("instagram", "youtube", "facebook"):
            out.append(f"insert into public.publications (reel_id,platform,state) values ({rid},'{p}','todo') on conflict (reel_id,platform) do nothing;")
out.append("insert into public.activity (actor,action,detail) values ('claude','seed',$j${\"note\":\"initial import from the studio folder\"}$j$::jsonb);")
print("\n".join(out))
