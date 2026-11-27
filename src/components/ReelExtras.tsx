import clsx from "clsx";
import { CheckCircle2, Circle, Download, ExternalLink, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button, Card, Empty, Spinner } from "./ui";
import { useClaims, useMediaUrl, useUpdateReel } from "../lib/api";
import type { FileRow, Reel } from "../lib/types";
import { CHANNEL, IG, W } from "../lib/channel";

// ---------------------------------------------------------------------------------------------
// #3 Hook options: 2–3 claim-first hooks written with the script (script.json → hook_options),
// each with a text score (hookscore.py: length, concrete detail, stakes, payload first, aimed at
// the viewer). The owner picks one; Claude records the reel with the pick.
export interface HookOption { hi: string; en: string; score?: number; why?: string; card?: string[] }
export function HookOptions({ r }: { r: Reel }) {
  const update = useUpdateReel();
  const opts = ((r.script as { hook_options?: HookOption[] } | null)?.hook_options ?? []);
  const chosen = r.hook_choice as unknown as HookOption | null | undefined;
  if (!opts.length) return null;
  const best = Math.max(...opts.map((o) => o.score ?? 0));
  return (
    <Card className="!p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-bold"><Sparkles size={16} /> Hook options</p>
        <span className="text-xs text-ink-soft dark:text-parchment/60">Score = how strong the first line reads (0–100). It can't predict views; your stats will show which style wins.</span>
      </div>
      <div className="mt-3 grid gap-2">
        {opts.map((o, i) => {
          const on = chosen ? chosen.hi === o.hi : i === 0;
          return (
            <button key={o.hi} onClick={() => update.mutate({ reel: r, patch: { hook_choice: { ...o } as Record<string, unknown> }, action: "hook picked" })}
              className={clsx("grid gap-1 rounded-xl border p-3 text-left text-sm transition", on ? "border-gold-deep bg-gold-soft/60 dark:border-gold dark:bg-gold/10" : "border-parchment-deep hover:border-gold-deep/60 dark:border-night-700")}>
              <span className="flex items-start justify-between gap-3">
                <span className="text-[15px] font-semibold">{o.hi}</span>
                {o.score != null && <span className={clsx("tabular shrink-0 rounded-full px-2 py-0.5 text-xs font-bold", o.score === best ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-black/[.05] dark:bg-white/10")}>{o.score}</span>}
              </span>
              <span className="text-ink-soft dark:text-parchment/60">{o.en}</span>
              {o.why && <span className="text-xs text-ink-soft dark:text-parchment/60">{o.why}</span>}
              <span className="text-xs font-semibold">{on ? (chosen ? "✓ Your pick" : "Current hook") : "Pick this"}</span>
            </button>
          );
        })}
      </div>
      {chosen && r.hook_hi && chosen.hi.replace(/\[[^\]]+\]\s*/g, "") !== r.hook_hi && <p className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-300">Picked a different hook than the recorded one: Claude will re-record shot 1 next session.</p>}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------
// #6 Fact-check view: every claim with its sources as links and a tick per claim (stored on the reel,
// keyed by claim text, so it survives re-syncs). The "I checked the citations" box needs every tick.
const isUrl = (s: string) => /^https?:\/\//.test(s);
export function useClaimProgress(r: Reel) {
  const claims = useClaims(r.id);
  const checks = ((r as Reel & { claim_checks?: Record<string, string> }).claim_checks ?? {});
  const list = claims.data ?? [];
  const done = list.filter((c) => checks[c.claim]).length;
  return { claims, checks, list, done, total: list.length, all: list.length > 0 && done === list.length };
}
export function FactCheck({ r }: { r: Reel }) {
  const update = useUpdateReel();
  const { claims, checks, list, done, total } = useClaimProgress(r);
  if (claims.isLoading) return <Spinner />;
  if (!list.length) return <Empty>No claims recorded yet. {W.needRef}</Empty>;
  const toggle = (claim: string) => {
    const next = { ...checks }; if (next[claim]) delete next[claim]; else next[claim] = new Date().toISOString();
    update.mutate({ reel: r, patch: { claim_checks: next } as Partial<Reel> });
  };
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-black/[.04] p-3 text-sm dark:bg-white/5">
        <b className="tabular">{done} of {total} claims checked</b>
        <span className="relative h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><span className="absolute inset-y-0 left-0 rounded-full bg-emerald-600" style={{ width: `${(done / total) * 100}%` }} /></span>
        <span className="text-xs text-ink-soft dark:text-parchment/60">Ticking each one is optional: one tick on Publish ("I checked the citations") marks them all.</span>
        {done < total && <Button size="sm" onClick={() => update.mutate({ reel: r, patch: { claim_checks: Object.fromEntries(list.map((c) => [c.claim, checks[c.claim] ?? new Date().toISOString()])) } as Partial<Reel> })}>Mark all checked</Button>}
      </div>
      {list.map((c, i) => {
        const ok = !!checks[c.claim];
        return (
          <Card key={c.id} className={clsx("!p-4", ok && "ring-2 ring-emerald-500/50")}>
            <div className="flex items-start gap-3">
              <button onClick={() => toggle(c.claim)} aria-label={ok ? "Untick this claim" : "Tick this claim as checked"} className="mt-0.5 shrink-0">
                {ok ? <CheckCircle2 size={22} className="text-emerald-600" /> : <Circle size={22} className="text-ink-soft" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-semibold"><span className="tabular mr-1 text-ink-soft">{i + 1}.</span>{c.claim}</p>
                <p className="mt-0.5 text-xs text-ink-soft dark:text-parchment/60">{c.ref}{!c.verified && " · not marked verified by Claude"}</p>
                {c.quote_sa && <p className="mt-2 rounded-lg bg-black/[.04] p-3 text-[15px] leading-relaxed dark:bg-white/5">{c.quote_sa}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.sources.map((s) => isUrl(s)
                    ? <a key={s} href={s} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate rounded-lg border border-parchment-deep px-2 py-1 text-xs font-semibold text-gold-deep dark:border-night-700 dark:text-gold"><ExternalLink size={12} /> {new URL(s).hostname.replace(/^www\./, "")}{new URL(s).pathname.length > 1 ? new URL(s).pathname.slice(0, 40) : ""}</a>
                    : <span key={s} className="rounded-lg bg-black/[.04] px-2 py-1 text-xs dark:bg-white/5">{s}</span>)}
                </div>
                {ok && <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">Checked {new Date(checks[c.claim]).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>}
              </div>
            </div>
          </Card>
        );
      })}
      {r.verify_note && <p className="text-sm text-ink-soft dark:text-parchment/60">{r.verify_note}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// #7 Story share kit: a 1080×1920 story image drawn in the browser from the reel's cover,
// plus which highlight it belongs in.
const HIGHLIGHT: Record<string, string> = Object.fromEntries(((CHANNEL as { categories?: { name: string; highlight?: string }[] }).categories ?? []).map((c) => [c.name, c.highlight ?? c.name.toUpperCase()]));
export function StoryKit({ r, cover }: { r: Reel; cover?: FileRow }) {
  const img = useMediaUrl(cover);
  const [st, setSt] = useState<{ busy?: boolean; err?: string }>({});
  const cat = r.category ?? (r.script as { category?: string } | null)?.category ?? "";
  const make = async () => {
    if (!img.data) return; setSt({ busy: true });
    try {
      const im = new Image(); im.crossOrigin = "anonymous"; im.src = img.data; await im.decode();
      const c = document.createElement("canvas"); c.width = 1080; c.height = 1920; const x = c.getContext("2d")!;
      x.fillStyle = "#FFC83D"; x.fillRect(0, 0, 1080, 1920);
      // the cover, slightly smaller, tilted, with a hard ink shadow (sticker look)
      x.save(); x.translate(540, 900); x.rotate(-0.04); const w = 860, h = w * (im.height / im.width);
      x.fillStyle = "#14123A"; x.fillRect(-w / 2 + 18, -h / 2 + 18, w, h); x.drawImage(im, -w / 2, -h / 2, w, h);
      x.strokeStyle = "#14123A"; x.lineWidth = 14; x.strokeRect(-w / 2, -h / 2, w, h); x.restore();
      const pill = (text: string, cx: number, cy: number, bg: string, fg: string, size: number, rot = 0) => {
        x.save(); x.translate(cx, cy); x.rotate(rot); x.font = `900 ${size}px Montserrat, sans-serif`; const tw = x.measureText(text).width + size * 1.3, th = size * 1.6;
        x.fillStyle = "#14123A"; x.beginPath(); x.roundRect(-tw / 2 + 10, -th / 2 + 10, tw, th, th / 2); x.fill();
        x.fillStyle = bg; x.strokeStyle = "#14123A"; x.lineWidth = 8; x.beginPath(); x.roundRect(-tw / 2, -th / 2, tw, th, th / 2); x.fill(); x.stroke();
        x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 0, 4); x.restore();
      };
      pill("NEW REEL 👀", 540, 190, "#FF4B3E", "#FFFFFF", 78, -0.05);
      pill("TAP TO WATCH", 540, 1700, "#14123A", "#FFC83D", 56, 0.03);
      x.font = "800 40px Montserrat, sans-serif"; x.fillStyle = "#14123A"; x.textAlign = "center"; x.fillText(IG.handle, 540, 1820);
      const a = document.createElement("a"); a.download = `${r.code}_story.png`; a.href = c.toDataURL("image/png"); a.click(); setSt({});
    } catch (e) { setSt({ err: `Couldn't draw the story image (${(e as Error).message}). Download the cover instead.` }); }
  };
  return (
    <div className="grid gap-2 rounded-2xl border border-parchment-deep p-4 text-sm dark:border-night-700">
      <p className="font-bold">Story share kit</p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>Instagram: open the reel → <b>Share → Add to story</b> (best: it links straight to the reel). Or post this story image and add a link sticker.</li>
        <li>Then add the story to the <b>{HIGHLIGHT[cat] ?? "category"}</b> highlight{cat ? ` (${cat})` : ""}.</li>
        <li>Facebook: <b>Share → Share to story</b> on the Page's reel.</li>
      </ol>
      <div><Button size="sm" disabled={!img.data || st.busy} onClick={make}><Download size={14} /> {st.busy ? "Drawing…" : "Download story image"}</Button></div>
      {st.err && <p className="text-xs text-vermilion">{st.err}</p>}
    </div>
  );
}
