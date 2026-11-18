#!/usr/bin/env python3
"""Upload a reel file and record it in the studio database.
   python3 scripts/media.py <reel_code> <kind> <local_file> [spec]
   kind: preview | poster | final | citations | caption | audio | master_instagram | master_youtube | ...
   Files <= 50 MB go to Supabase Storage (bucket reel-media); bigger masters go to GitHub Releases (scripts/release.py)."""
import hashlib, json, mimetypes, os, sys, urllib.request, urllib.parse
BASE = "https://spsrryrycowxmgiofyxo.supabase.co"; H = {"apikey": "proxy-injected"}
code, kind, path = sys.argv[1], sys.argv[2], sys.argv[3]; spec = sys.argv[4] if len(sys.argv) > 4 else None
size = os.path.getsize(path); sha = hashlib.sha256(open(path, "rb").read()).hexdigest()
if size > 50 * 1024 * 1024: sys.exit("over 50 MB: use scripts/release.py for masters")
ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"; key = f"untold-ramayana/{code}/{os.path.basename(path)}"
rq = urllib.request.Request(f"{BASE}/storage/v1/object/reel-media/{key}", open(path, "rb").read(), {**H, "Content-Type": ctype, "x-upsert": "true"}, method="POST")
print(urllib.request.urlopen(rq, timeout=600).read().decode()[:120])
def rest(method, q, body=None, prefer="return=representation"):
    r = urllib.request.Request(f"{BASE}/rest/v1/{q}", json.dumps(body).encode() if body is not None else None, {**H, "Content-Type": "application/json", "Prefer": prefer}, method=method)
    b = urllib.request.urlopen(r, timeout=60).read(); return json.loads(b) if b else None
reel = rest("GET", f"reels?select=id&series_id=eq.untold-ramayana&code=eq.{code}")[0]
rest("DELETE", f"files?reel_id=eq.{reel['id']}&kind=eq.{kind}&store=eq.supabase&path=eq.{urllib.parse.quote(key)}", prefer="return=minimal")
rest("POST", "files", [{"reel_id": reel["id"], "series_id": "untold-ramayana", "kind": kind, "store": "supabase", "path": key, "bytes": size, "spec": spec, "sha256": sha}], "return=minimal")
print("recorded", code, kind, key, f"{size / 1e6:.1f} MB")
