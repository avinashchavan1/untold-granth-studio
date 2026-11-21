// Festival / occasion calendar for posting strategy (India). Dates checked on panchang sites in Nov 2026;
// tithi-based dates can differ by a day by region, so `approx: true` ones get re-checked a week before.
// To extend: add rows here (keep sources), or update `themes` when new reels are planned.
import type { Reel } from "./types";

export interface Occasion { date: string; name: string; what: string; themes: string[]; weight: number; approx?: boolean; devotional?: boolean }

export const OCCASIONS: Occasion[] = [
  { date: "2026-11-21", name: "Tulsi Vivah", what: "Kartika Shukla Dwadashi; a big devotional day, the wedding season begins", themes: ["devotion"], weight: 2, devotional: true },
  { date: "2026-11-24", name: "Kartik Purnima · Dev Diwali", what: "Full moon of Kartik: holy dip in the Ganga, lamps on the ghats", themes: ["devotion", "ganga", "lamps"], weight: 4, devotional: true },
  { date: "2026-12-14", name: "Vivah Panchami", what: "Anniversary of the wedding of Rama and Sita", themes: ["wedding", "swayamvara", "bow", "janaka"], weight: 5, devotional: true },
  { date: "2026-12-20", name: "Gita Jayanti", what: "Mokshada Ekadashi (some calendars 19 Dec)", themes: ["devotion"], weight: 1, approx: true, devotional: true },
  { date: "2027-01-14", name: "Makar Sankranti", what: "The sun enters Capricorn: a sun festival", themes: ["sun"], weight: 3 },
  { date: "2027-03-06", name: "Maha Shivratri", what: "Night of Shiva (some calendars 5 Mar)", themes: ["shiva", "bow"], weight: 3, approx: true, devotional: true },
  { date: "2027-04-15", name: "Ram Navami", what: "Birth of Rama (some calendars 14 Apr)", themes: ["rama-birth", "dasharatha"], weight: 6, approx: true, devotional: true },
  { date: "2027-04-20", name: "Hanuman Jayanti", what: "Birth of Hanuman (north Indian date)", themes: ["hanuman"], weight: 6, approx: true, devotional: true },
];

// themes a reel carries, read from its title, plan note and hashtags
const THEME_RX: [string, RegExp][] = [
  ["hanuman", /hanuman|maruti|anjan/i], ["sun", /\bsun\b|surya/i], ["sita", /\bsita\b|janaki|vaidehi/i],
  ["wedding", /wedding|marri|vivah|swayamvara/i], ["swayamvara", /swayamvara/i], ["bow", /\bbow\b|pinaka/i], ["janaka", /janaka/i],
  ["shiva", /shiva|rameshwar/i], ["rama-birth", /birth of rama|rama.?s birth|putrakam|ram navami|shanta|rishyashringa/i], ["dasharatha", /dasharatha|shravan/i],
  ["ayodhya", /ayodhya/i], ["ganga", /ganga|boat|kevat|guha/i], ["lamps", /diwali|lamp|deep/i], ["ravana", /ravana/i], ["rama", /\brama\b/i],
];
export const themesOf = (r: Reel) => { const s = `${r.title} ${r.plan_note ?? ""} ${(r.hashtags ?? []).join(" ")}`; return new Set(THEME_RX.filter(([, rx]) => rx.test(s)).map(([k]) => k)); };
export const pullOf = (r: Reel) => { const m = (r.plan_note ?? "").match(/★+/); return m ? m[0].length : 1; };   // ★★★ = strongest audience pull

export const istDayOf = (iso: string) => Math.floor((Date.parse(iso + "T00:00:00+05:30") + 330 * 60000) / 86400000);
export const occasionsOn = (day: number) => OCCASIONS.filter((o) => istDayOf(o.date) === day);
export const hanumanDay = (day: number) => [2, 6].includes((day + 4) % 7);   // Tuesday, Saturday

// how well a reel fits a day: festivals it matches, Hanuman's weekly days, devotional days for strong reels
export function fit(r: Reel, day: number) {
  const th = themesOf(r), why: string[] = []; let s = 0;
  if (th.has("hanuman") && hanumanDay(day)) { s += 3; why.push(`${(day + 4) % 7 === 2 ? "Tuesday" : "Saturday"} is Hanuman's day`); }
  for (const o of occasionsOn(day)) {
    const hit = o.themes.filter((t) => th.has(t));
    if (hit.length) { s += o.weight; why.push(`${o.name}: ${o.what}`); }
    else if (o.devotional) { s += 0.8 * pullOf(r) / 3; why.push(`${o.name}: a devotional day, more people watching`); }
  }
  return { s, why };
}

// festivals in the next N days, with the reels (any stage) that fit them best
export function upcoming(reels: Reel[], fromDay: number, days = 180) {
  return OCCASIONS.filter((o) => { const d = istDayOf(o.date); return d >= fromDay && d < fromDay + days; })
    .map((o) => ({ o, day: istDayOf(o.date), reels: reels.filter((r) => r.stage !== "published" && o.themes.some((t) => themesOf(r).has(t))).sort((a, b) => pullOf(b) - pullOf(a) || (a.plan_no ?? 999) - (b.plan_no ?? 999)).slice(0, 4) }));
}

// Double-post rule (owner, Nov 2026): one reel a day by default. A second, optional MORNING post only when
// (1) the day is a major festival (weight >= 5), (2) a second ready reel also matches the festival's themes,
// (3) at least 5 reels are ready (the backlog keeps daily posting going), and (4) the morning slot hasn't passed.
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
