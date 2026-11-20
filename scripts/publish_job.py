#!/usr/bin/env python3
"""Runs inside GitHub Actions (.github/workflows/publish.yml). Posts one reel to one platform.
Gets everything from the studio job API using a one-time job token, then:
  YouTube  : resumable upload of the 4K master (videos.insert), Shorts metadata
  Instagram: Reels via the Instagram API with Instagram Login (resumable upload, then media_publish)
Progress and the final post link are reported back to the app."""
import json, os, subprocess, sys, time, urllib.error, urllib.parse, urllib.request

API, JOB_ID, TOKEN = os.environ["JOB_API"], os.environ["JOB_ID"], os.environ["JOB_TOKEN"]
print(f"::add-mask::{TOKEN}")
IG_API = "https://graph.instagram.com/v21.0"
IG_MAX = 300 * 1000 * 1000          # Instagram Reels API size limit

def call(method, url, body=None, headers=None, raw=False, timeout=300):
    data = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            b = r.read(); return (r, b) if raw else (json.loads(b) if b else {})
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{method} {url.split('?')[0]} → {e.code}: {e.read().decode(errors='replace')[:500]}")

def report(**kw):
    kw["job_id"] = JOB_ID
    try: call("POST", API, kw, {"x-job-token": TOKEN, "Content-Type": "application/json"}, timeout=30)
    except Exception as e: print("report failed:", e)
    if kw.get("log"): print(kw["log"])

def download(spec, dest):
    url = spec["master"]["url"]; hdr = {"Authorization": f"Bearer {spec['hf_token']}"} if spec.get("hf_token") else {}
    report(step="downloading master", log=f"Downloading {spec['master']['path']} ({(spec['master'].get('bytes') or 0) / 1e6:.0f} MB)")
    req = urllib.request.Request(url, headers=hdr)
    with urllib.request.urlopen(req, timeout=600) as r, open(dest, "wb") as f:
        while chunk := r.read(8 << 20): f.write(chunk)
    return dest

