import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Plus, Radar, RefreshCw, Rocket } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, ErrorNote, SectionTitle, Spinner } from "../components/ui";
import { studio, usePublications, useReels } from "../lib/api";
import { supabase } from "../lib/supabase";

// Best time + Autopilot.
// The server builds a weekday × hour score per platform every morning from: published studies (weak prior),
// similar channels' real posts (YouTube Data API, Instagram Business Discovery), our Instagram audience's online hours
// (from 100 followers), and our own results. Autopilot (off until switched on) schedules CHECKED reels into the best slots.
type Model = { platform: string; grid: number[][]; top: { dow: number; hour: number; score: number }[]; parts: any; updated_at: string };
type Peer = { id: string; platform: string; handle: string; title: string | null; followers: number | null; active: boolean; source: string; last_scan: string | null; last_error: string | null };
type Auto = { enabled: boolean; platforms: string[]; days_ahead: number; post_days: number[]; last_run: { at?: string; scheduled?: string[] }; updated_by: string | null };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PL: Record<string, string> = { instagram: "Instagram", youtube: "YouTube", facebook: "Facebook" };
const H0 = 7, H1 = 23;                       // hours shown (IST)
const hh = (h: number) => `${((h + 11) % 12) + 1} ${h >= 12 ? "PM" : "AM"}`;
const q = async <T,>(table: string, sel = "*"): Promise<T> => { const { data, error } = await supabase.from(table).select(sel); if (error) throw new Error(error.message); return data as T; };

export default function Timing() {
  const models = useQuery({ queryKey: ["timing_model"], queryFn: () => q<Model[]>("timing_model") });
  const peers = useQuery({ queryKey: ["peers"], queryFn: () => q<Peer[]>("peers") });
  const auto = useQuery({ queryKey: ["autopilot"], queryFn: () => q<Auto[]>("autopilot").then((r) => r[0]) });
  const counts = useQuery({ queryKey: ["peer_counts"], queryFn: () => q<{ peer_id: string }[]>("peer_posts", "peer_id") });
  const qc = useQueryClient();
  const [st, setSt] = useState<{ busy?: boolean; msg?: string; err?: string }>({});
  if (models.isLoading || peers.isLoading || auto.isLoading) return <Spinner />;
  if (models.error) return <ErrorNote error={models.error} />;
  const byP = Object.fromEntries((models.data ?? []).map((m) => [m.platform, m]));
  const n = (id: string) => (counts.data ?? []).filter((x) => x.peer_id === id).length;
  const rescan = async () => {
    setSt({ busy: true });
    try { const r = await studio<{ cooldown?: boolean }>("timing_rescan"); setSt({ msg: r.cooldown ? "Updated less than 10 minutes ago, so the platforms weren't asked again." : "Rescanned: similar channels read and the model rebuilt." }); }
    catch (e) { setSt({ err: (e as Error).message }); }
    ["timing_model", "peers", "peer_counts"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };
  const updated = (models.data ?? []).map((m) => m.updated_at).sort().pop();
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-wide">Best time</h1>
          <p className="mt-1 max-w-3xl text-sm text-ink-soft dark:text-parchment/60">When to post, learned from similar Hindi facts channels' real posts, our audience and our own results. Rebuilt every morning{updated ? ` · last ${new Date(updated).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} IST` : ""}.</p>
        </div>
        <Button size="sm" disabled={st.busy} onClick={rescan}><RefreshCw size={14} className={st.busy ? "animate-spin" : ""} /> {st.busy ? "Scanning…" : "Rescan now"}</Button>
      </div>
      {st.msg && <p className="text-sm text-ink-soft dark:text-parchment/70">{st.msg}</p>}
      {st.err && <p className="text-sm text-vermilion">{st.err}</p>}

      <AutopilotCard a={auto.data!} best={byP} />

      <div className="grid gap-6 xl:grid-cols-3">
        {["instagram", "youtube", "facebook"].map((p) => byP[p] && <Heat key={p} m={byP[p]} />)}
      </div>

      <PeersCard peers={peers.data ?? []} n={n} />

      <Card className="!p-4 text-xs text-ink-soft dark:text-parchment/60">
        <b className="text-ink dark:text-parchment">How it works.</b> Each similar channel's post is compared with that channel's own typical views (so big and small channels count equally), smoothed by hour and weekday.
        That is blended with published studies (evening peaks in India), our Instagram audience's online hours (from 100 followers) and our own posts; real data counts more as it grows.
        Everything comes through official APIs (YouTube Data API, Instagram Business Discovery), no scraping. Instagram hashtag data needs Meta's "Instagram Public Content Access" review, so it isn't used.
      </Card>
    </div>
  );
}

