// Smart timing + Autopilot (runs daily on the timer; buttons on the Best time page).
// Sources, all through official APIs (no scraping):
//   1. prior: what published studies say about Indian evening/lunch peaks (weak, always on)
//   2. peers: similar channels' real posts (YouTube Data API: publish time + views; Instagram Business Discovery:
//      Reels timestamp + views). Each post is scored against its own channel's median, so big and small channels count equally.
//   3. audience: our Instagram followers online per hour (online_followers; needs 100+ followers)
//   4. own: our posts' results by posting hour
// The model is a [weekday][hour] grid per platform (IST), mean 1. Weights grow with sample size.
import { admin, getIntegration, instagramToken, youtubeAccessToken } from "./util.ts";

const YT = "https://www.googleapis.com/youtube/v3";
type P = "instagram" | "youtube" | "facebook";
const IST = 5.5;
const istOf = (iso: string) => { const d = new Date(new Date(iso).getTime() + IST * 3600e3); return { dow: d.getUTCDay(), hour: d.getUTCHours() + d.getUTCMinutes() / 60 }; };

// ---------- 1. the prior (published studies: lunch + strong evening, weekend late morning) ----------
const bump = (h: number, at: number, w: number, a: number) => a * Math.exp(-((h - at) ** 2) / (2 * w * w));
function prior(p: P, dow: number, h: number) {
  const weekend = dow === 0 || dow === 6;
  if (h < 7 || h > 23.5) return 0.05;
  if (p !== "youtube") return weekend ? bump(h, 11.5, 1.3, 0.75) + bump(h, 20.5, 1.4, 1) + bump(h, 15, 2, 0.3) + 0.08 : bump(h, 13, 1, 0.55) + bump(h, 20.5, 1.3, 1) + bump(h, 9, 1, 0.25) + 0.08;
  return weekend ? bump(h, 11, 1.5, 0.8) + bump(h, 19.5, 1.6, 1) + bump(h, 15, 2, 0.35) + 0.08 : bump(h, 13, 1.1, 0.5) + bump(h, 19.5, 1.5, 1) + bump(h, 9, 1, 0.2) + 0.08;
}

// ---------- 2. peers ----------
/** Find similar channels once (YouTube search, 100 quota units per query; the terms are per channel: autopilot.peer_search).
 *  Keeps channels with 10k+ subscribers. */
