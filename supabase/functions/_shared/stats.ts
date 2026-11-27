// Stats + health, shared by the studio function (buttons) and the job function (daily timer).
import { admin, facebookPage, FB_GRAPH, getIntegration, instagramToken, youtubeAccessToken } from "./util.ts";

const YT = "https://www.googleapis.com/youtube/v3";
const today = () => new Date().toISOString().slice(0, 10);

/** Quiet hours: no automatic stats refresh between 00:00 and 08:00 IST (owner's choice; nobody is watching, and it saves API calls).
 *  Scheduled posts are NOT affected (separate timer). The function secret STATS_QUIET="0-8" (IST hours) can change it. */
export function inQuietHours(now = new Date()) {
  const [a, b] = (Deno.env.get("STATS_QUIET") ?? "0-8").split("-").map(Number);
  const h = (now.getUTCHours() + now.getUTCMinutes() / 60 + 5.5) % 24;
  return a <= b ? h >= a && h < b : h >= a || h < b;
}

/** How often a post is re-read (keeps API use small and far from Meta's and YouTube's limits, which posting shares):
 *  first 48 h after posting: hourly · up to 7 days: every 6 h · older: daily. */
export function isDue(postedAt: string | null, statsAt: string | null, now = Date.now()) {
  if (!statsAt) return true;
  const age = now - new Date(postedAt ?? statsAt).getTime(), since = now - new Date(statsAt).getTime(), H = 3600e3;
  return since >= (age < 48 * H ? 0.9 * H : age < 7 * 24 * H ? 5.9 * H : 23.5 * H);
}

/** Views / likes / comments (+ reach, saves, shares) for posted reels, and follower counts.
 *  onlyDue: just the posts whose turn it is (the hourly timer); otherwise all (Refresh now, max once per 10 min).
 *  Writes publications.stats (latest), stats_daily (one row per day) and stats_log (every reading). */
// retention (YouTube Analytics; needs the yt-analytics.readonly scope: "Reconnect YouTube" once): average % viewed, average view time,
// and the audience-retention curve (share of viewers still watching at each 1% of the video), for format tests like the opening-verse position
async function ytRetention(tok: string, id: string, duration?: string): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  try {
    const A = "https://youtubeanalytics.googleapis.com/v2/reports", end = new Date().toISOString().slice(0, 10), base = `ids=channel==MINE&startDate=2024-01-01&endDate=${end}&filters=video==${id}`;
    const H = { headers: { Authorization: `Bearer ${tok}` } };
    const sum = await (await fetch(`${A}?${base}&metrics=views,averageViewDuration,averageViewPercentage`, H)).json();
    if (sum.error) { out.analytics_error = String(sum.error.message ?? sum.error).slice(0, 200); return out; }
    const r0 = sum.rows?.[0]; if (r0) { out.avg_view_s = r0[1]; out.avg_view_pct = r0[2]; }
    const cur = await (await fetch(`${A}?${base}&metrics=audienceWatchRatio,relativeRetentionPerformance&dimensions=elapsedVideoTimeRatio&sort=elapsedVideoTimeRatio`, H)).json();
    if (cur.rows) out.retention = cur.rows.map((r: number[]) => [r[0], Math.round(r[1] * 1000) / 1000, Math.round(r[2] * 1000) / 1000]);
    if (duration) out.duration = duration;
  } catch (e) { out.analytics_error = e instanceof Error ? e.message : String(e); }
  return out;
}

