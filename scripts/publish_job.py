#!/usr/bin/env python3
"""Runs inside GitHub Actions (.github/workflows/publish.yml). Posts one reel to one platform.
Gets everything from the studio job API using a one-time job token, then:
  YouTube  : resumable upload of the 4K master (videos.insert), Shorts metadata
  Instagram: Reels via the Instagram API with Instagram Login (resumable upload, then media_publish)
  Facebook : Reels on the channel's Page (video_reels start → rupload → finish PUBLISHED)
Progress and the final post link are reported back to the app."""
import json, os, re, subprocess, sys, time, urllib.error, urllib.parse, urllib.request

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
    report(log=f"YouTube has the video {vid} (it is live or processing; never upload it again)")
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
    link = f"https://www.youtube.com/watch?v={vid}" if spec.get("longform") else f"https://youtube.com/shorts/{vid}"   # full-length 16:9 videos are normal videos, not Shorts
    return link, vid, f"Uploaded video {vid}{note}"

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
    cap_k = min(18_000, int((IG_MAX * 0.93 * 8 / dur - 128_000) / 1000))      # every second under 25 Mbps, file under 300 MB (owner: keep full quality)
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

def drop_link(spec, path):
    """Owner-approved (Nov 27 2026): put the Instagram file in a PUBLIC Hugging Face dataset next to the private masters ("<masters repo>-drop")
    for a few minutes so Instagram fetches it itself (video_url), then delete it. Instagram's upload server often refuses pushed bytes
    (ProcessingFailedError → FILE_NOT_FOUND, 0 bytes stored), as other publishers report too. Returns (link, cleanup) or (None, None)."""
    tok = spec.get("hf_token"); m = re.search(r"/datasets/([^/]+/[^/]+)/resolve/", (spec.get("master") or {}).get("url", ""))
    if not tok or not m: return None, None
    try:
        from huggingface_hub import HfApi
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "huggingface_hub"], check=False)
        try: from huggingface_hub import HfApi
        except ImportError: return None, None
    repo = m.group(1) + "-drop"; name = f"{spec.get('code', 'reel')}_{int(time.time())}.mp4"
    api = HfApi(token=tok)
    def cleanup():
        try:
            for f in api.list_repo_files(repo, repo_type="dataset"):
                if f.endswith(".mp4"): api.delete_file(f, repo_id=repo, repo_type="dataset", commit_message=f"posted: remove {f}")
            report(log="Removed the file from the public drop")
        except Exception as e: report(log=f"Could not empty the drop ({type(e).__name__}); the next post tries again")
    try:
        try: api.create_repo(repo, repo_type="dataset", private=False, exist_ok=True)
        except Exception: pass                            # created once by the owner's account; the app's token may not create repos, only upload to them
        report(step="sharing the file with Instagram", log=f"Putting the Instagram file in the public drop {repo} for a few minutes (deleted after posting)")
        api.upload_file(path_or_fileobj=path, path_in_repo=name, repo_id=repo, repo_type="dataset", commit_message=f"drop {name}")
        url = f"https://huggingface.co/datasets/{repo}/resolve/main/{name}"
        with urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=60) as r: url = r.geturl()   # the final file host (short-lived link)
        return url, cleanup
    except Exception as e:
        report(log=f"Could not share the file by link ({type(e).__name__}: {str(e)[:200]}); uploading it directly instead"); cleanup(); return None, None