export async function discoverPeers() {
  const { data: ap } = await admin.from("autopilot").select("peer_search").eq("id", 1).maybeSingle();
  const SEARCHES: string[] = ap?.peer_search ?? [];
  if (!SEARCHES.length) return ["no search terms set (autopilot.peer_search): add channels by hand on the Best time page"];
  const tok = await youtubeAccessToken(); const H = { Authorization: `Bearer ${tok}` };
  const found = new Map<string, string>();
  for (const q of SEARCHES) {
    const r = await (await fetch(`${YT}/search?part=snippet&type=channel&maxResults=10&regionCode=IN&relevanceLanguage=hi&q=${encodeURIComponent(q)}`, { headers: H })).json();
    for (const it of r.items ?? []) found.set(it.snippet.channelId, it.snippet.title);
  }
  const ids = [...found.keys()]; const added: string[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const r = await (await fetch(`${YT}/channels?part=snippet,statistics&id=${ids.slice(i, i + 50).join(",")}`, { headers: H })).json();
    for (const c of r.items ?? []) {
      const subs = +c.statistics?.subscriberCount || 0, mine = (await getIntegration("youtube"))?.channel_id;
      if (subs < 10000 || c.id === mine) continue;
      const handle = c.snippet.customUrl || c.id;
      const { error } = await admin.from("peers").upsert({ platform: "youtube", handle, external_id: c.id, title: c.snippet.title, followers: subs, source: "auto" }, { onConflict: "platform,handle", ignoreDuplicates: true });
      if (!error) added.push(c.snippet.title);
    }
  }
  return added;
}
/** Resolve and add one channel the owner typed (YouTube @handle or Instagram username). */
export async function addPeer(platform: P, raw: string) {
  const handle = raw.trim().replace(/^https?:\/\/(www\.)?(youtube\.com\/|instagram\.com\/)/, "").replace(/\/.*$/, "");
  if (platform === "youtube") {
    const tok = await youtubeAccessToken();
    const r = await (await fetch(`${YT}/channels?part=snippet,statistics&forHandle=${encodeURIComponent(handle.replace(/^@/, ""))}`, { headers: { Authorization: `Bearer ${tok}` } })).json();
    const c = r.items?.[0]; if (!c) throw new Error(`No YouTube channel found for ${handle}`);
    await admin.from("peers").upsert({ platform, handle: c.snippet.customUrl || handle, external_id: c.id, title: c.snippet.title, followers: +c.statistics?.subscriberCount || null, source: "owner", active: true }, { onConflict: "platform,handle" });
    return c.snippet.title as string;
  }
  const user = handle.replace(/^@/, "");
  const ig = await instagramToken();
  const r = await (await fetch(`${ig.api_base}/${ig.user_id}?fields=business_discovery.username(${encodeURIComponent(user)}){id,username,name,followers_count}&access_token=${encodeURIComponent(ig.token)}`)).json();
  const b = r.business_discovery; if (!b) throw new Error(r.error?.message ?? `@${user} isn't a public business/creator account`);
  await admin.from("peers").upsert({ platform: "instagram", handle: b.username, external_id: b.id, title: b.name ?? b.username, followers: b.followers_count ?? null, source: "owner", active: true }, { onConflict: "platform,handle" });
  return b.username as string;
}
const isoDur = (s: string) => { const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(s ?? "") ?? []; return (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + (+(m[3] ?? 0)); };
/** Read each active peer's ~50 latest posts (YouTube: ~3 quota units per channel; Instagram: 1 call per account). */
export async function scanPeers() {
  const { data: peers } = await admin.from("peers").select("*").eq("active", true);
  const out: string[] = [];
  let ytH: Record<string, string> | null = null, ig: { token: string; api_base: string; user_id: string } | null = null;
  for (const p of peers ?? []) {
    try {
      let rows: Record<string, unknown>[] = [];
      if (p.platform === "youtube") {
        ytH ??= { Authorization: `Bearer ${await youtubeAccessToken()}` };
        const uploads = "UU" + String(p.external_id).slice(2);
        const pl = await (await fetch(`${YT}/playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}`, { headers: ytH })).json();
        const ids = (pl.items ?? []).map((i: any) => i.contentDetails.videoId);
        if (!ids.length) throw new Error(pl.error?.message ?? "no uploads");
        const v = await (await fetch(`${YT}/videos?part=snippet,statistics,contentDetails&id=${ids.join(",")}`, { headers: ytH })).json();
        rows = (v.items ?? []).map((x: any) => ({ platform: "youtube", post_id: x.id, peer_id: p.id, published_at: x.snippet.publishedAt, duration_s: isoDur(x.contentDetails.duration),
          views: +x.statistics.viewCount || 0, likes: +x.statistics.likeCount || null, comments: +x.statistics.commentCount || null, fetched_at: new Date().toISOString() }))
          .filter((r: any) => r.duration_s > 0 && r.duration_s <= 180);          // Shorts only
      } else if (p.platform === "instagram" && String(p.handle).startsWith("#")) {
        // a hashtag "peer": the official hashtag API's top + recent posts (max 30 different hashtags a week; we use a few)
        if (!ig) { const t = await instagramToken(); ig = { token: t.token, api_base: t.api_base, user_id: t.user_id }; }
        let hid = p.external_id as string | null;
        if (!hid) { const h = await (await fetch(`${ig.api_base}/ig_hashtag_search?user_id=${ig.user_id}&q=${encodeURIComponent(String(p.handle).slice(1))}&access_token=${encodeURIComponent(ig.token)}`)).json();
          hid = h.data?.[0]?.id ?? null; if (!hid) throw new Error(h.error?.message ?? "hashtag not found"); await admin.from("peers").update({ external_id: hid }).eq("id", p.id); }
        for (const edge of ["top_media", "recent_media"]) {
          const r = await (await fetch(`${ig.api_base}/${hid}/${edge}?user_id=${ig.user_id}&fields=id,timestamp,media_type,like_count,comments_count&limit=50&access_token=${encodeURIComponent(ig.token)}`)).json();
          if (r.error) throw new Error(r.error.message);
          rows.push(...(r.data ?? []).filter((m: any) => m.media_type === "VIDEO" && m.timestamp)
            .map((m: any) => ({ platform: "instagram", post_id: m.id, peer_id: p.id, published_at: m.timestamp, views: null, likes: m.like_count ?? null, comments: m.comments_count ?? null, fetched_at: new Date().toISOString() })));
        }
        rows = [...new Map(rows.map((r) => [r.post_id, r])).values()];
      } else if (p.platform === "instagram") {
        if (!ig) { const t = await instagramToken(); ig = { token: t.token, api_base: t.api_base, user_id: t.user_id }; }
        const r = await (await fetch(`${ig.api_base}/${ig.user_id}?fields=business_discovery.username(${encodeURIComponent(p.handle)}){media.limit(50){id,timestamp,media_product_type,like_count,comments_count,view_count}}&access_token=${encodeURIComponent(ig.token)}`)).json();
        if (r.error) throw new Error(r.error.message);
        rows = (r.business_discovery?.media?.data ?? []).filter((m: any) => m.media_product_type === "REELS" && m.timestamp)
          .map((m: any) => ({ platform: "instagram", post_id: m.id, peer_id: p.id, published_at: m.timestamp, views: m.view_count ?? null, likes: m.like_count ?? null, comments: m.comments_count ?? null, fetched_at: new Date().toISOString() }));
      }
      if (rows.length) await admin.from("peer_posts").upsert(rows, { onConflict: "platform,post_id" });
      await admin.from("peers").update({ last_scan: new Date().toISOString(), last_error: null }).eq("id", p.id);
      out.push(`${p.title ?? p.handle}: ${rows.length}`);
    } catch (e) { await admin.from("peers").update({ last_scan: new Date().toISOString(), last_error: e instanceof Error ? e.message.slice(0, 300) : String(e) }).eq("id", p.id); }
  }
  return out;
}

// ---------- 3. our audience: saved by the stats timer (stats.ts → follower_daily.extra.online), read in buildModel ----------

// ---------- 4. the model ----------
type Grid = number[][];
const empty = (v = 1): Grid => Array.from({ length: 7 }, () => new Array(24).fill(v));
const norm = (g: Grid) => { const all = g.flat(), m = all.reduce((a, b) => a + b, 0) / all.length || 1; return g.map((r) => r.map((x) => x / m)); };
/** perf observations (dow, hour, ratio vs its channel median) → smooth hour curve × weekday curve (avoids sparse cells) */
function fromObs(obs: { dow: number; hour: number; r: number }[]): { grid: Grid; n: number } {
  if (!obs.length) return { grid: empty(), n: 0 };
  const hourC = new Array(24).fill(0).map((_, h) => { let ws = 0, acc = 0; for (const o of obs) { const d = Math.min(Math.abs(o.hour - h), 24 - Math.abs(o.hour - h)), k = Math.exp(-(d * d) / (2 * 1.5 * 1.5)); ws += k; acc += k * Math.log(o.r); } return ws > 0.3 ? Math.exp(acc / ws * Math.min(1, ws / 3)) : 1; });
  const dowC = new Array(7).fill(0).map((_, d) => { const m = obs.filter((o) => o.dow === d); return m.length >= 3 ? Math.exp(m.reduce((a, o) => a + Math.log(o.r), 0) / m.length * Math.min(1, m.length / 10)) : 1; });
  return { grid: norm(dowC.map((dw) => hourC.map((hc) => dw * hc))), n: obs.length };
}
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
export async function buildModel() {
  const { data: posts } = await admin.from("peer_posts").select("platform,peer_id,published_at,views,likes").lt("published_at", new Date(Date.now() - 3 * 864e5).toISOString()).limit(5000);
  // our audience: Instagram online_followers saved daily by the stats timer (follower_daily.extra.online, hours in Pacific time)
  const { data: fol } = await admin.from("follower_daily").select("extra").eq("platform", "instagram");
  const audHours = new Array(24).fill(0);
  for (const r of fol ?? []) { const on = (r.extra as any)?.online; if (!on || typeof on !== "object") continue;
    for (const [date, hours] of Object.entries(on as Record<string, Record<string, number>>)) {
      const off = new Date(`${date}T12:00:00Z`).toLocaleString("en-US", { timeZone: "America/Los_Angeles", timeZoneName: "short" }).includes("PDT") ? -7 : -8;
      for (const [k, v] of Object.entries(hours ?? {})) { const ist = ((Number(k) - off + IST) % 24 + 24) % 24; audHours[Math.floor(ist)] += Number(v) || 0; } } }
  const aud = audHours.map((value, hour_ist) => ({ hour_ist, value }));
  const { data: own } = await admin.from("publications").select("platform,posted_at,stats").eq("state", "posted").not("posted_at", "is", null);
  const result: Record<string, unknown> = {};
  for (const p of ["instagram", "youtube", "facebook"] as P[]) {
    // peers: Facebook has no peer data of its own; Instagram's is the closest audience
    const src = p === "facebook" ? "instagram" : p;
    const byPeer = new Map<string, { t: string; m: number }[]>();
    for (const x of posts ?? []) { if (x.platform !== src) continue; const m = Number(x.views ?? x.likes ?? 0); if (m > 0) (byPeer.get(x.peer_id) ?? byPeer.set(x.peer_id, []).get(x.peer_id)!).push({ t: x.published_at, m }); }
    const peerObs: { dow: number; hour: number; r: number }[] = [];
    for (const list of byPeer.values()) { if (list.length < 5) continue; const md = median(list.map((x) => x.m)) || 1; for (const x of list) { const { dow, hour } = istOf(x.t); peerObs.push({ dow, hour, r: Math.min(20, Math.max(0.05, x.m / md)) }); } }
    const peers = fromObs(peerObs);
    // own posts (views, else likes) vs our median
    const mine = (own ?? []).filter((x) => x.platform === p).map((x) => ({ t: x.posted_at as string, m: Number((x.stats as any)?.views ?? (x.stats as any)?.likes ?? 0) })).filter((x) => x.m > 0);
    const omd = median(mine.map((x) => x.m)) || 1; const ownR = fromObs(mine.map((x) => { const { dow, hour } = istOf(x.t); return { dow, hour, r: Math.min(20, Math.max(0.05, x.m / omd)) }; }));
    // audience (Instagram + Facebook share it as an approximation): followers online per hour, same for every weekday
    const audVals = new Array(24).fill(0); for (const a of aud ?? []) audVals[a.hour_ist] = Number(a.value);
    const hasAud = p !== "youtube" && audVals.some((v) => v > 0);
    const audG = hasAud ? norm(empty().map(() => audVals.map((v) => Math.max(v, 0.01)))) : empty();
    const pri = norm(empty().map((r, d) => r.map((_, h) => prior(p, d, h + 0.5))));
    const wPeer = peers.n / (peers.n + 150), wOwn = ownR.n / (ownR.n + 15), wAud = hasAud ? 0.6 : 0;
    const grid = norm(pri.map((r, d) => r.map((x, h) => x * Math.pow(peers.grid[d][h], wPeer * 1.5) * Math.pow(audG[d][h], wAud) * Math.pow(ownR.grid[d][h], wOwn * 1.5))));
    // never suggest the middle of the night even if a source likes it
    for (const r of grid) for (let h = 0; h < 24; h++) if (h < 7) r[h] *= 0.1;
    const g2 = norm(grid);
    const top: { dow: number; hour: number; score: number }[] = [];
    for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) top.push({ dow: d, hour: h, score: +g2[d][h].toFixed(3) });
    top.sort((a, b) => b.score - a.score);
    const parts = { prior: 1, peers: { weight: +wPeer.toFixed(2), posts: peers.n, channels: [...byPeer.values()].filter((l) => l.length >= 5).length }, audience: { weight: wAud, available: hasAud }, own: { weight: +wOwn.toFixed(2), posts: ownR.n } };
    await admin.from("timing_model").upsert({ platform: p, grid: g2.map((r) => r.map((x) => +x.toFixed(3))), top: top.slice(0, 10), parts, updated_at: new Date().toISOString() }, { onConflict: "platform" });
    result[p] = parts;
  }
  return result;
}