export async function refreshStats(onlyDue = false) {
  const { data: all } = await admin.from("publications").select("id,reel_id,platform,external_id,posted_at,stats_at").eq("state", "posted").not("external_id", "is", null);
  const pubs = (all ?? []).filter((p) => !onlyDue || isDue(p.posted_at, p.stats_at));
  const out: Record<string, unknown>[] = [];
  const save = async (p: { id: string; reel_id: string; platform: string }, stats: Record<string, unknown>) => {
    const num = (k: string) => (typeof stats[k] === "number" ? stats[k] as number : null);
    await admin.from("publications").update({ stats, stats_at: new Date().toISOString() }).eq("id", p.id);
    await admin.from("stats_daily").upsert({ reel_id: p.reel_id, platform: p.platform, day: today(), stats }, { onConflict: "reel_id,platform,day" });
    await admin.from("stats_log").insert({ reel_id: p.reel_id, platform: p.platform, views: num("views"), likes: num("likes"), comments: num("comments"), shares: num("shares"), saves: num("saved"), reach: num("reach") });
    out.push({ id: p.id, platform: p.platform, ...stats });
  };
  // YouTube: up to 50 videos per call (1 quota unit each call, 10,000 a day)
  const yts = pubs.filter((p) => p.platform === "youtube");
  if (yts.length) {
    try {
      const tok = await youtubeAccessToken();
      for (let i = 0; i < yts.length; i += 50) {
        const chunk = yts.slice(i, i + 50);
        const items = (await (await fetch(`${YT}/videos?part=statistics,status,contentDetails&id=${chunk.map((p) => p.external_id).join(",")}`, { headers: { Authorization: `Bearer ${tok}` } })).json()).items ?? [];
        for (const p of chunk) {
          const it = items.find((x: any) => x.id === p.external_id) ?? {}; const v = it.statistics ?? {}, st = it.status ?? {};
          await save(p, { views: +v.viewCount || 0, likes: +v.likeCount || 0, comments: +v.commentCount || 0, ...(await ytRetention(tok, p.external_id, it.contentDetails?.duration)),
            status: { privacy: st.privacyStatus, upload: st.uploadStatus, made_for_kids: st.madeForKids, self_declared_kids: st.selfDeclaredMadeForKids,
              age_restricted: it.contentDetails?.contentRating?.ytRating === "ytAgeRestricted", rejection: st.rejectionReason ?? null, license: st.license } });
        }
      }
    } catch (e) { out.push({ platform: "youtube", error: e instanceof Error ? e.message : String(e) }); }
  }
  let ig: { token: string; api_base: string } | null = null, fb: { token: string; page_id: string } | null = null;
  const fbI = await getIntegration("facebook");
  for (const p of pubs.filter((x) => x.platform !== "youtube")) {
    try {
      const stats: Record<string, unknown> = {};
      if (p.platform === "instagram") {
        if (!ig) { const t = await instagramToken(); ig = { token: t.token, api_base: t.api_base }; }
        const q = (path: string) => fetch(`${ig!.api_base}/${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(ig!.token)}`).then((r) => r.json());
        const m = await q(`${p.external_id}?fields=like_count,comments_count`);
        stats.likes = m.like_count ?? null; stats.comments = m.comments_count ?? null;
        const ins = await q(`${p.external_id}/insights?metric=views,reach,saved,shares`);
        for (const d of ins.data ?? []) stats[d.name] = d.values?.[0]?.value ?? d.total_value?.value ?? null;
        if (ins.error) stats.insights_error = String(ins.error.message ?? ins.error).slice(0, 200);
      } else if (p.platform === "facebook") {
        if (!fb) { const pg = await facebookPage(); fb = { token: pg.token, page_id: pg.page_id }; }
        const q = (path: string) => fetch(`${FB_GRAPH}/${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(fb!.token)}`).then((r) => r.json());
        const v = await q(`${p.external_id}?fields=likes.summary(true).limit(0),comments.summary(true).limit(0)`);
        if (v.error) throw new Error(v.error.message);
        stats.likes = v.likes?.summary?.total_count ?? null; stats.comments = v.comments?.summary?.total_count ?? null;
        // Meta names Reels plays differently across API versions: remember the one that works, try the others only if it stops
        const known = fbI?.views_metric as string | undefined;
        for (const m of [...(known ? [known] : []), ...["fb_reels_total_plays", "blue_reels_play_count", "total_video_views", "post_video_views"].filter((x) => x !== known)]) {
          const ins = await q(`${p.external_id}/video_insights?metric=${m}`);
          const val = ins.data?.[0]?.values?.[0]?.value;
          if (val != null) { stats.views = typeof val === "number" ? val : Number(val) || 0; if (m !== known && fbI) { fbI.views_metric = m; await admin.from("integrations").update({ data: fbI }).eq("provider", "facebook"); } break; }
          if (ins.error) stats.insights_error = String(ins.error.message ?? ins.error).slice(0, 200);
        }
        if (stats.views != null) delete stats.insights_error;
      } else continue;
      await save(p, stats);
    } catch (e) { out.push({ id: p.id, platform: p.platform, error: e instanceof Error ? e.message : String(e) }); }
  }
  // follower counts: 3 calls, once an hour at most
  const { data: ch } = await admin.from("channels").select("stats_refreshed_at").eq("platform", "youtube").maybeSingle();
  const followers = !onlyDue || !ch?.stats_refreshed_at || Date.now() - new Date(ch.stats_refreshed_at).getTime() > 55 * 60e3 ? await refreshFollowers() : null;
  if (followers) await admin.from("channels").update({ stats_refreshed_at: new Date().toISOString() }).eq("platform", "youtube");
  return { checked: pubs.length, of: (all ?? []).length, updated: out, followers };
}

