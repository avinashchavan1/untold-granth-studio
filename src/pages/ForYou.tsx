import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ChevronDown, Circle, Hand, Mic, Plug, Send, Stamp } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Empty, ErrorNote, SectionTitle, Spinner } from "../components/ui";
import { VoiceBudget } from "../components/VoiceBudget";
import { studio, usePublications, useReels, useWorkStatus } from "../lib/api";
import { supabase } from "../lib/supabase";

// "For you": everything only the owner can do, in one list, most urgent first, so the Timeline doesn't have to be searched.
// Two sources: (1) derived live from the data (reels waiting for approval before their slot, failed posts, connection
// problems, Claude waiting on a choice, a low voice budget); (2) rows Claude adds with `python3 scripts/status.py ask "..."`
// (table owner_actions), which the owner ticks off here.
export interface OwnerAction { id: number; key: string | null; title: string; detail: string | null; link: string | null; reel_code: string | null; priority: number; due: string | null; created_at: string; done_at: string | null; done_by: string | null }
type Item = { id: string; pri: 1 | 2 | 3; icon: typeof Stamp; title: string; detail?: string | null; link?: string | null; when?: string | null; action?: OwnerAction };

export const useOwnerActions = () =>
  useQuery({ queryKey: ["owner_actions"], refetchInterval: 60e3, queryFn: async () => {
    const { data, error } = await supabase.from("owner_actions").select("*").order("created_at", { ascending: false }).limit(60);
    if (error) throw new Error(error.message);
    return (data ?? []) as OwnerAction[];
  } });
const useHealth = () => useQuery({ queryKey: ["health"], queryFn: () => studio<{ issues: { level: "warn" | "error"; where: string; text: string; fix?: string }[] }>("health"), staleTime: 10 * 60e3, retry: false });
const IST = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function useForYou() {
  const reels = useReels(), pubs = usePublications(), acts = useOwnerActions(), health = useHealth(), ws = useWorkStatus();
  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    const now = Date.now(), byId = new Map((reels.data ?? []).map((r) => [r.id, r]));
    // 1. reels waiting for approval, by their next slot
    for (const r of reels.data ?? []) {
      if (r.stage !== "review") continue;
      const next = (pubs.data ?? []).filter((p) => p.reel_id === r.id && p.state === "scheduled" && p.scheduled_for).map((p) => p.scheduled_for!).sort()[0];
      const h = next ? (new Date(next).getTime() - now) / 36e5 : null;
      out.push({ id: `review-${r.code}`, pri: h !== null && h < 72 ? 1 : next ? 2 : 3, icon: Stamp, title: `Watch and approve ${r.code}: ${r.title}`,   // gone as soon as you press Approve on the reel
        detail: next ? `Scheduled ${IST(next)}. It won't post until you approve it.` : "Not scheduled yet: approve it and Autopilot gives it a slot.", link: `/reels/${r.code}`, when: next });
    }
    // 2. posts that failed after every retry
    for (const p of pubs.data ?? []) if (p.state === "failed") {
      const r = byId.get(p.reel_id);
      out.push({ id: `fail-${p.id}`, pri: 1, icon: Send, title: `${p.platform} post failed${r ? `: ${r.code}` : ""}`, detail: p.last_error, link: r ? `/reels/${r.code}` : "/timeline" });
    }
    // 3. connection problems (same check as the banner)
    for (const i of health.data?.issues ?? []) out.push({ id: `health-${i.text}`, pri: i.level === "error" ? 1 : 3, icon: Plug, title: i.text, link: i.fix ?? "/settings" });
    // 4. Claude is waiting on a choice
    if (ws.data?.state === "waiting" && ws.data.task) out.push({ id: "waiting", pri: 1, icon: Hand, title: `Claude is waiting on you: ${ws.data.task}`, detail: ws.data.detail, link: ws.data.reel_code ? `/reels/${ws.data.reel_code}` : "/live" });
    // 5. low voice budget
    const vb = ws.data?.info?.voice_budget;
    if (vb?.limit && vb.limit - vb.used < 0.15 * vb.limit && !(acts.data ?? []).some((a) => !a.done_at && /elevenlabs/i.test(a.title)))
      out.push({ id: "budget", pri: 1, icon: Mic, title: `ElevenLabs almost used up: ${((vb.limit - vb.used) / 1000).toFixed(1)}k left`, detail: "Upgrade the plan or add a new key when Claude asks.", link: "/settings" });
    // 6. Claude's asks
    // approvals are never asks: the reel's own review item above appears and disappears with its stage (owner, Nov 28 2026)
    for (const a of acts.data ?? []) if (!a.done_at && !/-(re)?approve$/.test(a.key ?? "") && !/^(re-?)?approve\b/i.test(a.title)) out.push({ id: `ask-${a.id}`, pri: (Math.min(3, Math.max(1, a.priority)) as 1 | 2 | 3), icon: Circle, title: a.title, detail: a.detail, link: a.link ?? (a.reel_code ? `/reels/${a.reel_code}` : null), when: a.due, action: a });
    return out.sort((a, b) => a.pri - b.pri || (a.when ?? "9").localeCompare(b.when ?? "9"));
  }, [reels.data, pubs.data, acts.data, health.data, ws.data]);
  return { items, loading: reels.isLoading || pubs.isLoading || acts.isLoading, error: reels.error || pubs.error || acts.error, done: (acts.data ?? []).filter((a) => a.done_at).slice(0, 8) };
}

