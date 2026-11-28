#!/usr/bin/env python3
"""Push the shared product (engine, art library, app, backend, scripts, skills, playbook) from a channel repo to the
storyreel-studio template, so every improvement made while producing a channel reaches the template.

  python3 scripts/template_sync.py <template checkout> [--commit]

Copies only SHARED paths (never channel.json, calendar.json, studio/series/, brand images, CLAUDE.md, README.md), then scans the
template for leaked channel details (the channel's name/handles/ids from its channel.json, plus extra words in .template_guard)
and refuses to commit if any are found. Run it after every engine/app/script/skill change (CLAUDE.md rule)."""
import json, os, re, shutil, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHARED = ["studio/engine/py", "studio/engine/js", "studio/engine/art", "studio/engine/fonts", "studio/make_reel.py", "studio/STYLE_GUIDE.md",
          "studio/package.json", "studio/.claude/skills", ".claude/skills", "src", "supabase", "scripts", "presets", "PLAYBOOK.md", "index.html",
          "package.json", "vite.config.ts", "tailwind.config.js", "postcss.config.js", "tsconfig.json", "netlify.toml", ".github", "public", "brand/make_brand.py"]
SKIP = re.compile(r"(__pycache__|\.pyc$|node_modules|/frames/|/out/|/\.temp$|\.temp/)")

def copy(src, dst):
    if os.path.isdir(src):
        if os.path.exists(dst): shutil.rmtree(dst)
        shutil.copytree(src, dst, ignore=lambda d, fs: [f for f in fs if SKIP.search(os.path.join(d, f))])
    else: os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(src, dst)

def guard_words():
    C = json.load(open(os.path.join(ROOT, "channel.json"), encoding="utf-8"))
    w = {C["name"], C["id"], C["series"]["id"], C["series"]["name"], C["infra"]["supabase_ref"], C["infra"]["hf_masters_repo"], C["infra"]["netlify_site_id"],
         C["owner"]["contact_email"], C["app_url"].split("//")[-1]} | {h["handle"] for h in C["handles"].values()}
    g = os.path.join(ROOT, ".template_guard")
    if os.path.exists(g): w |= {l.strip() for l in open(g, encoding="utf-8") if l.strip() and not l.startswith("#")}
    return {x for x in w if x and "example" not in x.lower() and "YOUR" not in x}

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(__doc__)
    T = os.path.abspath(sys.argv[1])
    if os.path.samefile(T, ROOT): sys.exit("run this from the channel repo, pointing at the template checkout")
    for p in SHARED:
        s = os.path.join(ROOT, p)
        if os.path.exists(s): copy(s, os.path.join(T, p))
    # never undo another session's work (lesson, Nov 28 2026): a template file that is NEWER than the channel's copy, or that the
    # channel doesn't have at all, is restored and listed; pull those into the channel first (copy them over, test, commit), then sync again.
    git = lambda repo, *a: subprocess.run(["git", "-C", repo, *a], capture_output=True, text=True).stdout.strip()
    kept = []
    for line in git(T, "status", "--porcelain").splitlines():
        code, path = line[:2], line[3:].strip()
        if "D" in code:
            git(T, "checkout", "HEAD", "--", path); kept.append(f"{path} (only in the template)"); continue
        if "M" not in code: continue
        t_time = int(git(T, "log", "-1", "--format=%ct", "HEAD", "--", path) or 0)
        c_file = os.path.join(ROOT, path)
        c_time = max(int(git(ROOT, "log", "-1", "--format=%ct", "--", path) or 0), int(os.path.getmtime(c_file)) if os.path.exists(c_file) else 0)
        if t_time > c_time: git(T, "checkout", "HEAD", "--", path); kept.append(f"{path} (newer in the template)")
    if kept: print("KEPT the template's version (pull these into the channel first):\n  " + "\n  ".join(kept))
    words = guard_words(); hits = []
    for d, _, fs in os.walk(T):
        if ".git" in d or "node_modules" in d or "presets" in d: continue
        for f in fs:
            p = os.path.join(d, f)
            try: txt = open(p, encoding="utf-8").read()
            except Exception: continue
            for w in words:
                if w.lower() in txt.lower(): hits.append(f"{os.path.relpath(p, T)}: {w}")
    if hits: print("LEAKS (channel details in the template), fix in the channel repo with channel.json/series.json, then re-run:\n  " + "\n  ".join(sorted(set(hits))[:60])); sys.exit(1)
    print("template updated, no channel details found")
    if "--commit" in sys.argv:
        subprocess.run(["git", "-C", T, "add", "-A"], check=True)
        r = subprocess.run(["git", "-C", T, "diff", "--cached", "--quiet"])
        if r.returncode: subprocess.run(["git", "-C", T, "commit", "-m", "Sync shared engine/app/scripts from a channel repo"], check=True); print("committed in the template")
        else: print("nothing changed")
