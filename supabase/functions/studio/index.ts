// Admin actions from the app: connections, OAuth start, "Post now", and "Apply brand to YouTube".
import { admin, cors, FB_GRAPH, FN_URL, getIntegration, instagramToken, json, randomToken, REPO, requireAdmin, resolveInstagramFromToken, setIntegration, sha256, youtubeAccessToken } from "../_shared/util.ts";

const YT = "https://www.googleapis.com/youtube/v3";
const YT_UP = "https://www.googleapis.com/upload/youtube/v3";
type Step = { step: string; ok: boolean; detail?: string };

/** Push the channel profile (channels.profile for youtube) and the brand kit (storage brand/) to the connected channel. */
async function applyYouTubeBrand(email: string): Promise<Step[]> {
  const steps: Step[] = [];
  const token = await youtubeAccessToken();
  const info = await (await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`)).json();
  if (!String(info.scope ?? "").split(" ").some((s: string) => /auth\/youtube(\.force-ssl)?$/.test(s)))
    throw new Error("YouTube is connected for uploads only. Press “Reconnect YouTube” once (Settings → Connections) to allow channel edits, then try again.");
  const H = { Authorization: `Bearer ${token}` };
  const yt = async (method: string, url: string, body?: BodyInit, ctype = "application/json") => {
    const r = await fetch(url, { method, headers: { ...H, ...(body ? { "Content-Type": ctype } : {}) }, body });
    const t = await r.text(); const j = t ? JSON.parse(t) : {};
    if (!r.ok) throw new Error(j.error?.message ?? `${r.status}`);
    return j;
  };
  const file = async (name: string) => { const { data, error } = await admin.storage.from("reel-media").download(`brand/${name}`); if (error || !data) throw new Error(`brand/${name} missing — run scripts/brand.py`); return data; };
  const run = async (step: string, fn: () => Promise<string | undefined>) => {
    try { steps.push({ step, ok: true, detail: await fn() }); } catch (e) { steps.push({ step, ok: false, detail: e instanceof Error ? e.message : String(e) }); }
  };
  const { data: row } = await admin.from("channels").select("profile").eq("platform", "youtube").single();
  const p = (row?.profile ?? {}) as Record<string, any>;
  if (!p.description) throw new Error("No YouTube profile saved yet — run scripts/brand.py");

  const ch = (await yt("GET", `${YT}/channels?part=brandingSettings&mine=true`)).items?.[0];
  if (!ch) throw new Error("No channel on this Google account");
  let bannerUrl: string | undefined;
  await run("Upload banner (2560×1440)", async () => {
    const r = await yt("POST", `${YT_UP}/channelBanners/insert?uploadType=media`, await file("youtube_banner_2560x1440.jpg"), "image/jpeg");
    bannerUrl = r.url; return "uploaded";
  });
  await run("Description, keywords, country, language" + (bannerUrl ? " and banner" : ""), async () => {
    const b = ch.brandingSettings ?? {};
    const kw = (p.keywords as string[]).map((k) => (/\s/.test(k) ? `"${k}"` : k)).join(" ");
    const channel = { ...(b.channel ?? {}), description: p.description, keywords: kw, country: p.country, defaultLanguage: p.default_language };
    delete channel.title;
    const image = bannerUrl ? { ...(b.image ?? {}), bannerExternalUrl: bannerUrl } : b.image;
    await yt("PUT", `${YT}/channels?part=brandingSettings`, JSON.stringify({ id: ch.id, brandingSettings: { ...b, channel, ...(image ? { image } : {}) } }));
    return `${p.description.length} chars, ${p.keywords.length} keywords`;
  });
  await run("Video watermark (diya, top-right corner)", async () => {
    const img = new Uint8Array(await (await file("youtube_watermark_300.png")).arrayBuffer());
    const meta = JSON.stringify({ timing: { type: "offsetFromStart", offsetMs: 0 }, position: { type: "corner", cornerPosition: "topRight" } });
    const boundary = "ugb" + randomToken(8);
    const head = new TextEncoder().encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: image/png\r\n\r\n`);
    const tail = new TextEncoder().encode(`\r\n--${boundary}--\r\n`);
    const body = new Uint8Array(head.length + img.length + tail.length); body.set(head); body.set(img, head.length); body.set(tail, head.length + img.length);
    await yt("POST", `${YT_UP}/watermarks/set?channelId=${ch.id}&uploadType=multipart`, body, `multipart/related; boundary=${boundary}`);
    return "set";
  });
  await run(`Playlist “${p.playlist?.title}”`, async () => {
    const yti = await getIntegration("youtube");
    const mine = (await yt("GET", `${YT}/playlists?part=snippet&mine=true&maxResults=50`)).items ?? [];
    let pl = mine.find((x: any) => x.id === yti?.playlist_id) ?? mine.find((x: any) => x.snippet?.title === p.playlist.title);
    const snippet = { title: p.playlist.title, description: p.playlist.description, defaultLanguage: p.default_language };
    if (pl) await yt("PUT", `${YT}/playlists?part=snippet`, JSON.stringify({ id: pl.id, snippet }));
    else pl = await yt("POST", `${YT}/playlists?part=snippet,status`, JSON.stringify({ snippet, status: { privacyStatus: "public" } }));
    if (yti) await setIntegration("youtube", { ...yti, playlist_id: pl.id });
    return `${pl.id} · new uploads are added automatically`;
  });
  await admin.from("channels").update({ applied: { at: new Date().toISOString(), by: email, steps } }).eq("platform", "youtube");
  await admin.from("activity").insert({ actor: email, action: "youtube: brand applied", detail: { ok: steps.filter((s) => s.ok).length, of: steps.length } });
  return steps;
}

