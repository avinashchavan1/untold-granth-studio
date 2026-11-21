import clsx from "clsx";
import { Check, ChevronDown, ChevronUp, Circle, Hand, ListOrdered, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWorkStatus, type WorkStatus } from "../lib/api";

// The live work panel: what Claude is doing, on which reel, how far along and how long is left, plus the render phases,
// the queue of reels and recent events. Collapses into a small corner pill (remembered per browser).
const STEPS = ["Research", "Script", "Voices", "Music", "Art", "Preview", "Masters", "Cover & upload"];
const KEY = "workbar-collapsed";
const readCollapsed = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };
const writeCollapsed = (v: boolean) => { try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* private mode: not remembered */ } };

const mins = (m: number | null | undefined) => {
  if (m === null || m === undefined || !isFinite(Number(m))) return null;
  const x = Math.max(1, Math.round(Number(m)));
  return x < 60 ? `${x} min` : `${Math.floor(x / 60)} h ${String(x % 60).padStart(2, "0")} min`;
};
const ago = (iso: string) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`;
};

export default function WorkBar() {
  const { data: s } = useWorkStatus();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 5000); return () => clearInterval(i); }, []);
  if (!s || s.state === "idle") return null;
  const toggle = (v: boolean) => { setCollapsed(v); writeCollapsed(v); };
  return collapsed ? <Pill s={s} onOpen={() => toggle(false)} /> : <Panel s={s} onClose={() => toggle(true)} />;
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
  const label = <span className="min-w-0 truncate">{waiting ? "Needs you" : s.reel_code ?? "Working"}{!waiting && s.task ? ` · ${s.task}` : ""}</span>;
  const nums = !waiting && <>{pct !== null && <span className="tabular shrink-0 opacity-80">{pct}%</span>}{left && <span className="shrink-0 opacity-70">· ~{left}</span>}</>;
  const tone = waiting ? "bg-amber-100 text-amber-950 dark:bg-amber-900 dark:text-amber-50" : "bg-night-900 text-parchment";
  return (
    <>
      <button onClick={onOpen} aria-label="Show what Claude is doing"
        className={clsx("flex w-full items-center gap-2 border-b px-4 py-1 text-[12px] font-semibold lg:hidden", tone, waiting ? "border-amber-300 dark:border-amber-700" : "border-gold/30")}>
        {icon(13)}{label}{nums}<ChevronDown size={14} className="ml-auto shrink-0 opacity-70" />
      </button>
      <button onClick={onOpen} aria-label="Show what Claude is doing"
        className={clsx("fixed bottom-4 right-4 z-50 hidden max-w-md items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold shadow-lg ring-1 transition hover:scale-[1.02] lg:flex", tone, waiting ? "ring-amber-300 dark:ring-amber-700" : "ring-gold/40")}>
        {icon(15)}{label}{nums}<ChevronUp size={15} className="shrink-0 opacity-70" />
      </button>
    </>
  );
}

// expanded: the full panel under the header
function Panel({ s, onClose }: { s: WorkStatus; onClose: () => void }) {
  const { waiting, stale, pct, left, queueLeft, since } = useMeta(s);
  const info = s.info ?? {};
  const elapsed = s.started_at ? mins((Date.now() - new Date(s.started_at).getTime()) / 60000) : null;
  const phases = info.phases ?? [], queue = info.queue ?? [], events = (info.events ?? []).slice(-5).reverse();
  return (
    <div role="status" aria-live="polite"
      className={clsx("border-b px-4 py-3 text-[13px] sm:px-6 lg:px-10", waiting ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" : "border-gold/40 bg-night-900 text-parchment")}>
      <div className="mx-auto max-w-7xl">
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
          <button onClick={onClose} className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold opacity-80 ring-1 ring-current/30 hover:opacity-100" aria-label="Hide the work panel">
            Hide <ChevronDown size={14} />
          </button>
        </div>

        {/* progress */}
        {!waiting && (
          <div className="mt-2.5">
            <div className="flex items-center gap-2">
              <div className="h-2 min-w-[80px] flex-1 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${Math.max(2, pct ?? 2)}%` }} />
              </div>
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