def instagram(spec, path):
    ig = spec["instagram"]; tok = ig["access_token"]; uid = ig["user_id"]; print(f"::add-mask::{tok}")
    IG = ig.get("api_base") or IG_API; ver = IG.rsplit("/", 1)[-1]
    path = instagram_fit(path); size = os.path.getsize(path)
    print(f"Instagram file: {size / 1e6:.0f} MB")
    q = lambda cid: call("GET", f"{IG}/{cid}?fields=status_code,status,video_status&access_token={urllib.parse.quote(tok)}")
    # Instagram's top-level status_code says IN_PROGRESS even when its upload server stored NOTHING (video_status.uploading_phase:
    # error, 0 bytes, FILE_NOT_FOUND: seen on real uploads). So we judge the upload by video_status, never by status_code,
    # resend (or resume from the bytes it has) until every byte is stored, and only then wait for processing.
    def upload_state(cid):
        st = q(cid); up = (st.get("video_status") or {}).get("uploading_phase") or {}
        return st, up.get("status"), int(up.get("bytes_transferred") or 0), up.get("errors")
    def send(uri, offset):
        with open(path, "rb") as f:
            f.seek(offset)
            req = urllib.request.Request(uri, data=f, method="POST", headers={"Authorization": f"OAuth {tok}", "offset": str(offset), "file_size": str(size),
                                                                               "Content-Length": str(size - offset), "Content-Type": "application/octet-stream"})
            try:
                with urllib.request.urlopen(req, timeout=1800) as r: return (r.read() or b"{}").decode(errors="replace")[:300]
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, ConnectionError) as e:
                return (e.read().decode(errors="replace") if isinstance(e, urllib.error.HTTPError) else f"{type(e).__name__}: {e}")[:300]
    errors = []
    # a link (video_url) container has no video_status field: asking for it gives "Invalid parameter" (error_subcode 2207065)
    q_link = lambda cid: call("GET", f"{IG}/{cid}?fields=status_code,status&access_token={urllib.parse.quote(tok)}")
    def wait_processing(cid, link=False):
        t0 = time.time(); st, proc = {}, None
        while time.time() - t0 < 30 * 60:                 # processing usually takes ~30 s; check once a minute (Meta's advice, and its request limit)
            time.sleep(20 if time.time() - t0 < 60 else 60)
            st = q_link(cid) if link else q(cid); proc = ((st.get("video_status") or {}).get("processing_phase") or {}).get("status"); waited = int((time.time() - t0) / 60)
            report(step=f"Instagram processing ({st.get('status_code')}, {waited} min)")
            if st.get("status_code") in ("FINISHED", "ERROR", "EXPIRED") or proc == "error": break
        return st, proc
    # 1) link route: Instagram downloads the file itself. Automatic; if Instagram refuses the link we fall back to the direct upload (2).
    cid = None; link, cleanup = drop_link(spec, path)
    if link:
        try:
            params = {"media_type": "REELS", "video_url": link, "caption": ig["caption"][:2200], "share_to_feed": "true", "access_token": tok}
            if spec.get("cover_url"): params["cover_url"] = spec["cover_url"]
            report(step="creating Instagram reel", log=f"Creating Reels container from a link ({size / 1e6:.0f} MB); Instagram downloads it itself")
            try: c = call("POST", f"{IG}/{uid}/media?{urllib.parse.urlencode(params)}")
            except RuntimeError as e:
                if "cover_url" not in params: raise
                report(log=f"Instagram refused the cover ({e}); posting with its default cover"); params.pop("cover_url"); c = call("POST", f"{IG}/{uid}/media?{urllib.parse.urlencode(params)}")
            report(log=f"Container {c['id']} created from the link; Instagram is downloading and processing it")
            st, proc = wait_processing(c["id"], link=True)
            if st.get("status_code") == "FINISHED": cid = c["id"]; report(log="Link route worked: Instagram fetched and processed the video")
            else:
                errors.append(f"link container {c['id']}: {st.get('status_code')}: {st.get('status')}")
                report(log=f"Instagram could not use the link ({st.get('status_code')}: {st.get('status')}); uploading directly instead")
        except Exception as e:
            errors.append(f"link route: {type(e).__name__}: {str(e)[:200]}"); report(log=f"Link route failed ({type(e).__name__}: {str(e)[:200]}); uploading directly instead")
        finally: cleanup()
    done = cid is not None
    for attempt in ((1, 2) if not done else ()):       # 2) direct upload; a new container only if 4 sends to this one never stored the file
        report(step="creating Instagram reel", log=f"Creating Reels container ({size / 1e6:.0f} MB){' (new container, attempt 2)' if attempt > 1 else ''}")
        params = {"media_type": "REELS", "upload_type": "resumable", "caption": ig["caption"][:2200], "share_to_feed": "true", "access_token": tok}
        if spec.get("cover_url"): params["cover_url"] = spec["cover_url"]      # our designed cover instead of a random frame
        try: c = call("POST", f"{IG}/{uid}/media?{urllib.parse.urlencode(params)}")
        except RuntimeError as e:
            if "cover_url" not in params: raise
            report(log=f"Instagram refused the cover ({e}); posting with its default cover")
            params.pop("cover_url"); c = call("POST", f"{IG}/{uid}/media?{urllib.parse.urlencode(params)}")
        cid, uri = c["id"], c.get("uri") or f"https://rupload.facebook.com/ig-api-upload/{ver}/{c['id']}"
        stored, offset = False, 0
        for tryno, pause in zip((1, 2, 3, 4), (0, 30, 60, 120)):
            if pause: report(log=f"Waiting {pause} s before sending again"); time.sleep(pause)
            report(step="uploading to Instagram", log=f"Container {cid}: sending {(size - offset) / 1e6:.0f} MB from byte {offset:,} (send {tryno} of 4)")
            reply = send(uri, offset)
            for _ in range(8):                            # the upload server needs a moment to settle: read its real state
                time.sleep(10); st, ust, got, uerr = upload_state(cid)
                if ust in ("complete", "error") or got >= size: break
            report(log=f"Upload reply: {reply} | Instagram stored {got:,} of {size:,} bytes ({ust}{': ' + str(uerr)[:160] if uerr else ''})")
            if ust == "complete" or got >= size: stored = True; break
            errors.append(f"container {cid} send {tryno}: stored {got} of {size} bytes ({ust}) {str(uerr)[:160] if uerr else ''}")
            offset = got if 0 < got < size else 0         # resume from what it kept; after a failed (0-byte) send, start again from 0
        if not stored: report(log=f"Instagram's upload server did not store the file in container {cid}"); continue
        report(log="All bytes stored; Instagram is processing the video")
        st, proc = wait_processing(cid)
        if st.get("status_code") == "FINISHED": done = True; break
        errors.append(f"container {cid} processing: {st.get('status_code')}: {st.get('status')} (processing {proc})")
        report(log=f"Instagram could not process container {cid}: {st.get('status')} (processing {proc})")
    if not done:
        raise RuntimeError("Instagram's upload server did not take the video (it stored 0 bytes on every try; this is on Instagram's side). "
                           "Try again later. Details: " + " || ".join(errors)[:1300])
    p = call("POST", f"{IG}/{uid}/media_publish?{urllib.parse.urlencode({'creation_id': cid, 'access_token': tok})}")
    mid = p["id"]
    report(log=f"Instagram published media {mid} (never publish it again)")
    try:   # confirm the cover: Instagram serves the reel's cover as thumbnail_url
        th = call("GET", f"{IG}/{mid}?fields=thumbnail_url&access_token={urllib.parse.quote(tok)}").get("thumbnail_url")
        report(log=("Cover: our designed cover was sent and Instagram reports a cover image" if spec.get("cover_url") and th else
                    "Cover: Instagram used a frame from the video (no designed cover was sent)" if th else "Cover: Instagram reports no cover image yet"))
    except Exception as e: report(log=f"Cover check skipped ({str(e)[:120]})")
    link = call("GET", f"{IG}/{mid}?fields=permalink&access_token={urllib.parse.quote(tok)}").get("permalink") or os.environ.get("IG_PROFILE_URL", "")
    return link, mid, f"Published reel {mid}"