const SIMPLE: Record<string, string[]> = {
  github: ["token"],                         // fine-grained PAT: Actions read & write on the repo
  huggingface: ["token"],                    // read access to the masters repo
  google_app: ["client_id", "client_secret"],// Google Cloud OAuth client (Web)
  meta_app: ["app_id", "app_secret", "config_id"], // Meta app (App settings → Basic) + Unified-login configuration ID
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const email = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    switch (body.action) {
      case "status": {
        const { data } = await admin.from("integrations").select("provider,data,connected_at,updated_at");
        const out: Record<string, unknown> = {};
        for (const row of data ?? []) {
          const d = row.data as Record<string, any>;
          out[row.provider] = { connected: !!row.connected_at, at: row.connected_at, name: d.channel_title ?? d.username ?? d.login ?? null,
            account_id: d.user_id ?? d.channel_id ?? null, expires_at: d.expires_at ?? null, has_values: Object.keys(d).length > 0 };
        }
        return json({ providers: out, redirect_uris: { youtube: `${FN_URL}/oauth/youtube`, instagram: `${FN_URL}/oauth/instagram` } });
      }
      case "save": {
        const keys = SIMPLE[body.provider];
        if (!keys) return json({ error: "unknown provider" }, 400);
        const values: Record<string, string> = {};
        for (const k of keys) { const v = String(body.values?.[k] ?? "").trim(); if (!v) return json({ error: `missing ${k}` }, 400); values[k] = v; }
        if (body.provider === "github") {
          const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows`, { headers: { Authorization: `Bearer ${values.token}`, Accept: "application/vnd.github+json", "User-Agent": "storyreel-studio" } });
          if (!r.ok) return json({ error: `GitHub refused this token (${r.status}). It needs Actions: read & write on ${REPO}.` }, 400);
        }
        if (body.provider === "huggingface") {
          const r = await fetch("https://huggingface.co/api/whoami-v2", { headers: { Authorization: `Bearer ${values.token}` } });
          if (!r.ok) return json({ error: `Hugging Face refused this token (${r.status}).` }, 400);
          values.login = (await r.json()).name;
        }
        await setIntegration(body.provider, values, true);
        await admin.from("activity").insert({ actor: email, action: `connected ${body.provider}` });
        return json({ ok: true });
      }
      case "instagram_token": {
        const token = String(body.values?.token ?? "").trim();
        if (!token) return json({ error: "Paste the system-user token" }, 400);
        try {
          const ig = await resolveInstagramFromToken(token, body.values?.ig_user_id ? String(body.values.ig_user_id) : undefined);
          await setIntegration("instagram", { access_token: token, user_id: ig.user_id, username: ig.username, api_base: FB_GRAPH, system_user: true });
          await admin.from("activity").insert({ actor: email, action: "connected instagram", detail: { username: ig.username } });
          return json({ ok: true, username: ig.username });
        } catch (e) { return json({ error: e instanceof Error ? e.message : String(e) }, 400); }
      }
      case "disconnect": {
        await admin.from("integrations").delete().eq("provider", body.provider);
        await admin.from("activity").insert({ actor: email, action: `disconnected ${body.provider}` });
        return json({ ok: true });
      }
      case "oauth_start": {
        const state = randomToken(16);
        await admin.from("oauth_states").insert({ state, provider: body.provider, return_to: body.return_to ?? null });
        if (body.provider === "youtube") {
          const app = await getIntegration("google_app");
          if (!app?.client_id) return json({ error: "Add the Google OAuth client first" }, 400);
          const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
          u.search = new URLSearchParams({ client_id: app.client_id, redirect_uri: `${FN_URL}/oauth/youtube`, response_type: "code", access_type: "offline", prompt: "consent", include_granted_scopes: "true",
            // youtube = manage the channel (banner, description, watermark, playlists); youtube.upload = post videos
            scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl", state }).toString();
          return json({ url: u.toString() });
        }
        if (body.provider === "instagram") {
          const app = await getIntegration("meta_app");
          if (!app?.app_id) return json({ error: "Add the Meta app ID, secret and configuration ID first" }, 400);
          // Facebook Login for Business with the Unified-login configuration → system-user token (never expires)
          const u = new URL("https://www.facebook.com/v21.0/dialog/oauth");
          u.search = new URLSearchParams({ client_id: app.app_id, redirect_uri: `${FN_URL}/oauth/instagram`, state, config_id: app.config_id, response_type: "code", override_default_response_type: "true" }).toString();
          return json({ url: u.toString() });
        }
        return json({ error: "unknown provider" }, 400);
      }
      case "publish": {
        const { reel_id, platform } = body;
        if (!["youtube", "instagram"].includes(platform)) return json({ error: "Auto-posting is available for Instagram and YouTube" }, 400);
        const { data: reel } = await admin.from("reels").select("id,code,reviewed").eq("id", reel_id).single();
        if (!reel) return json({ error: "reel not found" }, 404);
        if (!reel.reviewed) return json({ error: "Tick the citation check before posting" }, 400);
        const kind = platform === "youtube" ? "master_youtube" : "master_instagram";
        const { data: master } = await admin.from("files").select("id").eq("reel_id", reel_id).eq("kind", kind).maybeSingle();
        if (!master) return json({ error: `No ${platform} master attached to ${reel.code}` }, 400);
        const need = platform === "youtube" ? ["github", "huggingface", "google_app", "youtube"] : ["github", "huggingface", "instagram"];
        for (const p of need) if (!(await getIntegration(p))) return json({ error: `Connect ${p.replace("_app", "")} first (Settings → Connections)` }, 400);
        const { data: running } = await admin.from("publish_jobs").select("id").eq("reel_id", reel_id).eq("platform", platform).in("status", ["queued", "running"]).maybeSingle();
        if (running) return json({ error: "Already posting this reel to " + platform }, 409);

        const token = randomToken();
        const { data: job, error } = await admin.from("publish_jobs").insert({
          reel_id, platform, requested_by: email, token_hash: await sha256(token), token_expires_at: new Date(Date.now() + 3 * 3600e3).toISOString(),
          options: { privacy: body.options?.privacy ?? "public" }, step: "queued", log: `Queued by ${email}\n`,
        }).select("id").single();
        if (error || !job) return json({ error: error?.message ?? "could not create job" }, 500);
        await admin.from("publications").upsert({ reel_id, platform, state: "posting" }, { onConflict: "reel_id,platform" });
        const gh = await getIntegration("github");
        const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/publish.yml/dispatches`, {
          method: "POST",
          headers: { Authorization: `Bearer ${gh!.token}`, Accept: "application/vnd.github+json", "User-Agent": "storyreel-studio", "Content-Type": "application/json" },
          body: JSON.stringify({ ref: "main", inputs: { job_id: job.id, job_token: token, api: `${FN_URL}/job` } }),
        });
        if (!r.ok) {
          const msg = `GitHub did not start the publisher (${r.status}): ${(await r.text()).slice(0, 200)}`;
          await admin.from("publish_jobs").update({ status: "failed", step: "dispatch", log: msg, finished_at: new Date().toISOString(), token_hash: null }).eq("id", job.id);
          await admin.from("publications").upsert({ reel_id, platform, state: "failed" }, { onConflict: "reel_id,platform" });
          return json({ error: msg }, 502);
        }
        await admin.from("activity").insert({ actor: email, reel_id, action: `${platform}: posting started`, detail: { code: reel.code, job: job.id } });
        return json({ ok: true, job_id: job.id });
      }
      case "youtube_update": {      // push the app's title/description/tags to an already-posted YouTube video
        const { data: reel } = await admin.from("reels").select("id,code,title,captions,hashtags").eq("id", body.reel_id).single();
        const { data: pub } = await admin.from("publications").select("external_id").eq("reel_id", body.reel_id).eq("platform", "youtube").maybeSingle();
        if (!reel || !pub?.external_id) return json({ error: "This reel has no posted YouTube video" }, 400);
        const caps = (reel.captions ?? {}) as Record<string, string>;
        const tok = await youtubeAccessToken();
        const snippet = { title: (caps.youtube_title || `${reel.title} #Shorts`).slice(0, 100), description: (caps.youtube_description || "").slice(0, 4900),
          tags: ((reel.hashtags ?? []) as string[]).map((t) => t.replace(/^#/, "")).slice(0, 30), categoryId: "27", defaultLanguage: "en", defaultAudioLanguage: "hi" };
        const r = await fetch(`${YT}/videos?part=snippet`, { method: "PUT", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify({ id: pub.external_id, snippet }) });
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          const msg = e.error?.message ?? r.status;
          return json({ error: /insufficient|scope/i.test(String(msg)) ? "Press “Reconnect YouTube” once (Settings → Connections) to allow edits, then try again." : `YouTube refused the update: ${msg}` }, 400);
        }
        await admin.from("activity").insert({ actor: email, reel_id: reel.id, action: "youtube: title/description updated", detail: { code: reel.code } });
        return json({ ok: true });
      }
      case "refresh_stats": {       // views / likes / comments for every posted reel (trial comparison on the Dashboard)
        const { data: pubs } = await admin.from("publications").select("id,platform,external_id").eq("state", "posted").not("external_id", "is", null);
        const out: Record<string, unknown>[] = [];
        let ytTok: string | null = null, ig: { token: string; api_base: string } | null = null;
        for (const p of pubs ?? []) {
          try {
            let stats: Record<string, number | null> = {};
            if (p.platform === "youtube") {
              ytTok ??= await youtubeAccessToken();
              const it = (await (await fetch(`${YT}/videos?part=statistics,status,contentDetails&id=${p.external_id}`, { headers: { Authorization: `Bearer ${ytTok}` } })).json()).items?.[0] ?? {};
              const v = it.statistics ?? {}, st = it.status ?? {};
              stats = { views: +v.viewCount || 0, likes: +v.likeCount || 0, comments: +v.commentCount || 0 };
              (stats as Record<string, unknown>).status = { privacy: st.privacyStatus, upload: st.uploadStatus, made_for_kids: st.madeForKids, self_declared_kids: st.selfDeclaredMadeForKids,
                age_restricted: it.contentDetails?.contentRating?.ytRating === "ytAgeRestricted", rejection: st.rejectionReason ?? null, license: st.license };
            } else if (p.platform === "instagram") {
              if (!ig) { const t = await instagramToken(); ig = { token: t.token, api_base: t.api_base }; }
              const q = (path: string) => fetch(`${ig!.api_base}/${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(ig!.token)}`).then((r) => r.json());
              const m = await q(`${p.external_id}?fields=like_count,comments_count`);
              stats = { likes: m.like_count ?? null, comments: m.comments_count ?? null };
              const ins = await q(`${p.external_id}/insights?metric=views,reach,saved,shares`);
              for (const d of ins.data ?? []) stats[d.name] = d.values?.[0]?.value ?? d.total_value?.value ?? null;
              if (ins.error) (stats as Record<string, unknown>).insights_error = String(ins.error.message ?? ins.error).slice(0, 200);
            } else continue;
            await admin.from("publications").update({ stats, stats_at: new Date().toISOString() }).eq("id", p.id);
            out.push({ id: p.id, ...stats });
          } catch (e) { out.push({ id: p.id, error: e instanceof Error ? e.message : String(e) }); }
        }
        return json({ ok: true, updated: out });
      }
      case "youtube_set_covers": {   // after channel verification: put our designed cover on every posted YouTube video
        const tok = await youtubeAccessToken();
        const { data: pubs } = await admin.from("publications").select("reel_id,external_id").eq("platform", "youtube").eq("state", "posted").not("external_id", "is", null);
        const out: Record<string, unknown>[] = [];
        for (const p of pubs ?? []) {
          const { data: f } = await admin.from("files").select("path").eq("reel_id", p.reel_id).eq("kind", "thumbnail").eq("store", "supabase").order("created_at", { ascending: false }).limit(1).maybeSingle();
          if (!f?.path) { out.push({ video: p.external_id, ok: false, detail: "no cover file" }); continue; }
          const img = (await admin.storage.from("reel-media").download(f.path)).data;
          if (!img) { out.push({ video: p.external_id, ok: false, detail: "cover not readable" }); continue; }
          const r = await fetch(`${YT_UP}/thumbnails/set?videoId=${p.external_id}&uploadType=media`, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "image/jpeg" }, body: img });
          out.push({ video: p.external_id, ok: r.ok, detail: r.ok ? "cover set" : ((await r.json().catch(() => ({}))).error?.message ?? r.status) });
        }
        await admin.from("activity").insert({ actor: email, action: "youtube: covers applied", detail: { results: out } });
        return json({ ok: out.every((o) => o.ok), results: out });
      }
      case "youtube_brand": {
        const steps = await applyYouTubeBrand(email);
        return json({ ok: steps.every((s) => s.ok), steps });
      }
      default:
        return json({ error: "unknown action" }, 400);
    }
  } catch (e) {
    if (e instanceof Response) return e;
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
