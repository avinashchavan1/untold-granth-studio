import { Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, ErrorNote, SectionTitle, Spinner, StageBadge } from "../components/ui";
import { useAddReel, useDroppedReels, useReels } from "../lib/api";
import { KIND_LABEL } from "../lib/types";
import { SERIES_ID } from "../lib/channel";

export default function Plan() {
  const { data, isLoading, error } = useReels();
  const dropped = useDroppedReels();
  const add = useAddReel();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", kind: "myth_buster", source_ref: "", plan_note: "" });
  if (isLoading) return <Spinner />;
  if (error) return <ErrorNote error={error} />;
  const reels = data ?? [];
  const nextNo = Math.max(0, ...reels.map((r) => r.plan_no ?? 0)) + 1;
  const nextCode = "A" + String(Math.max(0, ...[...reels, ...(dropped.data ?? [])].map((r) => parseInt(r.code.slice(1)) || 0)) + 1).padStart(2, "0");   // dropped codes stay taken
  const done = reels.filter((r) => r.stage === "published").length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-wide">The plan</h1>
          <p className="mt-1 text-sm text-ink-soft dark:text-parchment/60">{reels.length} reels planned · {done} published. Order is the publishing order: myth-busters first, then reveals.</p>
        </div>
        <Button variant="primary" onClick={() => setOpen((o) => !o)}><Plus size={16} /> Add an idea</Button>
      </div>

      {open && (
        <Card>
          <SectionTitle>New reel idea · {nextCode}</SectionTitle>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); await add.mutateAsync({ series_id: SERIES_ID, code: nextCode, plan_no: nextNo, title: f.title, kind: f.kind, source_ref: f.source_ref, plan_note: f.plan_note }); setOpen(false); setF({ title: "", kind: "myth_buster", source_ref: "", plan_note: "" }); }}>
            <label className="grid gap-1 text-sm font-semibold md:col-span-2">Working title<input id="idea-title" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="rounded-xl border border-parchment-deep bg-white/80 px-3 py-2 font-normal dark:border-night-700 dark:bg-night-950" /></label>
            <label className="grid gap-1 text-sm font-semibold">Type<select id="idea-kind" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className="rounded-xl border border-parchment-deep bg-white/80 px-3 py-2 font-normal dark:border-night-700 dark:bg-night-950">{Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-semibold">Where in the text<input id="idea-src" value={f.source_ref} onChange={(e) => setF({ ...f, source_ref: e.target.value })} placeholder="e.g. Sundara · 36" className="rounded-xl border border-parchment-deep bg-white/80 px-3 py-2 font-normal dark:border-night-700 dark:bg-night-950" /></label>
            <label className="grid gap-1 text-sm font-semibold md:col-span-2">Notes<textarea id="idea-note" value={f.plan_note} onChange={(e) => setF({ ...f, plan_note: e.target.value })} rows={3} className="rounded-xl border border-parchment-deep bg-white/80 px-3 py-2 font-normal dark:border-night-700 dark:bg-night-950" /></label>
            <div className="md:col-span-2"><Button type="submit" variant="primary" disabled={add.isPending}>{add.isPending ? "Adding…" : "Add to the plan"}</Button>{add.error && <span className="ml-3 text-sm text-vermilion">{(add.error as Error).message}</span>}</div>
          </form>
        </Card>
      )}

      <ol className="grid gap-2">
        {reels.map((r) => (
          <li key={r.id}>
            <Link to={`/reels/${r.code}`} className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-3 rounded-xl border border-parchment-deep bg-white/70 p-3 hover:border-gold sm:grid-cols-[3rem_minmax(0,1fr)_auto] dark:border-night-700 dark:bg-night-900">
              <span className="tabular pt-0.5 text-right font-mono text-sm text-ink-soft">{r.plan_no ?? "–"}</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline gap-2"><span className="font-mono text-xs text-gold-deep dark:text-gold">{r.code}</span><span className="font-semibold">{r.title}</span>{r.art_cost && <span className="text-xs text-ink-soft" title="New art needed">{r.art_cost}</span>}</span>
                <span className="block text-xs text-ink-soft dark:text-parchment/60">{[r.kind ? KIND_LABEL[r.kind] : null, r.source_ref].filter(Boolean).join(" · ")}</span>
                {r.plan_note && <span className="mt-1 block text-xs leading-relaxed text-ink-soft dark:text-parchment/50">{r.plan_note}</span>}
              </span>
              <span className="col-start-2 sm:col-start-auto"><StageBadge stage={r.stage} /></span>
            </Link>
          </li>
        ))}
      </ol>
      {(dropped.data ?? []).length > 0 && (
        <details className="rounded-xl border border-dashed border-parchment-deep p-3 text-sm dark:border-night-700">
          <summary className="cursor-pointer font-semibold text-ink-soft dark:text-parchment/60">Dropped or merged · {dropped.data!.length}</summary>
          <ul className="mt-2 grid gap-1.5">{dropped.data!.map((r) => <li key={r.id}><Link to={`/reels/${r.code}`} className="hover:underline"><span className="mr-2 font-mono text-xs text-ink-soft">{r.code}</span><span className="line-through">{r.title}</span></Link>{r.plan_note && <span className="block text-xs text-ink-soft dark:text-parchment/50">{r.plan_note}</span>}</li>)}</ul>
        </details>
      )}
    </div>
  );
}
