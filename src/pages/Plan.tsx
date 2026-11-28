import { ArrowDown, ArrowUp, Hammer, Plus, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, ErrorNote, SectionTitle, Spinner, StageBadge } from "../components/ui";
import { useAddReel, useDroppedReels, useReels, useUpdateReel } from "../lib/api";
import type { Reel } from "../lib/types";
import { KIND_LABEL } from "../lib/types";
import { SERIES_ID, W } from "../lib/channel";

export default function Plan() {
  const { data, isLoading, error } = useReels();
  const dropped = useDroppedReels();
  const add = useAddReel();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", kind: "myth_buster", source_ref: "", plan_note: "" });
  if (isLoading) return <Spinner label="Loading the plan…" />;
  if (error) return <ErrorNote error={error} />;
  const reels = data ?? [];
  const nextNo = Math.max(0, ...reels.map((r) => r.plan_no ?? 0)) + 1;
  const all = [...reels, ...(dropped.data ?? [])];
  const prefix = all[0]?.code.match(/^[A-Z]+/)?.[0] ?? "R", width = Math.max(2, ...all.map((r) => r.code.length - prefix.length));
  const nextCode = prefix + String(Math.max(0, ...all.map((r) => parseInt(r.code.replace(/^[A-Z]+/, "")) || 0)) + 1).padStart(width, "0");   // dropped codes stay taken
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

      <RequestQueue reels={reels} />

      {open && (
        <Card>
          <SectionTitle>New reel idea · {nextCode}</SectionTitle>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); await add.mutateAsync({ series_id: SERIES_ID, code: nextCode, plan_no: nextNo, title: f.title, kind: f.kind, source_ref: f.source_ref, plan_note: f.plan_note }); setOpen(false); setF({ title: "", kind: "myth_buster", source_ref: "", plan_note: "" }); }}>
            <label className="grid gap-1 text-sm font-semibold md:col-span-2">Working title<input id="idea-title" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="rounded-xl border border-parchment-deep bg-white/80 px-3 py-2 font-normal dark:border-night-700 dark:bg-night-950" /></label>
            <label className="grid gap-1 text-sm font-semibold">Type<select id="idea-kind" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className="rounded-xl border border-parchment-deep bg-white/80 px-3 py-2 font-normal dark:border-night-700 dark:bg-night-950">{Object.entries(KIND_LABEL).filter(([k]) => k !== "longform").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-semibold">{W.where}<input id="idea-src" value={f.source_ref} onChange={(e) => setF({ ...f, source_ref: e.target.value })} placeholder={W.wherePh} className="rounded-xl border border-parchment-deep bg-white/80 px-3 py-2 font-normal dark:border-night-700 dark:bg-night-950" /></label>
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
              <span className="col-start-2 flex flex-wrap items-center gap-2 sm:col-start-auto"><StageBadge stage={r.stage} />{r.stage === "idea" && <MakeThis r={r} reels={reels} />}</span>
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

// #4 Reel request queue: "Make this" puts an idea in Claude's queue; Claude makes requests top-down
// (scripts/request_queue.py prints the queue at the start of a session).
const queueOf = (reels: Reel[]) => reels.filter((r) => r.requested_at && r.stage === "idea").sort((a, b) => (a.request_pos ?? 0) - (b.request_pos ?? 0));
function MakeThis({ r, reels }: { r: Reel; reels: Reel[] }) {
  const update = useUpdateReel();
  if (r.requested_at) return <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">In queue #{queueOf(reels).findIndex((x) => x.id === r.id) + 1}</span>;
  return (
    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); update.mutate({ reel: r, patch: { requested_at: new Date().toISOString(), request_pos: Math.max(0, ...reels.map((x) => x.request_pos ?? 0)) + 1 }, action: "reel requested" }); }}
      className="inline-flex items-center gap-1 rounded-full border border-gold-deep px-2.5 py-0.5 text-xs font-semibold text-gold-deep hover:bg-gold-soft dark:border-gold dark:text-gold dark:hover:bg-gold/10"><Hammer size={12} /> Make this</button>
  );
}
function RequestQueue({ reels }: { reels: Reel[] }) {
  const update = useUpdateReel();
  const q = queueOf(reels);
  const move = (i: number, d: -1 | 1) => { const a = q[i], b = q[i + d]; if (!a || !b) return;
    update.mutate({ reel: a, patch: { request_pos: b.request_pos } }); update.mutate({ reel: b, patch: { request_pos: a.request_pos } }); };
  return (
    <Card>
      <SectionTitle right={<span className="text-xs text-ink-soft dark:text-parchment/60">Claude makes these first, top to bottom (up to 3 per session)</span>}><span className="inline-flex items-center gap-2"><Hammer size={18} /> Your request queue</span></SectionTitle>
      {q.length === 0 ? <p className="text-sm text-ink-soft dark:text-parchment/60">Empty. Press <b>Make this</b> on any idea below (or add your own idea first), and Claude picks it up next, in your order. With an empty queue Claude follows the plan order.</p> : (
        <ol className="grid gap-2">
          {q.map((r, i) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-parchment-deep p-2.5 text-sm dark:border-night-700">
              <span className="tabular w-6 text-center font-bold">{i + 1}</span>
              <Link to={`/reels/${r.code}`} className="font-mono text-xs text-gold-deep dark:text-gold">{r.code}</Link>
              <span className="min-w-0 flex-1 truncate font-semibold">{r.title}</span>
              <input aria-label={`Note for ${r.code}`} defaultValue={r.request_note ?? ""} placeholder="Note for Claude (optional)" onBlur={(e) => e.target.value !== (r.request_note ?? "") && update.mutate({ reel: r, patch: { request_note: e.target.value || null } })}
                className="w-full rounded-lg border border-parchment-deep bg-white/80 px-2 py-1 text-xs sm:w-56 dark:border-night-700 dark:bg-night-950" />
              <span className="flex gap-1">
                <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-md p-1 disabled:opacity-30"><ArrowUp size={15} /></button>
                <button aria-label="Move down" disabled={i === q.length - 1} onClick={() => move(i, 1)} className="rounded-md p-1 disabled:opacity-30"><ArrowDown size={15} /></button>
                <button aria-label="Remove from queue" onClick={() => update.mutate({ reel: r, patch: { requested_at: null, request_pos: null }, action: "request removed" })} className="rounded-md p-1"><X size={15} /></button>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
