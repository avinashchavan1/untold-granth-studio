import clsx from "clsx";
import { CalendarClock, CheckCircle2, Clapperboard, Clock, Flame, Hammer, Lightbulb } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, ErrorNote, Spinner, StageBadge, fmtLen } from "../components/ui";
import { useQueryClient } from "@tanstack/react-query";
import { studio, useAllFiles, useConnections, useFollowers, useMediaUrl, usePublications, useReels, useSeries } from "../lib/api";
import { KIND_LABEL, type FileRow, type Publication, type Reel } from "../lib/types";
import { doubleCandidate, weeklyOn, MAJOR, MIN_BACKLOG, occasionsOn, upcoming } from "../lib/occasions";
import { bestHour, confidence, dayName, explain, fmtHour, istDate, istParts, isTestTurn, observations, planDays, testHour, type Main, type ObsSet, type TestQueue } from "../lib/bestTime";
import calendarCfg from "../../calendar.json";
const SHOW_FEST = (calendarCfg as { festival_plan?: boolean }).festival_plan !== false;   // calendar.json → festival_plan: false hides the Festival plan

// All dates are India time. Posting days and times are suggestions from lib/bestTime.ts.
const TZ = "Asia/Kolkata";
const dayLabel = (d: Date) => d.toLocaleDateString("en-IN", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
const PRODUCTION = ["researching", "scripted", "voiced", "rendered"];
const MAIN = ["youtube", "instagram"] as const;

export default function Timeline() {
  const reels = useReels();
  const series = useSeries();
  const pubs = usePublications();
  const files = useAllFiles();
  const fol = useFollowers();
  const [allIdeas, setAllIdeas] = useState(false);

  const covers = useMemo(() => Object.fromEntries((files.data ?? []).filter((f) => f.kind === "thumbnail" && f.reel_id).map((f) => [f.reel_id!, f])), [files.data]);
  const byReel = useMemo(() => {
    const m: Record<string, Publication[]> = {};
    for (const p of pubs.data ?? []) (m[p.reel_id] ??= []).push(p);
    return m;
  }, [pubs.data]);

  if (reels.isLoading || pubs.isLoading) return <Spinner label="Loading the timeline…" />;
  if (reels.error) return <ErrorNote error={reels.error} />;
  const all = [...(reels.data ?? [])].sort((a, b) => (a.plan_no ?? 9999) - (b.plan_no ?? 9999));
  const posted = (r: Reel) => (byReel[r.id] ?? []).filter((p) => p.state === "posted" && p.posted_at);
  const firstPost = (r: Reel) => posted(r).map((p) => new Date(p.posted_at!)).sort((a, b) => +a - +b)[0];

  const live = all.filter((r) => r.stage === "published" || posted(r).length > 0).sort((a, b) => +firstPost(a) - +firstPost(b));
  const ready = all.filter((r) => (r.stage === "review" || r.stage === "approved") && !live.includes(r));
  const making = all.filter((r) => PRODUCTION.includes(r.stage));
  const ideas = all.filter((r) => r.stage === "idea");

  // suggested days (one a day; themed reels on their weekly days, calendar.json; paired reels back to back) and best times per platform
  const now = new Date();
  const obs = observations(pubs.data ?? [], all, fol.data ?? []);
  const todayN = istParts(now).day, lastDayN = live.length ? istParts(firstPost(live[live.length - 1])).day : -1;
  const eveningLeft = bestHour("instagram", todayN, obs, now) !== null;
  const firstDay = lastDayN >= todayN || !eveningLeft ? todayN + 1 : todayN;
  const fixedFor = (r: Reel) => { const sch = (byReel[r.id] ?? []).map((p) => p.scheduled_for).filter(Boolean).sort()[0]; return sch ? new Date(sch) : null; };
  const todayTags = [...weeklyOn(todayN).map((w) => w.text), ...occasionsOn(todayN).map((o) => o.name)];
  const fest = upcoming(all, todayN, 183);
  // A/B tests (series.json → experiments.<name>.post_queue): their reels go first, back to back, in the set order
  const exps = ((series.data?.[0]?.config as Record<string, unknown> | undefined)?.experiments ?? {}) as Record<string, { post_queue?: string[]; formats?: Record<string, string>; test_reels?: Record<string, string> }>;
  const tests: TestQueue[] = Object.entries(exps).filter(([, e]) => e.post_queue?.length).map(([name, e]) => ({ name, codes: e.post_queue!,
    label: (code: string) => `A/B test (${name.replace(/_/g, " ")}): ${e.test_reels?.[code] === "proof" ? "half-verse after the reveal" : e.test_reels?.[code] === "opening" ? "opening śloka" : "test reel"}, posted back to back so the numbers compare` }));
  const plan = planDays(ready, firstDay, fixedFor, tests).map((s) => {
    const dbl = doubleCandidate(s.day, s.reel, ready);
    const am = dbl ? bestHour("instagram", s.day, obs, now, 9, 11.5) : null;
    return { ...s, ig: bestHour("instagram", s.day, obs, now), yt: bestHour("youtube", s.day, obs, now), fb: bestHour("facebook", s.day, obs, now), dbl: dbl && am !== null ? { ...dbl, am } : null };
  });

  const total = all.length;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide">Timeline</h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-parchment/60">Where the series stands today and what comes next, in posting order. Dates and times are India time, one reel per posting day (calendar.json → post_days), at the suggested best time for each platform.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Live" n={live.length} tone="emerald" />
        <Stat label="Ready to post" n={ready.length} tone="amber" />
        <Stat label="In production" n={making.length} tone="violet" />
        <Stat label="Planned" n={ideas.length} tone="stone" />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10" title={`${live.length} of ${total} live`}>
        <div className="flex h-full">
          <div className="bg-emerald-500" style={{ width: `${(live.length / total) * 100}%` }} />
          <div className="bg-amber-400" style={{ width: `${(ready.length / total) * 100}%` }} />
          <div className="bg-violet-400" style={{ width: `${(making.length / total) * 100}%` }} />
        </div>
      </div>

      <ol className="relative grid gap-0 border-l-2 border-parchment-deep pl-6 dark:border-night-700 sm:ml-2">
        <Phase icon={<CheckCircle2 size={16} />} tone="emerald" title="Live" note={`${live.length} posted`} />
        {live.map((r) => <Item key={r.id} r={r} cover={covers[r.id]} when={dayLabel(firstPost(r))} pubs={byReel[r.id]} dot="emerald" />)}

        <li className="relative -ml-[33px] my-4 flex items-center gap-2">
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-night-950 shadow">Today · {dayLabel(now)}</span>
          <span className="h-px flex-1 bg-gold/60" />
        </li>
        {SHOW_FEST && (todayTags.length > 0) && <li className="-mt-2 mb-3 flex flex-wrap gap-1.5">{todayTags.map((t) => <span key={t} className="flex items-center gap-1 rounded-full bg-vermilion/10 px-2.5 py-0.5 text-xs font-semibold text-vermilion"><Flame size={12} />{t}</span>)}</li>}

        <Phase icon={<CalendarClock size={16} />} tone="amber" title="Ready to post" note="Watch it, check the citations, then post from the reel page" />
        {ready.length === 0 && <Empty>Nothing waiting. The next reel is in production.</Empty>}
        {ready.length > 0 && <AutoFill plan={plan} byReel={byReel} todayN={todayN} obs={obs} pubs={pubs.data ?? []} />}
        {ready.length > 0 && <BestTimeCard obs={obs} />}
        {plan.map((s) => <Item key={s.reel.id} r={s.reel} cover={covers[s.reel.id]} when={`Post ${dayName(s.day)}`} pubs={byReel[s.reel.id]} dot="amber" hint={!s.reel.reviewed ? "Waiting for your check" : undefined}
          best={<><BestTimes ig={s.ig} yt={s.yt} fb={s.fb} why={s.why} />{s.dbl && <div className="mt-1.5 rounded-lg border border-dashed border-amber-400 px-2 py-1 text-[11px] text-amber-900 dark:text-amber-200"><b>Optional 2nd post, {fmtHour(s.dbl.am)}:</b> {s.dbl.reel.code} {s.dbl.reel.title} also fits {s.dbl.occasion.name}. Space it from the evening post; skip it if fewer than {MIN_BACKLOG} reels are ready.</div>}</>} />)}

        <Phase icon={<Hammer size={16} />} tone="violet" title="In production" note="Being researched, voiced or rendered now" />
        {making.length === 0 && <Empty>Starting the next one from the plan.</Empty>}
        {making.map((r) => <Item key={r.id} r={r} cover={covers[r.id]} when="Being made" dot="violet" />)}

        {SHOW_FEST && <>
        <Phase icon={<Flame size={16} />} tone="amber" title="Festival plan" note="Occasions in the next 6 months and the reels that fit them (make them in time)" />
        {fest.map(({ o, day, reels: rs }) => {
          const daysTo = day - todayN, need = rs.filter((r) => r.stage === "idea" || PRODUCTION.includes(r.stage));
          return (
            <li key={o.date} className="mb-2 rounded-xl border border-parchment-deep bg-white/80 p-3 text-sm dark:border-night-700 dark:bg-night-900">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-semibold">{o.name}</span><span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">{dayName(day)}{daysTo === 0 ? " · today" : ` · in ${daysTo} days`}{o.approx ? " · date ±1 day, recheck" : ""}</span></div>
              <div className="text-xs text-ink-soft dark:text-parchment/60">{o.what}</div>
              {rs.length > 0 ? <div className="mt-1.5 flex flex-wrap gap-1.5">{rs.map((r) => <Link key={r.id} to={`/reels/${r.code}`} className="flex items-center gap-1 rounded-full border border-parchment-deep px-2 py-0.5 text-xs hover:border-gold dark:border-night-700"><span className="font-mono text-gold-deep dark:text-gold">{r.code}</span> {r.title.length > 34 ? r.title.slice(0, 33) + "…" : r.title} <StageBadge stage={r.stage} /></Link>)}</div>
                : <div className="mt-1 text-xs text-ink-soft">No matching reel yet: a general devotional day.</div>}
              {need.length > 0 && daysTo > 3 && <div className="mt-1.5 text-xs font-semibold text-vermilion">Make {need[0].code} before {dayName(day - 2)} to post it on the day.</div>}
              {o.weight >= MAJOR && rs.length >= 2 && <div className="mt-1 text-xs text-amber-900 dark:text-amber-200">Major festival: a 2nd post is OK if {rs[1].code} is ready too (morning 9–11 AM, {rs[0].code} in the evening) and {MIN_BACKLOG}+ reels are ready.</div>}
            </li>
          );
        })}
        </>}

        <Phase icon={<Lightbulb size={16} />} tone="stone" title="Coming up" note="From the plan, strongest audience pull first" />
        {(allIdeas ? ideas : ideas.slice(0, 10)).map((r, i) => <Item key={r.id} r={r} when={i === 0 && making.length === 0 ? "Next" : `#${r.plan_no ?? "–"}`} dot="stone" compact />)}
        {ideas.length > 10 && (
          <li className="py-2"><button onClick={() => setAllIdeas((v) => !v)} className="text-sm font-semibold text-gold-deep hover:underline dark:text-gold">{allIdeas ? "Show fewer" : `Show all ${ideas.length} planned reels`}</button></li>
        )}
      </ol>
      <p className="flex items-center gap-2 text-xs text-ink-soft dark:text-parchment/50"><Clapperboard size={14} /> Something wrong in a reel? Name the reel code (for example A07) in the chat and say what to change.</p>
    </div>
  );
}

