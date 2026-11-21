// Best time to post: a suggestion, not a guarantee.
// score(slot) = audience prior (typical Indian, Hindi-speaking evening pattern for Reels / Shorts)
//             × what our own posts show (each post's speed vs the others, smoothed over nearby hours),
// with our own data weighted more as more posts come in (w = n / (n + 6)).
import type { Publication, Reel } from "./types";
import { fit, pullOf } from "./occasions";

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

// best half-hour on a given IST day (skips times already past, and anything under an hour from now); from/to limit the window
export function bestHour(p: Main, day: number, obs: Obs[], now = new Date(), from = 7, to = 22.5) {
  const n = istParts(now); let best = { h: 20, s: -1 };
  for (let h = from; h <= to; h += 0.5) { if (day === n.day && h < n.hour + 1) continue; const s = score(p, day, h, obs); if (s > best.s) best = { h, s }; }
  return best.s < 0 ? null : best.h;
}

export const confidence = (obs: Obs[], p: Main) => { const n = obs.filter((o) => o.platform === p).length; return n >= 12 ? "high" : n >= 5 ? "medium" : "low"; };

// --- 3. which day each ready reel goes out ----------------------------------
// Day by day from the first free evening, give each day the ready reel that fits it best:
// festival match (lib/occasions.ts, calendar.json) + weekly theme days + audience pull (★ in the plan), with a small pull towards plan order.
// A reel with "follows" only goes the day after its pair; scheduled posts stay where they are.
export interface Slot { reel: Reel; day: number; fixed?: Date; why: string[] }
export function planDays(queue: Reel[], firstDay: number, fixedFor: (r: Reel) => Date | null): Slot[] {
  const fixed: Slot[] = [], left: Reel[] = [], taken = new Set<number>();
  for (const r of queue) { const f = fixedFor(r); if (f) { const d = istParts(f).day; fixed.push({ reel: r, day: d, fixed: f, why: ["Scheduled"] }); taken.add(d); } else left.push(r); }
  const days: number[] = []; for (let d = firstDay; days.length < left.length; d++) if (!taken.has(d)) days.push(d);
  const order = (r: Reel) => queue.indexOf(r), n = left.length;
  // total value of posting left[perm[k]] on days[k]: festival/weekly-day fit, strong reels a little earlier, small cost for leaving plan order;
  // a reel with "follows" must sit the day right after its pair (when both are in the queue)
  const value = (perm: number[]) => {
    let v = 0; const at: Record<string, number> = {};
    perm.forEach((ri, k) => { at[left[ri].code] = days[k]; });
    for (let k = 0; k < n; k++) { const r = left[perm[k]];
      if (r.follows && at[r.follows] !== undefined && at[r.follows] !== days[k] - 1) return -1e9;
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
  return [...fixed, ...slots].sort((a, b) => a.day - b.day);
}
