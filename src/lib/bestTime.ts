// Best time to post: the app decides, from three layers of evidence, and says why.
//   1. research  — what published studies say per platform (presets/best_times.json, cited, India evening-shifted)
//   2. audience  — when OUR Instagram followers are online (Instagram's online_followers, saved daily by the stats timer
//                  into follower_daily.extra.online); also used, at half weight, for Facebook
//   3. results   — how OUR posts actually did, by weekday × hour: each post's early speed (views ÷ √age, first 72 h)
//                  compared with the posts made around the same time (so channel growth doesn't favour later slots)
// score = (research^(1−wA) × audience^wA)^(1 − 0.8·share) × results, where wA grows with days of audience data (max 0.5) and the results
// factor moves away from 1 as posts come in, while the first two layers flatten (share = n / (n + 5)). Every few posts the app picks a TEST slot (≥ 2 h from the
// best, where we know least), so the results layer keeps learning instead of repeating one hour forever.
import type { Publication, Reel } from "./types";
import { fit, pullOf } from "./occasions";
import calCfg from "../../calendar.json";
import research from "../../presets/best_times.json";
// posting weekdays (0 = Sun … 6 = Sat), calendar.json → post_days; default every day
export const POST_DAYS: number[] = (calCfg as { post_days?: number[] }).post_days ?? [0, 1, 2, 3, 4, 5, 6];

export type Main = "instagram" | "youtube" | "facebook";
export const PLATFORMS: Main[] = ["instagram", "youtube", "facebook"];
const TZ = "Asia/Kolkata";
const IST_MIN = 330; // UTC+5:30