// ---- weekday × hour heatmap, one hue (more = darker), with hover values
function Heat({ m }: { m: Model }) {
  const [hi, setHi] = useState<{ d: number; h: number } | null>(null);
  const max = Math.max(...m.grid.flatMap((r) => r.slice(H0, H1 + 1)));
  const p = m.parts ?? {};
  const src = [`studies`, p.peers?.posts ? `${p.peers.posts} posts from ${p.peers.channels} similar channel${p.peers.channels === 1 ? "" : "s"}` : null, p.audience?.available ? "our audience's online hours" : null, p.own?.posts ? `${p.own.posts} of our posts` : null].filter(Boolean).join(" + ");
  return (
    <Card>
      <SectionTitle>{PL[m.platform] ?? m.platform}</SectionTitle>
      <p className="-mt-2 mb-3 text-xs text-ink-soft dark:text-parchment/60">Based on {src}{m.platform === "facebook" && !p.own?.posts ? " (uses Instagram's pattern until our Page has its own data)" : ""}.</p>
      <div className="overflow-x-auto">
        <div className="grid min-w-[420px] gap-[2px]" style={{ gridTemplateColumns: `2.2rem repeat(${H1 - H0 + 1}, minmax(0,1fr))` }} onMouseLeave={() => setHi(null)}>
          <span />
          {Array.from({ length: H1 - H0 + 1 }, (_, i) => <span key={i} className="text-center text-[9px] text-ink-soft dark:text-parchment/50">{(H0 + i) % 3 === 0 ? hh(H0 + i).replace(" ", "") : ""}</span>)}
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <Row key={d} d={d} m={m} max={max} hi={hi} setHi={setHi} />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-ink-soft dark:text-parchment/60">
        <span>{hi ? `${DAYS[hi.d]} ${hh(hi.h)} IST · ${m.grid[hi.d][hi.h].toFixed(2)}× an average hour` : "Hover a cell for its score"}</span>
        <span className="flex items-center gap-1">less <span className="h-2 w-16 rounded bg-gradient-to-r from-ink/5 to-ink dark:from-gold/10 dark:to-gold" /> more</span>
      </div>
      <p className="mt-3 text-sm font-semibold">Top slots</p>
      <ol className="mt-1 grid gap-0.5 text-sm">{m.top.slice(0, 4).map((t, i) => <li key={i} className="flex justify-between"><span>{i + 1}. {DAYS[t.dow]} {hh(t.hour)}</span><span className="tabular text-ink-soft dark:text-parchment/60">{t.score.toFixed(1)}×</span></li>)}</ol>
    </Card>
  );
}
function Row({ d, m, max, hi, setHi }: { d: number; m: Model; max: number; hi: { d: number; h: number } | null; setHi: (x: { d: number; h: number }) => void }) {
  return (
    <>
      <span className="pr-1 text-right text-[11px] font-semibold leading-5">{DAYS[d]}</span>
      {Array.from({ length: H1 - H0 + 1 }, (_, i) => { const h = H0 + i, v = m.grid[d][h] / max, on = hi?.d === d && hi?.h === h;
        return <span key={h} onMouseEnter={() => setHi({ d, h })} title={`${DAYS[d]} ${hh(h)} · ${m.grid[d][h].toFixed(2)}×`}
          className={`h-5 rounded-[3px] ${on ? "ring-2 ring-vermilion" : ""}`} style={{ background: `rgb(var(--heat) / ${(0.06 + 0.94 * Math.pow(Math.max(0, v), 1.4)).toFixed(3)})` }} />; })}
    </>
  );
}

