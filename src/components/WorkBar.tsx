import clsx from "clsx";
import { Hand, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWorkStatus } from "../lib/api";

// A slim live bar on every page: what Claude is doing right now, which reel, which step, how far along.
export default function WorkBar() {
  const { data: s } = useWorkStatus();
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 5000); return () => clearInterval(i); }, []);
  if (!s || s.state === "idle") return null;
  const ago = Math.max(0, Math.round((Date.now() - new Date(s.updated_at).getTime()) / 1000));
  const agoTxt = ago < 60 ? `${ago}s ago` : `${Math.round(ago / 60)} min ago`;
  const stale = s.state === "working" && ago > 15 * 60;
  const waiting = s.state === "waiting";
  return (
    <div className={clsx("border-b px-4 py-2 text-[13px] sm:px-6 lg:px-10", waiting ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" : "border-gold/40 bg-night-900 text-parchment")} role="status" aria-live="polite">
      <div className="mx-auto flex max-w-7xl items-center gap-2.5">
        {waiting ? <Hand size={16} className="shrink-0" /> : <Loader2 size={16} className={clsx("shrink-0 text-gold", !stale && "animate-spin")} />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold">{waiting ? "Waiting for you:" : "Claude is working:"}</span>
            {s.reel_code && <Link to={`/reels/${s.reel_code}`} className="font-mono text-xs text-gold hover:underline">{s.reel_code}</Link>}
            <span className="min-w-0 truncate">{s.task}</span>
            {s.step && s.steps && <span className="text-xs opacity-70">· step {s.step} of {s.steps}</span>}
          </div>
          {(s.pct !== null || s.detail) && (
            <div className="mt-1 flex items-center gap-2">
              {s.pct !== null && <div className="h-1.5 min-w-[80px] flex-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${Math.max(2, Number(s.pct))}%` }} /></div>}
              {s.pct !== null && <span className="tabular w-11 shrink-0 text-right text-xs font-semibold">{Math.round(Number(s.pct))}%</span>}
            </div>
          )}
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] opacity-70">
            {s.detail && <span className="min-w-0 truncate">{s.detail}</span>}
            {s.eta_min !== null && Number(s.eta_min) > 0 && <span>about {Math.max(1, Math.round(Number(s.eta_min)))} min left</span>}
            <span>{stale ? `no update for ${agoTxt}` : `updated ${agoTxt}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
