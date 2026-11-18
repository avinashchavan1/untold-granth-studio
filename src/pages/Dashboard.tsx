import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, Empty, ErrorNote, SectionTitle, Spinner, StageBadge, fmtDate } from "../components/ui";
import { Target } from "../components/Target";
import { useActivity, useChannels, useConnections, usePublications, useReels } from "../lib/api";
import { STAGES, type Stage } from "../lib/types";

export default function Dashboard() {
  const reels = useReels();
  const pubs = usePublications();
  const act = useActivity();
  const ch = useChannels();
  const conn = useConnections();
  if (reels.isLoading) return <Spinner />;
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
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-deep sm:text-xs sm:tracking-[0.25em] dark:text-gold">Untold Ramayana · Valmiki, Critical Edition</div>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-wide sm:text-4xl">Today in the studio</h1>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2 font-mono text-xs text-ink-soft dark:text-parchment/60">
          {(ch.data ?? []).map((c) => <a key={c.platform} href={c.url ?? "#"} target="_blank" rel="noreferrer" className="rounded-full border border-parchment-deep px-3 py-1 hover:border-gold dark:border-night-700">{c.platform} {c.handle}</a>)}
        </div>
      </div>

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
        {act.isLoading ? <Spinner /> : (act.data ?? []).length === 0 ? <Empty>No activity yet.</Empty> : (
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