// --- helpers in India time -------------------------------------------------
export const istParts = (d: Date) => {
  const m = d.getTime() / 60000 + IST_MIN;
  const day = Math.floor(m / 1440), mins = m - day * 1440;
  return { day, hour: mins / 60, dow: (day + 4) % 7 }; // 1970-01-01 was a Thursday (dow 4)
};
export const istDate = (day: number, hour: number) => new Date(((day * 1440) + hour * 60 - IST_MIN) * 60000);
export const fmtHour = (h: number) => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60), ap = hh >= 12 ? "PM" : "AM", h12 = ((hh + 11) % 12) + 1; return `${h12}:${String(mm).padStart(2, "0")} ${ap}`; };
export const dayName = (day: number) => istDate(day, 12).toLocaleDateString("en-IN", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- 1. research prior (presets/best_times.json) ---------------------------
type Bump = { at: number; w: number; h: number };
interface Plat { label: string; weekday: Bump[]; weekend: Bump[]; day_weight: number[]; summary: string; sources: { name: string; url: string; finding: string }[] }
export const RESEARCH = research as unknown as { updated: string; audience: string; platforms: Record<Main, Plat> };
const bump = (h: number, b: Bump) => b.h * Math.exp(-((h - b.at) ** 2) / (2 * b.w * b.w));
export function prior(p: Main, dow: number, h: number) {
  if (h < 7 || h > 23) return 0.02;
  const P = RESEARCH.platforms[p], bs = dow === 0 || dow === 6 ? P.weekend : P.weekday;
  return Math.max(0.02, bs.reduce((a, b) => a + bump(h, b), 0) * (P.day_weight[dow] ?? 1));
}

// --- 2. when our audience is online (Instagram online_followers) ----------
// The stats timer saves Instagram's answer as follower_daily.extra.online = { "YYYY-MM-DD": { "0": n, …, "23": n } }.
// Instagram reports these hours in Pacific time; we convert each to IST.
export interface Audience { days: number; curve: number[][] }   // curve[dow][halfHour 0..47], peak = 1
const ptOffsetMin = (date: string) => {   // Pacific UTC offset on that date (handles summer time)
  const d = new Date(`${date}T12:00:00Z`), loc = new Date(d.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return Math.round((loc.getTime() - new Date(d.toLocaleString("en-US", { timeZone: "UTC" })).getTime()) / 60000);
};
export function audience(rows: { platform: string; extra: Record<string, unknown> | null }[]): Audience {
  const byDate: Record<string, Record<string, number>> = {};
  for (const r of rows) if (r.platform === "instagram" && r.extra && typeof r.extra.online === "object" && r.extra.online) Object.assign(byDate, r.extra.online as Record<string, Record<string, number>>);
  const sum = [...Array(7)].map(() => new Array(48).fill(0)), cnt = new Array(7).fill(0), all = new Array(48).fill(0);
  const dates = Object.keys(byDate).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  for (const date of dates) {
    const off = ptOffsetMin(date), vals = byDate[date]; let any = false;
    for (const [k, v] of Object.entries(vals)) {
      const n = Number(v); if (!isFinite(n)) continue; any = true;
      const t = new Date(`${date}T00:00:00Z`).getTime() + (Number(k) * 60 - off) * 60000, ist = istParts(new Date(t));
      const hh = Math.floor(ist.hour * 2) % 48;
      sum[ist.dow][hh] += n; sum[ist.dow][(hh + 1) % 48] += n; all[hh] += n; all[(hh + 1) % 48] += n;
    }
    if (any) cnt[istParts(new Date(`${date}T12:00:00Z`)).dow]++;
  }
  const norm = (a: number[]) => { const m = Math.max(...a); return m > 0 ? a.map((x) => Math.max(0.05, x / m)) : a.map(() => 1); };
  const allN = norm(all);
  // a weekday with fewer than 2 days of data borrows the all-days shape
  return { days: dates.length, curve: sum.map((a, d) => (cnt[d] >= 2 ? norm(a).map((x, i) => 0.6 * x + 0.4 * allN[i]) : allN)) };
}
const AUD_MAX: Record<Main, number> = { instagram: 0.5, facebook: 0.25, youtube: 0 };
export const audienceWeight = (p: Main, a?: Audience) => (a && a.days ? AUD_MAX[p] * a.days / (a.days + 5) : 0);
const audAt = (a: Audience, dow: number, h: number) => a.curve[dow][Math.max(0, Math.min(47, Math.round(h * 2)))];

// --- 3. what our own posts show --------------------------------------------
export interface Obs { code: string; platform: Main; day: number; dow: number; hour: number; ageH: number; metric: number; metricName: string; speed: number; ratio: number; test: boolean }
// observations travel with the audience curve, so every existing call site gets both: bestHour(p, day, obs)
export type ObsSet = Obs[] & { aud?: Audience };
export function observations(pubs: Publication[], reels: Reel[], followers: { platform: string; extra: Record<string, unknown> | null }[] = []): ObsSet {
  const code = Object.fromEntries(reels.map((r) => [r.id, r.code]));
  const rows: Obs[] = pubs.filter((p) => PLATFORMS.includes(p.platform as Main) && p.state === "posted" && p.posted_at && p.stats && p.stats_at)
    .map((p) => {
      const plat = p.platform as Main, s = p.stats as Record<string, number | null>;
      const metricName = s.views != null && Number(s.views) > 0 ? "views" : "likes", metric = Number(s[metricName] ?? 0);
      const ageH = Math.max(0.5, (new Date(p.stats_at!).getTime() - new Date(p.posted_at!).getTime()) / 3.6e6), ip = istParts(new Date(p.posted_at!));
      const opt = (p as { schedule_options?: { slot?: { kind?: string } } }).schedule_options;
      // Shorts and Reels collect most of their reach early; dividing by √age compares a 6-hour-old post with a 2-day-old one fairly
      return { code: code[p.reel_id] ?? "?", platform: plat, day: ip.day, dow: ip.dow, hour: ip.hour, ageH, metric, metricName, speed: metric / Math.sqrt(Math.min(ageH, 72)), ratio: 1, test: opt?.slot?.kind === "test" };
    }).filter((o) => o.metric > 0);
  for (const plat of PLATFORMS) {
    const mine = rows.filter((o) => o.platform === plat).sort((a, b) => a.day - b.day);
    // compare each post with up to 8 posts made nearest in time (its own "era"), so a growing channel doesn't bias the hours
    mine.forEach((o) => {
      const near = [...mine].sort((a, b) => Math.abs(a.day - o.day) - Math.abs(b.day - o.day)).slice(0, 8).map((x) => x.speed).sort((a, b) => a - b);
      const med = near.length ? near[Math.floor(near.length / 2)] : 0;
      o.ratio = med > 0 ? Math.max(0.2, Math.min(5, o.speed / med)) : 1;
    });
    // centre on the platform's own average (geometric), so "above 1" means better than our usual post
    const g = Math.exp(mine.reduce((a, o) => a + Math.log(o.ratio), 0) / Math.max(1, mine.length));
    mine.forEach((o) => { o.ratio = Math.max(0.2, Math.min(5, o.ratio / g)); });
  }
  const out = rows as ObsSet; out.aud = audience(followers); return out;
}
const dayK = (a: number, b: number) => (a === b ? 1 : (a === 0 || a === 6) === (b === 0 || b === 6) ? 0.6 : 0.35);
function evidence(obs: Obs[], p: Main, dow: number, h: number) {
  const mine = obs.filter((o) => o.platform === p); let ws = 0, acc = 0;
  for (const o of mine) { const k = Math.exp(-((h - o.hour) ** 2) / (2 * 1.0 * 1.0)) * dayK(dow, o.dow); ws += k; acc += k * Math.log(o.ratio); }
  return { n: mine.length, mass: ws, local: ws > 0 ? Math.exp(acc / ws) : 1 };   // geometric mean of the nearby posts' ratios
}
// how much our own results count overall: 0 with no posts, ½ at 5 posts, ⅔ at 10 …
export const dataShare = (n: number) => n / (n + 5);
function learned(obs: Obs[], p: Main, dow: number, h: number) {
  const e = evidence(obs, p, dow, h); if (!e.n) return 1;
  const near = Math.min(1, e.mass);   // far from any post → stay near 1
  return Math.max(0.3, Math.min(3, Math.pow(e.local, dataShare(e.n) * near)));
}

// --- 4. similar channels (server: supabase/functions/_shared/timing.ts → timing_model) ----------------------
// Every morning the server studies similar channels' real posts (YouTube Data API, Instagram Business Discovery) and stores a
// weekday × hour grid per platform (mean 1) with its weight (grows with the number of posts studied). Loaded once by the app shell.
type PeerLayer = { grid: number[][]; w: number; posts: number; channels: number };
let PEERS: Partial<Record<Main, PeerLayer>> = {};
export function setPeerLayer(models: { platform: string; grid: number[][]; parts: { peers?: { weight?: number; posts?: number; channels?: number } } }[]) {
  PEERS = Object.fromEntries(models.filter((m) => m.parts?.peers?.posts).map((m) => [m.platform, { grid: m.grid, w: m.parts.peers!.weight ?? 0, posts: m.parts.peers!.posts ?? 0, channels: m.parts.peers!.channels ?? 0 }]));
}
const peerAt = (p: Main, dow: number, h: number) => { const L = PEERS[p]; if (!L) return 1; const a = Math.floor(h) % 24, b = (a + 1) % 24, f = h - Math.floor(h); return Math.max(0.05, L.grid[dow][a] * (1 - f) + L.grid[dow][b] * f); };
export const peerInfo = (p: Main) => PEERS[p] ?? null;

// --- the decision ------------------------------------------------------------
// as our own posts come in, the research+audience curve flattens (power 1 − 0.8·share) so our results can overrule it
export function score(p: Main, day: number, h: number, obs: ObsSet) {
  const dow = (day + 4) % 7, a = obs.aud, wA = audienceWeight(p, a), g = dataShare(obs.filter((o) => o.platform === p).length);
  const base = wA > 0 ? Math.pow(prior(p, dow, h), 1 - wA) * Math.pow(audAt(a!, dow, h), wA) : prior(p, dow, h);
  const wP = (PEERS[p]?.w ?? 0) * (1 - 0.6 * g);      // similar channels count less as our own results grow
  return Math.pow(base, 1 - 0.8 * g) * Math.pow(peerAt(p, dow, h), wP) * learned(obs, p, dow, h);
}
// why a slot scored what it did: the three layers and how much each counted
export function explain(p: Main, day: number, h: number, obs: ObsSet) {
  const dow = (day + 4) % 7, a = obs.aud, wA = audienceWeight(p, a), e = evidence(obs, p, dow, h), wL = e.n ? 0.8 * dataShare(e.n) : 0;
  const g = dataShare(obs.filter((o) => o.platform === p).length), wP = (PEERS[p]?.w ?? 0) * (1 - 0.6 * g);
  return { research: prior(p, dow, h), audience: wA > 0 ? audAt(a!, dow, h) : null, results: learned(obs, p, dow, h), peers: wP > 0 ? peerAt(p, dow, h) : null, wP, peerPosts: PEERS[p]?.posts ?? 0, wA, wL, posts: e.n, audienceDays: a?.days ?? 0 };
}

// best half-hour on a given IST day (skips times already past, and anything under an hour from now); from/to limit the window
export function bestHour(p: Main, day: number, obs: ObsSet, now = new Date(), from = 7, to = 22.5) {
  const n = istParts(now); let best = { h: 20, s: -1 };
  for (let h = from; h <= to; h += 0.5) { if (day === n.day && h < n.hour + 1) continue; const s = score(p, day, h, obs); if (s > best.s) best = { h, s }; }
  return best.s < 0 ? null : best.h;
}
// a TEST slot: at least 2 h from the best, still a decent time (≥ 45% of the best score), where our own posts tell us least
export function testHour(p: Main, day: number, obs: ObsSet, now = new Date(), from = 8, to = 22.5) {
  const b = bestHour(p, day, obs, now, from, to); if (b === null) return null;
  const top = score(p, day, b, obs), n = istParts(now), dow = (day + 4) % 7; let best = { h: -1, s: -1 };
  for (let h = from; h <= to; h += 0.5) {
    if (Math.abs(h - b) < 2 || (day === n.day && h < n.hour + 1)) continue;
    const s = score(p, day, h, obs); if (s < 0.45 * top) continue;
    const ucb = s * (1 + 0.8 * (1 - Math.min(1, evidence(obs, p, dow, h).mass)));   // optimism where we haven't looked
    if (ucb > best.s) best = { h, s: ucb };
  }
  return best.h < 0 ? null : best.h;
}
// explore every 5th post while we know little, every 8th once confidence is high
export function isTestTurn(p: Main, pubs: Publication[], obs: ObsSet, k = 0) {
  const done = pubs.filter((x) => x.platform === p && ["posted", "posting", "scheduled"].includes(x.state)).length + k;
  return done > 0 && done % (confidence(obs, p) === "high" ? 8 : 5) === 4;
}

export const confidence = (obs: ObsSet, p: Main) => {
  const n = obs.filter((o) => o.platform === p).length, a = (obs.aud?.days ?? 0) >= 14 && p !== "youtube" ? 3 : 0;
  return n + a >= 12 ? "high" : n + a >= 5 ? "medium" : "low";
};
// a 7 × 32 grid (Sun..Sat × 7:00..22:30 IST), each row scaled to the week's best slot, for the Stats heatmap
export function heat(p: Main, obs: ObsSet, weekStartDay: number) {
  const rows = [...Array(7)].map((_, i) => { const day = weekStartDay + i, dow = (day + 4) % 7; return { dow, day, v: [...Array(32)].map((__, k) => score(p, day, 7 + k * 0.5, obs)) }; }).sort((a, b) => a.dow - b.dow);
  const m = Math.max(...rows.flatMap((r) => r.v)); return rows.map((r) => ({ ...r, v: r.v.map((x) => (m > 0 ? x / m : 0)) }));
}

// --- 3. which day each ready reel goes out ----------------------------------
// Day by day from the first free evening, give each day the ready reel that fits it best:
// festival match (lib/occasions.ts, calendar.json) + weekly theme days + audience pull (★ in the plan), with a small pull towards plan order.
// A reel with "follows" only goes the day after its pair; scheduled posts stay where they are.
export interface Slot { reel: Reel; day: number; fixed?: Date; why: string[] }
// tests: series.json → experiments.<name>.post_queue lists reels that go first, one a day, in that exact order (A/B tests need them
// back to back so their numbers are comparable); they skip the scoring below.
export interface TestQueue { name: string; codes: string[]; label: (code: string) => string }
export function planDays(queue: Reel[], firstDay: number, fixedFor: (r: Reel) => Date | null, tests: TestQueue[] = []): Slot[] {
  const fixed: Slot[] = [], left: Reel[] = [], taken = new Set<number>();
  for (const r of queue) { const f = fixedFor(r); if (f) { const d = istParts(f).day; fixed.push({ reel: r, day: d, fixed: f, why: ["Scheduled"] }); taken.add(d); } else left.push(r); }
  const testSlots: Slot[] = []; let td = firstDay;
  for (const tq of tests) for (const code of tq.codes) {
    const i = left.findIndex((r) => r.code === code); if (i < 0) continue;
    while (taken.has(td) || !POST_DAYS.includes((td + 4) % 7)) td++;
    testSlots.push({ reel: left[i], day: td, why: [tq.label(code)] }); taken.add(td); left.splice(i, 1);
  }
  const days: number[] = []; for (let d = firstDay; days.length < left.length; d++) if (!taken.has(d) && POST_DAYS.includes((d + 4) % 7)) days.push(d);   // calendar.json → post_days
  const order = (r: Reel) => queue.indexOf(r), n = left.length;
  // total value of posting left[perm[k]] on days[k]: festival/weekly-day fit, strong reels a little earlier, small cost for leaving plan order;
  // a reel with "follows" must sit the day right after its pair (when both are in the queue)
  const value = (perm: number[]) => {
    let v = 0; const at: Record<string, number> = {};
    perm.forEach((ri, k) => { at[left[ri].code] = days[k]; });
    for (let k = 0; k < n; k++) { const r = left[perm[k]];
      if (r.follows && at[r.follows] !== undefined && days.indexOf(at[r.follows]) !== k - 1) return -1e9;   // paired reels on consecutive posting days
      const wk = [0, 6].includes((days[k] + 4) % 7) ? 0.45 * pullOf(r) : 0;   // weekends: the biggest audience, give it the strongest reels
      v += fit(r, days[k]).s + wk + 0.25 * pullOf(r) * (n - k) / n - 0.15 * Math.abs(k - order(r)); }
    return v;
  };
  let best: number[] = left.map((_, i) => i);
  if (n <= 8) {          // try every order (8! = 40320): small and exact
    let bv = -Infinity; const cur: number[] = [], used = new Array(n).fill(false);
    const rec = () => { if (cur.length === n) { const v = value(cur); if (v > bv) { bv = v; best = [...cur]; } return; }
      for (let i = 0; i < n; i++) if (!used[i]) { used[i] = true; cur.push(i); rec(); cur.pop(); used[i] = false; } };
    rec();
  } else {               // bigger queues: best single swaps until nothing improves
    let improved = true; while (improved) { improved = false; const v0 = value(best);
      for (let a = 0; a < n && !improved; a++) for (let b = a + 1; b < n && !improved; b++) { const t = [...best]; [t[a], t[b]] = [t[b], t[a]]; if (value(t) > v0 + 1e-9) { best = t; improved = true; } } }
  }
  const slots: Slot[] = best.map((ri, k) => { const r = left[ri], f = fit(r, days[k]), why = [...f.why];
    if (r.follows) why.push(`Posts the day after ${r.follows}, as its pinned comment promises`);
    if ((days[k] + 4) % 7 === 0 && pullOf(r) >= 3) why.push("Sunday: the biggest audience of the week, for a ★★★ reel");
    if (!why.length && pullOf(r) >= 3) why.push("Strong pull (★★★): everyone knows the popular version");
    return { reel: r, day: days[k], why }; });
  return [...fixed, ...testSlots, ...slots].sort((a, b) => a.day - b.day);
}
