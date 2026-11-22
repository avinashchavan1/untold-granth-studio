import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { CheckCircle2, Circle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Card, CopyButton, ErrorNote, SectionTitle, Spinner, StageBadge } from "../components/ui";
import { mediaUrl } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { Stage } from "../lib/types";

// Long-form: full-length 16:9 videos (~10-12 min) and the 9:16 reels derived from them.
// Data: studio/series/<id>/longform/<code>/longform.json, synced by scripts/sync.py into longform_videos.
type Beat = { id: string; title: string; cite: string; summary: string; link_out?: string };
type Act = { name: string; music?: string; beats: Beat[] };
type Pair = { topic: string; tulsidas: { ref: string; line: string }; valmiki: string; note: string };
type Plan = {
  title: string; subtitle?: string; frame?: string; target_min?: string; arc?: string; base_text?: string; sargas_read?: string;
  opening_sloka?: { ref: string; lines: string[]; translit?: string; en: string; why?: string };
  retention?: { owner_note?: string; plan: string[] };
  acts?: Act[];
  popular_compare?: { source?: string; status?: string; pairs?: Pair[]; not_claimed?: string };
  derived_reels?: { id: string; title: string; beats: string[]; note?: string }[];
  characters_needed?: { key: string; tier: string; status: string }[];
  progress?: { step: string; done: boolean }[];
  budget?: Record<string, unknown>;
  thumb_path?: string | null; youtube_description?: string | null; length?: string; master?: string;
};
type Row = { id: string; code: string; title: string; subtitle: string | null; stage: string; plan: Plan; preview_path: string | null; updated_at: string };

const useLongform = () => useQuery({ queryKey: ["longform"], queryFn: async () => {
  const { data, error } = await supabase.from("longform_videos").select("*").order("code");
  if (error) throw new Error(error.message);
  return data as Row[];
} });

export default function Longform() {
  const { code } = useParams();
  const q = useLongform();
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorNote error={q.error} />;
  const rows = q.data ?? [];
  const row = code ? rows.find((r) => r.code === code) : rows.length === 1 ? rows[0] : undefined;
  if (row) return <Detail row={row} many={rows.length > 1} />;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Header />
      {rows.length === 0 && <Card>No full-length video yet. Start one in a session: "long-form pilot: &lt;arc&gt;".</Card>}
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((r) => (
          <Link key={r.id} to={`/longform/${r.code}`}><Card className="hover:border-gold">
            <div className="flex items-center justify-between gap-2"><span className="font-mono text-sm">{r.code}</span><StageBadge stage={r.stage as Stage} /></div>
            <div className="mt-1 font-display text-xl font-bold">{r.title}</div>
            {r.subtitle && <p className="mt-1 text-sm text-ink-soft dark:text-parchment/70">{r.subtitle}</p>}
          </Card></Link>
        ))}
      </div>
    </div>
  );
}

const Header = () => (
  <div>
    <h1 className="font-display text-3xl font-extrabold tracking-wide">Long-form</h1>
    <p className="mt-1 max-w-2xl text-sm text-ink-soft dark:text-parchment/60">Full-length 16:9 videos for YouTube (~10–12 min). Each is a new production; 4–6 reels are cut from its beats.</p>
  </div>
);

