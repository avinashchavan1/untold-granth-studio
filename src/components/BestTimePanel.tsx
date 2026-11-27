import clsx from "clsx";
import { CalendarClock, FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, SectionTitle } from "./ui";
import { bestHour, confidence, DOW, explain, fmtHour, heat, istParts, observations, PLATFORMS, POST_DAYS, RESEARCH, testHour, dayName, type Main } from "../lib/bestTime";
import type { FollowerDay } from "../lib/api";
import type { Publication, Reel } from "../lib/types";

// Best time to post: what the app decided for each platform and why (lib/bestTime.ts).
// One sequential colour (darker = better); each platform's map is scaled to its own best slot of the week.
const LABEL: Record<Main, string> = { instagram: "Instagram", youtube: "YouTube", facebook: "Facebook" };
const pctW = (w: number) => `${Math.round(w * 100)}%`;

export function BestTimePanel({ pubs, reels, fol }: { pubs: Publication[]; reels: Reel[]; fol: FollowerDay[] }) {
  const [p, setP] = useState<Main>("instagram");
  const obs = useMemo(() => observations(pubs, reels, fol as unknown as { platform: string; extra: Record<string, unknown> | null }[]), [pubs, reels, fol]);
  const now = new Date(), today = istParts(now).day;
  const grid = useMemo(() => heat(p, obs, today), [p, obs, today]);
  const next = useMemo(() => {
    const out: { day: number; best: number; test: number | null }[] = [];
    for (let d = today; out.length < 6 && d < today + 21; d++) { if (!POST_DAYS.includes((d + 4) % 7)) continue; const b = bestHour(p, d, obs, now); if (b !== null) out.push({ day: d, best: b, test: testHour(p, d, obs, now) }); }
    return out;
  }, [p, obs, today]);   // eslint-disable-line react-hooks/exhaustive-deps
  const e = next[0] ? explain(p, next[0].day, next[0].best, obs) : null;
  const conf = confidence(obs, p), R = RESEARCH.platforms[p];
  const audErr = fol.filter((f) => f.platform === "instagram").map((f) => (f.extra as Record<string, unknown>)?.online_error).filter(Boolean).pop() as string | undefined;
  const wR = e ? Math.max(0, 1 - e.wA) * (1 - e.wL) : 1, wA = e ? e.wA * (1 - e.wL) : 0, wL = e?.wL ?? 0;

  return (
    <Card className="grid gap-4">
      <SectionTitle right={<div role="tablist" className="flex gap-1">{PLATFORMS.map((k) => (
        <button key={k} role="tab" aria-selected={p === k} onClick={() => setP(k)} className={clsx("rounded-full px-3 py-1 text-xs font-semibold", p === k ? "bg-gold text-ink" : "bg-parchment-deep/40 text-ink-soft hover:bg-parchment-deep dark:bg-night-800 dark:text-parchment/70")}>{LABEL[k]}</button>))}</div>}>
        <span className="inline-flex items-center gap-2"><CalendarClock size={18} /> Best time to post</span>
      </SectionTitle>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          <div className="mb-1 flex justify-between text-[11px] text-ink-soft dark:text-parchment/60"><span>{LABEL[p]} · this week · IST</span><span>darker = better</span></div>
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: "34px repeat(32, minmax(0, 1fr))" }}>
            {grid.map((row) => [
              <div key={`l${row.dow}`} className={clsx("pr-1 text-right text-[10px] leading-[14px]", POST_DAYS.includes(row.dow) ? "font-semibold" : "text-ink-soft/70 dark:text-parchment/40")}>{DOW[row.dow]}</div>,
              ...row.v.map((v, k) => <div key={`${row.dow}-${k}`} title={`${DOW[row.dow]} ${fmtHour(7 + k * 0.5)} · ${Math.round(v * 100)}% of the week's best`} className="h-[14px] rounded-[3px]" style={{ background: `color-mix(in oklab, #C98A12 ${Math.round(8 + 92 * v * v)}%, transparent)` }} />),
            ])}
            <div />
            {[...Array(32)].map((_, k) => <div key={`t${k}`} className="text-center text-[9px] text-ink-soft dark:text-parchment/50">{k % 4 === 0 ? (7 + k / 2 > 12 ? `${7 + k / 2 - 12}p` : `${7 + k / 2}a`) : ""}</div>)}
          </div>
          <p className="mt-2 text-[11px] text-ink-soft dark:text-parchment/60">Bold days are your posting days (calendar.json → post_days).</p>
        </div>

        <div className="grid content-start gap-3 text-sm">
          <div>
            <div className="mb-1 font-semibold">Next posting days</div>
            <ul className="grid gap-1 tabular">
              {next.map((x) => (
                <li key={x.day} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-white/60 px-2 py-1 dark:bg-night-900">
                  <span>{dayName(x.day)}</span>
                  <span><b>{fmtHour(x.best)}</b>{x.test !== null && <span className="ml-2 text-[11px] text-ink-soft dark:text-parchment/60"><FlaskConical size={11} className="mr-0.5 inline" />test {fmtHour(x.test)}</span>}</span>
                </li>))}
            </ul>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between font-semibold"><span>What decided it</span><span className="text-[11px] font-normal text-ink-soft">confidence: {conf}</span></div>
            <div className="flex h-3 overflow-hidden rounded-full" aria-label="How much each layer counted">
              <div className="bg-[#E9C46A]" style={{ width: pctW(wR) }} title="Research" />
              <div className="bg-[#C98A12]" style={{ width: pctW(wA) }} title="Your audience online" />
              <div className="bg-[#7A4E00]" style={{ width: pctW(wL) }} title="Your results" />
            </div>
            <ul className="mt-1.5 grid gap-0.5 text-[12px]">
              <li><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#E9C46A]" /><b>Research</b> {pctW(wR)}: {R.summary}</li>
              <li><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#C98A12]" /><b>Your audience</b> {pctW(wA)}: {p === "youtube" ? "YouTube doesn't share this through its API (YouTube Studio → Analytics → Audience shows it)." : e?.audienceDays ? `${e.audienceDays} days of Instagram 'followers online'${p === "facebook" ? " (used at half weight for Facebook)" : ""}.` : `not recorded yet${audErr ? ` (${audErr})` : ""}.`}</li>
              <li><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#7A4E00]" /><b>Your results</b> {pctW(wL)}: {e?.posts ? `${e.posts} ${LABEL[p]} post${e.posts > 1 ? "s" : ""} with stats; slots near this time did ${e.results.toFixed(2)}× the usual.` : "no posts with stats yet."}</li>
              <li><span className="mr-1 inline-block h-2 w-2 rounded-full bg-ink dark:bg-parchment" /><b>Similar channels</b>: {e?.peers ? `${e.peerPosts} of their ${LABEL[p]} posts studied; this slot does ${e.peers.toFixed(2)}× their usual (weight ${Math.round((e.wP ?? 0) * 100)}%).` : "not studied yet."} <Link to="/best-time" className="font-semibold underline">Best time page</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <details className="text-xs text-ink-soft dark:text-parchment/70">
        <summary className="cursor-pointer font-semibold text-ink dark:text-parchment">How the app decides (and the studies behind the research layer)</summary>
        <p className="mt-2 leading-relaxed">
          Score = research × your audience × your results. Research is the starting guess; your audience (when your Instagram followers are online) gets up to half the say as days are recorded;
          your results (each post's early speed, views ÷ √age, compared with the posts made around it so channel growth doesn't skew it, by weekday and hour) count more with every post.
          About one post in five (one in eight once confidence is high) goes to a <b>test slot</b> at least 2 hours from the best, where your data is thinnest, so the system keeps learning.
          Auto-fill saves the reason for every slot with the post. Studies disagree a lot, so the research layer is deliberately gentle. Updated {RESEARCH.updated}; audience assumed: {RESEARCH.audience}.
        </p>
        <ul className="mt-2 grid gap-1">
          {R.sources.map((s) => <li key={s.name}>• <a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.name}</a>: {s.finding}</li>)}
        </ul>
      </details>
    </Card>
  );
}
