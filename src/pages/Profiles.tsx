import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, ExternalLink, Instagram, Sparkles, XCircle, Youtube } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CopyButton, ErrorNote, SectionTitle, Spinner, fmtDate } from "../components/ui";
import { mediaUrl, studio, useChannels, useConnections } from "../lib/api";
import { IG } from "../lib/channel";

type Step = { step: string; ok: boolean; detail?: string };
const ASSETS = [
  { file: "avatar_1080.png", label: "Instagram profile picture", size: "1080 × 1080", round: true },
  { file: "youtube_profile_800.png", label: "YouTube profile picture", size: "800 × 800", round: true },
  { file: "youtube_banner_2560x1440.jpg", label: "YouTube banner", size: "2560 × 1440 · text inside the phone-safe area", wide: true },
  { file: "youtube_watermark_300.png", label: "YouTube video watermark", size: "300 × 300, transparent" },
];

export default function Profiles() {
  const ch = useChannels();
  const conn = useConnections();
  if (ch.isLoading) return <Spinner />;
  if (ch.error) return <ErrorNote error={ch.error} />;
  const by = Object.fromEntries((ch.data ?? []).map((c) => [c.platform, c]));
  const ig = (by.instagram?.profile ?? {}) as Record<string, any>;
  const yt = (by.youtube?.profile ?? {}) as Record<string, any>;
  const applied = (by.youtube?.applied ?? {}) as { at?: string; by?: string; steps?: Step[] };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide">Profiles</h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-parchment/60">Brand kit and profile text for every platform. YouTube applies from here; Instagram doesn't allow apps to edit profiles, so copy each field in.</p>
      </div>

      <Card>
        <SectionTitle>Brand kit</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{ASSETS.map((a) => <Asset key={a.file} {...a} />)}</div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle right={<a href={IG.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-deep dark:text-gold">Open <ExternalLink size={13} /></a>}>
            <span className="inline-flex items-center gap-2"><Instagram size={18} /> Instagram · @{ig.username}</span>
          </SectionTitle>
          <p className="mb-3 text-sm text-ink-soft dark:text-parchment/60">Instagram app → Profile → <b>Edit profile</b>. Copy each field:</p>
          <div className="grid gap-3">
            <Field label="Profile picture" note="Edit picture → choose avatar_1080.png from the brand kit above" />
            <Field label="Name (searchable)" text={ig.name} limit={64} />
            <Field label="Bio" text={ig.bio} limit={150} />
            <Field label={`Link · title “${ig.link_title}”`} text={ig.link} />
            <Field label="Category" text={ig.category} />
          </div>
          <Checklist items={ig.settings} />
        </Card>

        <Card>
          <SectionTitle right={<a href="https://studio.youtube.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-deep dark:text-gold">YouTube Studio <ExternalLink size={13} /></a>}>
            <span className="inline-flex items-center gap-2"><Youtube size={18} /> YouTube · {yt.handle}</span>
          </SectionTitle>
          <ApplyYouTube connected={!!conn.data?.providers.youtube?.connected} />
          {applied.steps && (
            <div className="mt-3 rounded-xl border border-parchment-deep p-3 text-sm dark:border-night-700">
              <p className="mb-2 text-xs text-ink-soft dark:text-parchment/60">Last applied {fmtDate(applied.at)} by {applied.by}</p>
              <Steps steps={applied.steps} />
            </div>
          )}
          <div className="mt-4 grid gap-3">
            <Field label="Description" text={yt.description} limit={1000} />
            <Field label="Keywords" text={(yt.keywords ?? []).join(", ")} />
            <Field label="Series playlist" text={yt.playlist?.title} />
          </div>
          <p className="mt-4 text-sm font-semibold">Still done by hand in YouTube Studio (the API can't):</p>
          <Checklist items={yt.manual} />
        </Card>
      </div>
      <p className="text-xs text-ink-soft dark:text-parchment/60">Source: <code>brand/profiles.json</code> and <code>brand/make_brand.py</code> in the repo; <code>python3 scripts/brand.py</code> re-renders the kit and refreshes this page.</p>
    </div>
  );
}

function Asset({ file, label, size, round, wide }: { file: string; label: string; size: string; round?: boolean; wide?: boolean }) {
  const view = useQuery({ queryKey: ["brand", file], staleTime: 45 * 60 * 1000, queryFn: () => mediaUrl({ store: "supabase", path: `brand/${file}`, url: null }) });
  const dl = useQuery({ queryKey: ["brand", file, "dl"], staleTime: 45 * 60 * 1000, queryFn: () => mediaUrl({ store: "supabase", path: `brand/${file}`, url: null }, true) });
  return (
    <figure className={wide ? "col-span-2" : ""}>
      <div className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-night-950 p-2" style={wide ? { aspectRatio: "16 / 9" } : undefined}>
        {view.data ? <img src={view.data} alt={label} className={round ? "h-full rounded-full object-cover" : "max-h-full max-w-full object-contain"} /> : <Spinner label="" />}
      </div>
      <figcaption className="mt-2 flex items-start justify-between gap-2 text-sm">
        <span className="min-w-0"><span className="block font-semibold">{label}</span><span className="block text-xs text-ink-soft dark:text-parchment/60">{size}</span></span>
        {dl.data && <a href={dl.data} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-parchment-deep px-2.5 py-1.5 text-xs font-semibold dark:border-night-700" aria-label={`Download ${label}`}><Download size={13} /> Save</a>}
      </figcaption>
    </figure>
  );
}

function Field({ label, text, limit, note }: { label: string; text?: string; limit?: number; note?: ReactNode }) {
  return (
    <div className="rounded-xl border border-parchment-deep p-3 dark:border-night-700">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-parchment/60">{label}{limit && text ? ` · ${[...text].length}/${limit}` : ""}</span>
        {text && <CopyButton text={text} label="Copy" />}
      </div>
      {text ? <p className="mt-1.5 whitespace-pre-line break-words text-sm">{text}</p> : <p className="mt-1.5 text-sm text-ink-soft dark:text-parchment/60">{note}</p>}
    </div>
  );
}

const Checklist = ({ items }: { items?: string[] }) => !items?.length ? null : (
  <ul className="mt-3 grid gap-1.5 text-sm">{items.map((t) => <li key={t} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{t}</li>)}</ul>
);

const Steps = ({ steps }: { steps: Step[] }) => (
  <ul className="grid gap-1.5">{steps.map((s) => (
    <li key={s.step} className="flex gap-2">{s.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-vermilion" />}
      <span className="min-w-0"><b>{s.step}</b>{s.detail && <span className="block break-words text-xs text-ink-soft dark:text-parchment/60">{s.detail}</span>}</span></li>
  ))}</ul>
);

function ApplyYouTube({ connected }: { connected: boolean }) {
  const qc = useQueryClient();
  const [st, setSt] = useState<{ busy?: boolean; err?: string; steps?: Step[] }>({});
  if (!connected) return <p className="text-sm">Connect YouTube first in <Link className="font-semibold text-gold-deep underline dark:text-gold" to="/settings#connections">Settings → Connections</Link>.</p>;
  return (
    <div className="grid gap-2">
      <p className="text-sm">Uploads the banner and watermark, sets the description, keywords, country and language, and creates the series playlist (new posts go into it automatically).</p>
      <div><Button variant="primary" disabled={st.busy} onClick={async () => {
        setSt({ busy: true });
        try { const r = await studio<{ ok: boolean; steps: Step[] }>("youtube_brand"); setSt({ steps: r.steps }); }
        catch (e) { setSt({ err: (e as Error).message }); }
        qc.invalidateQueries({ queryKey: ["channels"] });
      }}><Sparkles size={15} /> {st.busy ? "Applying…" : "Apply brand to YouTube"}</Button></div>
      {st.err && <p className="text-sm text-vermilion">{st.err}{/Reconnect/.test(st.err) && <> <Link className="font-semibold underline" to="/settings#connections">Go to Connections</Link></>}</p>}
    </div>
  );
}
