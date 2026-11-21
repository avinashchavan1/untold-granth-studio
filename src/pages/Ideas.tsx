import { ArrowUpRight, Lightbulb, RotateCcw, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Empty, ErrorNote, Spinner, fmtDate } from "../components/ui";
import { supabase } from "../lib/supabase";
import { useAddReel, useIdeaMutations, useIdeas, useReels, type Idea } from "../lib/api";
import { SERIES_ID } from "../lib/channel";

const tagsOf = (s: string) => [...new Set((s.match(/#[\p{L}\p{N}_-]+/gu) ?? []).map((t) => t.slice(1).toLowerCase()))];

export default function Ideas() {
  const ideas = useIdeas();
  const { add } = useIdeaMutations();
  const [text, setText] = useState("");
  const [view, setView] = useState<"new" | "promoted" | "dropped">("new");
  const [tag, setTag] = useState<string | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const rows = useMemo(() => (ideas.data ?? []).filter((i) => i.status === view && (!tag || i.tags.includes(tag))), [ideas.data, view, tag]);
  const allTags = useMemo(() => [...new Set((ideas.data ?? []).filter((i) => i.status === view).flatMap((i) => i.tags))].sort(), [ideas.data, view]);
  const count = (s: Idea["status"]) => (ideas.data ?? []).filter((i) => i.status === s).length;
  const save = async () => { const body = text.trim(); if (!body) return; await add.mutateAsync({ body, tags: tagsOf(body) }); setText(""); box.current?.focus(); };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide">Ideas</h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-parchment/60">Jot anything: a myth to check, a verse, a character, a hook. Add <code>#tags</code> to group them. Promote one to the plan when it's ready to become a reel.</p>
      </div>
      <Card>
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="grid gap-2">
          <textarea ref={box} id="idea-body" value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={4000} aria-label="New idea"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); } }}
            placeholder="e.g. Did the hero really do this? Check book 6, chapter 61 #hero #mythbuster"
            className="w-full rounded-xl border border-parchment-deep bg-white/80 px-3 py-2.5 text-[15px] outline-none focus:border-gold dark:border-night-700 dark:bg-night-950" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-ink-soft dark:text-parchment/60">{text.length > 0 ? `${text.length}/4000 · ` : ""}Ctrl/⌘ + Enter to save{tagsOf(text).length ? ` · tags: ${tagsOf(text).join(", ")}` : ""}</span>
            <Button type="submit" variant="primary" disabled={add.isPending || !text.trim()}><Lightbulb size={15} /> {add.isPending ? "Saving…" : "Save idea"}</Button>
          </div>
          {add.error && <p className="text-sm text-vermilion">{(add.error as Error).message}</p>}
        </form>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {(["new", "promoted", "dropped"] as const).map((s) => (
          <button key={s} onClick={() => { setView(s); setTag(null); }} aria-pressed={view === s}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${view === s ? "bg-night-800 text-parchment dark:bg-gold dark:text-night-950" : "border border-parchment-deep text-ink-soft dark:border-night-700"}`}>
            {s === "new" ? "Inbox" : s === "promoted" ? "In the plan" : "Dropped"} · {count(s)}
          </button>
        ))}
        {allTags.map((t) => <button key={t} onClick={() => setTag(tag === t ? null : t)} aria-pressed={tag === t} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tag === t ? "bg-gold text-night-950" : "bg-black/5 text-ink-soft dark:bg-white/10 dark:text-parchment/70"}`}>#{t}</button>)}
      </div>

      {ideas.isLoading ? <Spinner /> : ideas.error ? <ErrorNote error={ideas.error} /> : rows.length === 0 ? <Empty>{view === "new" ? "No ideas yet. Write the first one above." : "Nothing here."}</Empty> : (
        <ul className="grid gap-2">{rows.map((i) => <IdeaRow key={i.id} idea={i} />)}</ul>
      )}
    </div>
  );
}

function IdeaRow({ idea }: { idea: Idea }) {
  const { update, remove } = useIdeaMutations();
  const reels = useReels();
  const addReel = useAddReel();
  const [err, setErr] = useState("");
  const reel = reels.data?.find((r) => r.id === idea.reel_id);
  const promote = async () => {
    setErr("");
    try {
      const all = reels.data ?? [];
      const code = "A" + String(Math.max(0, ...all.map((r) => parseInt(r.code.slice(1)) || 0)) + 1).padStart(2, "0");
      const planNo = Math.max(0, ...all.map((r) => r.plan_no ?? 0)) + 1;
      const first = idea.body.split("\n")[0].replace(/#[\p{L}\p{N}_-]+/gu, "").trim().slice(0, 120) || "New idea";
      await addReel.mutateAsync({ series_id: SERIES_ID, code, title: first, kind: idea.tags.includes("mythbuster") ? "myth_buster" : null, source_ref: "", plan_note: idea.body, plan_no: planNo });
      const { data } = await supabase.from("reels").select("id").eq("series_id", SERIES_ID).eq("code", code).single();
      await update.mutateAsync({ id: idea.id, patch: { status: "promoted", reel_id: data?.id ?? null } });
    } catch (e) { setErr((e as Error).message); }
  };
  return (
    <li className="rounded-xl border border-parchment-deep bg-white/80 p-3 dark:border-night-700 dark:bg-night-900">
      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{idea.body}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-ink-soft dark:text-parchment/60">{fmtDate(idea.created_at)}{idea.created_by ? ` · ${idea.created_by.split("@")[0]}` : ""}
          {reel && <> · <Link to={`/reels/${reel.code}`} className="font-semibold text-gold-deep underline dark:text-gold">{reel.code} in the plan</Link></>}</span>
        <span className="flex flex-wrap gap-1.5">
          {idea.status === "new" && <Button size="sm" variant="primary" disabled={addReel.isPending} onClick={promote}><ArrowUpRight size={14} /> Promote to plan</Button>}
          {idea.status === "new" && <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: idea.id, patch: { status: "dropped" } })}><X size={14} /> Drop</Button>}
          {idea.status === "dropped" && <Button size="sm" onClick={() => update.mutate({ id: idea.id, patch: { status: "new" } })}><RotateCcw size={14} /> Back to inbox</Button>}
          <Button size="sm" variant="danger" aria-label="Delete idea" onClick={() => { if (confirm("Delete this idea?")) remove.mutate(idea.id); }}><Trash2 size={14} /></Button>
        </span>
      </div>
      {err && <p className="mt-1 text-sm text-vermilion">{err}</p>}
    </li>
  );
}