const TONE = {
  emerald: "bg-emerald-500 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-400 text-amber-800 dark:text-amber-300",
  violet: "bg-violet-400 text-violet-800 dark:text-violet-300",
  stone: "bg-stone-400 text-ink-soft dark:text-parchment/60",
} as const;
type Tone = keyof typeof TONE;

const Stat = ({ label, n, tone }: { label: string; n: number; tone: Tone }) => (
  <div className="rounded-xl border border-parchment-deep bg-white/80 p-3 dark:border-night-700 dark:bg-night-900">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-parchment/60"><span className={clsx("h-2 w-2 rounded-full", TONE[tone].split(" ")[0])} />{label}</div>
    <div className="tabular mt-1 font-display text-2xl font-extrabold">{n}</div>
  </div>
);

const Phase = ({ icon, title, note, tone }: { icon: ReactNode; title: string; note: string; tone: Tone }) => (
  <li className="relative mb-2 mt-6 first:mt-0">
    <span className={clsx("absolute -left-[37px] top-0 flex h-7 w-7 items-center justify-center rounded-full text-white", TONE[tone].split(" ")[0])}>{icon}</span>
    <h2 className="font-display text-lg font-semibold tracking-wide">{title}</h2>
    <p className="text-xs text-ink-soft dark:text-parchment/60">{note}</p>
  </li>
);

