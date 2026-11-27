import clsx from "clsx";
import { ArrowLeft, Check, ChevronRight, Circle, Hand, ListOrdered, Loader2, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useWorkStatus, type WorkStatus } from "../lib/api";

// The live work panel: what Claude is doing, on which reel, how far along and how long is left, plus the render phases,
// the queue of reels and recent events. Every page shows a small strip/pill; tapping it opens the full view on its own page (/live).
const STEPS = ["Research", "Script", "Voices", "Music", "Art", "Preview", "Masters", "Cover & upload"];

const mins = (m: number | null | undefined) => {
  if (m === null || m === undefined || !isFinite(Number(m))) return null;
  const x = Math.max(1, Math.round(Number(m)));
  return x < 60 ? `${x} min` : `${Math.floor(x / 60)} h ${String(x % 60).padStart(2, "0")} min`;
};
const ago = (iso: string) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`;
};

const useTick = () => { const [, tick] = useState(0); useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 5000); return () => clearInterval(i); }, []); };

export default function WorkBar() {
  const { data: s } = useWorkStatus();
  const nav = useNavigate(), loc = useLocation();
  useTick();
  if (!s || s.state === "idle" || loc.pathname === "/live") return null;
  return <Pill s={s} onOpen={() => nav("/live")} />;
}

// the full live view, as its own page
export function WorkPage() {
  const { data: s, isLoading } = useWorkStatus();
  const nav = useNavigate();
  useTick();
  const back = () => (window.history.length > 1 ? nav(-1) : nav("/"));
  return (
    <div className="grid gap-4">
      <button onClick={back} className="flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink dark:text-parchment/60"><ArrowLeft size={16} /> Back</button>
      <h1 className="font-display text-2xl font-extrabold tracking-wide sm:text-3xl">Live studio</h1>
      <p className="-mt-2 text-sm text-ink-soft dark:text-parchment/60">What Claude is making right now, step by step.</p>
      {isLoading ? <div className="h-40 animate-pulse rounded-3xl bg-night-900/20" />
        : !s || s.state === "idle" ? (
          <div className="flex items-center gap-3 rounded-3xl bg-night-900 p-6 text-parchment"><Moon size={22} className="text-gold" />
            <div><div className="font-semibold">Nothing running right now.</div><div className="text-sm opacity-75">When Claude starts on reels, the live progress shows up here.</div></div></div>
        ) : <Panel s={s} />}
    </div>
  );
}

function useMeta(s: WorkStatus) {
  const since = Math.round((Date.now() - new Date(s.updated_at).getTime()) / 1000);
  const waiting = s.state === "waiting", stale = s.state === "working" && since > 15 * 60;
  const pct = s.pct === null ? null : Math.round(Number(s.pct));
  return { waiting, stale, pct, left: mins(s.eta_min), queueLeft: mins(s.info?.overall_eta_min), since };
}

// collapsed: on phones a thin one-line strip at the top (away from the thumbs); on computers a small pill in the corner
function Pill({ s, onOpen }: { s: WorkStatus; onOpen: () => void }) {
  const { waiting, stale, pct, left } = useMeta(s);
  const icon = (size: number) => waiting ? <Hand size={size} className="shrink-0" /> : <Loader2 size={size} className={clsx("shrink-0 text-gold", !stale && "animate-spin")} />;
  const b = batchOf(s);
  const label = <span className="min-w-0 truncate">{waiting ? "Needs you" : s.reel_code ?? "Working"}{!waiting && s.task ? ` · ${s.task}` : ""}{!waiting && b ? ` · reel ${b.doneN + (b.doneN < b.total ? 1 : 0)}/${b.total}` : ""}</span>;
  const nums = !waiting && <>{pct !== null && <span className="tabular shrink-0 opacity-80">{pct}%</span>}{left && <span className="shrink-0 opacity-70">· ~{left}</span>}</>;
  const tone = waiting ? "bg-amber-100 text-amber-950 dark:bg-amber-900 dark:text-amber-50" : "bg-night-900 text-parchment";
  return (
    <>
      <button onClick={onOpen} aria-label="Show what Claude is doing"
        className={clsx("flex w-full items-center gap-2 border-b px-4 py-1 text-[12px] font-semibold lg:hidden", tone, waiting ? "border-amber-300 dark:border-amber-700" : "border-gold/30")}>
        {icon(13)}{label}{nums}<ChevronRight size={14} className="ml-auto shrink-0 opacity-70" />
      </button>
      <button onClick={onOpen} aria-label="Show what Claude is doing"
        className={clsx("fixed bottom-4 right-4 z-50 hidden max-w-md items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold shadow-lg ring-1 transition hover:scale-[1.02] lg:flex", tone, waiting ? "ring-amber-300 dark:ring-amber-700" : "ring-gold/40")}>
        {icon(15)}{label}{nums}<ChevronRight size={15} className="shrink-0 opacity-70" />
      </button>
    </>
  );
}

// the full view (on /work)
function Panel({ s }: { s: WorkStatus }) {
  const { waiting, stale, pct, left, queueLeft, since } = useMeta(s);
  const info = s.info ?? {};
  const elapsed = s.started_at ? mins((Date.now() - new Date(s.started_at).getTime()) / 60000) : null;
  const phases = info.phases ?? [], queue = info.queue ?? [], events = (info.events ?? []).slice(-12).reverse();
  return (
    <div role="status" aria-live="polite"
      className={clsx("rounded-3xl px-4 py-4 text-[13px] ring-1 sm:px-6", waiting ? "ring-amber-300 bg-amber-50 text-amber-950 dark:ring-amber-800 dark:bg-amber-950 dark:text-amber-100" : "ring-gold/40 bg-night-900 text-parchment")}>
      <div>
        {/* headline */}
        <div className="flex items-start gap-2.5">
          {waiting ? <Hand size={18} className="mt-0.5 shrink-0" /> : <Loader2 size={18} className={clsx("mt-0.5 shrink-0 text-gold", !stale && "animate-spin")} />}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-semibold">{waiting ? "Waiting for you:" : "Claude is working:"}</span>
              {s.reel_code && <Link to={`/reels/${s.reel_code}`} className="font-mono text-xs text-gold hover:underline">{s.reel_code}</Link>}
              {info.title && <span className="min-w-0 truncate opacity-80">{info.title}</span>}
            </div>
            <div className="mt-0.5 text-[15px] font-semibold">{s.task}</div>
            {s.detail && <div className="mt-0.5 text-xs opacity-75">{s.detail}</div>}
          </div>
        </div>

        {/* batch: every reel of the current run, with its 8 steps */}
        {info.batch && info.reels && <Batch info={info} current={s.reel_code} />}

        {/* progress */}
        {!waiting && (
          <div className="mt-2.5">
            <div className="flex items-center gap-2">
              <Bar pct={pct} />
              {pct !== null && <span className="tabular w-11 shrink-0 text-right text-xs font-semibold">{pct}%</span>}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] opacity-75">
              {left && <span>~{left} left for this reel</span>}
              {queueLeft && queue.length > 1 && <span>~{queueLeft} for the whole queue</span>}
              {elapsed && <span>running {elapsed}</span>}
              <span>{stale ? `no update for ${Math.round(since / 60)} min (the machine may have restarted)` : `updated ${ago(s.updated_at)}`}</span>
            </div>
          </div>
        )}

        {/* steps of a reel */}
        {s.step && (
          <ol className="mt-3 flex flex-wrap gap-1.5">
            {STEPS.map((name, i) => {
              const n = i + 1, st = n < s.step! ? "done" : n === s.step ? "now" : "todo";
              return (
                <li key={name} className={clsx("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
                  st === "done" && "bg-gold/15 text-gold", st === "now" && "bg-gold text-night-900 font-semibold", st === "todo" && "opacity-50 ring-1 ring-current/25")}>
                  {st === "done" ? <Check size={11} /> : <span className="tabular">{n}</span>} {name}
                </li>
              );
            })}
          </ol>
        )}

        {/* details: render phases · queue · recent events */}
        {(phases.length > 0 || queue.length > 0 || events.length > 0) && (
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
            {phases.length > 0 && (
              <div>
                <div className="mb-1 font-semibold uppercase tracking-wider opacity-60">This reel</div>
                <ul className="space-y-0.5">
                  {phases.map((p) => (
                    <li key={p.name} className={clsx("flex items-center gap-1.5", p.state === "todo" && "opacity-50")}>
                      {p.state === "done" ? <Check size={12} className="text-gold" /> : p.state === "running" ? <Loader2 size={12} className="animate-spin text-gold" /> : <Circle size={10} />}
                      <span className="min-w-0 truncate">{p.name}{p.pct !== undefined ? ` · ${p.pct}%` : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {queue.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider opacity-60"><ListOrdered size={12} /> Queue</div>
                <ul className="space-y-0.5">
                  {queue.map((q) => (
                    <li key={q.code} className={clsx("flex items-center gap-1.5", q.state === "queued" && "opacity-60")}>
                      {q.state === "done" ? <Check size={12} className="text-gold" /> : q.state === "running" ? <Loader2 size={12} className="animate-spin text-gold" /> : <Circle size={10} />}
                      <Link to={`/reels/${q.code}`} className="font-mono text-gold hover:underline">{q.code}</Link>
                      <span className="min-w-0 truncate">{q.title}</span>
                      {q.note && <span className="ml-auto shrink-0 opacity-60">{q.note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {events.length > 0 && (
              <div>
                <div className="mb-1 font-semibold uppercase tracking-wider opacity-60">Recent</div>
                <ul className="space-y-0.5">
                  {events.map((e) => <li key={e.at + e.text} className="flex gap-1.5"><span className="shrink-0 tabular opacity-60">{ago(e.at)}</span><span className="min-w-0 truncate">{e.text}</span></li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// overall batch numbers
function batchOf(s: WorkStatus) {
  const r = s.info?.reels, b = s.info?.batch; if (!r || !b) return null;
  const codes = b.codes.filter((c) => r[c]); const doneN = codes.filter((c) => r[c].state === "done").length;
  return { codes, doneN, total: codes.length, pct: Math.round(Number(s.info?.batch_pct ?? 0)), title: b.title };
}

// progress bar: animated stripes while working; a shimmer when there is no exact percentage yet
function Bar({ pct, big = false }: { pct: number | null; big?: boolean }) {
  return (
    <div className={clsx("relative min-w-[80px] flex-1 overflow-hidden rounded-full bg-white/15 ring-1 ring-black/20", big ? "h-4" : "h-2.5")}>
      {pct === null ? <div className="progress-shimmer absolute inset-0" />
        : <div className="progress-stripes h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${Math.max(3, pct)}%` }} />}
    </div>
  );
}

