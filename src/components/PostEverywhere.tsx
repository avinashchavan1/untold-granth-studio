import clsx from "clsx";
import { CalendarClock, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui";
import { studio, useFollowers, usePublications, useReels } from "../lib/api";
import { bestHour, istDate, istParts, observations, POST_DAYS, type Main, type ObsSet } from "../lib/bestTime";
import type { FileRow, Publication, Reel } from "../lib/types";

// One panel for all platforms: tick where it goes, then post now or pick a time.
// Scheduled posts are started by the server's timer (every 5 minutes), so the app can be closed.
const PL = [
  { key: "instagram", label: "Instagram", master: "master_instagram" },
  { key: "youtube", label: "YouTube", master: "master_youtube" },
  { key: "facebook", label: "Facebook Page", master: "master_instagram" },
] as const;
type Key = (typeof PL)[number]["key"];

// next posting day (calendar.json → post_days) at the best slot for that platform (lib/bestTime.ts: research + audience + our results), in IST
export function nextBestSlot(now = new Date(), obs?: ObsSet, p: Main = "instagram") {
  const n = istParts(now);
  for (let d = n.day; d < n.day + 14; d++) {
    if (!POST_DAYS.includes((d + 4) % 7)) continue;
    const h = bestHour(p, d, obs ?? ([] as unknown as ObsSet), now, 7, 22.5);
    if (h !== null) return istDate(d, h);
  }
  return new Date(now.getTime() + 3600e3);
}
const toLocalInput = (d: Date) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 16); };
export const fmtIST = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) + " IST";

