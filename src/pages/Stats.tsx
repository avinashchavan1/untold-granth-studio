import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, CalendarClock, ChevronDown, Clock, Download, RefreshCw, TrendingUp } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Empty, ErrorNote, SectionTitle, Spinner } from "../components/ui";
import { studio, useFollowers, usePublications, useReels, useStatsDaily, useStatsLog, type FollowerDay, type StatDay, type StatLog } from "../lib/api";
import type { Publication, Reel } from "../lib/types";
import { BestTimePanel } from "../components/BestTimePanel";

// Stats: what's working.
// Refresh rhythm (kept small on purpose: Meta and YouTube rate-limit per account, and posting shares those limits):
// the server re-reads each post hourly for its first 48 h, every 6 h up to a week, then daily (timer at :23 past each hour);
// "Refresh now" re-reads everything at most once per 10 minutes. This page re-reads the saved numbers every minute (free).
// Every chart is a single series (one platform or one measure), so no colour legend is needed: the title names it.
const PLATS = [{ key: "instagram", label: "Instagram" }, { key: "youtube", label: "YouTube" }, { key: "facebook", label: "Facebook" }] as const;
const n = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : 0);
const fmt = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e4 ? `${Math.round(v / 1e3)}k` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : String(Math.round(v)));
const pct = (v: number) => `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;
const dayISO = (d: Date) => d.toISOString().slice(0, 10);
const category = (r?: Reel) => r?.category ?? (r?.script as { category?: string } | null)?.category ?? "Other";
const IST = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) + " IST";
export const ago = (iso: string | null | undefined, now = Date.now()) => {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  return s < 60 ? "just now" : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min ago` : `${Math.round(s / 86400)} days ago`;
};
const istHour = (d: Date) => (d.getUTCHours() + d.getUTCMinutes() / 60 + 5.5) % 24;
// the hourly timer runs at :23 UTC (:53 IST) and skips the quiet hours 00:00–08:00 IST
const nextTimer = (now = new Date()) => { const t = new Date(now); t.setUTCMinutes(23, 0, 0); if (t <= now) t.setUTCHours(t.getUTCHours() + 1); while (istHour(t) < 8) t.setUTCHours(t.getUTCHours() + 1); return t; };
const useNow = (ms = 30e3) => { const [t, setT] = useState(Date.now()); useEffect(() => { const i = setInterval(() => setT(Date.now()), ms); return () => clearInterval(i); }, [ms]); return t; };
const RANGES = [{ key: "7", label: "Last 7 days", days: 7 }, { key: "30", label: "Last 30 days", days: 30 }, { key: "all", label: "All time", days: 1e5 }] as const;

