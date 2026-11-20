import clsx from "clsx";
import { CalendarClock, CheckCircle2, Clapperboard, Hammer, Lightbulb } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ErrorNote, Spinner, StageBadge, fmtLen } from "../components/ui";
import { useAllFiles, useMediaUrl, usePublications, useReels } from "../lib/api";
import { KIND_LABEL, type FileRow, type Publication, type Reel } from "../lib/types";

// All dates are shown in India time: posts go out 7–9 PM IST, one a day.
const TZ = "Asia/Kolkata";
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
const dayLabel = (d: Date) => d.toLocaleDateString("en-IN", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const PRODUCTION = ["researching", "scripted", "voiced", "rendered"];
const MAIN = ["youtube", "instagram"] as const;

export default function Timeline() {
  const reels = useReels();
  const pubs = usePublications();
  const files = useAllFiles();
  const [allIdeas, setAllIdeas] = useState(false);

  const covers = useMemo(() => Object.fromEntries((files.data ?? []).filter((f) => f.kind === "thumbnail" && f.reel_id).map((f) => [f.reel_id!, f])), [files.data]);
  const byReel = useMemo(() => {
    const m: Record<string, Publication[]> = {};
    for (const p of pubs.data ?? []) (m[p.reel_id] ??= []).push(p);
    return m;
  }, [pubs.data]);

  if (reels.isLoading || pubs.isLoading) return <Spinner />;
  if (reels.error) return <ErrorNote error={reels.error} />;
  const all = [...(reels.data ?? [])].sort((a, b) => (a.plan_no ?? 9999) - (b.plan_no ?? 9999));
  const posted = (r: Reel) => (byReel[r.id] ?? []).filter((p) => p.state === "posted" && p.posted_at);
  const firstPost = (r: Reel) => posted(r).map((p) => new Date(p.posted_at!)).sort((a, b) => +a - +b)[0];

  const live = all.filter((r) => r.stage === "published" || posted(r).length > 0).sort((a, b) => +firstPost(a) - +firstPost(b));
  const ready = all.filter((r) => (r.stage === "review" || r.stage === "approved") && !live.includes(r));
  const making = all.filter((r) => PRODUCTION.includes(r.stage));
  const ideas = all.filter((r) => r.stage === "idea");

  // suggested slots: one a day from the first free evening
  const now = new Date();
  const today = dayKey(now);
  const lastDay = live.length ? dayKey(firstPost(live[live.length - 1])) : "";
  let slot = lastDay >= today ? addDays(now, 1) : now;
  const slots = ready.map((r) => {
    const sch = (byReel[r.id] ?? []).map((p) => p.scheduled_for).filter(Boolean).sort()[0];
    if (sch) return new Date(sch);
    const d = slot; slot = addDays(slot, 1); return d;
  });

  const total = all.length;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide">Timeline</h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-parchment/60">Where the series stands today and what comes next, in posting order. Dates are India time; one reel a day at 7–9 PM.</p>
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

        <Phase icon={<CalendarClock size={16} />} tone="amber" title="Ready to post" note="Watch it, check the citations, then post from the reel page" />
        {ready.length === 0 && <Empty>Nothing waiting. The next reel is in production.</Empty>}
        {ready.map((r, i) => <Item key={r.id} r={r} cover={covers[r.id]} when={`Post ${dayLabel(slots[i])}`} pubs={byReel[r.id]} dot="amber" hint={!r.reviewed ? "Waiting for your check" : undefined} />)}

        <Phase icon={<Hammer size={16} />} tone="violet" title="In production" note="Being researched, voiced or rendered now" />
        {making.length === 0 && <Empty>Starting the next one from the plan.</Empty>}
        {making.map((r) => <Item key={r.id} r={r} cover={covers[r.id]} when="Being made" dot="violet" />)}

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

function Item({ r, cover, when, pubs, dot, hint, compact }: { r: Reel; cover?: FileRow; when: string; pubs?: Publication[]; dot: Tone; hint?: string; compact?: boolean }) {
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
          {hint && <div className="mt-1.5 inline-block rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-300">{hint}</div>}
        </div>
      </Link>
    </li>
  );
}
