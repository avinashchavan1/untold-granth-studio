import clsx from "clsx";
import { Columns3, List, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, ErrorNote, Spinner, StageBadge, fmtLen } from "../components/ui";
import { useAllFiles, useMediaUrl, useReels } from "../lib/api";
import { KIND_LABEL, STAGES, type FileRow, type Reel, type Stage } from "../lib/types";

export default function Reels() {
  const { data, isLoading, error } = useReels();
  const files = useAllFiles();
  const covers = useMemo(() => Object.fromEntries((files.data ?? []).filter((f) => f.kind === "thumbnail" && f.reel_id).map((f) => [f.reel_id!, f])), [files.data]);
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const view = params.get("view") ?? (typeof window !== "undefined" && window.innerWidth < 640 ? "list" : "board");
  const stage = (params.get("stage") as Stage | null) ?? null;
  const rows = useMemo(() => (data ?? []).filter((r) => (!stage || r.stage === stage) && (!q || `${r.code} ${r.title} ${r.source_ref ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [data, stage, q]);
  if (isLoading) return <Spinner label="Loading reels…" />;
  if (error) return <ErrorNote error={error} />;
  const set = (k: string, v: string | null) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p, { replace: true }); };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold tracking-wide">Reels</h1>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <label className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input id="reel-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, code, book…" aria-label="Search reels"
              className="w-full rounded-xl sm:w-64 border border-parchment-deep bg-white/80 py-2 pl-9 pr-3 text-sm outline-none focus:border-gold dark:border-night-700 dark:bg-night-900" />
          </label>
          <select id="stage-filter" aria-label="Filter by stage" value={stage ?? ""} onChange={(e) => set("stage", e.target.value || null)}
            className="rounded-xl border border-parchment-deep bg-white/80 px-3 py-2 text-sm dark:border-night-700 dark:bg-night-900">
            <option value="">All stages</option>{STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <div className="flex rounded-xl border border-parchment-deep p-0.5 dark:border-night-700" role="group" aria-label="View">
            {[["board", Columns3, "Board"], ["list", List, "List"]].map(([k, Icon, l]) => {
              const I = Icon as typeof List;
              return <button key={k as string} onClick={() => set("view", k as string)} aria-pressed={view === k} className={clsx("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold", view === k ? "bg-night-800 text-parchment dark:bg-gold dark:text-night-950" : "text-ink-soft")}><I size={15} />{l as string}</button>;
            })}
          </div>
        </div>
      </div>

      {view === "board" ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2">
          <div className="flex gap-4" style={{ minWidth: "min-content" }}>
            {STAGES.filter((s) => !stage || s.key === stage).map((s) => {
              const col = rows.filter((r) => r.stage === s.key);
              return (
                <div key={s.key} className="w-72 shrink-0">
                  <div className="mb-2 flex items-center justify-between px-1"><StageBadge stage={s.key} /><span className="tabular text-sm text-ink-soft dark:text-parchment/60">{col.length}</span></div>
                  <div className="grid max-h-[70vh] gap-2 overflow-y-auto pr-1">
                    {col.slice(0, s.key === "idea" ? 40 : 200).map((r) => <ReelCard key={r.id} r={r} cover={covers[r.id]} />)}
                    {s.key === "idea" && col.length > 40 && <Link to="/plan" className="p-2 text-center text-sm font-semibold text-gold-deep dark:text-gold">+{col.length - 40} more in the plan</Link>}
                    {col.length === 0 && <div className="rounded-xl border border-dashed border-parchment-deep p-4 text-center text-xs text-ink-soft dark:border-night-700">Empty</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
        <ul className="grid gap-2 sm:hidden">{rows.map((r) => <li key={r.id}><ReelCard r={r} cover={covers[r.id]} /></li>)}</ul>
        <Card className="hidden overflow-x-auto !p-0 sm:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-ink-soft dark:text-parchment/60">
              <tr className="border-b border-parchment-deep dark:border-night-700"><th className="p-3">#</th><th className="p-3">Reel</th><th className="p-3">Type</th><th className="p-3">Source</th><th className="p-3">Length</th><th className="p-3">Stage</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-parchment-deep last:border-0 hover:bg-black/[.02] dark:border-night-800 dark:hover:bg-white/[.03]">
                  <td className="tabular p-3 text-ink-soft">{r.plan_no ?? ""}</td>
                  <td className="p-3"><Link to={`/reels/${r.code}`} className="font-semibold hover:underline"><span className="mr-2 font-mono text-xs text-gold-deep dark:text-gold">{r.code}</span>{r.title}</Link></td>
                  <td className="p-3">{r.kind ? KIND_LABEL[r.kind] : ""}</td>
                  <td className="p-3 text-ink-soft dark:text-parchment/70">{r.source_ref}</td>
                  <td className="tabular p-3">{fmtLen(r.length_s)}</td>
                  <td className="p-3"><StageBadge stage={r.stage} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        </>
      )}
    </div>
  );
}

function ReelCard({ r, cover }: { r: Reel; cover?: FileRow }) {
  const img = useMediaUrl(cover);
  return (
    <Link to={`/reels/${r.code}`} className="flex gap-3 rounded-xl border border-parchment-deep bg-white/80 p-3 hover:border-gold dark:border-night-700 dark:bg-night-900">
      {cover && (img.data ? <img src={img.data} alt="" className="aspect-[9/16] w-14 shrink-0 self-start rounded-lg object-cover" /> : <div className="aspect-[9/16] w-14 shrink-0 animate-pulse rounded-lg bg-night-800" />)}
      <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between"><span className="font-mono text-xs text-gold-deep dark:text-gold">{r.code}</span>{r.art_cost && <span className="text-xs text-ink-soft" title="New art needed">{r.art_cost}</span>}</div>
      <div className="mt-1 text-[15px] font-semibold leading-snug">{r.title}</div>
      <div className="mt-1 text-xs text-ink-soft dark:text-parchment/60">{[r.kind ? KIND_LABEL[r.kind] : null, r.source_ref].filter(Boolean).join(" · ")}</div>
      {r.stage === "review" && !r.reviewed && <div className="mt-2 rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-300">Waiting for your citation check</div>}
      </div>
    </Link>
  );
}
