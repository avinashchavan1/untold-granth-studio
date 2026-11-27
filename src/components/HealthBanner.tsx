import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { studio } from "../lib/api";

// #10 Connection health: anything that could make a post fail or a scheduled post miss, on every page.
// Checked by the server (studio "health": tokens, permissions, failed posts, late schedules) every 30 min while the app is open, and daily by the timer.
type Issue = { level: "warn" | "error"; where: string; text: string; fix?: string };
const KEY = "health-dismissed";
export default function HealthBanner() {
  const q = useQuery({ queryKey: ["health"], queryFn: () => studio<{ issues: Issue[]; at: string }>("health"), refetchInterval: 30 * 60e3, staleTime: 10 * 60e3, retry: false });
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => { try { return sessionStorage.getItem(KEY) ?? ""; } catch { return ""; } });
  const issues = q.data?.issues ?? [];
  const errors = issues.filter((i) => i.level === "error"), warns = issues.filter((i) => i.level === "warn");
  const sig = issues.map((i) => i.text).join("|");
  if (!issues.length || dismissed === sig) return null;
  const tone = errors.length ? "border-vermilion/40 bg-vermilion/10 text-vermilion" : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200";
  const Row = ({ i }: { i: Issue }) => (
    <li className="flex flex-wrap items-baseline gap-x-2">{i.text}{i.fix && (i.fix.startsWith("/") ? <Link to={i.fix} className="font-semibold underline">Fix</Link> : <a href={i.fix} target="_blank" rel="noreferrer" className="font-semibold underline">Fix</a>)}</li>
  );
  return (
    <div role="alert" className={`border-b px-4 py-2 text-[13px] sm:px-6 lg:px-10 ${tone}`}>
      <div className="mx-auto flex max-w-7xl items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          {errors.length > 0 && <ul className="grid gap-0.5 font-semibold">{errors.map((i) => <Row key={i.text} i={i} />)}</ul>}
          {warns.length > 0 && (
            <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 font-semibold">{warns.length} thing{warns.length > 1 ? "s" : ""} to set up <ChevronDown size={14} className={open ? "rotate-180" : ""} /></button>
          )}
          {open && <ul className="mt-1 grid gap-0.5">{warns.map((i) => <Row key={i.text} i={i} />)}</ul>}
        </div>
        <button aria-label="Hide until something changes" onClick={() => { setDismissed(sig); try { sessionStorage.setItem(KEY, sig); } catch { /* not remembered */ } }} className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"><X size={15} /></button>
      </div>
    </div>
  );
}
