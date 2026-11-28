import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, ExternalLink, Facebook, Instagram, Sparkles, XCircle, Youtube } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CopyButton, ErrorNote, SectionTitle, Spinner, fmtDate } from "../components/ui";
import { mediaUrl, studio, useChannels, useConnections } from "../lib/api";
import { IG } from "../lib/channel";

type Step = { step: string; ok: boolean; detail?: string };
const ASSETS = [
  { file: "avatar_1080.png", label: "Profile picture (Instagram + Facebook)", size: "1080 × 1080", round: true },
  { file: "youtube_profile_800.png", label: "YouTube profile picture", size: "800 × 800", round: true },
  { file: "youtube_banner_2560x1440.jpg", label: "YouTube banner", size: "2560 × 1440 · text inside the phone-safe area", wide: true },
  { file: "youtube_watermark_300.png", label: "YouTube video watermark", size: "300 × 300, transparent" },
  { file: "facebook_cover_1640x924.jpg", label: "Facebook cover photo", size: "1640 × 924 · computers show the middle strip, phones all of it", wide: true },
  { file: "intro_post_1080x1350.png", label: "Intro post (pin on Instagram + Facebook)", size: "1080 × 1350" },
  { file: "facebook_cover_SAFE_AREA_guide.jpg", label: "Facebook cover: safe-area guide", size: "red = desktop crop · blue = profile picture" },
];
const HIGHLIGHTS: [string, string][] = [["START", "start_here"], ["SCIENCE", "science_wala_sach"], ["ITIHAAS", "itihaas_ke_raaz"], ["JAANWAR", "jaanwaron_ki_duniya"], ["ANTRIKSH", "antriksh"],
  ["AJOOBE", "desh_ke_ajoobe"], ["MYTH?", "myth_or_fact"], ["KHAANA", "khaane_ka_itihaas"], ["PAISA", "paise_ki_kahani"], ["SHABD", "shabdon_ki_kahani"], ["SOURCES", "sources"]];