def youtube(spec, path):
    yt = spec["youtube"]; tok = yt["access_token"]; print(f"::add-mask::{tok}")
    size = os.path.getsize(path); privacy = spec.get("options", {}).get("privacy", "public")
    meta = {"snippet": {"title": yt["title"][:100], "description": yt["description"][:4900], "tags": yt["tags"][:30], "categoryId": "27", "defaultLanguage": "en", "defaultAudioLanguage": "hi"},
            "status": {"privacyStatus": privacy, "selfDeclaredMadeForKids": False, "embeddable": True}}
    report(step="uploading to YouTube", log=f"Starting resumable upload ({size / 1e6:.0f} MB), privacy={privacy}")
    r, _ = call("POST", "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", json.dumps(meta).encode(),
                {"Authorization": f"Bearer {tok}", "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Length": str(size), "X-Upload-Content-Type": "video/mp4"}, raw=True)
    loc = r.headers["Location"]; sent = 0; CH = 64 << 20; video = None
    with open(path, "rb") as f:
        while sent < size:
            chunk = f.read(CH); end = sent + len(chunk) - 1
            req = urllib.request.Request(loc, data=chunk, method="PUT", headers={"Content-Length": str(len(chunk)), "Content-Range": f"bytes {sent}-{end}/{size}"})
            try:
                with urllib.request.urlopen(req, timeout=600) as resp: video = json.loads(resp.read())
            except urllib.error.HTTPError as e:
                if e.code != 308: raise RuntimeError(f"YouTube upload {e.code}: {e.read().decode()[:400]}")
            sent = end + 1
            report(step=f"uploading to YouTube {sent * 100 // size}%")
    vid = video["id"]; st = video.get("status", {})
    note = "" if st.get("privacyStatus") == privacy else f" (YouTube set privacy to {st.get('privacyStatus')}; unverified API apps upload as private until Google audits the app)"
    if yt.get("playlist_id"):                       # series playlist (created by "Apply brand to YouTube"); never fails the post
        try:
            call("POST", "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
                 {"snippet": {"playlistId": yt["playlist_id"], "resourceId": {"kind": "youtube#video", "videoId": vid}}},
                 {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
            note += "; added to the series playlist"
        except Exception as e: note += f"; playlist add skipped ({e})"
    if spec.get("cover_url"):                       # custom thumbnail (needs a phone-verified channel); never fails the post
        try:
            img = urllib.request.urlopen(spec["cover_url"], timeout=120).read()
            call("POST", f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={vid}&uploadType=media", img,
                 {"Authorization": f"Bearer {tok}", "Content-Type": "image/jpeg"})
            note += "; thumbnail set"
        except Exception as e: note += f"; thumbnail skipped ({e})"
    return f"https://youtube.com/shorts/{vid}", vid, f"Uploaded video {vid}{note}"

def mp4_boxes(path):
    """Top-level MP4 box order and the raw moov box."""
    order, moov = [], b""
    with open(path, "rb") as f:
        while True:
            h = f.read(8)
            if len(h) < 8: break
            n, typ = int.from_bytes(h[:4], "big"), h[4:].decode("latin-1"); hdr = 8
            if n == 1: n = int.from_bytes(f.read(8), "big"); hdr = 16
            order.append(typ)
            if typ == "moov": moov = f.read(n - hdr)
            elif n == 0: break
            else: f.seek(n - hdr, 1)
    return order, moov

def instagram_fit(path):
    """Instagram Reels API delivery spec: H.264 High, 4:2:0, closed GOP, <=25 Mbps video, AAC 128 kbps 48 kHz stereo,
    <=300 MB, moov atom at the front, NO edit lists (so no B-frames: they make ffmpeg write one). Re-encode from our master at the best quality that stays inside those limits."""
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).strip())
    cap_k = min(18_000, int((IG_MAX * 0.93 * 8 / dur - 128_000) / 1000))      # every second under 25 Mbps, file under 300 MB
    report(step="preparing Instagram file", log=f"Encoding to Instagram's Reels spec (H.264, ≤{cap_k} kb/s, AAC 128k/48k, ≤300 MB)")
    out = path.replace(".mp4", "_ig.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-c:v", "libx264", "-preset", "slow", "-tune", "grain", "-crf", "14",
                    "-maxrate", f"{cap_k}k", "-bufsize", f"{cap_k}k", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level:v", "4.2",
                    "-bf", "0", "-g", "48", "-keyint_min", "24", "-sc_threshold", "0", "-flags", "+cgop", "-r", "24",
                    "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
                    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", "-use_editlist", "0", out], check=True)
    size = os.path.getsize(out)
    order, moov = mp4_boxes(out)
    if "moov" not in order or "mdat" not in order or order.index("moov") > order.index("mdat"): raise RuntimeError(f"moov atom is not at the front ({order})")
    if b"elst" in moov: raise RuntimeError("Instagram file still has an MP4 edit list (Reels spec forbids it)")
    if size > IG_MAX: raise RuntimeError(f"Instagram file is still {size / 1e6:.0f} MB (limit 300 MB)")
    return out

def instagram(spec, path):
    ig = spec["instagram"]; tok = ig["access_token"]; uid = ig["user_id"]; print(f"::add-mask::{tok}")
    IG = ig.get("api_base") or IG_API; ver = IG.rsplit("/", 1)[-1]
    path = instagram_fit(path); size = os.path.getsize(path)
    print(f"Instagram file: {size / 1e6:.0f} MB")
    q = lambda cid: call("GET", f"{IG}/{cid}?fields=status_code,status&access_token={urllib.parse.quote(tok)}")
    errors = []
    for attempt in (1, 2):                                # Meta: retry the upload; if it still fails, start a new container
        report(step="creating Instagram reel", log=f"Creating Reels container ({size / 1e6:.0f} MB){' (new container, attempt 2)' if attempt > 1 else ''}")
        params = {"media_type": "REELS", "upload_type": "resumable", "caption": ig["caption"][:2200], "share_to_feed": "true", "access_token": tok}
        if spec.get("cover_url"): params["cover_url"] = spec["cover_url"]      # our designed cover instead of a random frame
        try: c = call("POST", f"{IG}/{uid}/media?{urllib.parse.urlencode(params)}")
        except RuntimeError as e:
            if "cover_url" not in params: raise
            report(log=f"Instagram refused the cover ({e}); posting with its default cover")
            params.pop("cover_url"); c = call("POST", f"{IG}/{uid}/media?{urllib.parse.urlencode(params)}")
        cid, uri = c["id"], c.get("uri") or f"https://rupload.facebook.com/ig-api-upload/{ver}/{c['id']}"
        uploaded = False
        for tryno in (1, 2):
            report(step="uploading to Instagram", log=f"Container {cid}: uploading {size / 1e6:.0f} MB (try {tryno})")
            try:
                with open(path, "rb") as f:
                    req = urllib.request.Request(uri, data=f, method="POST", headers={"Authorization": f"OAuth {tok}", "offset": "0", "file_size": str(size),
                                                                                       "Content-Length": str(size), "Content-Type": "application/octet-stream"})
                    with urllib.request.urlopen(req, timeout=1800) as r: up = json.loads(r.read() or b"{}")
                if up.get("success", True): uploaded = True; break
                errors.append(f"upload response {up}")
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
                body = e.read().decode(errors="replace")[:400] if isinstance(e, urllib.error.HTTPError) else str(e)
                st = q(cid); errors.append(f"container {cid} try {tryno}: {body} | status {st.get('status_code')}: {st.get('status')}")
                report(log=f"Upload answered with an error: {body} | container status: {st.get('status_code')}")
                if st.get("status_code") in ("IN_PROGRESS", "FINISHED"):     # the bytes arrived anyway; let Instagram finish
                    uploaded = True; break
            time.sleep(30)
        if not uploaded: continue
        for i in range(90):                               # Instagram processes the video (up to ~15 min)
            st = q(cid)
            report(step=f"Instagram processing ({st.get('status_code')})")
            if st.get("status_code") in ("FINISHED", "ERROR", "EXPIRED"): break
            time.sleep(10)
        if st.get("status_code") == "FINISHED": break
        errors.append(f"container {cid} processing: {st.get('status_code')}: {st.get('status')}")
        report(log=f"Instagram could not process container {cid}: {st.get('status')}")
    else:
        raise RuntimeError("Instagram did not accept the video after 2 containers: " + " || ".join(errors)[:1500])
    p = call("POST", f"{IG}/{uid}/media_publish?{urllib.parse.urlencode({'creation_id': cid, 'access_token': tok})}")
    mid = p["id"]
    link = call("GET", f"{IG}/{mid}?fields=permalink&access_token={urllib.parse.quote(tok)}").get("permalink") or "https://www.instagram.com/untoldgranth.official/"
    return link, mid, f"Published reel {mid}"

def main():
    try:
        spec = call("GET", f"{API}?job_id={JOB_ID}", headers={"x-job-token": TOKEN})
        for k in ("hf_token",):
            if spec.get(k): print(f"::add-mask::{spec[k]}")
        path = download(spec, f"/tmp/{spec['code']}_{spec['platform']}.mp4")
        url, ext_id, msg = (youtube if spec["platform"] == "youtube" else instagram)(spec, path)
        report(status="done", step="posted", result_url=url, external_id=ext_id, log=f"{msg} → {url}")
    except Exception as e:
        report(status="failed", step="failed", log=f"FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
