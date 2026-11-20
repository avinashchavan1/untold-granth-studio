// Best time to post: a suggestion, not a guarantee.
// score(slot) = audience prior (typical Indian, Hindi-speaking evening pattern for Reels / Shorts)
//             × what our own posts show (each post's speed vs the others, smoothed over nearby hours),
// with our own data weighted more as more posts come in (w = n / (n + 6)).
import type { Publication, Reel } from "./types";

export type Main = "instagram" | "youtube";
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

// --- 1. the audience prior (sum of bumps over the IST day) ------------------
// Weekdays: a lunch bump and a stronger evening peak; weekends: a late-morning bump too.
const bump = (h: number, at: number, w: number, a: number) => a * Math.exp(-((h - at) ** 2) / (2 * w * w));
function prior(p: Main, h: number, weekend: boolean) {
  if (h < 7 || h > 23) return 0.02;
  if (p === "instagram") return weekend
    ? bump(h, 11.5, 1.3, 0.75) + bump(h, 20.5, 1.4, 1.0) + bump(h, 15, 2, 0.3)
    : bump(h, 13, 1.0, 0.55) + bump(h, 20.5, 1.3, 1.0) + bump(h, 9, 1, 0.25);
  return weekend
    ? bump(h, 11, 1.5, 0.8) + bump(h, 19.5, 1.6, 1.0) + bump(h, 15, 2, 0.35)
    : bump(h, 13, 1.1, 0.5) + bump(h, 19.5, 1.5, 1.0) + bump(h, 9, 1, 0.2);
}

// --- 2. what our own posts show -------------------------------------------
export interface Obs { code: string; platform: Main; hour: number; ageH: number; metric: number; metricName: string; speed: number; ratio: number }
export function observations(pubs: Publication[], reels: Reel[]): Obs[] {
  const code = Object.fromEntries(reels.map((r) => [r.id, r.code]));
  const rows = pubs.filter((p) => (p.platform === "instagram" || p.platform === "youtube") && p.state === "posted" && p.posted_at && p.stats && p.stats_at)
    .map((p) => {
      const plat = p.platform as Main, s = p.stats as Record<string, number | null>;
      const metricName = plat === "youtube" ? "views" : "likes", metric = Number(s[metricName] ?? 0);
      const ageH = Math.max(0.5, (new Date(p.stats_at!).getTime() - new Date(p.posted_at!).getTime()) / 3.6e6);
      // Shorts and Reels collect most of their reach early; dividing by √age compares a 6-hour-old post with a 2-day-old one fairly
      return { code: code[p.reel_id] ?? "?", platform: plat, hour: istParts(new Date(p.posted_at!)).hour, ageH, metric, metricName, speed: metric / Math.sqrt(Math.min(ageH, 72)), ratio: 1 };
    }).filter((o) => o.metric > 0);
  for (const plat of ["instagram", "youtube"] as Main[]) {
    const mine = rows.filter((o) => o.platform === plat), mean = mine.reduce((a, o) => a + o.speed, 0) / Math.max(1, mine.length);
    mine.forEach((o) => { o.ratio = mean > 0 ? o.speed / mean : 1; });
  }
  return rows;
}
function learned(obs: Obs[], p: Main, h: number) {
  const mine = obs.filter((o) => o.platform === p); if (!mine.length) return 1;
  let ws = 0, acc = 0; for (const o of mine) { const k = Math.exp(-((h - o.hour) ** 2) / (2 * 1.5 * 1.5)); ws += k; acc += k * o.ratio; }
  const local = ws > 0 ? acc / ws : 1, near = Math.min(1, ws);       // far from any post → stay near 1
  const w = mine.length / (mine.length + 6);
  return Math.max(0.4, 1 + w * near * (local - 1));
}

export function score(p: Main, day: number, h: number, obs: Obs[]) { const dow = (day + 4) % 7; return prior(p, h, dow === 0 || dow === 6) * learned(obs, p, h); }

// best half-hour on a given IST day (skips times already past, and anything under an hour from now)
export function bestHour(p: Main, day: number, obs: Obs[], now = new Date()) {
  const n = istParts(now); let best = { h: 20, s: -1 };
  for (let h = 7; h <= 22.5; h += 0.5) { if (day === n.day && h < n.hour + 1) continue; const s = score(p, day, h, obs); if (s > best.s) best = { h, s }; }
  return best.s < 0 ? null : best.h;
}

export const confidence = (obs: Obs[], p: Main) => { const n = obs.filter((o) => o.platform === p).length; return n >= 12 ? "high" : n >= 5 ? "medium" : "low"; };

// --- 3. which day each ready reel goes out ----------------------------------
const HANUMAN_DAYS = [2, 6]; // Tuesday, Saturday
export const isHanuman = (r: Reel) => /hanuman/i.test(`${r.title} ${(r.hashtags ?? []).join(" ")}`);
export interface Slot { reel: Reel; day: number; fixed?: Date; why: string[] }
export function planDays(queue: Reel[], firstDay: number, fixedFor: (r: Reel) => Date | null): Slot[] {
  const slots: Slot[] = []; let d = firstDay;
  for (const r of queue) { const f = fixedFor(r); if (f) slots.push({ reel: r, day: istParts(f).day, fixed: f, why: ["Scheduled"] }); else slots.push({ reel: r, day: d++, why: [] }); }
  const locked = new Set<string>(); queue.forEach((r) => { if (r.follows) { locked.add(r.code); locked.add(r.follows); } });
  const free = (s: Slot) => !s.fixed && !locked.has(s.reel.code);
  for (const s of slots) {
    if (!free(s) || !isHanuman(s.reel) || HANUMAN_DAYS.includes((s.day + 4) % 7)) continue;
    const cand = slots.filter((o) => o !== s && free(o) && !isHanuman(o.reel) && HANUMAN_DAYS.includes((o.day + 4) % 7) && Math.abs(o.day - s.day) <= 3)
      .sort((a, b) => Math.abs(a.day - s.day) - Math.abs(b.day - s.day) || a.day - b.day)[0];
    if (cand) { const t = s.day; s.day = cand.day; cand.day = t; }
  }
  for (const s of slots) {
    const dow = (s.day + 4) % 7;
    if (isHanuman(s.reel) && HANUMAN_DAYS.includes(dow)) s.why.push(`${dow === 2 ? "Tuesday" : "Saturday"} is Hanuman's day: devotional interest peaks`);
    if (s.reel.follows) s.why.push(`Posts the day after ${s.reel.follows}, as its pinned comment promises`);
  }
  return slots.sort((a, b) => a.day - b.day);
}