export default function Profiles() {
  const ch = useChannels();
  const conn = useConnections();
  if (ch.isLoading) return <Spinner label="Loading profiles…" />;
  if (ch.error) return <ErrorNote error={ch.error} />;
  const by = Object.fromEntries((ch.data ?? []).map((c) => [c.platform, c]));
  const ig = (by.instagram?.profile ?? {}) as Record<string, any>;
  const yt = (by.youtube?.profile ?? {}) as Record<string, any>;
  const fb = (by.facebook?.profile ?? {}) as Record<string, any>;
  const applied = (by.youtube?.applied ?? {}) as { at?: string; by?: string; steps?: Step[] };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide">Profiles</h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-parchment/60">Brand kit and profile text for every platform. YouTube applies from here; Instagram and Facebook don't let apps edit profiles, so copy each field in.</p>
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
          <p className="mb-3 rounded-xl bg-black/[.04] p-3 text-sm dark:bg-white/5">No auto-apply for Instagram: Meta doesn't let any app change an Instagram profile picture, name, bio or links. Do it once in the app: Instagram → Profile → <b>Edit profile</b>, copying each field:</p>
          <div className="grid gap-3">
            <Field label="Profile picture" note="Edit picture → choose avatar_1080.png from the brand kit above" />
            <Field label="Name (searchable)" text={ig.name} limit={64} />
            <Field label="Bio" text={ig.bio} limit={150} />
            {(ig.links ?? [{ title: ig.link_title, url: ig.link }]).map((l: { title: string; url: string }) => <Field key={l.url} label={`Link · title “${l.title}”`} text={l.url} />)}
            <Field label="Category" text={ig.category} />
          </div>
          <Checklist items={ig.settings} />
          <p className="mb-2 mt-4 text-sm font-semibold">Story highlight covers</p>
          <p className="mb-3 text-xs text-ink-soft dark:text-parchment/60">Post a cover as a story → add it to a new highlight → Edit highlight → Edit cover. Then add each new reel to its category's highlight.</p>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">{HIGHLIGHTS.map(([label, f]) => <Highlight key={f} label={label} file={`ig_highlight_${f}.png`} />)}</div>
        </Card>

        <Card>
          <SectionTitle right={<a href="https://studio.youtube.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-deep dark:text-gold">YouTube Studio <ExternalLink size={13} /></a>}>
            <span className="inline-flex items-center gap-2"><Youtube size={18} /> YouTube · {yt.handle}</span>
          </SectionTitle>
          <ApplyBrand connected={!!conn.data?.providers.youtube?.connected} needs="YouTube" action="youtube_brand" label="Apply brand to YouTube"
            what="Uploads the banner and watermark, sets the description, keywords, country and language, and creates the series playlist (new posts go into it automatically)." />
          <Applied applied={applied} />
          <div className="mt-4 grid gap-3">
            <Field label="Description" text={yt.description} limit={1000} />
            <Field label="Keywords" text={(yt.keywords ?? []).join(", ")} />
            <Field label="Series playlist" text={yt.playlist?.title} />
          </div>
          <p className="mt-4 text-sm font-semibold">Still done by hand in YouTube Studio (the API can't):</p>
          <Checklist items={yt.manual} />
        </Card>
      </div>
      <Card>
        <SectionTitle right={fb.url && <a href={fb.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-deep dark:text-gold">Open Page <ExternalLink size={13} /></a>}>
          <span className="inline-flex items-center gap-2"><Facebook size={18} /> Facebook Page · {fb.page_name}</span>
        </SectionTitle>
        <ApplyBrand connected={!!conn.data?.providers.facebook?.connected} needs="the Facebook Page (step 5)" action="facebook_brand" label="Apply brand to Facebook"
          what="Sets the Page's intro, description, website, cover photo and profile picture. Needs pages_manage_metadata on the Meta login; any step Meta refuses can be done by hand with the fields below." />
        <Applied applied={(by.facebook?.applied ?? {}) as { at?: string; by?: string; steps?: Step[] }} />
        <p className="mb-3 mt-4 text-sm text-ink-soft dark:text-parchment/60">By hand: your Page → <b>Edit</b> (or Settings → Page setup). Copy each field:</p>
        <div className="grid gap-3 lg:grid-cols-2">
          <Field label="Profile picture" note="avatar_1080.png from the brand kit above" />
          <Field label="Cover photo" note="facebook_cover_1640x924.jpg from the brand kit above" />
          <Field label="Page name" text={fb.page_name} limit={75} />
          <Field label="Username" text={fb.username} />
          <Field label="Category" text={fb.category} />
          <Field label="Intro (bio)" text={fb.intro} limit={101} />
          <Field label="Website" text={fb.website} />
          <Field label="Action button" text={fb.button} />
          <div className="lg:col-span-2"><Field label="About / description" text={fb.about} /></div>
        </div>
      </Card>
      <p className="text-xs text-ink-soft dark:text-parchment/60">Source: <code>brand/profiles.json</code> and <code>brand/make_brand.py</code> in the repo; <code>brand/make_social_kit.py</code> (Facebook + Instagram art); <code>python3 scripts/brand.py --no-render</code> uploads the kit and refreshes this page.</p>
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

function ApplyBrand({ connected, action, label, what, needs }: { connected: boolean; action: string; label: string; what: string; needs: string }) {
  const qc = useQueryClient();
  const [st, setSt] = useState<{ busy?: boolean; err?: string }>({});
  if (!connected) return <p className="text-sm">Connect {needs} first in <Link className="font-semibold text-gold-deep underline dark:text-gold" to="/settings#connections">Settings → Connections</Link>.</p>;
  return (
    <div className="grid gap-2">
      <p className="text-sm">{what}</p>
      <div><Button variant="primary" disabled={st.busy} onClick={async () => {
        setSt({ busy: true });
        try { await studio<{ ok: boolean; steps: Step[] }>(action); setSt({}); }
        catch (e) { setSt({ err: (e as Error).message }); }
        qc.invalidateQueries({ queryKey: ["channels"] });
      }}><Sparkles size={15} /> {st.busy ? "Applying…" : label}</Button></div>
      {st.err && <p className="text-sm text-vermilion">{st.err}{/Reconnect|Connect Instagram/.test(st.err) && <> <Link className="font-semibold underline" to="/settings#connections">Go to Connections</Link></>}</p>}
    </div>
  );
}

function Applied({ applied }: { applied: { at?: string; by?: string; steps?: Step[] } }) {
  if (!applied.steps) return null;
  return (
    <div className="mt-3 rounded-xl border border-parchment-deep p-3 text-sm dark:border-night-700">
      <p className="mb-2 text-xs text-ink-soft dark:text-parchment/60">Last applied {fmtDate(applied.at)} by {applied.by} · {applied.steps.filter((x) => x.ok).length} of {applied.steps.length} done</p>
      <Steps steps={applied.steps} />
    </div>
  );
}

function Highlight({ label, file }: { label: string; file: string }) {
  const view = useQuery({ queryKey: ["brand", file], staleTime: 45 * 60 * 1000, queryFn: () => mediaUrl({ store: "supabase", path: `brand/${file}`, url: null }) });
  const dl = useQuery({ queryKey: ["brand", file, "dl"], staleTime: 45 * 60 * 1000, queryFn: () => mediaUrl({ store: "supabase", path: `brand/${file}`, url: null }, true) });
  return (
    <a href={dl.data ?? "#"} className="grid justify-items-center gap-1 text-center" aria-label={`Download the ${label} highlight cover`}>
      <span className="grid aspect-square w-full max-w-[84px] place-items-center overflow-hidden rounded-full ring-2 ring-parchment-deep dark:ring-night-700">
        {view.data ? <img src={view.data} alt="" className="h-full w-full scale-[1.9] object-cover" /> : <span className="h-full w-full animate-pulse bg-night-800" />}
      </span>
      <span className="text-[11px] font-semibold">{label}</span>
    </a>
  );
}