const Empty = ({ children }: { children: ReactNode }) => <li className="mb-2 rounded-xl border border-dashed border-parchment-deep p-3 text-sm text-ink-soft dark:border-night-700">{children}</li>;

function Item({ r, cover, when, pubs, dot, hint, compact, best }: { r: Reel; cover?: FileRow; when: string; pubs?: Publication[]; dot: Tone; hint?: string; compact?: boolean; best?: ReactNode }) {
  const img = useMediaUrl(cover);
  return (
    <li className="relative mb-2">
      <span className={clsx("absolute -left-[31px] top-4 h-3 w-3 rounded-full ring-4 ring-parchment dark:ring-night-950", TONE[dot].split(" ")[0])} />
      <Link to={`/reels/${r.code}`} className={clsx("flex gap-3 rounded-xl border border-parchment-deep bg-white/80 hover:border-gold dark:border-night-700 dark:bg-night-900", compact ? "p-2.5" : "p-3")}>
        {!compact && (cover ? (img.data ? <img src={img.data} alt="" className="aspect-[9/16] w-14 shrink-0 self-start rounded-lg object-cover" /> : <div className="aspect-[9/16] w-14 shrink-0 animate-pulse rounded-lg bg-night-800" />) : <div className="aspect-[9/16] w-14 shrink-0 rounded-lg bg-black/5 dark:bg-white/5" />)}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={clsx("text-xs font-bold uppercase tracking-wider", TONE[dot].split(" ").slice(1).join(" "))}>{when}</span>
            {!compact && <StageBadge stage={r.stage} />}
          </div>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-2"><span className="font-mono text-xs text-gold-deep dark:text-gold">{r.code}</span><span className="font-semibold leading-snug">{r.title}</span></div>
          <div className="mt-0.5 text-xs text-ink-soft dark:text-parchment/60">{[r.kind ? KIND_LABEL[r.kind] : null, r.source_ref, r.length_s ? fmtLen(r.length_s) : null].filter(Boolean).join(" · ")}</div>
          {pubs && pubs.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {MAIN.map((p) => {
                const s = pubs.find((x) => x.platform === p)?.state;
                const ok = s === "posted";
                return <span key={p} className={clsx("rounded-full px-2 py-0.5 text-[11px] font-semibold", ok ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-black/5 text-ink-soft dark:bg-white/10 dark:text-parchment/60")}>{p === "youtube" ? "YouTube" : "Instagram"} {ok ? "✓" : "·"}</span>;
              })}
            </div>
          )}
          {best}
          {hint && <div className="mt-1.5 inline-block rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-300">{hint}</div>}
        </div>
      </Link>
    </li>
  );
}

const PLAT: Record<Main, string> = { instagram: "Instagram", youtube: "YouTube", facebook: "Facebook" };
function BestTimes({ ig, yt, fb, why }: { ig: number | null; yt: number | null; fb: number | null; why: string[] }) {
  return (
    <div className="mt-1.5 grid gap-1">
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold">
        <Clock size={13} className="text-gold-deep dark:text-gold" />
        {ig !== null && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-gold-deep dark:text-gold">Instagram {fmtHour(ig)}</span>}
        {yt !== null && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-gold-deep dark:text-gold">YouTube {fmtHour(yt)}</span>}
        {fb !== null && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-gold-deep dark:text-gold">Facebook {fmtHour(fb)}</span>}
      </div>
      {why.map((w) => <div key={w} className="text-[11px] text-ink-soft dark:text-parchment/60">• {w}</div>)}
    </div>
  );
}
function BestTimeCard({ obs }: { obs: ObsSet }) {
  const rows = (["instagram", "youtube", "facebook"] as Main[]).map((p) => ({ p, list: obs.filter((o) => o.platform === p).sort((a, b) => b.ratio - a.ratio), conf: confidence(obs, p) }));
  return (
    <li className="mb-3 rounded-xl border border-gold/50 bg-gold/5 p-3 text-sm">
      <div className="flex items-center gap-2 font-semibold"><Clock size={15} className="text-gold-deep dark:text-gold" /> How the best times are picked</div>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft dark:text-parchment/70">
        Three layers: <b>research</b> (published studies per platform, shifted to the Indian evening peak; presets/best_times.json), <b>your audience</b>
        (when your Instagram followers are online{obs.aud?.days ? `, ${obs.aud.days} days recorded` : ", recorded daily once the account has 100+ followers"}) and <b>your results</b>
        (each post's speed vs the posts around it, by weekday and hour). The more you post, the more your own data counts; every few posts Auto-fill tries a
        <b> test slot</b> so it keeps learning. Full picture on the <Link to="/stats" className="underline">Stats</Link> page.
        Categories take turns fairly (plan order, and Autopilot gives each day to the category that has waited longest); a reel with a weekly theme (calendar.json → weekly) still goes on its day.
      </p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
        {rows.map(({ p, list, conf }) => (
          <div key={p} className="rounded-lg bg-white/60 p-2 text-xs dark:bg-night-900">
            <div className="mb-1 flex items-center justify-between font-semibold"><span>{PLAT[p]} so far</span><span className="text-[11px] font-normal text-ink-soft">confidence: {conf}</span></div>
            {list.length === 0 && <div className="text-ink-soft">No stats yet.</div>}
            {list.map((o) => (
              <div key={o.code} className="flex justify-between gap-2 tabular">
                <span><span className="font-mono text-gold-deep dark:text-gold">{o.code}</span> posted {fmtHour(Math.round(o.hour * 2) / 2)}</span>
                <span className={clsx(o.ratio >= 1.2 ? "font-semibold text-emerald-700 dark:text-emerald-300" : o.ratio < 0.8 ? "text-ink-soft" : "")}>{o.metric} {o.metricName} · {o.ratio.toFixed(1)}× avg speed</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </li>
  );
}

// #5 Auto-fill: turn the suggested days into real schedules (the server's timer posts them)
function AutoFill({ plan, byReel, todayN, obs, pubs }: { plan: { reel: Reel; day: number; ig: number | null; yt: number | null; fb: number | null }[]; byReel: Record<string, Publication[]>; todayN: number; obs: ObsSet; pubs: Publication[] }) {
  const conn = useConnections();
  const qc = useQueryClient();
  const [weeks, setWeeks] = useState(2);
  const [st, setSt] = useState<{ busy?: boolean; msg?: string; errs?: string[] }>({});
  const p = conn.data?.providers ?? {};
  const on = { instagram: !!p.instagram?.connected, youtube: !!p.youtube?.connected, facebook: !!p.facebook?.connected };
  const inRange = plan.filter((x) => x.day < todayN + weeks * 7);
  const free = (r: Reel, k: string) => !(byReel[r.id] ?? []).some((q) => q.platform === k && ["posted", "posting", "scheduled"].includes(q.state));
  const todo = inRange.filter((x) => x.reel.reviewed && (["instagram", "youtube", "facebook"] as const).some((k) => on[k] && free(x.reel, k)));
  const waiting = inRange.filter((x) => !x.reel.reviewed);
  const run = async () => {
    setSt({ busy: true }); const errs: string[] = []; let n = 0;
    const added: Record<string, number> = {};
    for (const x of todo) {
      // each platform at its own time; every few posts a test slot (≥ 2 h away, where we know least) so the results layer keeps learning
      for (const k of ["instagram", "facebook", "youtube"] as Main[]) {
        if (!on[k] || !free(x.reel, k)) continue;
        const best = k === "instagram" ? x.ig : k === "youtube" ? x.yt ?? x.ig : x.fb ?? x.ig; if (best === null) continue;
        const test = isTestTurn(k, pubs, obs, added[k] ?? 0), th = test ? testHour(k, x.day, obs) : null, h = th ?? best;
        const e = explain(k, x.day, h, obs), platforms = [k];
        const slot = { kind: th !== null ? "test" : "best", hour_ist: h, best_hour_ist: best, research: +e.research.toFixed(3), audience: e.audience === null ? null : +e.audience.toFixed(3), results: +e.results.toFixed(3), weights: { audience: +e.wA.toFixed(2), results: +e.wL.toFixed(2) }, posts: e.posts, at: new Date().toISOString() };
        added[k] = (added[k] ?? 0) + 1;
        try {
          const r = await studio<{ results: Record<string, { ok: boolean; error?: string }> }>("schedule", { reel_id: x.reel.id, platforms, at: istDate(x.day, h).toISOString(), options: { privacy: "public", slot } });
          for (const [k, v] of Object.entries(r.results)) v.ok ? n++ : errs.push(`${x.reel.code} ${k}: ${v.error}`);
        } catch (e) { errs.push(`${x.reel.code}: ${(e as Error).message}`); }
      }
    }
    setSt({ msg: n ? `Scheduled ${n} post${n > 1 ? "s" : ""}. The server posts them on time, even with the app closed.` : "Nothing new to schedule.", errs });
    qc.invalidateQueries({ queryKey: ["pubs"] });
  };
  return (
    <li className="mb-3 grid gap-2 rounded-2xl border border-gold-deep/50 bg-gold-soft/40 p-4 text-sm dark:border-gold/30 dark:bg-gold/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <b className="flex items-center gap-2"><CalendarClock size={16} /> Auto-fill the calendar</b>
        <label className="flex items-center gap-2 text-xs font-semibold">Next
          <select id="autofill-weeks" value={weeks} onChange={(e) => setWeeks(+e.target.value)} className="rounded-md border border-parchment-deep bg-white/80 px-2 py-1 dark:border-night-700 dark:bg-night-950"><option value={1}>1 week</option><option value={2}>2 weeks</option><option value={4}>4 weeks</option></select></label>
      </div>
      <p>Schedules every <b>checked</b> reel below on its suggested day, each platform at its own best time (Instagram, YouTube{on.facebook ? ", Facebook" : ""}); about one post in five goes to a <b>test slot</b> so the timing keeps learning. {todo.length} reel{todo.length === 1 ? "" : "s"} ready to schedule{waiting.length ? `; ${waiting.length} waiting for your citation check (${waiting.slice(0, 5).map((x) => x.reel.code).join(", ")})` : ""}.</p>
      <div><Button variant="primary" size="sm" disabled={!todo.length || st.busy} onClick={run}><CalendarClock size={14} /> {st.busy ? "Scheduling…" : `Schedule ${todo.length} reel${todo.length === 1 ? "" : "s"}`}</Button></div>
      {st.msg && <p className="text-emerald-700 dark:text-emerald-300">{st.msg}</p>}
      {st.errs?.map((e) => <p key={e} className="text-vermilion">{e}</p>)}
    </li>
  );
}
