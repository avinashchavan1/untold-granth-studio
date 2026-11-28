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
/** Fill the next N posting days, strictly (owner, Nov 27 2026: "good and rigid"). Rules, in order:
 *  1. ONE reel per day, and the SAME reel on every main platform (YouTube + Instagram): never two reels a day, never split.
 *  2. A/B test reels first, in the exact order of series.json → experiments.<name>.post_queue (unposted ones only).
 *  3. A reel with "follows": X goes ONLY on the day right after X's day; the day after X is kept for it.
 *  4. A reel with "post_on": "YYYY-MM-DD" (festival) goes ONLY on that date, and that date is kept for it.
 *  5. Otherwise the calendar (calendar.json, same as the Timeline): theme days (+3), festivals (+weight), ★ pull, with a pull towards plan order;
 *     a reel matching a big festival (weight >= 4) within 21 days waits for it. Only CHECKED reels (citations ticked); never longform.
 *  6. Facebook: the day's reel the same evening, plus the backlog (reels already live elsewhere, oldest first) 1 a day at 11:00 IST until caught up.
 *  7. Long-form: an approved full-length video on YouTube, Sunday 11:00 IST, at most one a week (doesn't take the reel's slot).
 *  8. Never moves, replaces or doubles anything already scheduled, posting or posted. */