export default function Stats() {
  const reels = useReels(), pubs = usePublications(), daily = useStatsDaily(), fol = useFollowers(), log = useStatsLog();
  const qc = useQueryClient();
  const now = useNow();
  const [st, setSt] = useState<{ busy?: boolean; err?: string; note?: string }>({});
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("all");
  useEffect(() => { const i = setInterval(() => qc.invalidateQueries({ queryKey: ["pubs"] }), 60e3); return () => clearInterval(i); }, [qc]);
  if (reels.isLoading || pubs.isLoading) return <Spinner label="Loading stats…" />;
  if (reels.error || pubs.error) return <ErrorNote error={reels.error ?? pubs.error} />;
  const byId = Object.fromEntries((reels.data ?? []).map((r) => [r.id, r]));
  const since = now - RANGES.find((x) => x.key === range)!.days * 864e5;
  const postedAll = (pubs.data ?? []).filter((p) => p.state === "posted");
  const posted = postedAll.filter((p) => p.posted_at && new Date(p.posted_at).getTime() >= since);
  const last = postedAll.map((p) => p.stats_at).filter(Boolean).sort().pop() ?? null;
  const refresh = async () => {
    setSt({ busy: true });
    try {
      const r = await studio<{ cooldown?: number; checked?: number }>("refresh_stats");
      setSt(r.cooldown ? { note: `Updated less than 10 minutes ago, so the platforms weren't asked again (protects your rate limits). Try again in ${r.cooldown} min.` } : { note: `Updated ${r.checked ?? 0} posts just now.` });
    } catch (e) { setSt({ err: (e as Error).message }); }
    ["pubs", "stats_daily", "follower_daily", "stats_log"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };
  const csv = () => {
    const rows = [["reel", "title", "category", "platform", "posted_at", "views", "likes", "comments", "shares", "saves", "reach", "stats_updated"]];
    for (const p of postedAll) { const r = byId[p.reel_id], s = p.stats ?? {}; rows.push([r?.code ?? "", r?.title ?? "", category(r), p.platform, p.posted_at ?? "", ...["views", "likes", "comments", "shares", "saved", "reach"].map((k) => String(s[k] ?? "")), p.stats_at ?? ""]); }
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" })); a.download = `stats_${dayISO(new Date())}.csv`; a.click();
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-wide">Stats</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-soft dark:text-parchment/60">
            <Clock size={14} /> <span>Last updated <b className="text-ink dark:text-parchment">{last ? `${IST(last)} · ${ago(last, now)}` : "never"}</b></span>
            <span>· next automatic check {IST(nextTimer(new Date(now)).toISOString()).split(", ").pop()}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select id="stats-range" aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value as typeof range)} className="rounded-xl border border-parchment-deep bg-white/80 px-3 py-1.5 text-sm font-semibold dark:border-night-700 dark:bg-night-950">
            {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <Button size="sm" onClick={csv} disabled={!postedAll.length}><Download size={14} /> CSV</Button>
          <Button size="sm" disabled={st.busy} onClick={refresh}><RefreshCw size={14} className={st.busy ? "animate-spin" : ""} /> {st.busy ? "Updating…" : "Refresh now"}</Button>
        </div>
      </div>
      {st.err && <p className="text-sm text-vermilion">{st.err}</p>}
      {st.note && <p className="text-sm text-ink-soft dark:text-parchment/70">{st.note}</p>}

      <WeeklyReport reels={reels.data ?? []} pubs={pubs.data ?? []} daily={daily.data ?? []} />

      <div className="grid gap-3 sm:grid-cols-3">
        {PLATS.map((p) => <PlatformTile key={p.key} label={p.label} now={now} pubs={posted.filter((x) => x.platform === p.key)} fol={(fol.data ?? []).filter((f) => f.platform === p.key)} />)}
      </div>

      <BestTimePanel pubs={pubs.data ?? []} reels={reels.data ?? []} fol={fol.data ?? []} />

      {posted.length === 0 ? <Empty>No posts in this range yet. Numbers show up within the hour after a post (or press Refresh now).</Empty> : (
        <>
          <ReelTable posted={posted} byId={byId} log={log.data ?? []} now={now} />
          <div className="grid gap-6 xl:grid-cols-2">
            <CategoryBars posted={posted} byId={byId} />
            <HourBars posted={posted} />
          </div>
          <HookVsViews posted={posted} byId={byId} />
        </>
      )}
      <Card className="!p-4 text-xs text-ink-soft dark:text-parchment/60">
        <b className="text-ink dark:text-parchment">How fresh are these numbers?</b> Each post is re-read every hour for its first 2 days, every 6 hours up to a week, then once a day, except 12 am to 8 am IST (quiet hours; Refresh now still works any time).
        That keeps us far below Instagram's, Facebook's and YouTube's rate limits, which your posting shares, so a busy stats check can never block a scheduled post.
        Views: YouTube views, Instagram plays (needs the <code>instagram_manage_insights</code> permission), Facebook Reels plays.
      </Card>
    </div>
  );
}