function Detail({ row, many }: { row: Row; many: boolean }) {
  const p = row.plan;
  const preview = useQuery({ enabled: !!row.preview_path, queryKey: ["media-path", row.preview_path], queryFn: () => mediaUrl({ store: "supabase", path: row.preview_path!, url: null }) });
  const thumb = useQuery({ enabled: !!p.thumb_path, queryKey: ["media-path", p.thumb_path], queryFn: () => mediaUrl({ store: "supabase", path: p.thumb_path!, url: null }) });
  const beatTitle = Object.fromEntries((p.acts ?? []).flatMap((a) => a.beats).map((b) => [b.id, b.title]));
  const done = (p.progress ?? []).filter((s) => s.done).length;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div>
        {many && <Link to="/longform" className="text-sm text-gold">← All long-form videos</Link>}
        <div className="mt-1 flex flex-wrap items-center gap-3"><span className="font-mono text-sm">{row.code}</span><StageBadge stage={row.stage as Stage} /><span className="text-xs text-ink-soft dark:text-parchment/50">updated {new Date(row.updated_at).toLocaleString()}</span></div>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-wide">{p.title}</h1>
        {p.subtitle && <p className="mt-1 max-w-3xl text-ink-soft dark:text-parchment/70">{p.subtitle}</p>}
        <p className="mt-2 text-sm text-ink-soft dark:text-parchment/60">{[p.length ? `${p.length} long` : null, p.frame, !p.length && p.target_min ? `${p.target_min} min` : null].filter(Boolean).join(" · ")}</p>
      </div>

      {preview.data && <Card><SectionTitle>Preview (review copy, 480p)</SectionTitle><video controls src={preview.data} className="aspect-video w-full rounded-xl bg-black" />{p.master && <p className="mt-2 text-xs text-ink-soft dark:text-parchment/60">Upload master: {p.master}</p>}</Card>}
      {(thumb.data || p.youtube_description) && (
        <div className="grid gap-6 xl:grid-cols-2">
          {thumb.data && <Card><SectionTitle>YouTube thumbnail</SectionTitle><img src={thumb.data} alt="Wide YouTube thumbnail" className="aspect-video w-full rounded-xl" /></Card>}
          {p.youtube_description && <Card><SectionTitle right={<CopyButton text={p.youtube_description} label="Copy" />}>YouTube description + chapters</SectionTitle><pre className="max-h-96 overflow-auto whitespace-pre-wrap text-sm">{p.youtube_description}</pre></Card>}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <SectionTitle right={<span className="text-sm text-ink-soft">{done}/{p.progress?.length ?? 0}</span>}>Progress</SectionTitle>
          <ul className="grid gap-2">{(p.progress ?? []).map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">{s.done ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <Circle size={18} className="mt-0.5 shrink-0 text-ink-soft/50" />}<span className={clsx(s.done && "text-ink-soft dark:text-parchment/60")}>{s.step}</span></li>
          ))}</ul>
        </Card>
        <Card>
          <SectionTitle>Characters</SectionTitle>
          <ul className="grid gap-1.5 text-sm">{(p.characters_needed ?? []).map((c) => (
            <li key={c.key} className="flex justify-between gap-3"><span className="font-semibold capitalize">{c.key}</span><span className={clsx("text-right", /owner/.test(c.status) ? "text-amber-700 dark:text-amber-300" : "text-ink-soft dark:text-parchment/60")}>{c.status}</span></li>
          ))}</ul>
        </Card>
      </div>

      {p.opening_sloka && (
        <Card>
          <SectionTitle>Opening śloka · Valmiki Ramayana {p.opening_sloka.ref}</SectionTitle>
          <div className="font-[Mukta] text-xl leading-relaxed">{p.opening_sloka.lines.map((l, i) => <div key={i}>{l}</div>)}</div>
          {p.opening_sloka.translit && <p className="mt-2 text-sm italic text-ink-soft dark:text-parchment/60">{p.opening_sloka.translit}</p>}
          <p className="mt-2">{p.opening_sloka.en}</p>
          {p.opening_sloka.why && <p className="mt-2 text-sm text-ink-soft dark:text-parchment/60">{p.opening_sloka.why}</p>}
        </Card>
      )}

      <section>
        <SectionTitle>Beats</SectionTitle>
        <div className="grid gap-5">{(p.acts ?? []).map((a) => (
          <div key={a.name}>
            <div className="mb-2 flex flex-wrap items-baseline gap-3"><h3 className="font-display text-lg font-bold">{a.name}</h3>{a.music && <span className="text-xs text-ink-soft dark:text-parchment/50">music: {a.music}</span>}</div>
            <div className="grid gap-2">{a.beats.map((b) => (
              <Card key={b.id} className="!p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2"><div><span className="mr-2 font-mono text-xs text-ink-soft">{b.id}</span><span className="font-semibold">{b.title}</span></div><span className="font-mono text-xs text-gold">CE {b.cite}</span></div>
                <p className="mt-1 text-sm text-ink-soft dark:text-parchment/70">{b.summary}</p>
                {b.link_out && <p className="mt-1 text-sm italic">→ “{b.link_out}”</p>}
              </Card>
            ))}</div>
          </div>
        ))}</div>
      </section>

      {p.retention && (
        <Card>
          <SectionTitle>Keeping viewers to the end</SectionTitle>
          {p.retention.owner_note && <p className="mb-2 text-sm text-ink-soft dark:text-parchment/60">{p.retention.owner_note}</p>}
          <ul className="list-disc space-y-1 pl-5 text-sm">{p.retention.plan.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </Card>
      )}

      {p.popular_compare?.pairs && (
        <section>
          <SectionTitle>Popular version vs Valmiki</SectionTitle>
          {p.popular_compare.source && <p className="-mt-2 mb-3 text-sm text-ink-soft dark:text-parchment/60">{p.popular_compare.source}</p>}
          <div className="grid gap-2 md:grid-cols-2">{p.popular_compare.pairs.map((x) => (
            <Card key={x.topic} className="!p-4">
              <div className="font-semibold">{x.topic}</div>
              <div className="mt-1 font-[Mukta] text-base">{x.tulsidas.line}</div>
              <div className="text-xs text-ink-soft">Ramcharitmanas, {x.tulsidas.ref}</div>
              <div className="mt-2 text-sm"><span className="font-semibold">Valmiki: </span>{x.valmiki}</div>
              <div className="mt-1 text-xs text-ink-soft dark:text-parchment/60">{x.note}</div>
            </Card>
          ))}</div>
          {p.popular_compare.not_claimed && <p className="mt-3 text-sm text-amber-800 dark:text-amber-300">Not claimed: {p.popular_compare.not_claimed}</p>}
        </section>
      )}

      {p.derived_reels && (
        <Card>
          <SectionTitle>Reels cut from this video</SectionTitle>
          <ul className="grid gap-2 text-sm">{p.derived_reels.map((r) => (
            <li key={r.id}><span className="mr-2 font-mono">{/^A\d/.test(r.id) ? <Link className="text-gold" to={`/reels/${r.id}`}>{r.id}</Link> : r.id}</span><span className="font-semibold">{r.title}</span>
              <div className="text-xs text-ink-soft dark:text-parchment/60">beats: {r.beats.map((b) => `${b} ${beatTitle[b] ?? ""}`).join(" · ")}{r.note ? ` · ${r.note}` : ""}</div></li>
          ))}</ul>
        </Card>
      )}

      {(p.arc || p.sargas_read) && (
        <Card>
          <SectionTitle>Research</SectionTitle>
          {p.base_text && <p className="text-sm"><span className="font-semibold">Text: </span>{p.base_text}</p>}
          {p.arc && <p className="mt-1 text-sm"><span className="font-semibold">Arc: </span>{p.arc}</p>}
          {p.sargas_read && <p className="mt-1 text-sm"><span className="font-semibold">Read: </span>{p.sargas_read}</p>}
        </Card>
      )}
    </div>
  );
}