const PRI = { 1: { label: "Do first", tone: "border-vermilion/40 bg-vermilion/5" }, 2: { label: "Soon", tone: "border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/30" }, 3: { label: "When you have time", tone: "border-parchment-deep bg-white/50 dark:border-night-700 dark:bg-night-900/40" } } as const;

export default function ForYou() {
  const { items, loading, error, done } = useForYou();
  const qc = useQueryClient();
  const [showDone, setShowDone] = useState(false);
  const tick = useMutation({ mutationFn: async (a: OwnerAction) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("owner_actions").update({ done_at: a.done_at ? null : new Date().toISOString(), done_by: a.done_at ? null : u.user?.email ?? "owner" }).eq("id", a.id);
    if (error) throw new Error(error.message);
  }, onSettled: () => qc.invalidateQueries({ queryKey: ["owner_actions"] }) });
  if (loading) return <Spinner label="Loading your list…" />;
  const Row = ({ i }: { i: Item }) => {
    const Icon = i.icon, inner = (
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{i.title}</div>
        {i.detail && <div className="mt-0.5 text-sm text-ink-soft dark:text-parchment/70">{i.detail}</div>}
        {i.action?.due && <div className="mt-0.5 text-xs font-semibold opacity-70">Due {new Date(i.action.due).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>}
      </div>);
    return (
      <li className={`flex items-start gap-3 rounded-xl border p-3 ${PRI[i.pri].tone}`}>
        {i.action
          ? <button aria-label="Mark done" title="Mark done" onClick={() => tick.mutate(i.action!)} className="mt-0.5 shrink-0 text-gold-deep hover:text-gold dark:text-gold"><Circle size={20} /></button>
          : <Icon size={20} className="mt-0.5 shrink-0 text-gold-deep dark:text-gold" />}
        {i.link ? (i.link.startsWith("/") ? <Link to={i.link} className="min-w-0 flex-1 hover:underline">{inner}</Link> : <a href={i.link} target="_blank" rel="noreferrer" className="min-w-0 flex-1 hover:underline">{inner}</a>) : inner}
      </li>);
  };
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide">For you</h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-parchment/60">Everything only you can do, most urgent first. It fills itself from the reels, posts and connections, plus what Claude asks you. Tap the circle to tick off Claude's asks.</p>
      </div>
      {error && <ErrorNote error={error} />}
      <VoiceBudget />
      {([1, 2, 3] as const).map((p) => { const list = items.filter((i) => i.pri === p); return list.length ? (
        <Card key={p}><SectionTitle>{p === 1 && <AlertTriangle size={18} className="mr-1 inline text-vermilion" />}{PRI[p].label} · {list.length}</SectionTitle><ul className="grid gap-2">{list.map((i) => <Row key={i.id} i={i} />)}</ul></Card>
      ) : null; })}
      {!items.length && <Empty>Nothing waiting on you. 🎉</Empty>}
      {done.length > 0 && (
        <Card>
          <button onClick={() => setShowDone((s) => !s)} className="flex items-center gap-1 font-semibold"><CheckCircle2 size={16} className="text-emerald-600" /> Done recently · {done.length} <ChevronDown size={14} className={showDone ? "rotate-180" : ""} /></button>
          {showDone && <ul className="mt-2 grid gap-1 text-sm">{done.map((a) => (
            <li key={a.id} className="flex items-center gap-2 opacity-70"><button aria-label="Mark not done" onClick={() => tick.mutate(a)}><CheckCircle2 size={16} className="text-emerald-600" /></button><span className="line-through">{a.title}</span><span className="ml-auto text-xs">{a.done_by === "claude" ? "Claude" : "you"} · {new Date(a.done_at!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></li>
          ))}</ul>}
        </Card>
      )}
    </div>
  );
}
