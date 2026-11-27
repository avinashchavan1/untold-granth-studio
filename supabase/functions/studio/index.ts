// Admin actions from the app: connections, OAuth start, "Post now", and "Apply brand to YouTube".
import { healthCheck, refreshStats } from "../_shared/stats.ts";
import { addPeer, buildModel, discoverPeers, runAutopilot, scanPeers } from "../_shared/timing.ts";
import { notify, telegramChat } from "../_shared/notify.ts";
import { checkPublish, PLATFORMS, PublishError, startPublish } from "../_shared/publish.ts";
import { admin, cors, facebookPage, FB_GRAPH, FN_URL, getIntegration, instagramToken, json, randomToken, REPO, requireAdmin, resolveInstagramFromToken, setIntegration, sha256, youtubeAccessToken } from "../_shared/util.ts";

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
  await run("Video watermark (logo, top-right corner)", async () => {
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

/** Facebook Page branding through the Page API: intro (about), description, website, cover photo, profile picture.
 *  Each step reports on its own (Meta can refuse one field and accept the others). Needs pages_manage_metadata
 *  (settings) and pages_manage_posts (photo uploads) on the Meta login. */
async function applyFacebookBrand(email: string) {
  const steps: { step: string; ok: boolean; detail?: string }[] = [];
  const pg = await facebookPage(true);
  const { data: row } = await admin.from("channels").select("profile").eq("platform", "facebook").single();
  const p = (row?.profile ?? {}) as Record<string, any>;
  if (!p.intro) throw new Error("No Facebook profile saved yet: run scripts/brand.py");
  const fb = async (method: string, path: string, params: Record<string, string>) => {
    const r = await fetch(`${FB_GRAPH}/${path}`, { method, headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ ...params, access_token: pg.token }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) {
      const m = j.error?.message ?? `${r.status}`;
      throw new Error(/permission|\(#(200|10|3)\)/i.test(m) ? `${m}. Add pages_manage_metadata (and pages_manage_posts) to the Meta login, then press Connect Instagram again.` : m);
    }
    return j;
  };
  const signed = async (name: string) => { const { data } = await admin.storage.from("reel-media").createSignedUrl(`brand/${name}`, 3600); if (!data?.signedUrl) throw new Error(`brand/${name} missing: run scripts/brand.py`); return data.signedUrl; };
  const run = async (step: string, fn: () => Promise<string | undefined>) => {
    try { steps.push({ step, ok: true, detail: await fn() }); } catch (e) { steps.push({ step, ok: false, detail: e instanceof Error ? e.message : String(e) }); }
  };
  await run("Intro (bio)", async () => { await fb("POST", pg.page_id, { about: p.intro }); return `${[...p.intro].length}/101 chars`; });
  await run("About / description", async () => { await fb("POST", pg.page_id, { description: p.about }); return `${p.about.length} chars`; });
  await run("Website", async () => { await fb("POST", pg.page_id, { website: p.website }); return p.website; });
  await run("Cover photo (1640×924)", async () => {
    const ph = await fb("POST", `${pg.page_id}/photos`, { url: await signed("facebook_cover_1640x924.jpg"), published: "false" });
    await fb("POST", pg.page_id, { cover: ph.id, no_feed_story: "true" });
    return "set";
  });
  await run("Profile picture", async () => { await fb("POST", `${pg.page_id}/picture`, { picture: await signed("avatar_1080.png") }); return "set"; });
  await admin.from("channels").update({ applied: { at: new Date().toISOString(), by: email, steps, page: pg.page_name } }).eq("platform", "facebook");
  await admin.from("activity").insert({ actor: email, action: "facebook: brand applied", detail: { ok: steps.filter((s) => s.ok).length, of: steps.length } });
  return steps;
}

const SIMPLE: Record<string, string[]> = {
  github: ["token"],                         // fine-grained PAT: Actions read & write on the repo
  huggingface: ["token"],                    // WRITE token: reads the masters, and shares the Instagram file through the public drop
  telegram: ["bot_token"],                   // Telegram alerts: a bot from @BotFather
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
      case "telegram_test": {         // find the owner's chat (they sent /start to the bot) and send a test message
        const c = await telegramChat();
        if (!c) return json({ error: "Open Telegram, find your bot, press Start (or send it any message), then press Send test again." }, 400);
        const ok = await notify("🪔 Studio alerts are on. You'll get post results, anything that needs you, and a summary every morning at 8:17.");
        return json(ok ? { ok: true } : { error: "Telegram didn't accept the message" }, ok ? 200 : 400);
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
        if (body.provider === "telegram") {
          const r = await fetch(`https://api.telegram.org/bot${values.bot_token}/getMe`).then((x) => x.json()).catch(() => null);
          if (!r?.ok) return json({ error: "Telegram refused this bot token. Copy it again from @BotFather." }, 400);
          values.username = r.result.username;
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
      case "facebook_page": {      // find (or re-find) the Facebook Page from the Instagram/Meta login
        try { const pg = await facebookPage(true); await admin.from("activity").insert({ actor: email, action: "connected facebook page", detail: { page: pg.page_name } }); return json({ ok: true, page: pg.page_name }); }
        catch (e) { return json({ error: e instanceof Error ? e.message : String(e) }, 400); }
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
            scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/yt-analytics.readonly", state }).toString();
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
      case "publish": {              // one platform, now
        try { return json({ ok: true, job_id: await startPublish(body.reel_id, body.platform, body.options ?? {}, email) }); }
        catch (e) { return json({ error: e instanceof Error ? e.message : String(e) }, e instanceof PublishError ? e.status : 500); }
      }
      case "publish_all": {          // several platforms, now; each one succeeds or fails on its own
        const results: Record<string, { ok: boolean; job_id?: string; error?: string }> = {};
        for (const pl of (body.platforms ?? []) as string[]) {
          try { results[pl] = { ok: true, job_id: await startPublish(body.reel_id, pl, body.options ?? {}, email) }; }
          catch (e) { results[pl] = { ok: false, error: e instanceof Error ? e.message : String(e) }; }
        }
        return json({ ok: Object.values(results).every((r) => r.ok), results });
      }
      case "schedule": {             // several platforms, at one time (the timer starts them; see runDue)
        const at = new Date(String(body.at ?? ""));
        if (isNaN(at.getTime())) return json({ error: "Pick a date and time" }, 400);
        if (at.getTime() < Date.now() + 60_000) return json({ error: "Pick a time at least a minute from now (or use Post now)" }, 400);
        const results: Record<string, { ok: boolean; error?: string }> = {};
        for (const pl of (body.platforms ?? []) as string[]) {
          try {
            await checkPublish(body.reel_id, pl);
            const { data: cur } = await admin.from("publications").select("state").eq("reel_id", body.reel_id).eq("platform", pl).maybeSingle();
            if (cur?.state === "posted" || cur?.state === "posting") throw new Error(cur.state === "posted" ? "Already posted" : "Posting right now");
            const { error } = await admin.from("publications").upsert({ reel_id: body.reel_id, platform: pl, state: "scheduled", scheduled_for: at.toISOString(),
              schedule_options: body.options ?? {}, scheduled_by: email, last_error: null }, { onConflict: "reel_id,platform" });
            if (error) throw new Error(error.message);
            results[pl] = { ok: true };
          } catch (e) { results[pl] = { ok: false, error: e instanceof Error ? e.message : String(e) }; }
        }
        const okN = Object.values(results).filter((r) => r.ok).length;
        if (okN) await admin.from("activity").insert({ actor: email, reel_id: body.reel_id, action: `scheduled for ${at.toISOString()}`, detail: { platforms: Object.keys(results).filter((k) => results[k].ok) } });
        return json({ ok: okN === Object.keys(results).length, results, at: at.toISOString() });
      }
      case "unschedule": {
        const pls = (body.platforms ?? [...PLATFORMS]) as string[];
        await admin.from("publications").update({ state: "todo", scheduled_for: null, scheduled_by: null }).eq("reel_id", body.reel_id).eq("state", "scheduled").in("platform", pls);
        await admin.from("activity").insert({ actor: email, reel_id: body.reel_id, action: "schedule cancelled", detail: { platforms: pls } });
        return json({ ok: true });
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
      case "refresh_stats": {       // "Refresh now": everything, at most once per 10 minutes (the timer refreshes hourly anyway)
        const { data: ch } = await admin.from("channels").select("stats_refreshed_at").eq("platform", "youtube").maybeSingle();
        const ago = ch?.stats_refreshed_at ? Date.now() - new Date(ch.stats_refreshed_at).getTime() : Infinity;
        if (ago < 10 * 60e3) return json({ ok: true, cooldown: Math.ceil((10 * 60e3 - ago) / 60e3), note: "Refreshed less than 10 minutes ago" });
        await admin.from("channels").update({ stats_refreshed_at: new Date().toISOString() }).eq("platform", "youtube");
        return json({ ok: true, ...(await refreshStats(false)) });
      }
      case "timing_rescan": {        // Best time page → "Rescan now" (at most every 10 minutes: YouTube quota + Meta limits)
        const { data: last } = await admin.from("timing_model").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (last?.updated_at && Date.now() - new Date(last.updated_at).getTime() < 10 * 60e3 && !body.force_discover) return json({ ok: true, cooldown: true });
        if (body.force_discover) await discoverPeers();
        return json({ ok: true, scanned: await scanPeers(), model: await buildModel() });
      }
      case "peer_add": {
        try { const name = await addPeer(body.platform, String(body.handle ?? "")); return json({ ok: true, name }); }
        catch (e) { return json({ error: e instanceof Error ? e.message : String(e) }, 400); }
      }
      case "peer_toggle": {
        await admin.from("peers").update({ active: !!body.active }).eq("id", body.id);
        return json({ ok: true });
      }
      case "autopilot_set": {
        const patch: Record<string, unknown> = { updated_by: email, updated_at: new Date().toISOString() };
        for (const k of ["enabled", "platforms", "days_ahead", "post_days"]) if (k in body) patch[k] = body[k];
        await admin.from("autopilot").update(patch).eq("id", 1);
        await admin.from("activity").insert({ actor: email, action: `autopilot ${body.enabled === false ? "turned off" : body.enabled ? "turned on" : "settings changed"}`, detail: patch });
        return json({ ok: true, ...(body.enabled ? { run: await runAutopilot() } : {}) });
      }
      case "autopilot_run": {
        return json({ ok: true, ...(await runAutopilot()) });
      }
      case "health": {              // connection / token / failed-post checks for the banner (also runs daily)
        return json({ ok: true, ...(await healthCheck()) });
      }
      case "youtube_set_covers": {   // put our designed cover on ONE posted YouTube video (reel_id); the app calls it per reel
        if (!body.reel_id) return json({ error: "reel_id required: covers are set one video at a time" }, 400);
        const tok = await youtubeAccessToken();
        const { data: pubs } = await admin.from("publications").select("reel_id,external_id").eq("platform", "youtube").eq("state", "posted").eq("reel_id", body.reel_id).not("external_id", "is", null);
        if (!pubs?.length) return json({ error: "This reel has no posted YouTube video yet" }, 400);
        const out: Record<string, unknown>[] = [];
        for (const p of pubs ?? []) {
          const { data: f } = await admin.from("files").select("path").eq("reel_id", p.reel_id).eq("kind", "thumbnail").eq("store", "supabase").order("created_at", { ascending: false }).limit(1).maybeSingle();
          if (!f?.path) { out.push({ video: p.external_id, ok: false, detail: "no cover file" }); continue; }
          const img = (await admin.storage.from("reel-media").download(f.path)).data;
          if (!img) { out.push({ video: p.external_id, ok: false, detail: "cover not readable" }); continue; }
          const r = await fetch(`${YT_UP}/thumbnails/set?videoId=${p.external_id}&uploadType=media`, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "image/jpeg" }, body: img });
          out.push({ video: p.external_id, ok: r.ok, detail: r.ok ? "cover set" : ((await r.json().catch(() => ({}))).error?.message ?? r.status) });
        }
        await admin.from("activity").insert({ actor: email, action: "youtube: cover applied", detail: { reel_id: body.reel_id, results: out } });
        return json({ ok: out.every((o) => o.ok), results: out });
      }
      case "facebook_brand": {
        const steps = await applyFacebookBrand(email);
        return json({ ok: steps.every((s) => s.ok), steps });
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