/** When our Instagram followers are online, by hour (layer 2 of the app's best-time system, src/lib/bestTime.ts).
 *  Instagram answers for roughly the last 30 days, one 24-hour map per day (hours in Pacific time; the app converts to IST),
 *  and only for accounts with 100+ followers. Asked once a day (the first follower refresh of the IST day); saved as
 *  follower_daily.extra.online = { "YYYY-MM-DD": { "0": n, …, "23": n } }. Any error is saved as online_error, never thrown. */
async function onlineFollowers(t: { token: string; api_base: string; user_id: string }) {
  const { data: row } = await admin.from("follower_daily").select("extra").eq("platform", "instagram").eq("day", today()).maybeSingle();
  const prev = (row?.extra ?? {}) as Record<string, unknown>;
  if (prev.online || prev.online_error) return { online: prev.online, online_error: prev.online_error };
  try {
    const until = Math.floor(Date.now() / 1000), since = until - 29 * 86400;
    const r = await (await fetch(`${t.api_base}/${t.user_id}/insights?metric=online_followers&period=lifetime&since=${since}&until=${until}&access_token=${encodeURIComponent(t.token)}`)).json();
    if (r.error) return { online_error: String(r.error.message ?? r.error).slice(0, 200) };
    const online: Record<string, Record<string, number>> = {};
    for (const v of r.data?.[0]?.values ?? []) if (v.end_time && v.value && typeof v.value === "object" && Object.keys(v.value).length) online[String(v.end_time).slice(0, 10)] = v.value;
    return Object.keys(online).length ? { online } : { online_error: "no data yet (Instagram shares this from 100 followers)" };
  } catch (e) { return { online_error: (e instanceof Error ? e.message : String(e)).slice(0, 200) }; }
}

async function refreshFollowers() {
  const res: Record<string, number | string | null> = {};
  const save = async (platform: string, n: number | null, extra: Record<string, unknown> = {}) => {
    res[platform] = n; if (n !== null) await admin.from("follower_daily").upsert({ platform, day: today(), followers: n, extra }, { onConflict: "platform,day" });
  };
  try {
    if (await getIntegration("youtube")) {
      const tok = await youtubeAccessToken();
      const c = (await (await fetch(`${YT}/channels?part=statistics&mine=true`, { headers: { Authorization: `Bearer ${tok}` } })).json()).items?.[0]?.statistics ?? {};
      await save("youtube", c.subscriberCount != null ? +c.subscriberCount : null, { views: +c.viewCount || 0, videos: +c.videoCount || 0 });
    }
  } catch (e) { res.youtube = `error: ${e instanceof Error ? e.message : e}`; }
  try {
    const igI = await getIntegration("instagram");
    if (igI?.user_id) {
      const t = await instagramToken();
      const a = await (await fetch(`${t.api_base}/${t.user_id}?fields=followers_count,media_count&access_token=${encodeURIComponent(t.token)}`)).json();
      await save("instagram", a.followers_count ?? null, { posts: a.media_count ?? null, ...(await onlineFollowers(t)) });
    }
  } catch (e) { res.instagram = `error: ${e instanceof Error ? e.message : e}`; }
  try {
    if (await getIntegration("facebook")) {
      const pg = await facebookPage();
      const a = await (await fetch(`${FB_GRAPH}/${pg.page_id}?fields=followers_count,fan_count&access_token=${encodeURIComponent(pg.token)}`)).json();
      await save("facebook", a.followers_count ?? a.fan_count ?? null);
    }
  } catch (e) { res.facebook = `error: ${e instanceof Error ? e.message : e}`; }
  return res;
}