// ---- weekly report: last 7 days at a glance + what's next + what needs you
function WeeklyReport({ reels, pubs, daily }: { reels: Reel[]; pubs: Publication[]; daily: StatDay[] }) {
  const now = Date.now(), wk = now - 7 * 864e5, nextWk = now + 7 * 864e5;
  const byId = Object.fromEntries(reels.map((r) => [r.id, r]));
  const postedWk = pubs.filter((p) => p.state === "posted" && p.posted_at && new Date(p.posted_at).getTime() > wk);
  const viewsOn = (day: string) => daily.filter((d) => d.day <= day).reduce((acc, d) => { acc[`${d.reel_id}:${d.platform}`] = n(d.stats.views); return acc; }, {} as Record<string, number>);
  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
  const gained = sum(viewsOn(dayISO(new Date()))) - sum(viewsOn(dayISO(new Date(wk))));
  const top = [...pubs.filter((p) => p.state === "posted")].sort((a, b) => n(b.stats?.views) - n(a.stats?.views))[0];
  const upcoming = pubs.filter((p) => p.state === "scheduled" && p.scheduled_for && new Date(p.scheduled_for).getTime() < nextWk).sort((a, b) => a.scheduled_for!.localeCompare(b.scheduled_for!));
  const review = reels.filter((r) => r.stage === "review" && !r.reviewed);
  const failed = pubs.filter((p) => p.state === "failed");
  return (
    <Card>
      <SectionTitle><span className="inline-flex items-center gap-2"><TrendingUp size={18} /> This week</span></SectionTitle>
      <div className="grid gap-4 sm:grid-cols-3">
        <Hero label="Posts in the last 7 days" value={String(postedWk.length)} sub={postedWk.map((p) => `${byId[p.reel_id]?.code} ${p.platform}`).join(" · ") || "none yet"} />
        <Hero label="Views gained this week" value={fmt(Math.max(0, gained))} sub="all platforms, from the daily snapshots" />
        <Hero label="Top reel so far" value={top ? byId[top.reel_id]?.code ?? "—" : "—"} sub={top ? `${fmt(n(top.stats?.views))} views on ${top.platform}` : "post a reel to see this"} />
      </div>
      <div className="mt-4 grid gap-4 text-sm lg:grid-cols-2">
        <div>
          <p className="mb-1.5 font-semibold">Coming up (next 7 days)</p>
          {upcoming.length ? <ul className="grid gap-1">{upcoming.map((p) => <li key={p.id} className="flex gap-2"><CalendarClock size={15} className="mt-0.5 shrink-0" /><Link className="font-mono text-gold-deep dark:text-gold" to={`/reels/${byId[p.reel_id]?.code}`}>{byId[p.reel_id]?.code}</Link> {p.platform} · {IST(p.scheduled_for!)}</li>)}</ul>
            : <p className="text-ink-soft dark:text-parchment/60">Nothing scheduled. Use <Link className="underline" to="/timeline">Timeline → Auto-fill</Link> or a reel's Post everywhere.</p>}
        </div>
        <div>
          <p className="mb-1.5 font-semibold">Needs you</p>
          <ul className="grid gap-1">
            {review.length > 0 && <li>{review.length} reel{review.length > 1 ? "s" : ""} waiting for your citation check: {review.slice(0, 8).map((r) => <Link key={r.id} className="mr-1.5 font-mono text-gold-deep dark:text-gold" to={`/reels/${r.code}`}>{r.code}</Link>)}</li>}
            {failed.map((p) => <li key={p.id} className="text-vermilion">{byId[p.reel_id]?.code} failed on {p.platform}{p.last_error ? `: ${p.last_error.slice(0, 120)}` : ""}</li>)}
            {!review.length && !failed.length && <li className="text-ink-soft dark:text-parchment/60">Nothing. 🎉</li>}
          </ul>
        </div>
      </div>
    </Card>
  );
}
const Hero = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="rounded-2xl border border-parchment-deep p-4 dark:border-night-700">
    <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-parchment/60">{label}</p>
    <p className="tabular mt-1 font-display text-3xl font-extrabold">{value}</p>
    <p className="mt-1 truncate text-xs text-ink-soft dark:text-parchment/60" title={sub}>{sub}</p>
  </div>
);

// ---- per platform: totals, engagement rate, follower trend, when it was last read
function PlatformTile({ label, pubs, fol, now }: { label: string; pubs: Publication[]; fol: FollowerDay[]; now: number }) {
  const sum = (k: string) => pubs.reduce((a, p) => a + n(p.stats?.[k]), 0);
  const views = sum("views"), eng = sum("likes") + sum("comments") + sum("shares") + sum("saved");
  const series = fol.map((f) => ({ x: f.day, y: n(f.followers) }));
  const nowF = series.at(-1)?.y ?? null, weekAgo = series.find((s) => s.x >= dayISO(new Date(Date.now() - 7 * 864e5)))?.y ?? null;
  const last = pubs.map((p) => p.stats_at).filter(Boolean).sort().pop() ?? null;
  return (
    <Card className="!p-4">
      <div className="flex items-baseline justify-between gap-2"><p className="font-bold">{label}</p><span className="text-[11px] text-ink-soft dark:text-parchment/60" title={last ? IST(last) : ""}>updated {ago(last, now)}</span></div>
      <p className="mt-1 text-sm"><span className="tabular font-display text-2xl font-extrabold">{nowF ?? "—"}</span> followers
        {nowF !== null && weekAgo !== null && <span className="ml-2 text-xs text-ink-soft dark:text-parchment/60">{nowF - weekAgo >= 0 ? "+" : ""}{nowF - weekAgo} this week</span>}</p>
      <Spark data={series} label={`${label} followers`} />
      <p className="mt-2 text-xs text-ink-soft dark:text-parchment/60"><span className="tabular">{fmt(views)}</span> views · <span className="tabular">{fmt(eng)}</span> reactions{views > 0 ? ` (${pct(eng / views)} of views)` : ""} · {pubs.length} posts</p>
    </Card>
  );
}

