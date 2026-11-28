import { Mic } from "lucide-react";
import { useWorkStatus } from "../lib/api";

// ElevenLabs characters used this month. The key lives in the cloud environment, so the studio reports the numbers
// (scripts/status.py voice-budget, run after every voice/music step) and the app shows them here.
export function VoiceBudget({ compact = false }: { compact?: boolean }) {
  const vb = useWorkStatus().data?.info?.voice_budget;
  if (!vb?.limit) return null;
  const left = Math.max(0, vb.limit - vb.used), pct = Math.min(100, Math.round((vb.used / vb.limit) * 100));
  const k = (n: number) => `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  const reset = vb.reset ? new Date(vb.reset).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null;
  const mins = Math.round((Date.now() - new Date(vb.at).getTime()) / 60000);
  const tone = pct >= 90 ? "bg-vermilion" : pct >= 70 ? "bg-amber-500" : "bg-gold";
  return (
    <div className={compact ? "text-xs" : "rounded-2xl border border-parchment-deep bg-white/60 p-4 dark:border-night-700 dark:bg-night-900/60"}>
      <div className="flex flex-wrap items-center gap-2">
        <Mic size={compact ? 14 : 16} className="text-gold-deep dark:text-gold" />
        <span className="font-semibold">Voice budget (ElevenLabs)</span>
        <span className="tabular">{k(vb.used)} of {k(vb.limit)} used · <b>{k(left)} left</b></span>
        {reset && <span className="opacity-70">· resets {reset}</span>}
        <span className="ml-auto opacity-60">{vb.tier ? `${vb.tier} · ` : ""}updated {mins < 1 ? "just now" : mins < 60 ? `${mins} min ago` : `${Math.round(mins / 60)} h ago`}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><div className={`h-full ${tone}`} style={{ width: `${pct}%` }} /></div>
      {!compact && <p className="mt-1.5 text-xs opacity-70">About 3k a reel (voices, 2 takes) and ~3k per new score. It updates whenever Claude records or composes.</p>}
    </div>
  );
}