function Batch({ info, current }: { info: NonNullable<WorkStatus["info"]>; current: string | null }) {
  const reels = info.reels ?? {}, codes = (info.batch?.codes ?? []).filter((c) => reels[c]);
  const doneN = codes.filter((c) => reels[c].state === "done").length, pct = Math.round(Number(info.batch_pct ?? 0));
  return (
    <div className="mt-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-xs font-black uppercase tracking-wider text-gold">{info.batch?.title}</div>
        <div className="text-xs font-semibold opacity-80"><span className="tabular">{doneN}</span> of <span className="tabular">{codes.length}</span> reels ready · <span className="tabular">{pct}%</span></div>
      </div>
      <div className="mt-2 flex items-center gap-2"><Bar pct={pct} big /></div>
      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {codes.map((c) => {
          const r = reels[c], st = r.state ?? "queued", step = r.step ?? 0, live = c === current && st === "running";
          return (
            <Link key={c} to={`/reels/${c}`} className={clsx("block rounded-xl p-2.5 ring-1 transition hover:ring-gold/60",
              st === "done" ? "bg-gold/15 ring-gold/40" : live ? "bg-white/10 ring-gold" : "bg-white/5 ring-white/10")}>
              <div className="flex items-center gap-1.5">
                {st === "done" ? <Check size={14} className="text-gold" /> : live ? <Loader2 size={14} className="animate-spin text-gold" /> : <Circle size={11} className="opacity-60" />}
                <span className="font-mono text-xs font-bold text-gold">{c}</span>
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider opacity-70">{st === "done" ? "Ready" : st === "queued" ? "Queued" : `Step ${step}/8`}</span>
              </div>
              <div className="mt-1 truncate text-[12px] font-semibold">{st === "done" ? "Ready for your review" : r.task ?? "Queued"}</div>
              <div className="mt-2 flex gap-1" aria-label={`step ${step} of 8`}>
                {STEPS.map((name, i) => { const n = i + 1, on = st === "done" || n < step, now = st !== "done" && n === step;
                  return <span key={name} title={name} className={clsx("h-1.5 flex-1 rounded-full", on ? "bg-gold" : now ? (live ? "progress-stripes bg-gold/80" : "bg-gold/50") : "bg-white/15")} />; })}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