function Spark({ data, label, height = 56 }: { data: { x: string; y: number }[]; label: string; height?: number }) {
  const [hi, setHi] = useState<number | null>(null);
  if (data.length < 2) return <p className="mt-2 text-xs text-ink-soft dark:text-parchment/60" style={{ minHeight: height }}>The trend line appears after two readings.</p>;
  const W = 300, H = height, max = Math.max(1, ...data.map((d) => d.y)), min = Math.min(...data.map((d) => d.y));
  const X = (i: number) => 4 + (i * (W - 8)) / (data.length - 1), Y = (v: number) => H - 6 - ((v - min) / Math.max(1, max - min)) * (H - 12);
  const path = data.map((d, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(d.y).toFixed(1)}`).join("");
  return (
    <div className="relative mt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-ink dark:text-gold" style={{ height: H }} role="img" aria-label={`${label}: ${data.map((d) => `${d.x} ${d.y}`).join(", ")}`}
        onMouseLeave={() => setHi(null)} onMouseMove={(e) => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); setHi(Math.max(0, Math.min(data.length - 1, Math.round(((e.clientX - r.left) / r.width) * (data.length - 1))))); }}>
        <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {hi !== null && <><line x1={X(hi)} x2={X(hi)} y1={0} y2={H} stroke="currentColor" strokeOpacity={0.25} vectorEffect="non-scaling-stroke" /><circle cx={X(hi)} cy={Y(data[hi].y)} r={4} fill="currentColor" stroke="white" strokeWidth={2} /></>}
      </svg>
      {hi !== null && <div className="pointer-events-none absolute -top-7 whitespace-nowrap rounded-md bg-night-900 px-2 py-0.5 text-xs font-semibold text-parchment" style={{ left: `${(X(hi) / W) * 100}%`, transform: "translateX(-50%)" }}>{data[hi].x}: {fmt(data[hi].y)}</div>}
    </div>
  );
}

// ---- every reel: sortable, with views at 24 h, engagement rate, freshness and a growth curve
type SortKey = "total" | "v24" | "rate" | "posted";
function ReelTable({ posted, byId, log, now }: { posted: Publication[]; byId: Record<string, Reel>; log: StatLog[]; now: number }) {
  const [sort, setSort] = useState<{ k: SortKey; desc: boolean }>({ k: "total", desc: true });
  const [open, setOpen] = useState<string | null>(null);
  const rows = useMemo(() => {
    const m: Record<string, { r: Reel; p: Record<string, Publication> }> = {};
    for (const p of posted) { const r = byId[p.reel_id]; if (!r) continue; (m[r.id] ??= { r, p: {} }).p[p.platform] = p; }
    return Object.values(m).map((x) => {
      const ps = Object.values(x.p);
      const total = ps.reduce((a, p) => a + n(p.stats?.views), 0), eng = ps.reduce((a, p) => a + n(p.stats?.likes) + n(p.stats?.comments) + n(p.stats?.shares) + n(p.stats?.saved), 0);
      // views 24 h after each platform's post time: the first reading at or after +24 h (null until it exists)
      let v24: number | null = 0;
      for (const p of ps) { const t = new Date(p.posted_at ?? 0).getTime() + 864e5; const hit = log.find((l) => l.reel_id === x.r.id && l.platform === p.platform && new Date(l.at).getTime() >= t); if (!hit) { v24 = null; break; } v24 += n(hit.views); }
      const postedAt = ps.map((p) => p.posted_at!).filter(Boolean).sort()[0] ?? null, upd = ps.map((p) => p.stats_at).filter(Boolean).sort().pop() ?? null;
      return { ...x, total, eng, rate: total ? eng / total : 0, v24, postedAt, upd };
    });
  }, [posted, byId, log]);
  const val = (r: (typeof rows)[number]) => (sort.k === "posted" ? new Date(r.postedAt ?? 0).getTime() : sort.k === "v24" ? r.v24 ?? -1 : r[sort.k]);
  const sorted = [...rows].sort((a, b) => (sort.desc ? val(b) - val(a) : val(a) - val(b)));
  const H = ({ k, children }: { k: SortKey; children: string }) => (
    <th className="pr-3 text-right"><button onClick={() => setSort({ k, desc: sort.k === k ? !sort.desc : true })} className="inline-flex items-center gap-0.5 uppercase">{children}{sort.k === k && (sort.desc ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}</button></th>
  );
  return (
    <Card>
      <SectionTitle right={<span className="text-xs text-ink-soft dark:text-parchment/60">Click a column to sort · click a row for its growth</span>}>Every reel</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="text-left text-xs tracking-wider text-ink-soft dark:text-parchment/60">
            <th className="py-2 pr-3 uppercase">Reel</th>{PLATS.map((p) => <th key={p.key} className="pr-3 text-right uppercase">{p.label}</th>)}
            <H k="total">Total views</H><H k="v24">Views at 24 h</H><H k="rate">Reactions / views</H><H k="posted">Posted</H><th className="text-right uppercase">Updated</th>
          </tr></thead>
          <tbody>{sorted.map((x) => (
            <Fragment key={x.r.id}>
              <tr onClick={() => setOpen(open === x.r.id ? null : x.r.id)} className="cursor-pointer border-t border-parchment-deep hover:bg-black/[.02] dark:border-night-700 dark:hover:bg-white/[.03]">
                <td className="py-2 pr-3"><span className="flex items-center gap-1.5"><ChevronDown size={13} className={open === x.r.id ? "rotate-180" : ""} /><Link onClick={(e) => e.stopPropagation()} to={`/reels/${x.r.code}`} className="font-mono text-xs text-gold-deep dark:text-gold">{x.r.code}</Link> <span className="truncate">{x.r.title.slice(0, 38)}</span></span><span className="ml-5 block text-[11px] text-ink-soft dark:text-parchment/60">{category(x.r)}</span></td>
                {PLATS.map((pl) => { const s = x.p[pl.key]?.stats; return <td key={pl.key} className="tabular pr-3 text-right">{s ? <a onClick={(e) => e.stopPropagation()} href={x.p[pl.key].post_url ?? "#"} target="_blank" rel="noreferrer" title={`${n(s.likes)} likes · ${n(s.comments)} comments`} className="hover:underline">{fmt(n(s.views))}</a> : "—"}</td>; })}
                <td className="tabular pr-3 text-right font-semibold">{fmt(x.total)}</td>
                <td className="tabular pr-3 text-right">{x.v24 === null ? <span className="text-ink-soft" title="Available one day after posting">…</span> : fmt(x.v24)}</td>
                <td className="tabular pr-3 text-right">{x.total ? pct(x.rate) : "—"}</td>
                <td className="pr-3 text-right text-xs">{x.postedAt ? IST(x.postedAt).replace(" IST", "") : "—"}</td>
                <td className="text-right text-xs text-ink-soft dark:text-parchment/60" title={x.upd ? IST(x.upd) : ""}>{ago(x.upd, now)}</td>
              </tr>
              {open === x.r.id && <tr><td colSpan={9} className="pb-4"><Growth reel={x.r} log={log} /></td></tr>}
            </Fragment>
          ))}</tbody>
        </table>
      </div>
    </Card>
  );
}

// one reel's views over time, summed across platforms (one series)
function Growth({ reel, log }: { reel: Reel; log: StatLog[] }) {
  const mine = log.filter((l) => l.reel_id === reel.id);
  const latest: Record<string, number> = {};
  const data = mine.map((l) => { latest[l.platform] = n(l.views); return { x: IST(l.at).replace(" IST", ""), y: Object.values(latest).reduce((a, b) => a + b, 0) }; });
  return (
    <div className="rounded-xl bg-black/[.03] p-3 dark:bg-white/5">
      <p className="text-xs font-semibold">Total views over time · {mine.length} reading{mine.length === 1 ? "" : "s"}</p>
      <Spark data={data} label={`${reel.code} total views`} height={90} />
    </div>
  );
}

// ---- average views per reel, by category (one measure → one colour)
function Bars({ title, note, rows }: { title: string; note?: string; rows: { k: string; v: number; tip: string }[] }) {
  const [hi, setHi] = useState<string | null>(null);
  const max = Math.max(1, ...rows.map((r) => r.v));
  return (
    <Card>
      <SectionTitle right={note && <span className="text-xs text-ink-soft dark:text-parchment/60">{note}</span>}>{title}</SectionTitle>
      <div className="grid gap-2">
        {rows.map((r) => (
          <div key={r.k} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm" onMouseEnter={() => setHi(r.k)} onMouseLeave={() => setHi(null)}>
            <span className="truncate">{r.k}</span>
            <span className="relative h-5 rounded bg-black/[.04] dark:bg-white/5">
              <span className="absolute inset-y-0 left-0 rounded-r bg-ink dark:bg-gold" style={{ width: `${Math.max(1.5, (r.v / max) * 100)}%` }} />
              {hi === r.k && <span className="absolute -top-7 left-0 whitespace-nowrap rounded-md bg-night-900 px-2 py-0.5 text-xs font-semibold text-parchment">{r.tip}</span>}
            </span>
            <span className="tabular w-12 text-right font-semibold">{fmt(r.v)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
function CategoryBars({ posted, byId }: { posted: Publication[]; byId: Record<string, Reel> }) {
  const agg: Record<string, { views: number; reels: Set<string> }> = {};
  for (const p of posted) { const c = category(byId[p.reel_id]); (agg[c] ??= { views: 0, reels: new Set() }); agg[c].views += n(p.stats?.views); agg[c].reels.add(p.reel_id); }
  const rows = Object.entries(agg).map(([c, a]) => ({ k: c, v: Math.round(a.views / a.reels.size), tip: `${Math.round(a.views / a.reels.size)} avg views · ${a.reels.size} reel${a.reels.size > 1 ? "s" : ""}` })).sort((a, b) => b.v - a.v);
  return <Bars title="Average views per reel, by category" rows={rows} />;
}
// ---- what time of day works for us (posting hour in IST → average views per post)
function HourBars({ posted }: { posted: Publication[] }) {
  const agg: Record<string, { v: number; c: number }> = {};
  for (const p of posted) { if (!p.posted_at) continue; const h = Number(new Date(p.posted_at).toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false })) % 24; const k = `${((h + 11) % 12) + 1} ${h >= 12 ? "PM" : "AM"}`; (agg[k] ??= { v: 0, c: 0 }); agg[k].v += n(p.stats?.views); agg[k].c++; }
  const rows = Object.entries(agg).map(([k, a]) => ({ k, v: Math.round(a.v / a.c), tip: `${Math.round(a.v / a.c)} avg views · ${a.c} post${a.c > 1 ? "s" : ""}` })).sort((a, b) => b.v - a.v);
  return <Bars title="Average views by posting hour (IST)" note={rows.length < 4 ? "needs more posts to mean much" : undefined} rows={rows} />;
}
// ---- does the hook score match real views?
function HookVsViews({ posted, byId }: { posted: Publication[]; byId: Record<string, Reel> }) {
  const per: Record<string, { r: Reel; views: number }> = {};
  for (const p of posted) { const r = byId[p.reel_id]; if (!r) continue; (per[r.id] ??= { r, views: 0 }).views += n(p.stats?.views); }
  const rows = Object.values(per).map((x) => ({ ...x, score: x.r.hook_score != null ? Number(x.r.hook_score) : null })).sort((a, b) => b.views - a.views);
  return (
    <Card>
      <SectionTitle right={<span className="text-xs text-ink-soft dark:text-parchment/60">Hook score = text strength of the first line (Script tab)</span>}>Hooks vs real views</SectionTitle>
      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
        <thead><tr className="text-left text-xs uppercase tracking-wider text-ink-soft dark:text-parchment/60"><th className="py-2 pr-3">Reel</th><th className="pr-3">Hook (narration)</th><th className="pr-3 text-right">Hook score</th><th className="text-right">Views</th></tr></thead>
        <tbody>{rows.map((x) => (
          <tr key={x.r.id} className="border-t border-parchment-deep align-top dark:border-night-700">
            <td className="py-2 pr-3"><Link to={`/reels/${x.r.code}`} className="font-mono text-xs text-gold-deep dark:text-gold">{x.r.code}</Link></td>
            <td className="pr-3">{x.r.hook_hi ?? "—"}</td><td className="tabular pr-3 text-right">{x.score ?? <span className="text-ink-soft" title="Scored hooks start with R010">—</span>}</td><td className="tabular text-right font-semibold">{fmt(x.views)}</td>
          </tr>))}</tbody>
      </table></div>
    </Card>
  );
}
