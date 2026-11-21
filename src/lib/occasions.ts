// Occasion calendar for the posting plan. Data lives in calendar.json at the repo root (copy a preset from presets/,
// e.g. presets/calendar-hindu.json); tithi/lunar dates can move by a day by region, so `approx: true` ones get re-checked a week before.
import type { Reel } from "./types";
import cal from "../../calendar.json";

export interface Occasion { date: string; name: string; what: string; themes: string[]; weight: number; approx?: boolean; devotional?: boolean }
interface Weekly { theme: string; days: number[]; label: string }      // days: 0 = Sunday … 6 = Saturday

export const OCCASIONS: Occasion[] = cal.occasions as Occasion[];
const WEEKLY: Weekly[] = (cal as { weekly?: Weekly[] }).weekly ?? [];
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// themes a reel carries, read from its title, plan note and hashtags
const THEME_RX: [string, RegExp][] = (cal.themes as [string, string][]).map(([k, rx]) => [k, new RegExp(rx, "i")]);
export const themesOf = (r: Reel) => { const s = `${r.title} ${r.plan_note ?? ""} ${(r.hashtags ?? []).join(" ")}`; return new Set(THEME_RX.filter(([, rx]) => rx.test(s)).map(([k]) => k)); };
export const pullOf = (r: Reel) => { const m = (r.plan_note ?? "").match(/★+/); return m ? m[0].length : 1; };   // ★★★ = strongest audience pull

export const istDayOf = (iso: string) => Math.floor(Date.parse(iso + "T00:00:00Z") / 86400000);   // a calendar date as a local day number
export const dowOf = (day: number) => (day + 4) % 7;                   // day number (days since 1970-01-01, local) → weekday
export const occasionsOn = (day: number) => OCCASIONS.filter((o) => istDayOf(o.date) === day);
// weekly days that suit a theme (e.g. a deity's weekday), with their labels
export const weeklyOn = (day: number) => WEEKLY.filter((w) => w.days.includes(dowOf(day))).map((w) => ({ ...w, text: `${DOW[dowOf(day)]}: ${w.label}` }));

// how well a reel fits a day: festivals it matches, its theme's weekly days, devotional days for strong reels
export function fit(r: Reel, day: number) {
  const th = themesOf(r), why: string[] = []; let s = 0;
  for (const w of weeklyOn(day)) if (th.has(w.theme)) { s += 3; why.push(`${DOW[dowOf(day)]} is ${w.label}`); }
  for (const o of occasionsOn(day)) {
    const hit = o.themes.filter((t) => th.has(t));
    if (hit.length) { s += o.weight; why.push(`${o.name}: ${o.what}`); }
    else if (o.devotional) { s += 0.8 * pullOf(r) / 3; why.push(`${o.name}: a big day, more people watching`); }
  }
  return { s, why };
}

// occasions in the next N days, with the reels (any stage) that fit them best
export function upcoming(reels: Reel[], fromDay: number, days = 180) {
  return OCCASIONS.filter((o) => { const d = istDayOf(o.date); return d >= fromDay && d < fromDay + days; })
    .map((o) => ({ o, day: istDayOf(o.date), reels: reels.filter((r) => r.stage !== "published" && o.themes.some((t) => themesOf(r).has(t))).sort((a, b) => pullOf(b) - pullOf(a) || (a.plan_no ?? 999) - (b.plan_no ?? 999)).slice(0, 4) }));
}

// Double-post rule: one reel a day by default. A second, optional MORNING post only when (1) the day is a major occasion
// (weight >= 5), (2) a second ready reel also matches its themes, (3) at least 5 reels are ready, (4) the morning slot hasn't passed.
export const MAJOR = 5, MIN_BACKLOG = 5;
export function doubleCandidate(day: number, primary: Reel, ready: Reel[]) {
  const os = occasionsOn(day).filter((o) => o.weight >= MAJOR);
  if (!os.length || ready.length < MIN_BACKLOG) return null;
  for (const o of os) {
    const r = ready.find((x) => x !== primary && o.themes.some((t) => themesOf(x).has(t)));
    if (r) return { reel: r, occasion: o };
  }
  return null;
}