// ---- autopilot
function AutopilotCard({ a, best }: { a: Auto; best: Record<string, Model> }) {
  const qc = useQueryClient();
  const reels = useReels(), pubs = usePublications();
  const [st, setSt] = useState<{ busy?: boolean; msg?: string; err?: string }>({});
  const set = async (patch: Partial<Auto>) => {
    setSt({ busy: true });
    try { const r = await studio<{ run?: { scheduled?: string[] } }>("autopilot_set", patch); setSt({ msg: r.run?.scheduled ? (r.run.scheduled.length ? `Autopilot scheduled ${r.run.scheduled.length} post${r.run.scheduled.length > 1 ? "s" : ""}.` : "Autopilot is on. Nothing new to schedule: tick more reels as checked.") : "Saved." }); }
    catch (e) { setSt({ err: (e as Error).message }); }
    ["autopilot", "pubs"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };
  const code = Object.fromEntries((reels.data ?? []).map((r) => [r.id, r.code]));
  const upcoming = (pubs.data ?? []).filter((p) => p.state === "scheduled" && p.scheduled_for).sort((x, y) => x.scheduled_for!.localeCompare(y.scheduled_for!)).slice(0, 12);
  const checked = (reels.data ?? []).filter((r) => r.reviewed && r.stage !== "published").length;
  return (
    <Card className={a.enabled ? "ring-2 ring-emerald-500/40" : ""}>
      <SectionTitle right={<Button variant={a.enabled ? "default" : "primary"} disabled={st.busy} onClick={() => set({ enabled: !a.enabled })}><Rocket size={15} /> {a.enabled ? "Turn off" : "Turn on Autopilot"}</Button>}>
        <span className="inline-flex items-center gap-2"><Radar size={18} /> Autopilot · {a.enabled ? <span className="text-emerald-700 dark:text-emerald-300">ON</span> : "off"}</span>
      </SectionTitle>
      <p className="text-sm">Every morning it fills the next {a.days_ahead} days: on each posting day without a post, it schedules your next <b>checked</b> reel at that day's best time for each platform. It never schedules a reel you haven't ticked, and you can cancel any slot on the reel's page. <span className="text-ink-soft dark:text-parchment/60">{checked} checked reel{checked === 1 ? "" : "s"} ready.</span></p>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex flex-wrap items-center gap-1.5"><b>Days:</b>{[1, 2, 3, 4, 5, 6, 0].map((d) => { const on = a.post_days.includes(d);
          return <button key={d} disabled={st.busy} onClick={() => set({ post_days: on ? a.post_days.filter((x) => x !== d) : [...a.post_days, d] })} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${on ? "bg-gold text-night-950 ring-gold-deep" : "ring-parchment-deep dark:ring-night-700"}`}>{DAYS[d]}</button>; })}</span>
        <span className="flex flex-wrap items-center gap-1.5"><b>Platforms:</b>{["instagram", "youtube", "facebook"].map((p) => { const on = a.platforms.includes(p);
          return <button key={p} disabled={st.busy} onClick={() => set({ platforms: on ? a.platforms.filter((x) => x !== p) : [...a.platforms, p] })} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${on ? "bg-gold text-night-950 ring-gold-deep" : "ring-parchment-deep dark:ring-night-700"}`}>{PL[p]}</button>; })}</span>
      </div>
      {best.youtube?.top?.[0] && <p className="mt-3 text-xs text-ink-soft dark:text-parchment/60">Tip from the data: {DAYS[best.youtube.top[0].dow]} {hh(best.youtube.top[0].hour)} is YouTube's strongest slot{!a.post_days.includes(best.youtube.top[0].dow) ? ` and ${DAYS[best.youtube.top[0].dow]} isn't one of your posting days yet` : ""}.</p>}
      {st.msg && <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">{st.msg}</p>}
      {st.err && <p className="mt-2 text-sm text-vermilion">{st.err}</p>}
      <p className="mb-1 mt-4 flex items-center gap-1.5 text-sm font-semibold"><CalendarClock size={15} /> Scheduled</p>
      {upcoming.length ? <ul className="grid gap-1 text-sm">{upcoming.map((p) => <li key={p.id} className="flex flex-wrap gap-2"><Link className="font-mono text-gold-deep dark:text-gold" to={`/reels/${code[p.reel_id]}`}>{code[p.reel_id]}</Link>{PL[p.platform]} · {new Date(p.scheduled_for!).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} IST{(p as any).scheduled_by === "autopilot" && <span className="rounded-full bg-emerald-100 px-2 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">autopilot</span>}</li>)}</ul>
        : <p className="text-sm text-ink-soft dark:text-parchment/60">Nothing scheduled yet.</p>}
      {a.last_run?.at && <p className="mt-2 text-[11px] text-ink-soft dark:text-parchment/60">Last autopilot run {new Date(a.last_run.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · scheduled {a.last_run.scheduled?.length ?? 0}</p>}
    </Card>
  );
}

// ---- the channels we learn from
function PeersCard({ peers, n }: { peers: Peer[]; n: (id: string) => number }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ platform: "instagram", handle: "" });
  const [st, setSt] = useState<{ busy?: boolean; msg?: string; err?: string }>({});
  const add = async () => {
    setSt({ busy: true });
    try { const r = await studio<{ name: string }>("peer_add", f); setSt({ msg: `Added ${r.name}. Its posts are read at the next scan (or press Rescan now).` }); setF({ ...f, handle: "" }); }
    catch (e) { setSt({ err: (e as Error).message }); }
    qc.invalidateQueries({ queryKey: ["peers"] });
  };
  const toggle = async (p: Peer) => { await studio("peer_toggle", { id: p.id, active: !p.active }); qc.invalidateQueries({ queryKey: ["peers"] }); };
  const list = [...peers].sort((a, b) => a.platform.localeCompare(b.platform) || Number(b.active) - Number(a.active) || (b.followers ?? 0) - (a.followers ?? 0));
  return (
    <Card>
      <SectionTitle>Channels we learn from</SectionTitle>
      <form className="mb-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (f.handle.trim()) add(); }}>
        <select aria-label="Platform" value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })} className="rounded-lg border border-parchment-deep bg-white/80 px-2 py-1.5 text-sm dark:border-night-700 dark:bg-night-950"><option value="instagram">Instagram</option><option value="youtube">YouTube</option></select>
        <input aria-label="Username or @handle" value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value })} placeholder={f.platform === "instagram" ? "username (a public creator/business account)" : "@handle"} className="min-w-0 flex-1 rounded-lg border border-parchment-deep bg-white/80 px-2.5 py-1.5 text-sm dark:border-night-700 dark:bg-night-950" />
        <Button size="sm" type="submit" disabled={st.busy || !f.handle.trim()}><Plus size={14} /> Add</Button>
      </form>
      {st.msg && <p className="mb-2 text-sm text-emerald-700 dark:text-emerald-300">{st.msg}</p>}
      {st.err && <p className="mb-2 text-sm text-vermilion">{st.err}</p>}
      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
        <thead><tr className="text-left text-xs uppercase tracking-wider text-ink-soft dark:text-parchment/60"><th className="py-1.5">Channel</th><th>Platform</th><th className="text-right">Followers</th><th className="text-right">Posts read</th><th className="pl-3">Status</th><th /></tr></thead>
        <tbody>{list.map((p) => (
          <tr key={p.id} className={`border-t border-parchment-deep dark:border-night-700 ${p.active ? "" : "opacity-50"}`}>
            <td className="py-1.5 pr-2">{p.title ?? p.handle} <span className="text-xs text-ink-soft">{p.handle.startsWith("#") ? "" : p.handle}</span></td>
            <td>{PL[p.platform]}</td>
            <td className="tabular text-right">{p.followers ? (p.followers >= 1e6 ? `${(p.followers / 1e6).toFixed(1)}M` : `${Math.round(p.followers / 1e3)}k`) : "—"}</td>
            <td className="tabular text-right">{n(p.id)}</td>
            <td className="pl-3 text-xs">{p.last_error ? <span className="text-vermilion" title={p.last_error}>{p.last_error.slice(0, 60)}</span> : p.last_scan ? "ok" : "not scanned yet"}</td>
            <td className="text-right"><button onClick={() => toggle(p)} className="text-xs font-semibold underline">{p.active ? "Pause" : "Use"}</button></td>
          </tr>))}</tbody>
      </table></div>
    </Card>
  );
}