def facebook(spec, path):
    """Facebook Reels on the Page: start an upload session, send the file to rupload, then finish with PUBLISHED and wait
    until Facebook has processed and published it. Uses the same H.264 file as Instagram (Reels spec, <=90 s)."""
    fb = spec["facebook"]; tok = fb["access_token"]; page = fb["page_id"]; print(f"::add-mask::{tok}")
    G = fb.get("api_base") or "https://graph.facebook.com/v21.0"
    path = instagram_fit(path); size = os.path.getsize(path)
    report(step="creating Facebook reel", log=f"Starting a Reels upload on the Page {fb.get('page_name') or page} ({size / 1e6:.0f} MB)")
    st = call("POST", f"{G}/{page}/video_reels?{urllib.parse.urlencode({'upload_phase': 'start', 'access_token': tok})}")
    vid, uri = st["video_id"], st.get("upload_url") or f"https://rupload.facebook.com/video-upload/{G.rsplit('/', 1)[-1]}/{st['video_id']}"
    for tryno in (1, 2, 3):
        report(step="uploading to Facebook", log=f"Video {vid}: sending {size / 1e6:.0f} MB (try {tryno} of 3)")
        with open(path, "rb") as f:
            req = urllib.request.Request(uri, data=f, method="POST", headers={"Authorization": f"OAuth {tok}", "offset": "0", "file_size": str(size),
                                                                               "Content-Length": str(size), "Content-Type": "application/octet-stream"})
            try:
                with urllib.request.urlopen(req, timeout=1800) as r: reply = json.loads(r.read() or b"{}")
            except urllib.error.HTTPError as e: reply = {"error": e.read().decode(errors="replace")[:300]}
            except (urllib.error.URLError, TimeoutError, ConnectionError) as e: reply = {"error": f"{type(e).__name__}: {e}"}
        if reply.get("success"): break
        report(log=f"Upload reply: {str(reply)[:300]}"); time.sleep(30 * tryno)
    else:
        raise RuntimeError(f"Facebook did not take the video upload: {str(reply)[:300]}")
    params = {"upload_phase": "finish", "video_id": vid, "video_state": "PUBLISHED", "description": fb.get("description", "")[:2200], "access_token": tok}
    call("POST", f"{G}/{page}/video_reels?{urllib.parse.urlencode(params)}")
    report(log="Upload complete; Facebook is processing and publishing the reel")
    t0, last = time.time(), {}
    while time.time() - t0 < 30 * 60:
        time.sleep(20 if time.time() - t0 < 60 else 60)
        last = call("GET", f"{G}/{vid}?fields=status&access_token={urllib.parse.quote(tok)}").get("status") or {}
        vs = last.get("video_status"); pub = (last.get("publishing_phase") or {}).get("status"); proc = (last.get("processing_phase") or {}).get("status")
        report(step=f"Facebook processing ({vs}, {int((time.time() - t0) / 60)} min)")
        if vs == "error" or proc == "error" or pub == "error": raise RuntimeError(f"Facebook could not publish the reel: {str(last)[:600]}")
        if pub == "complete" or vs == "published": break
    else:
        raise RuntimeError(f"Facebook was still processing after 30 min: {str(last)[:400]}")
    if spec.get("cover_url"):                                 # our designed cover; never fails the post
        try:
            img = urllib.request.urlopen(spec["cover_url"], timeout=60).read(); bnd = "kbfcover"
            body = (f"--{bnd}\r\nContent-Disposition: form-data; name=\"is_preferred\"\r\n\r\ntrue\r\n--{bnd}\r\nContent-Disposition: form-data; name=\"source\"; filename=\"cover.jpg\"\r\n"
                    f"Content-Type: image/jpeg\r\n\r\n").encode() + img + f"\r\n--{bnd}--\r\n".encode()
            call("POST", f"{G}/{vid}/thumbnails?access_token={urllib.parse.quote(tok)}", body, {"Content-Type": f"multipart/form-data; boundary={bnd}"})
            report(log="Cover set on the Facebook reel")
        except Exception as e: report(log=f"Facebook kept its own cover ({str(e)[:200]})")
    return f"https://www.facebook.com/reel/{vid}", vid, f"Published Facebook reel {vid} on {fb.get('page_name') or page}"

