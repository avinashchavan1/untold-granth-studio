import clsx from "clsx";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, ErrorNote, Markdown, Spinner, fmtDate } from "../components/ui";
import { useDocs, useSaveDoc } from "../lib/api";

export default function Docs() {
  const { slug } = useParams();
  const docs = useDocs();
  const save = useSaveDoc();
  const [edit, setEdit] = useState(false);
  const [body, setBody] = useState("");
  const current = docs.data?.find((d) => d.slug === (slug ?? "style-guide")) ?? docs.data?.[0];
  useEffect(() => { setBody(current?.body_md ?? ""); setEdit(false); }, [current?.id, current?.body_md]);
  if (docs.isLoading) return <Spinner />;
  if (docs.error) return <ErrorNote error={docs.error} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav className="grid min-w-0 content-start gap-2">
        <h1 className="font-display text-2xl font-extrabold tracking-wide">Style & docs</h1>
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:overflow-visible lg:px-0">
        {(docs.data ?? []).map((d) => (
          <Link key={d.id} to={`/docs/${d.slug}`} className={clsx("shrink-0 rounded-xl px-3 py-2 text-sm font-semibold", d.id === current?.id ? "bg-night-800 text-parchment dark:bg-gold dark:text-night-950" : "hover:bg-black/5 dark:hover:bg-white/5")}>{d.title}</Link>
        ))}
        </div>
      </nav>
      {current && (
        <Card className="min-w-0 !px-4 sm:!px-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-parchment-deep pb-3 dark:border-night-700">
            <span className="text-xs text-ink-soft dark:text-parchment/60">Last updated {fmtDate(current.updated_at)}</span>
            {edit ? (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setBody(current.body_md); setEdit(false); }}>Cancel</Button>
                <Button size="sm" variant="primary" disabled={save.isPending} onClick={async () => { await save.mutateAsync({ id: current.id, slug: current.slug, title: current.title, body_md: body }); setEdit(false); }}>{save.isPending ? "Saving…" : "Save"}</Button>
              </div>
            ) : <Button size="sm" onClick={() => setEdit(true)}><Pencil size={14} /> Edit</Button>}
          </div>
          {edit ? <textarea id="doc-body" value={body} onChange={(e) => setBody(e.target.value)} className="h-[70vh] w-full rounded-xl border border-parchment-deep bg-white/80 p-4 font-mono text-[13px] leading-relaxed dark:border-night-700 dark:bg-night-950" />
                : <Markdown md={current.body_md} />}
        </Card>
      )}
    </div>
  );
}
