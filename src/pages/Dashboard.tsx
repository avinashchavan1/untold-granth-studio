import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Empty, ErrorNote, SectionTitle, Spinner, StageBadge, fmtDate } from "../components/ui";
import { Target } from "../components/Target";
import { studio, useActivity, useChannels, useConnections, usePublications, useReels, useSeries } from "../lib/api";
import type { Publication, Reel } from "../lib/types";
import { STAGES, type Stage } from "../lib/types";
import { CHANNEL } from "../lib/channel";

export default function Dashboard() {
  const reels = useReels();
  const pubs = usePublications();
  const act = useActivity();
  const ch = useChannels();
  const conn = useConnections();
  if (reels.isLoading) return <Spinner label="Loading the studio…" />;
  if (reels.error) return <ErrorNote error={reels.error} />;
  const all = reels.data ?? [];
  const count = (s: Stage) => all.filter((r) => r.stage === s).length;
  const made = all.filter((r) => !["idea", "researching", "scripted", "voiced"].includes(r.stage));
  const needsReview = all.filter((r) => r.stage === "review" && !r.reviewed);
  const toPost = all.filter((r) => ["review", "approved"].includes(r.stage) && r.reviewed);
  const inProd = all.filter((r) => ["researching", "scripted", "voiced", "rendered"].includes(r.stage));
  const posted = (p: string) => (pubs.data ?? []).filter((x) => x.platform === p && x.state === "posted").length;
  const nextUp = all.filter((r) => r.stage === "idea").slice(0, 5);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-deep sm:text-xs sm:tracking-[0.25em] dark:text-gold">{CHANNEL.series.name} · {CHANNEL.series.book}, {CHANNEL.series.edition}</div>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-wide sm:text-4xl">Today in the studio</h1>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2 font-mono text-xs text-ink-soft dark:text-parchment/60">
          {(ch.data ?? []).map((c) => <a key={c.platform} href={c.url ?? "#"} target="_blank" rel="noreferrer" className="rounded-full border border-parchment-deep px-3 py-1 hover:border-gold dark:border-night-700">{c.platform} {c.handle}</a>)}
        </div>
      </div>

      <Results reels={all} pubs={pubs.data ?? []} />
      <SlokaTest reels={all} pubs={pubs.data ?? []} />

      {conn.data && (conn.data.providers.instagram?.connected || conn.data.providers.youtube?.connected) && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Target platform="instagram" providers={conn.data.providers} className="border border-parchment-deep dark:border-night-700" />
          <Target platform="youtube" providers={conn.data.providers} className="border border-parchment-deep dark:border-night-700" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[["Reels made", made.length], ["In production", inProd.length], ["Waiting for your check", needsReview.length], ["On Instagram", posted("instagram")], ["On YouTube", posted("youtube")]].map(([l, v]) => (
          <Card key={l as string} className="!p-4"><div className="tabular text-3xl font-bold">{v}</div><div className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-parchment/60">{l}</div></Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>Needs you</SectionTitle>
          {needsReview.length + toPost.length === 0 ? <Empty>Nothing waiting. New reels land here when they're rendered.</Empty> : (
            <ul className="grid gap-2">
              {needsReview.map((r) => <Row key={r.id} code={r.code} title={r.title} note="Check the citations, then approve" stage={r.stage} />)}
              {toPost.map((r) => <Row key={r.id} code={r.code} title={r.title} note="Reviewed · ready to post" stage={r.stage} />)}
            </ul>
          )}
        </Card>
        <Card>
          <SectionTitle right={<Link to="/plan" className="text-sm font-semibold text-gold-deep hover:underline dark:text-gold">Full plan →</Link>}>Coming up next</SectionTitle>
          <ul className="grid gap-2">{inProd.map((r) => <Row key={r.id} code={r.code} title={r.title} note={r.source_ref ?? ""} stage={r.stage} />)}{nextUp.map((r) => <Row key={r.id} code={r.code} title={r.title} note={r.source_ref ?? ""} stage={r.stage} />)}</ul>
        </Card>
      </div>

      <Card>
        <SectionTitle>Pipeline</SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {STAGES.map((s) => (
            <Link key={s.key} to={`/reels?stage=${s.key}`} className="rounded-xl border border-parchment-deep p-3 hover:border-gold dark:border-night-700">
              <div className="tabular text-2xl font-bold">{count(s.key)}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-parchment/60">{s.label}</div>
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Recent activity</SectionTitle>
        {act.isLoading ? <Spinner size="sm" /> : (act.data ?? []).length === 0 ? <Empty>No activity yet.</Empty> : (
          <ul className="divide-y divide-parchment-deep text-sm dark:divide-night-700">
            {(act.data ?? []).map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span><b>{a.action}</b>{typeof a.detail?.code === "string" ? ` · ${a.detail.code}` : ""}</span>
                <span className="text-ink-soft dark:text-parchment/60">{a.actor ?? "studio"} · {fmtDate(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

const Row = ({ code, title, note, stage }: { code: string; title: string; note: string; stage: Stage }) => (
  <li>
    <Link to={`/reels/${code}`} className="flex items-center justify-between gap-3 rounded-xl border border-parchment-deep p-3 hover:border-gold dark:border-night-700">
      <div className="min-w-0">
        <div className="flex items-center gap-2"><span className="font-mono text-xs text-gold-deep dark:text-gold">{code}</span><span className="truncate font-semibold">{title}</span></div>
        <div className="truncate text-xs text-ink-soft dark:text-parchment/60">{note}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2"><StageBadge stage={stage} /><ArrowRight size={16} className="text-ink-soft" /></div>
    </Link>
  </li>
);

// How each posted reel is doing, per platform. A04–A06 are the trial: short cut (~55 s), question title,
// question caption + auto first comment. Compare them with A01–A03 (full length).
function Results({ reels, pubs }: { reels: Reel[]; pubs: Publication[] }) {
  const qc = useQueryClient();
  const [st, setSt] = useState<{ busy?: boolean; err?: string; msg?: string }>({});
  const posted = reels.filter((r) => pubs.some((p) => p.reel_id === r.id && p.state === "posted"));
  if (!posted.length) return null;
  const cell = (r: Reel, pl: string, k: string) => { const p = pubs.find((x) => x.reel_id === r.id && x.platform === pl && x.state === "posted"); const v = (p?.stats as Record<string, number> | undefined)?.[k]; return p ? (v == null ? "–" : v.toLocaleString()) : ""; };
  const trial = (r: Reel) => ["A04", "A06", "A07"].includes(r.code);
  const last = pubs.map((p) => p.stats_at).filter(Boolean).sort().pop();
  return (
    <Card>
      <SectionTitle right={<span className="flex flex-wrap gap-2"><Button size="sm" disabled={st.busy} onClick={async () => { setSt({ busy: true }); try { await studio("refresh_stats"); setSt({}); qc.invalidateQueries({ queryKey: ["pubs"] }); } catch (e) { setSt({ err: (e as Error).message }); } }}><RefreshCw size={14} className={st.busy ? "animate-spin" : ""} /> {st.busy ? "Updating…" : "Refresh stats"}</Button></span>}>How the reels are doing</SectionTitle>
      {/* phone: one card per reel */}
      <ul className="grid gap-2 sm:hidden">
        {posted.map((r) => {
          const line = (pl: string, keys: string[]) => keys.map((k) => { const v = cell(r, pl, k); return v && v !== "–" ? `${v} ${k}` : null; }).filter(Boolean).join(" · ");
          return (
            <li key={r.id} className="rounded-xl border border-parchment-deep p-3 dark:border-night-700">
              <Link to={`/reels/${r.code}`} className="font-semibold"><span className="mr-1.5 font-mono text-xs text-gold-deep dark:text-gold">{r.code}</span>{r.title}</Link>
              <div className="mt-1.5 grid gap-0.5 text-[13px] tabular">
                <div><span className="inline-block w-20 text-ink-soft dark:text-parchment/60">YouTube</span>{line("youtube", ["views", "likes", "comments"]) || "–"}</div>
                <div><span className="inline-block w-20 text-ink-soft dark:text-parchment/60">Instagram</span>{line("instagram", ["views", "likes", "comments", "shares"]) || "–"}</div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="-mx-1 hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-ink-soft dark:text-parchment/60">
            <tr><th className="p-2">Reel</th><th className="p-2">Length</th><th className="p-2 text-right">IG views</th><th className="p-2 text-right">IG likes</th><th className="p-2 text-right">IG comments</th><th className="p-2 text-right">IG shares</th><th className="p-2 text-right">YT views</th><th className="p-2 text-right">YT likes</th><th className="p-2 text-right">YT comments</th></tr>
          </thead>
          <tbody className="tabular">
            {posted.map((r) => (
              <tr key={r.id} className="border-t border-parchment-deep dark:border-night-700">
                <td className="p-2"><Link to={`/reels/${r.code}`} className="font-semibold hover:underline"><span className="mr-1.5 font-mono text-xs text-gold-deep dark:text-gold">{r.code}</span>{r.title}</Link>{(() => { const y = pubs.find((x) => x.reel_id === r.id && x.platform === "youtube")?.stats as { status?: { privacy?: string; made_for_kids?: boolean; age_restricted?: boolean } } | undefined; const st2 = y?.status; const bad = st2 && (st2.privacy !== "public" || st2.made_for_kids || st2.age_restricted); return bad ? <span className="ml-2 rounded-full bg-vermilion/10 px-2 py-0.5 text-[10px] font-bold uppercase text-vermilion">YT {st2!.privacy !== "public" ? st2!.privacy : st2!.made_for_kids ? "made for kids" : "age-restricted"}</span> : null; })()}{trial(r) && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900 dark:bg-amber-950 dark:text-amber-300">trial</span>}</td>
                <td className="p-2">{r.length_s ? `${Math.round(r.length_s)} s` : ""}</td>
                {["views", "likes", "comments", "shares"].map((k) => <td key={k} className="p-2 text-right">{cell(r, "instagram", k)}</td>)}
                {["views", "likes", "comments"].map((k) => <td key={k} className="p-2 text-right">{cell(r, "youtube", k)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink-soft dark:text-parchment/60">Trial (A04, A06, A07): ~55 s short cut on both platforms, question title, question in the caption and as the first comment. {last ? `Updated ${fmtDate(last)}.` : "Press Refresh stats after posting."}{st.err && <span className="text-vermilion"> {st.err}</span>}{st.msg && <span className="text-emerald-700 dark:text-emerald-300"> {st.msg}</span>}</p>
    </Card>
  );
}

// Owner's A/B test (series.json → experiments.sloka_position): opening śloka (shot 2) vs a half-verse "proof" over the story after the first reveal.
// Retention comes from YouTube Analytics (Refresh stats; needs "Reconnect YouTube" once for the analytics permission).
function SlokaTest({ reels, pubs }: { reels: Reel[]; pubs: Publication[] }) {
  const series = useSeries();
  const ex = ((series.data?.[0]?.config as Record<string, unknown> | undefined)?.experiments as Record<string, { test_reels?: Record<string, string>; question?: string }> | undefined)?.sloka_position;
  if (!ex?.test_reels) return null;
  type St = { views?: number; avg_view_pct?: number; avg_view_s?: number; retention?: [number, number, number][]; analytics_error?: string };
  const at = (r: Reel, st: St | undefined, sec: number) => { const L = r.length_s ?? 0; if (!st?.retention?.length || !L) return null; const row = st.retention.find((x) => x[0] >= sec / L) ?? st.retention[st.retention.length - 1]; return Math.round(row[1] * 100); };
  const rows = Object.entries(ex.test_reels).map(([code, fmt]) => { const r = reels.find((x) => x.code === code); const p = r && pubs.find((x) => x.reel_id === r.id && x.platform === "youtube" && x.state === "posted"); return { code, fmt, r, st: p?.stats as St | undefined, posted: !!p }; });
  const err = rows.find((x) => x.st?.analytics_error)?.st?.analytics_error;
  return (
    <Card>
      <SectionTitle>Śloka format test</SectionTitle>
      <p className="-mt-2 mb-3 text-sm text-ink-soft dark:text-parchment/60">{ex.question} Post them alternating, then compare at 48 h.</p>
      {err && <p className="mb-3 rounded-xl bg-amber-100 p-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-300">Retention needs one more YouTube permission: Settings → Connections → Reconnect YouTube. ({err})</p>}
      <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-ink-soft dark:text-parchment/60"><tr><th className="p-2">Reel</th><th className="p-2">Format</th><th className="p-2 text-right">YT views</th><th className="p-2 text-right">Avg % viewed</th><th className="p-2 text-right">Watching at 0:05</th><th className="p-2 text-right">at 0:20</th></tr></thead>
        <tbody className="tabular">{rows.map(({ code, fmt, r, st, posted }) => (
          <tr key={code} className="border-t border-parchment-deep dark:border-night-700">
            <td className="p-2">{r ? <Link to={`/reels/${code}`} className="font-semibold hover:underline"><span className="mr-1.5 font-mono text-xs">{code}</span>{r.title}</Link> : code}</td>
            <td className="p-2">{fmt === "proof" ? "Half-verse after the reveal" : "Opening śloka"}</td>
            <td className="p-2 text-right">{posted ? (st?.views ?? "–") : "not posted"}</td>
            <td className="p-2 text-right">{st?.avg_view_pct != null ? `${Math.round(st.avg_view_pct)}%` : "–"}</td>
            <td className="p-2 text-right">{r && at(r, st, 5) != null ? `${at(r, st, 5)}%` : "–"}</td>
            <td className="p-2 text-right">{r && at(r, st, 20) != null ? `${at(r, st, 20)}%` : "–"}</td>
          </tr>))}</tbody>
      </table></div>
    </Card>
  );
}