export function PostEverywhere({ r, pubs, files, auto }: { r: Reel; pubs: Publication[]; files: FileRow[]; auto: Record<string, boolean> }) {
  const qc = useQueryClient();
  const allPubs = usePublications(), allReels = useReels(), fol = useFollowers();
  const obs = useMemo(() => observations(allPubs.data ?? [], allReels.data ?? [], fol.data ?? []), [allPubs.data, allReels.data, fol.data]);
  const state = (k: Key) => pubs.find((p) => p.platform === k)?.state ?? "todo";
  const open = (k: Key) => !["posted", "posting", "scheduled"].includes(state(k));
  const ready = (k: Key) => auto[k] && files.some((f) => f.kind === PL.find((p) => p.key === k)!.master);
  const [pick, setPick] = useState<Record<Key, boolean>>(() => Object.fromEntries(PL.map((p) => [p.key, true])) as Record<Key, boolean>);
  const [mode, setMode] = useState<"now" | "later">("later");
  const [when, setWhen] = useState(() => toLocalInput(nextBestSlot(new Date(), obs)));
  const [privacy, setPrivacy] = useState("public");
  const [st, setSt] = useState<{ busy?: boolean; msg?: string; errs?: string[] }>({});
  const chosen = PL.filter((p) => pick[p.key] && open(p.key) && ready(p.key)).map((p) => p.key);
  const scheduled = pubs.filter((p) => p.state === "scheduled" && p.scheduled_for);
  const best = useMemo(() => nextBestSlot(new Date(), obs), [obs]);

  const go = async () => {
    setSt({ busy: true });
    try {
      const body = { reel_id: r.id, platforms: chosen, options: { privacy } };
      const res = mode === "now"
        ? await studio<{ results: Record<string, { ok: boolean; error?: string }> }>("publish_all", body)
        : await studio<{ results: Record<string, { ok: boolean; error?: string }>; at: string }>("schedule", { ...body, at: new Date(when).toISOString() });
      const errs = Object.entries(res.results).filter(([, v]) => !v.ok).map(([k, v]) => `${k}: ${v.error}`);
      const okN = Object.values(res.results).filter((v) => v.ok).length;
      setSt({ msg: okN ? (mode === "now" ? `Posting started on ${okN} platform${okN > 1 ? "s" : ""}.` : `Scheduled ${okN} post${okN > 1 ? "s" : ""} for ${fmtIST(new Date(when).toISOString())}.`) : undefined, errs });
    } catch (e) { setSt({ errs: [(e as Error).message] }); }
    qc.invalidateQueries({ queryKey: ["pubs"] }); qc.invalidateQueries({ queryKey: ["jobs", r.id] });
  };
  const cancel = async (k?: Key) => { await studio("unschedule", { reel_id: r.id, platforms: k ? [k] : undefined }); qc.invalidateQueries({ queryKey: ["pubs"] }); };

  return (
    <div className="grid gap-3 rounded-2xl border border-gold-deep/50 bg-gold-soft/40 p-4 dark:border-gold/30 dark:bg-gold/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-bold"><Send size={17} /> Post everywhere</h3>
        <span className="text-xs text-ink-soft dark:text-parchment/60">Next best slot: {fmtIST(best.toISOString())}</span>
      </div>

      {scheduled.length > 0 && (
        <div className="grid gap-1.5 rounded-xl bg-sky-50 p-3 text-sm text-sky-900 dark:bg-sky-950/50 dark:text-sky-200">
          {scheduled.map((p) => (
            <div key={p.platform} className="flex flex-wrap items-center gap-2">
              <CalendarClock size={15} /> <b className="capitalize">{p.platform}</b> scheduled for {fmtIST(p.scheduled_for!)}
              <button onClick={() => cancel(p.platform as Key)} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold underline"><X size={12} /> Cancel</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {PL.map((p) => {
          const s = state(p.key), can = open(p.key) && ready(p.key);
          return (
            <label key={p.key} className={clsx("flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold", can ? "border-parchment-deep dark:border-night-700" : "border-dashed border-parchment-deep opacity-60 dark:border-night-700")}>
              <input type="checkbox" className="h-4 w-4 accent-gold-deep" disabled={!can} checked={can && pick[p.key]} onChange={(e) => setPick({ ...pick, [p.key]: e.target.checked })} />
              {p.label}
              {!can && <span className="text-xs font-normal">· {s === "posted" ? "posted" : s === "posting" ? "posting now" : s === "scheduled" ? "scheduled" : !auto[p.key] ? "not connected" : "no master"}</span>}
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1.5"><input type="radio" name="when" checked={mode === "later"} onChange={() => setMode("later")} className="accent-gold-deep" /> At a time</label>
        <label className="flex items-center gap-1.5"><input type="radio" name="when" checked={mode === "now"} onChange={() => setMode("now")} className="accent-gold-deep" /> Now</label>
        {mode === "later" && (
          <span className="flex flex-wrap items-center gap-2">
            <input id="post-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="rounded-lg border border-parchment-deep bg-white/80 px-2 py-1 text-sm dark:border-night-700 dark:bg-night-950" />
            <button onClick={() => setWhen(toLocalInput(best))} className="text-xs font-semibold text-gold-deep underline dark:text-gold">Use best slot</button>
          </span>
        )}
        {pick.youtube && open("youtube") && (
          <label className="flex items-center gap-1.5 text-xs font-semibold">YouTube
            <select id="pe-privacy" value={privacy} onChange={(e) => setPrivacy(e.target.value)} className="rounded-md border border-parchment-deep bg-white/80 px-2 py-1 text-xs dark:border-night-700 dark:bg-night-950">
              <option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option>
            </select></label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={!r.reviewed || !chosen.length || st.busy} onClick={go} title={!r.reviewed ? "Tick the citation check first" : ""}>
          {mode === "now" ? <Send size={15} /> : <CalendarClock size={15} />}
          {st.busy ? "Working…" : mode === "now" ? `Post now to ${chosen.length || "…"}` : `Schedule ${chosen.length || "…"}`}
        </Button>
        {scheduled.length > 1 && <button onClick={() => cancel()} className="text-xs font-semibold underline">Cancel all scheduled</button>}
      </div>
      {!r.reviewed && <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Tick "I checked the citations" above to unlock posting.</p>}
      {st.msg && <p className="text-sm text-emerald-700 dark:text-emerald-300">{st.msg}</p>}
      {st.errs?.map((e) => <p key={e} className="text-sm text-vermilion">{e}</p>)}
      <p className="text-[11px] text-ink-soft dark:text-parchment/60">Times are in your browser's time zone (shown back in IST). Scheduled posts start within 5 minutes of the time, even if this app is closed.</p>
    </div>
  );
}
