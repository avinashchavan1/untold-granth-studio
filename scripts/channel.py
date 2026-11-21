"""The channel's identity and infrastructure, from channel.json at the repo root (one channel per copy of the template)."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = json.load(open(os.path.join(ROOT, "channel.json"), encoding="utf-8"))
STUDIO = os.path.join(ROOT, "studio")
SID = C["series"]["id"]                                   # series id: folder name under studio/series and DB key
SER = os.path.join(STUDIO, "series", SID)
REELS = os.path.join(SER, "reels")
SUPA = C["infra"]["supabase_url"].rstrip("/")             # e.g. https://<ref>.supabase.co ; keys are network secrets (proxy-injected)
HF_MASTERS = C["infra"]["hf_masters_repo"]
HANDLES = C["handles"]
