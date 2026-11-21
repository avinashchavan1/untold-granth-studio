#!/usr/bin/env bash
# New channel from this template: fills channel.json, creates the series folder from series/example, picks a calendar preset,
# and prints the infrastructure checklist. Safe to re-run (asks before overwriting a series).
set -euo pipefail
cd "$(dirname "$0")/.."
ask() { local q="$1" d="${2:-}" a; read -r -p "$q${d:+ [$d]}: " a; echo "${a:-$d}"; }
NAME=$(ask "Channel name (e.g. Untold Mahabharata)")
ID=$(ask "Channel id (lowercase, dashes)" "$(echo "$NAME" | tr '[:upper:] ' '[:lower:]-' | tr -cd 'a-z0-9-')")
SID=$(ask "Series id (folder under studio/series)" "$ID")
SNAME=$(ask "Series name" "$NAME")
BOOK=$(ask "Base text (e.g. Mahabharata)")
EDITION=$(ask "Edition you cite (e.g. BORI Critical Edition)")
IG=$(ask "Instagram handle (with @)")
YT=$(ask "YouTube handle (with @)")
LANG=$(ask "Narration language code (hi, en, mr, ta, te, bn...)" "hi")
VURL=$(ask "Verse page URL pattern with {book} and {chapter}" "https://example.org/book-{book}/chapter-{chapter}/")
TAG=$(ask "Tagline" "Stories from the original texts.")
EMAIL=$(ask "Owner contact email (privacy page + first app admin)")
CAL=$(ask "Calendar preset (hindu / none)" "hindu")
python3 - "$NAME" "$ID" "$SID" "$SNAME" "$BOOK" "$EDITION" "$IG" "$YT" "$LANG" "$VURL" "$TAG" "$EMAIL" <<'PY'
import json, sys
name, cid, sid, sname, book, ed, ig, yt, lang, vurl, tag, email = sys.argv[1:]
C = json.load(open("channel.json"))
C.update({"id": cid, "name": name, "app_title": f"{name} Studio"})
C["series"] = {"id": sid, "name": sname, "book": book, "edition": ed}
C["handles"] = {"instagram": {"handle": ig, "url": f"https://www.instagram.com/{ig.lstrip('@')}/"}, "youtube": {"handle": yt, "url": f"https://www.youtube.com/{yt}"}}
C["language"]["narration"] = lang; C["source"].update({"title": book, "edition": ed, "verse_url": vurl})
C["brand"]["tagline"] = tag; C["owner"]["contact_email"] = email
C["hashtags"] = ["#" + "".join(w.capitalize() for w in name.split()), "#" + book.replace(" ", ""), "#Stories"]
json.dump(C, open("channel.json", "w"), ensure_ascii=False, indent=1)
PY
S=studio/series/$SID
if [ -d "$S" ] && [ "$SID" != example ]; then echo "series $S exists: left as is"; else
  cp -r studio/series/example "$S"; rm -rf "$S/reels/X01"; echo '{}' > "$S/reels/stages.json"
  python3 - "$S" "$SID" "$NAME" "$SNAME" "$BOOK" "$EDITION" "$IG" "$YT" "$TAG" <<'PY'
import json, sys
S, sid, name, sname, book, ed, ig, yt, tag = sys.argv[1:]
j = json.load(open(f"{S}/series.json")); w = name.upper().split()
j.update({"id": sid, "logo": name.upper(), "title": [w[0], " ".join(w[1:])] if len(w) > 1 else [w[0], ""], "tagline": tag, "series_name": sname.upper(), "source_title": book})
j["source"].update({"book": book, "edition": ed}); j["channel"] = {"name": name, "instagram": ig, "youtube": yt}
j["handles_line"] = [f"INSTAGRAM  {ig}", f"YOUTUBE  {yt}"]
j["cta"]["instagram"]["handles_line"] = [f"INSTAGRAM  {ig}", f"YOUTUBE  {yt}"]; j["cta"]["youtube"]["handles_line"] = [f"YOUTUBE  {yt}", f"INSTAGRAM  {ig}"]
json.dump(j, open(f"{S}/series.json", "w"), ensure_ascii=False, indent=1)
open(f"{S}/PLAN.md", "w").write(f"# {sname}: plan\n\n| # | Title (working) | Type | Where (book · chapter) | Art | Notes |\n|---|---|---|---|---|---|\n")
PY
fi
[ "$CAL" = hindu ] && cp presets/calendar-hindu.json calendar.json || true
cat <<TXT

Channel files written: channel.json, $S/ (series.json, PLAN.md, cast/, art/), calendar.json ($CAL).
Now set up the channel's own infrastructure (one-time):
 1. Supabase: new project → run supabase/migrations in order → deploy supabase/functions (studio verify_jwt on, job off, oauth off)
    → function secrets: APP_URL, GITHUB_REPO, HF_MASTERS_REPO, IG_HANDLE=$IG
    → SQL: insert into public.app_admins (email) values ('$EMAIL');
    → put the project ref, URL and publishable key in channel.json → infra.
 2. Netlify: new site → its id in channel.json → infra.netlify_site_id, your domain in app_url; bash scripts/deploy.sh
 3. Hugging Face: a private dataset repo for masters + audio packs → channel.json → infra.hf_masters_repo
 4. Network secrets on the cloud environment (never in code): ElevenLabs, Supabase, Netlify, Hugging Face.
 5. Audition a narrator (4–6 ElevenLabs voices on one line) → $S/cast/cast.json; lock major characters as they appear.
 6. python3 scripts/sync.py   (fills the app), then in Claude Code: "next reel".
TXT