export type Issue = { level: "warn" | "error"; where: string; text: string; fix?: string };

/** Everything that could make a post fail or a schedule miss: connections, token expiry, failed posts, due-but-blocked schedules. */
export async function healthCheck() {
  const issues: Issue[] = [];
  const conn = "/settings#connections";
  const need = ["github", "huggingface", "google_app", "youtube", "meta_app", "instagram"];
  for (const p of need) if (!(await getIntegration(p))) issues.push({ level: "warn", where: p, text: `${p.replace("_app", " app")} is not connected`, fix: conn });
  if (await getIntegration("youtube")) {
    try { await youtubeAccessToken(); } catch (e) { issues.push({ level: "error", where: "youtube", text: `YouTube sign-in no longer works: ${e instanceof Error ? e.message : e}. Press Connect YouTube again.`, fix: conn }); }
  }
  const app = await getIntegration("meta_app"), igI = await getIntegration("instagram");
  if (app?.app_id && app?.app_secret && igI?.access_token) {
    try {
      const d = (await (await fetch(`${FB_GRAPH}/debug_token?input_token=${encodeURIComponent(igI.access_token)}&access_token=${encodeURIComponent(`${app.app_id}|${app.app_secret}`)}`)).json()).data ?? {};
      if (d.is_valid === false) issues.push({ level: "error", where: "instagram", text: "The Meta (Instagram/Facebook) login has expired or was removed. Press Connect Instagram again.", fix: conn });
      else if (d.expires_at && d.expires_at * 1000 < Date.now() + 7 * 864e5) issues.push({ level: "warn", where: "instagram", text: `The Meta login expires on ${new Date(d.expires_at * 1000).toDateString()}. Reconnect before then.`, fix: conn });
      const granted = new Set((d.scopes ?? []) as string[]);
      for (const [perm, why] of [["pages_manage_posts", "posting to the Facebook Page"], ["instagram_manage_insights", "Instagram reach/saves/shares on the Stats page"], ["read_insights", "Facebook views on the Stats page"], ["pages_manage_metadata", "Apply brand to Facebook"]])
        if (d.scopes && !granted.has(perm)) issues.push({ level: "warn", where: "meta", text: `Meta permission ${perm} is missing (needed for ${why}). Add it to the login configuration, then press Connect Instagram again.`, fix: `https://developers.facebook.com/apps/${app.app_id}/business-login/configurations/` });
    } catch { /* Meta unreachable: skip */ }
  }
  if (await getIntegration("instagram") && !(await getIntegration("facebook"))) issues.push({ level: "warn", where: "facebook", text: "The Facebook Page isn't linked yet (Settings → Connections → step 5).", fix: conn });
  const { data: failed } = await admin.from("publications").select("reel_id,platform,last_error,reels(code)").eq("state", "failed").limit(20);
  for (const f of failed ?? []) issues.push({ level: "error", where: f.platform, text: `${(f as any).reels?.code ?? "A reel"} failed on ${f.platform}${f.last_error ? `: ${String(f.last_error).slice(0, 160)}` : ""}`, fix: `/reels/${(f as any).reels?.code ?? ""}` });
  const { data: late } = await admin.from("publications").select("platform,scheduled_for,reels(code)").eq("state", "scheduled").lt("scheduled_for", new Date(Date.now() - 15 * 60e3).toISOString());
  for (const l of late ?? []) issues.push({ level: "error", where: l.platform, text: `${(l as any).reels?.code} was due on ${l.platform} at ${l.scheduled_for} but hasn't started (is the timer running?)`, fix: `/reels/${(l as any).reels?.code ?? ""}` });
  const report = { at: new Date().toISOString(), issues };
  await admin.from("channels").update({ health: report }).eq("platform", "youtube");   // one shared copy, read by the banner
  return report;
}
