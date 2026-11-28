import clsx from "clsx";
import { Check, Copy, Loader2 } from "lucide-react";
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PubState, Stage } from "../lib/types";
import { STAGES } from "../lib/types";

export function Button({ variant = "default", size = "md", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "ghost" | "danger"; size?: "sm" | "md" }) {
  return (
    <button
      {...p}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "px-3 py-1.5 text-[13px] sm:px-2.5 sm:py-1" : "px-3.5 py-2.5 text-sm sm:py-2",
        variant === "primary" && "bg-night-800 text-parchment hover:bg-night-700 dark:bg-gold dark:text-night-950 dark:hover:bg-gold-soft",
        variant === "default" && "border border-parchment-deep bg-white/70 text-ink hover:bg-white dark:border-night-700 dark:bg-night-800 dark:text-parchment dark:hover:bg-night-700",
        variant === "ghost" && "text-ink-soft hover:bg-black/5 dark:text-parchment/70 dark:hover:bg-white/5",
        variant === "danger" && "border border-vermilion/40 text-vermilion hover:bg-vermilion/10",
        className,
      )}
    />
  );
}

export const LinkButton = ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={clsx("inline-flex items-center gap-1.5 rounded-lg border border-parchment-deep bg-white/70 px-3 py-1.5 text-[13px] sm:px-2.5 sm:py-1 font-semibold hover:bg-white dark:border-night-700 dark:bg-night-800 dark:hover:bg-night-700", className)}>
    {children}
  </a>
);

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <section className={clsx("rounded-2xl border border-parchment-deep bg-white/80 p-5 shadow-sm dark:border-night-700 dark:bg-night-900", className)}>{children}</section>
);

export const SectionTitle = ({ children, right }: { children: ReactNode; right?: ReactNode }) => (
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
    <h2 className="font-display text-lg font-semibold tracking-wide">{children}</h2>
    {right}
  </div>
);

const STAGE_STYLE: Record<Stage, string> = {
  idea: "bg-stone-200 text-stone-700 dark:bg-night-700 dark:text-parchment/70",
  dropped: "bg-black/10 text-ink-soft line-through dark:bg-white/10",
  researching: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  scripted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  voiced: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  rendered: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  review: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};
export const StageBadge = ({ stage }: { stage: Stage }) => (
  <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider", STAGE_STYLE[stage] ?? "bg-black/10 text-ink-soft line-through dark:bg-white/10")}>{STAGES.find((s) => s.key === stage)?.label ?? (stage === "dropped" ? "Dropped" : stage)}</span>
);

export const PubBadge = ({ state }: { state: PubState }) => (
  <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
    state === "posted" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : state === "failed" ? "bg-vermilion/15 text-vermilion" : state === "posting" ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" : state === "scheduled" ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" : state === "skipped" ? "bg-stone-200 text-stone-600" : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300")}>
    {state === "todo" ? "To post" : state}
  </span>
);

export const Code = ({ children }: { children: ReactNode }) => (
  <span className="rounded border border-gold-deep/60 px-1.5 py-px font-mono text-xs text-gold-deep dark:border-gold/50 dark:text-gold">{children}</span>
);

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button size="sm" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1600); }
      catch { window.prompt?.("Copy this text:", text); }
    }}>
      {done ? <Check size={14} /> : <Copy size={14} />} {done ? "Copied" : label}
    </Button>
  );
}

// Loader: two googly eyes looking around + a label. size "page" (default) fills the page with placeholder cards under it,
// so a refresh never shows a blank screen or misleading zeros; size "sm" is for a section inside a page.
const Eyes = ({ px }: { px: number }) => (
  <span className="loader-eyes inline-flex gap-[0.18em]" style={{ fontSize: px }} aria-hidden>
    <span className="loader-eye"><span className="loader-pupil" /></span><span className="loader-eye"><span className="loader-pupil" /></span>
  </span>
);
export const Spinner = ({ label = "Loading…", size = "page" }: { label?: string; size?: "page" | "sm" | "screen" }) => size === "screen" ? (
  <div role="status" className="flex flex-col items-center gap-4"><Eyes px={72} /><div className="flex items-center gap-2 text-sm font-semibold text-ink-soft dark:text-parchment/70"><Loader2 className="animate-spin" size={15} /> {label}</div></div>
) : size === "sm" ? (
  <div role="status" className="flex items-center gap-2.5 py-6 text-sm font-semibold text-ink-soft dark:text-parchment/70"><Eyes px={22} /> {label}</div>
) : (
  <div role="status" aria-live="polite" className="grid gap-6">
    <div className="flex min-h-[28vh] flex-col items-center justify-center gap-4">
      <Eyes px={64} />
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-soft dark:text-parchment/70"><Loader2 className="animate-spin" size={15} /> {label}</div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" style={{ animationDelay: `${i * 150}ms` }} />)}</div>
    <div className="h-48 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
  </div>
);

export const ErrorNote = ({ error }: { error: unknown }) => (
  <div className="rounded-xl border border-vermilion/40 bg-vermilion/5 p-4 text-sm text-vermilion">Couldn't load this: {error instanceof Error ? error.message : String(error)}</div>
);

export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="rounded-2xl border border-dashed border-parchment-deep p-8 text-center text-sm text-ink-soft dark:border-night-700 dark:text-parchment/60">{children}</div>
);

export const Markdown = ({ md }: { md: string }) => (
  <div className="prose-studio"><ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown></div>
);

export const fmtBytes = (b?: number | null) => (b == null ? "" : b > 1e9 ? `${(b / 1e9).toFixed(2)} GB` : b > 1e6 ? `${(b / 1e6).toFixed(0)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
export const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");
export const fmtLen = (s?: number | null) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : "—");