/** best hour (IST, whole hour) on a given IST date for a platform, at least `minLead` hours from now */
async function bestHourOn(p: P, dateIst: Date, minLeadH = 2) {
  const { data: m } = await admin.from("timing_model").select("grid").eq("platform", p).maybeSingle();
  const g = (m?.grid as number[][] | undefined) ?? empty().map((r, d) => r.map((_, h) => prior(p, d, h + 0.5)));
  const dow = dateIst.getUTCDay(); let best = -1, bh = -1;
  for (let h = 7; h <= 22; h++) { const at = new Date(Date.UTC(dateIst.getUTCFullYear(), dateIst.getUTCMonth(), dateIst.getUTCDate(), h, 0) - IST * 3600e3); if (at.getTime() < Date.now() + minLeadH * 3600e3) continue; if (g[dow][h] > best) { best = g[dow][h]; bh = h; } }
  return bh < 0 ? null : new Date(Date.UTC(dateIst.getUTCFullYear(), dateIst.getUTCMonth(), dateIst.getUTCDate(), bh, 0) - IST * 3600e3);
}

// ---------- Autopilot ----------
/** Fill the next N days: on each posting day without a post, schedule the next CHECKED reel at that day's best time per platform. */
export async function runAutopilot() {
  const { data: ap } = await admin.from("autopilot").select("*").eq("id", 1).single();
  if (!ap?.enabled) return { skipped: "autopilot is off" };
  const postDays: number[] = ap.post_days ?? [1, 2, 4, 5];
  const { data: reels } = await admin.from("reels").select("id,code,plan_no,reviewed,stage").eq("reviewed", true).neq("stage", "dropped").order("plan_no");
  const { data: pubs } = await admin.from("publications").select("reel_id,platform,state,scheduled_for,posted_at");
  const used = (p: string, dayKey: string) => (pubs ?? []).some((x) => x.platform === p && (x.state === "scheduled" || x.state === "posted" || x.state === "posting") && ((x.scheduled_for ?? x.posted_at) ?? "").length && new Date(new Date((x.scheduled_for ?? x.posted_at) as string).getTime() + IST * 3600e3).toISOString().slice(0, 10) === dayKey);
  const free = (r: { id: string }, p: string) => !(pubs ?? []).some((x) => x.reel_id === r.id && x.platform === p && ["scheduled", "posted", "posting"].includes(x.state));
  const made: string[] = [];
  const todayIst = new Date(Date.now() + IST * 3600e3);
  for (let i = 0; i < (ap.days_ahead ?? 7); i++) {
    const day = new Date(Date.UTC(todayIst.getUTCFullYear(), todayIst.getUTCMonth(), todayIst.getUTCDate() + i));
    if (!postDays.includes(day.getUTCDay())) continue;
    const key = day.toISOString().slice(0, 10);
    for (const p of ap.platforms as P[]) {
      if (used(p, key)) continue;
      const reel = (reels ?? []).find((r) => free(r, p)); if (!reel) continue;
      const at = await bestHourOn(p, day); if (!at) continue;
      const { error } = await admin.from("publications").upsert({ reel_id: reel.id, platform: p, state: "scheduled", scheduled_for: at.toISOString(), schedule_options: { privacy: "public" }, scheduled_by: "autopilot", last_error: null }, { onConflict: "reel_id,platform" });
      if (!error) { made.push(`${reel.code} ${p} ${key} ${at.toISOString().slice(11, 16)}Z`); (pubs ?? []).push({ reel_id: reel.id, platform: p, state: "scheduled", scheduled_for: at.toISOString(), posted_at: null }); }
    }
  }
  await admin.from("autopilot").update({ last_run: { at: new Date().toISOString(), scheduled: made } }).eq("id", 1);
  if (made.length) await admin.from("activity").insert({ actor: "autopilot", action: `autopilot scheduled ${made.length} post${made.length > 1 ? "s" : ""}`, detail: { made } });
  return { scheduled: made };
}

/** The daily job: discover peers once, scan, read audience, rebuild the model, run autopilot. */
export async function dailyTiming() {
  const { count } = await admin.from("peers").select("id", { count: "exact", head: true });
  const discovered = count ? [] : await discoverPeers().catch((e) => [`discover failed: ${e instanceof Error ? e.message : e}`]);
  const scanned = await scanPeers();
  const model = await buildModel();
  const autopilot = await runAutopilot();
  return { discovered, scanned, model, autopilot };
}