const MAIN: P[] = ["youtube", "instagram"];
const istKey = (iso: string) => new Date(new Date(iso).getTime() + IST * 3600e3).toISOString().slice(0, 10);
export async function runAutopilot() {
  const { data: ap } = await admin.from("autopilot").select("*").eq("id", 1).single();
  if (!ap?.enabled) return { skipped: "autopilot is off" };
  const postDays: number[] = ap.post_days ?? [0, 1, 2, 3, 4, 5, 6];
  const platforms = ((ap.platforms ?? MAIN) as P[]);
  const mains = MAIN.filter((p) => platforms.includes(p));
  const { data: reels } = await admin.from("reels").select("id,code,title,plan_note,hashtags,plan_no,reviewed,stage,kind,source_ref,follows:script->>follows,post_on:script->>post_on").neq("stage", "dropped").order("plan_no");
  const { data: pubs } = await admin.from("publications").select("reel_id,platform,state,scheduled_for,posted_at");
  const { data: ser } = await admin.from("series").select("config").limit(1).maybeSingle();
  const all = (reels ?? []).filter((r) => r.kind !== "longform");
  const byCode = Object.fromEntries(all.map((r) => [r.code, r]));
  const live = (x: { state: string }) => ["scheduled", "posting", "posted"].includes(x.state);
  const P_ = pubs ?? [];
  const when = (r: { id: string }, p: string) => { const x = P_.find((y) => y.reel_id === r.id && y.platform === p && live(y)); return x ? istKey((x.scheduled_for ?? x.posted_at) as string) : null; };
  const isLf = (id: string) => (reels ?? []).some((r) => r.id === id && r.kind === "longform");
  const busy = (p: string, key: string) => P_.some((x) => x.platform === p && live(x) && !isLf(x.reel_id) && (x.scheduled_for ?? x.posted_at) && istKey((x.scheduled_for ?? x.posted_at) as string) === key);
  const untouched = (r: { id: string }) => mains.every((p) => !when(r, p));            // not on any main platform yet
  // rule 2: the test queue, in order
  const exps = ((ser?.config ?? {}) as { experiments?: Record<string, { post_queue?: string[] }> }).experiments ?? {};
  const testCodes = Object.values(exps).flatMap((e) => e.post_queue ?? []);
  const order = [...testCodes.map((c) => byCode[c]).filter(Boolean), ...all.filter((r) => !testCodes.includes(r.code))];
  // the same calendar as the Timeline page (calendar.json, synced into series.config.calendar): theme days and festivals
  const cal = ((ser?.config ?? {}) as { calendar?: { themes?: [string, string][]; weekly?: { theme: string; days: number[]; label: string }[]; occasions?: { date: string; name: string; themes: string[]; weight: number }[] } }).calendar ?? {};
  const RX = (cal.themes ?? []).map(([k, rx]) => [k, new RegExp(rx, "i")] as const);
  const themesOf = (r: { title?: string | null; plan_note?: string | null; hashtags?: string[] | null }) => { const t = `${r.title ?? ""} ${r.plan_note ?? ""} ${(r.hashtags ?? []).join(" ")}`; return new Set(RX.filter(([, rx]) => rx.test(t)).map(([k]) => k)); };
  const pullOf = (r: { plan_note?: string | null }) => ((r.plan_note ?? "").match(/★+/)?.[0].length ?? 1);
  const fitOn = (r: typeof all[number], key: string, dow: number) => { const th = themesOf(r); let f = 0;
    for (const w of cal.weekly ?? []) if (w.days.includes(dow) && th.has(w.theme)) f += 3;
    for (const o of cal.occasions ?? []) if (o.date === key && o.themes.some((t) => th.has(t))) f += o.weight;
    return f; };
  // a reel that matches a big festival (weight >= 4) in the next 21 days waits for that day
  const heldFor = (r: typeof all[number], key: string) => { const th = themesOf(r), d0 = Date.parse(key);
    return (cal.occasions ?? []).find((o) => o.weight >= 4 && o.themes.some((t) => th.has(t)) && Date.parse(o.date) > d0 && Date.parse(o.date) - d0 <= 21 * 864e5); };
  // opt-in fair rotation (calendar.json → "rotation": "fair"): the category (plan column → reels.source_ref) that has waited longest since its
  // last post or scheduled post gets a boost, so every category gets a fair chance; never posted = waited the longest
  const fair = (cal as { rotation?: string }).rotation === "fair";
  const catOf = (id: string) => (reels ?? []).find((r) => r.id === id)?.source_ref ?? "Other";
  const waited = (cat: string, key: string) => { const ts = P_.filter((x) => live(x) && catOf(x.reel_id) === cat && (x.scheduled_for ?? x.posted_at)).map((x) => istKey((x.scheduled_for ?? x.posted_at) as string)).filter((k) => k < key).sort();
    return ts.length ? (Date.parse(key) - Date.parse(ts[ts.length - 1])) / 864e5 : 365; };
  const made: string[] = [], notes: string[] = [];
  const todayIst = new Date(Date.now() + IST * 3600e3);
  const fixedDates = new Set(all.filter((r) => r.post_on && untouched(r)).map((r) => r.post_on as string));
  const keptFor = (key: string) => all.find((r) => r.post_on === key && untouched(r));
  for (let i = 0; i < (ap.days_ahead ?? 7); i++) {
    const day = new Date(Date.UTC(todayIst.getUTCFullYear(), todayIst.getUTCMonth(), todayIst.getUTCDate() + i));
    if (!postDays.includes(day.getUTCDay())) continue;
    const key = day.toISOString().slice(0, 10), prev = new Date(day.getTime() - 864e5).toISOString().slice(0, 10);
    // ---- main platforms: one reel, all of them ----
    if (mains.length && !mains.some((p) => busy(p, key))) {
      let pick: typeof all[number] | undefined;
      const fixed = keptFor(key);
      // rule 3: the follower of yesterday's reel, if it is checked
      const follower = all.find((r) => r.follows && untouched(r) && byCode[r.follows] && mains.some((p) => when(byCode[r.follows!], p) === prev));
      if (fixed) pick = fixed.reviewed ? fixed : undefined;
      else if (follower) { pick = follower.reviewed ? follower : undefined; if (!pick) notes.push(`${key}: kept for ${follower.code} (follows ${follower.follows}) but it isn't checked yet`); }
      else if (!fixedDates.has(key)) {
        // theme days + festivals + strong reels, with a pull towards plan/test order (same idea as the Timeline page)
        const cands = order.filter((r) => r.reviewed && untouched(r) && !r.post_on && !r.follows && r.stage !== "published");
        const testFirst = cands.find((r) => testCodes.includes(r.code));
        const scored = cands.filter((r) => !heldFor(r, key) || fitOn(r, key, day.getUTCDay()) > 0)
          .map((r, k) => ({ r, s: fitOn(r, key, day.getUTCDay()) + 0.25 * pullOf(r) - (fair ? 0.05 : 0.6) * k + (fair ? 0.5 * Math.min(waited(r.source_ref ?? "Other", key), 30) : 0) }));
        scored.sort((a, b) => b.s - a.s);
        pick = testFirst ?? scored[0]?.r;
        for (const r of cands) { const h = heldFor(r, key); if (h && r !== pick && !notes.some((n) => n.includes(r.code))) notes.push(`${r.code} held for ${h.name} (${h.date})`); }
        // a parent whose follower is checked but whose next day is taken would break the pair: skip it today
        const nextKey = new Date(day.getTime() + 864e5).toISOString().slice(0, 10);
        while (pick && all.some((f) => f.follows === pick!.code && untouched(f)) && (mains.some((p) => busy(p, nextKey)) || fixedDates.has(nextKey))) {
          const cur: typeof all[number] = pick; pick = order.find((r) => r.reviewed && untouched(r) && !r.post_on && !r.follows && r.stage !== "published" && order.indexOf(r) > order.indexOf(cur));
        }
      }
      if (pick) {
        const times = await Promise.all(mains.map((p) => bestHourOn(p, day)));
        if (times.every(Boolean)) {
          for (let k = 0; k < mains.length; k++) {
            const p = mains[k], at = times[k]!;
            const { error } = await admin.from("publications").upsert({ reel_id: pick.id, platform: p, state: "scheduled", scheduled_for: at.toISOString(), schedule_options: { privacy: "public" }, scheduled_by: "autopilot", last_error: null }, { onConflict: "reel_id,platform" });
            if (!error) { made.push(`${pick.code} ${p} ${key} ${at.toISOString().slice(11, 16)}Z`); P_.push({ reel_id: pick.id, platform: p, state: "scheduled", scheduled_for: at.toISOString(), posted_at: null }); }
          }
        }
      }
    }
    // ---- long-form (owner, Nov 27 2026): an approved full-length video goes to YouTube on Sunday at 11:00 IST (the channel's best
    //      YouTube slot in the model), at most one a week, never on top of another long-form video; it doesn't take the reel's evening slot ----
    if (platforms.includes("youtube") && day.getUTCDay() === 0) {
      const lf = (reels ?? []).filter((r) => r.kind === "longform" && r.reviewed && r.stage !== "published" && !when(r, "youtube") && (!r.post_on || r.post_on === key));   // a planned date (post_on, e.g. the 1st/3rd Sunday) is kept
      const weekHasLf = P_.some((x) => x.platform === "youtube" && live(x) && (reels ?? []).some((r) => r.kind === "longform" && r.id === x.reel_id) &&
        Math.abs(Date.parse(istKey((x.scheduled_for ?? x.posted_at) as string)) - Date.parse(key)) < 7 * 864e5);
      const at = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 11) - IST * 3600e3);
      if (lf[0] && !weekHasLf && at.getTime() > Date.now() + 30 * 60e3) {
        const { error } = await admin.from("publications").upsert({ reel_id: lf[0].id, platform: "youtube", state: "scheduled", scheduled_for: at.toISOString(), schedule_options: { privacy: "public" }, scheduled_by: "autopilot", last_error: null }, { onConflict: "reel_id,platform" });
        if (!error) { made.push(`${lf[0].code} youtube (long-form) ${key} 05:30Z`); P_.push({ reel_id: lf[0].id, platform: "youtube", state: "scheduled", scheduled_for: at.toISOString(), posted_at: null }); }
      }
    }
    // ---- Facebook: (a) the day's reel, same evening as YouTube/Instagram; (b) the backlog of reels already live elsewhere,
    //      1 a day at 11:00 IST until Facebook has caught up (owner, Nov 27 2026: "Facebook must catch up") ----
    if (platforms.includes("facebook")) {
      const fbOn = (k: string) => P_.filter((x) => x.platform === "facebook" && live(x) && (x.scheduled_for ?? x.posted_at) && istKey((x.scheduled_for ?? x.posted_at) as string) === k);
      const schedFb = async (r: { id: string; code: string }, at: Date) => {
        const { error } = await admin.from("publications").upsert({ reel_id: r.id, platform: "facebook", state: "scheduled", scheduled_for: at.toISOString(), schedule_options: { privacy: "public" }, scheduled_by: "autopilot", last_error: null }, { onConflict: "reel_id,platform" });
        if (!error) { made.push(`${r.code} facebook ${key} ${at.toISOString().slice(11, 16)}Z`); P_.push({ reel_id: r.id, platform: "facebook", state: "scheduled", scheduled_for: at.toISOString(), posted_at: null }); }
      };
      // (a) the reel YouTube/Instagram get that day
      const todays = P_.find((x) => MAIN.includes(x.platform as P) && live(x) && !isLf(x.reel_id) && (x.scheduled_for ?? x.posted_at) && istKey((x.scheduled_for ?? x.posted_at) as string) === key);
      const tr = todays && all.find((r) => r.id === todays.reel_id);
      if (tr && tr.reviewed && !when(tr, "facebook")) { const at = await bestHourOn("facebook", day); if (at) await schedFb(tr, at); }
      // (b) backlog: oldest first, reels already POSTED on YouTube or Instagram, at most 1 extra a day (owner: one is enough)
      for (const hh of [11]) {
        if (fbOn(key).length >= 2) break;
        const at = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hh) - IST * 3600e3);
        if (at.getTime() < Date.now() + 30 * 60e3) continue;
        if (fbOn(key).some((x) => Math.abs(new Date(x.scheduled_for as string).getTime() - at.getTime()) < 60 * 60e3)) continue;
        const back = all.find((r) => r.reviewed && !when(r, "facebook") && mains.some((p) => P_.some((x) => x.reel_id === r.id && x.platform === p && x.state === "posted")));
        if (back) await schedFb(back, at);
      }
    }
  }
  await admin.from("autopilot").update({ last_run: { at: new Date().toISOString(), scheduled: made, notes } }).eq("id", 1);
  if (made.length) await admin.from("activity").insert({ actor: "autopilot", action: `autopilot scheduled ${made.length} post${made.length > 1 ? "s" : ""}`, detail: { made, notes } });
  return { scheduled: made, notes };
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