def first_comment(spec, ext_id):
    """Post the reel's question as the first comment (starts the conversation in the first minutes). Never fails the post."""
    text = (spec.get("first_comment") or "").strip()
    if not text: return ""
    try:
        if spec["platform"] == "youtube":
            tok = spec["youtube"]["access_token"]
            call("POST", "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet",
                 {"snippet": {"videoId": ext_id, "topLevelComment": {"snippet": {"textOriginal": text[:9000]}}}},
                 {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
        elif spec["platform"] == "facebook":
            fb = spec["facebook"]; G = fb.get("api_base") or "https://graph.facebook.com/v21.0"
            call("POST", f"{G}/{ext_id}/comments?{urllib.parse.urlencode({'message': text[:2200], 'access_token': fb['access_token']})}")
        else:
            ig = spec["instagram"]; IG = ig.get("api_base") or IG_API
            call("POST", f"{IG}/{ext_id}/comments?{urllib.parse.urlencode({'message': text[:2200], 'access_token': ig['access_token']})}")
        return "; first comment posted (pin it in the app)"
    except Exception as e:
        return f"; first comment skipped ({str(e)[:200]})"

def main():
    try:
        spec = call("GET", f"{API}?job_id={JOB_ID}", headers={"x-job-token": TOKEN})
        for k in ("hf_token",):
            if spec.get(k): print(f"::add-mask::{spec[k]}")
        for sec in ("youtube", "instagram", "facebook"):
            if (spec.get(sec) or {}).get("access_token"): print(f"::add-mask::{spec[sec]['access_token']}")
        path = download(spec, f"/tmp/{spec['code']}_{spec['platform']}.mp4")
        url, ext_id, msg = {"youtube": youtube, "facebook": facebook}.get(spec["platform"], instagram)(spec, path)
        msg += first_comment(spec, ext_id)
        report(status="done", step="posted", result_url=url, external_id=ext_id, log=f"{msg} → {url}")
    except Exception as e:
        report(status="failed", step="failed", log=f"FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
