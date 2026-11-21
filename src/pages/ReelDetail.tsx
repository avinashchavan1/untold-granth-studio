import clsx from "clsx";
import { ArrowLeft, CheckCircle2, Download, ExternalLink, FileText, Loader2, Pencil, Send, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, Code, CopyButton, Empty, ErrorNote, LinkButton, PubBadge, SectionTitle, Spinner, StageBadge, fmtBytes, fmtDate, fmtLen } from "../components/ui";
import { mediaUrl, studio, type ProviderStatus, useClaims, useConnections, useFiles, useJobs, useMediaUrl, usePublications, usePublishNow, useReel, useSaveCaptions, useSetStage, useUpdateReel, useUpsertPublication, type PublishJob } from "../lib/api";
import { Target } from "../components/Target";
import { KIND_LABEL, PLATFORMS, STAGES, type FileRow, type Publication, type Reel, type Stage } from "../lib/types";
import { CHANNEL, IG } from "../lib/channel";

const TABS = ["Publish", "Script", "Citations", "Files", "Notes"] as const;
type Tab = (typeof TABS)[number];

export default function ReelDetail() {
  const { code = "" } = useParams();
  const reel = useReel(code);
  const [tab, setTab] = useState<Tab>("Publish");
  const files = useFiles(reel.data?.id);
  const setStage = useSetStage();
  if (reel.isLoading) return <Spinner />;
  if (reel.error || !reel.data) return <ErrorNote error={reel.error ?? "Reel not found"} />;
  const r = reel.data;
  const preview = files.data?.find((f) => f.kind === "preview");
  const cover = files.data?.find((f) => f.kind === "thumbnail");
  const poster = cover ?? files.data?.find((f) => f.kind === "poster");
  const produced = !["idea", "researching"].includes(r.stage) && !!r.script;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Link to="/reels" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink dark:text-parchment/60"><ArrowLeft size={16} /> All reels</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><Code>{r.code}</Code>{r.kind && <span className="text-sm text-ink-soft dark:text-parchment/60">{KIND_LABEL[r.kind]}</span>}<span className="text-sm text-ink-soft dark:text-parchment/60">· {r.source_ref}</span></div>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-wide sm:text-3xl" style={{ textWrap: "balance" } as React.CSSProperties}>{r.title}</h1>
          {r.hook_en && <p className="mt-2 text-lg">{r.hook_en}</p>}
          {r.hook_hi && <p className="text-sm text-ink-soft dark:text-parchment/60">Narration: {r.hook_hi}</p>}
        </div>
        <label className="grid w-full gap-1 text-xs font-semibold uppercase tracking-wider text-ink-soft sm:w-auto dark:text-parchment/60">
          Stage
          <select id="stage" value={r.stage} onChange={(e) => setStage(r, e.target.value as Stage)} className="w-full rounded-xl border border-parchment-deep bg-white/80 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-ink dark:border-night-700 dark:bg-night-900 dark:text-parchment">
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
        <div className="mx-auto grid w-full max-w-[300px] content-start gap-3 lg:mx-0 lg:max-w-none">
          <Preview preview={preview} poster={poster} />
          <Cover cover={cover} />
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft dark:text-parchment/60"><StageBadge stage={r.stage} /> <span className="tabular">{fmtLen(r.length_s)}</span> {r.updated_at && <span>· updated {fmtDate(r.updated_at)}</span>}</div>
        </div>
        <div className="min-w-0">
          <div className="-mx-4 mb-4 flex gap-1 overflow-x-auto whitespace-nowrap border-b border-parchment-deep px-4 sm:mx-0 sm:px-0 dark:border-night-700" role="tablist">
            {TABS.map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={clsx("-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold", tab === t ? "border-gold-deep text-ink dark:border-gold dark:text-parchment" : "border-transparent text-ink-soft hover:text-ink dark:text-parchment/60")}>{t}</button>
            ))}
          </div>
          {tab === "Publish" && (produced ? <PublishTab r={r} files={files.data ?? []} /> : <Empty>This reel is still in the plan. Publishing opens once it's rendered.</Empty>)}
          {tab === "Script" && (r.script ? <ScriptTab r={r} /> : <Empty>No script yet. Plan note: {r.plan_note || "—"}</Empty>)}
          {tab === "Citations" && <ClaimsTab r={r} />}
          {tab === "Files" && <FilesTab files={files.data ?? []} loading={files.isLoading} />}
          {tab === "Notes" && <NotesTab r={r} />}
        </div>
      </div>
    </div>
  );
}

function Preview({ preview, poster }: { preview?: FileRow; poster?: FileRow }) {
  const v = useMediaUrl(preview);
  const p = useMediaUrl(poster);
  if (!preview) return <div className="grid aspect-[9/16] w-full place-items-center rounded-2xl border border-dashed border-parchment-deep text-sm text-ink-soft dark:border-night-700">No video yet</div>;
  if (v.isLoading) return <div className="aspect-[9/16] w-full animate-pulse rounded-2xl bg-night-800" />;
  return <video controls playsInline preload="metadata" poster={p.data ?? undefined} src={v.data ?? undefined} className="aspect-[9/16] w-full rounded-2xl bg-black" />;
}

function YouTubeEdit({ r }: { r: Reel }) {
  const save = useSaveCaptions();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState({ title: r.captions?.youtube_title ?? "", description: r.captions?.youtube_description ?? "" });
  const [st, setSt] = useState<{ busy?: boolean; ok?: boolean; err?: string }>({});
  if (!open) return <Button size="sm" onClick={() => setOpen(true)}>Edit title & description on YouTube</Button>;
  return (
    <div className="grid gap-2">
      <label className="grid gap-1 text-xs font-semibold">Title ({d.title.length}/100)
        <input id="yt-live-title" value={d.title} maxLength={100} onChange={(e) => setD({ ...d, title: e.target.value })} className="rounded-lg border border-parchment-deep bg-white/80 px-2.5 py-1.5 text-sm font-normal dark:border-night-700 dark:bg-night-950" /></label>
      <label className="grid gap-1 text-xs font-semibold">Description ({d.description.length}/5000)
        <textarea id="yt-live-desc" value={d.description} maxLength={5000} rows={8} onChange={(e) => setD({ ...d, description: e.target.value })} className="rounded-lg border border-parchment-deep bg-white/80 px-2.5 py-1.5 text-sm font-normal dark:border-night-700 dark:bg-night-950" /></label>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" disabled={st.busy} onClick={async () => {
          setSt({ busy: true });
          try { await save(r, { ...(r.captions ?? {}), youtube_title: d.title, youtube_description: d.description }); await studio("youtube_update", { reel_id: r.id }); setSt({ ok: true }); }
          catch (e) { setSt({ err: (e as Error).message }); }
        }}>{st.busy ? "Updating…" : "Save & update on YouTube"}</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
      </div>
      {st.ok && <p className="text-sm text-emerald-700 dark:text-emerald-300">Updated on YouTube.</p>}
      {st.err && <p className="text-sm text-vermilion">{st.err}</p>}
    </div>
  );
}

function Cover({ cover }: { cover?: FileRow }) {
  const img = useMediaUrl(cover);
  const dl = useMediaUrl(cover, true);
  if (!cover) return <p className="rounded-xl border border-dashed border-parchment-deep p-3 text-xs text-ink-soft dark:border-night-700">No cover yet. Every reel gets one (<code>make_reel.py thumb</code>).</p>;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-parchment-deep p-2.5 dark:border-night-700">
      {img.data ? <img src={img.data} alt="Reel cover" className="aspect-[9/16] w-16 shrink-0 rounded-lg object-cover" /> : <div className="aspect-[9/16] w-16 shrink-0 animate-pulse rounded-lg bg-night-800" />}
      <div className="min-w-0 text-sm">
        <p className="font-semibold">Cover · thumbnail</p>
        <p className="text-xs text-ink-soft dark:text-parchment/60">Sent automatically as the Instagram cover and the YouTube thumbnail.</p>
        <div className="mt-1.5 flex gap-3 text-xs font-semibold">
          {img.data && <a href={img.data} target="_blank" rel="noreferrer" className="text-gold-deep underline dark:text-gold">View</a>}
          {dl.data && <a href={dl.data} className="text-gold-deep underline dark:text-gold">Download</a>}
        </div>
      </div>
    </div>
  );
}

function PublishTab({ r, files }: { r: Reel; files: FileRow[] }) {
  const pubs = usePublications(r.id);
  const update = useUpdateReel();
  const jobs = useJobs(r.id);
  const conn = useConnections();
  const masters = { instagram: files.find((f) => f.kind === "master_instagram"), youtube: files.find((f) => f.kind === "master_youtube") };
  const p = conn.data?.providers ?? {};
  const canAuto: Record<string, boolean> = {
    youtube: ["github", "huggingface", "google_app", "youtube"].every((k) => p[k]?.connected),
    instagram: ["github", "huggingface", "instagram"].every((k) => p[k]?.connected),
  };
  return (
    <div className="grid gap-4">
      <label className={clsx("flex items-start gap-3 rounded-2xl border p-4", r.reviewed ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40" : "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40")}>
        <input id="reviewed" type="checkbox" className="mt-1 h-5 w-5 accent-[#a8741a]" checked={r.reviewed}
          onChange={(e) => update.mutate({ reel: r, patch: { reviewed: e.target.checked, reviewed_at: e.target.checked ? new Date().toISOString() : null, stage: e.target.checked && r.stage === "review" ? "approved" : r.stage }, action: e.target.checked ? "citations reviewed" : "review cleared" })} />
        <span className="text-sm">
          <b className="flex items-center gap-1.5"><ShieldCheck size={16} /> I checked the citations against the text</b>
          {r.reviewed ? <span className="text-emerald-800 dark:text-emerald-300">Reviewed {fmtDate(r.reviewed_at)}. Posting is unlocked.</span> : <span>Open the Citations tab, read each claim against its verse, then tick this. Posting stays locked until then.</span>}
        </span>
      </label>
      {!canAuto.youtube && !canAuto.instagram && !conn.isLoading && (
        <div className="rounded-2xl border border-parchment-deep p-3 text-sm dark:border-night-700">Want one-tap posting? Finish <Link to="/settings#connections" className="font-semibold text-gold-deep underline dark:text-gold">Settings → Connections</Link> once; then <b>Post now</b> appears here.</div>
      )}
      <div className="grid gap-4 xl:grid-cols-3">
        {PLATFORMS.map((pl) => <Lane key={pl.key} r={r} platform={pl} pub={pubs.data?.find((x) => x.platform === pl.key)} master={masters[pl.master]}
          auto={!!canAuto[pl.key]} job={jobs.data?.find((j) => j.platform === pl.key)} providers={p} />)}
      </div>
    </div>
  );
}

function Lane({ r, platform, pub, master, auto, job, providers }: { r: Reel; platform: (typeof PLATFORMS)[number]; pub?: Publication; master?: FileRow; auto: boolean; job?: PublishJob; providers: Record<string, ProviderStatus | undefined> }) {
  const upsert = useUpsertPublication();
  const publish = usePublishNow();
  const saveCaptions = useSaveCaptions();
  const [url, setUrl] = useState(pub?.post_url ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", caption: "" });
  const [privacy, setPrivacy] = useState("public");
  useEffect(() => setUrl(pub?.post_url ?? ""), [pub?.post_url]);
  const state = pub?.state ?? "todo";
  const caption = r.captions?.[platform.capField] ?? "";
  const title = platform.titleField ? r.captions?.[platform.titleField] ?? "" : "";
  const active = job && (job.status === "queued" || job.status === "running");
  const startEdit = () => { setDraft({ title, caption }); setEditing(true); };
  const save = async () => {
    const next = { ...(r.captions ?? {}), [platform.capField]: draft.caption };
    if (platform.titleField) next[platform.titleField] = draft.title;
    if (platform.key === "instagram" && (r.captions?.facebook ?? "") === caption) next.facebook = draft.caption.replace(IG.handle, CHANNEL.name);
    await saveCaptions(r, next); setEditing(false);
  };
  return (
    <Card className="grid content-start gap-3 !p-4">
      <div className="flex items-center justify-between gap-2"><h3 className="font-bold">{platform.label}</h3><PubBadge state={active ? "posting" : state} /></div>
      {master ? <MasterLink f={master} /> : <div className="rounded-lg bg-black/[.04] p-2 text-xs text-ink-soft dark:bg-white/5">Master file: not attached yet</div>}

      {job && (job.status !== "done" || state !== "posted") && <JobCard job={job} />}

      {state === "posted" && !active ? (
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300"><CheckCircle2 size={16} /> Posted {fmtDate(pub?.posted_at)}</div>
          {pub?.post_url && <a href={pub.post_url} target="_blank" rel="noreferrer" className="break-all text-gold-deep underline dark:text-gold">{pub.post_url}</a>}
          {platform.key === "youtube" && pub?.external_id && <YouTubeEdit r={r} />}
          <Button size="sm" variant="ghost" onClick={() => upsert.mutate({ reel: r, platform: platform.key, patch: { state: "todo", posted_at: null } })}>Mark as not posted</Button>
        </div>
      ) : editing ? (
        <div className="grid gap-2">
          {platform.titleField && <label className="grid gap-1 text-xs font-semibold">Title ({draft.title.length}/100)
            <input id={`title-${platform.key}`} value={draft.title} maxLength={100} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="rounded-lg border border-parchment-deep bg-white/80 px-2.5 py-1.5 text-sm font-normal dark:border-night-700 dark:bg-night-950" /></label>}
          <label className="grid gap-1 text-xs font-semibold">{platform.titleField ? "Description" : "Caption"} ({draft.caption.length}/{platform.key === "youtube" ? 5000 : 2200})
            <textarea id={`cap-${platform.key}`} rows={10} value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} className="rounded-lg border border-parchment-deep bg-white/80 p-2.5 text-[13px] font-normal dark:border-night-700 dark:bg-night-950" /></label>
          <div className="flex gap-2"><Button size="sm" variant="primary" onClick={save}>Save</Button><Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div>
        </div>
      ) : (
        <>
          <details className="text-sm"><summary className="cursor-pointer font-semibold">{platform.titleField ? "Title & description" : "Caption"}</summary>
            <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/[.04] p-3 font-sans text-[13px] dark:bg-white/5">{title ? `${title}\n\n` : ""}{caption}</pre>
          </details>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={startEdit} disabled={!!active}><Pencil size={14} /> Edit</Button>
            {title && <CopyButton text={title} label="Copy title" />}
            <CopyButton text={caption} label={platform.titleField ? "Copy description" : "Copy caption"} />
          </div>

          {auto && platform.key !== "facebook" ? (
            <div className="grid gap-2 rounded-xl border border-gold-deep/40 bg-gold-soft/40 p-3 dark:border-gold/30 dark:bg-gold/5">
              {(platform.key === "instagram" || platform.key === "youtube") && <Target platform={platform.key} providers={providers} />}
              {platform.key === "youtube" && (
                <label className="flex items-center gap-2 text-xs font-semibold">Visibility
                  <select id="yt-privacy" value={privacy} onChange={(e) => setPrivacy(e.target.value)} className="rounded-md border border-parchment-deep bg-white/80 px-2 py-1 text-xs dark:border-night-700 dark:bg-night-950">
                    <option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option>
                  </select></label>
              )}
              <Button variant="primary" disabled={!r.reviewed || !master || !!active || publish.isPending} title={!r.reviewed ? "Tick the citation check first" : ""}
                onClick={() => publish.mutate({ reel: r, platform: platform.key, privacy })}><Send size={15} /> {active ? "Posting…" : publish.isPending ? "Starting…" : state === "failed" ? "Try again" : "Post now"}</Button>
              {!r.reviewed && <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Tick "I checked the citations" at the top to unlock posting.</p>}
              {publish.error && <p className="text-xs text-vermilion">{(publish.error as Error).message}</p>}
              <p className="text-[11px] text-ink-soft dark:text-parchment/60">Uploads the full-quality master with this {platform.titleField ? "title and description" : "caption"}. Takes 3–10 minutes; you can leave this page.</p>
            </div>
          ) : (
            <details className="text-sm" open={platform.key === "facebook"}><summary className="cursor-pointer font-semibold">Post manually</summary>
              <div className="mt-2 grid gap-2">
                <LinkButton href={platform.uploadUrl}><ExternalLink size={14} /> Open {platform.label.split(" ")[0]}</LinkButton>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input id={`url-${platform.key}`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste post link (optional)" aria-label={`${platform.label} post link`}
                    className="min-w-0 flex-1 rounded-lg border border-parchment-deep bg-white/80 px-2.5 py-1.5 text-sm dark:border-night-700 dark:bg-night-950" />
                  <Button size="sm" variant="primary" disabled={!r.reviewed || upsert.isPending} title={r.reviewed ? "" : "Tick the citation check first"}
                    onClick={() => upsert.mutate({ reel: r, platform: platform.key, patch: { state: "posted", post_url: url.trim() || null, posted_at: new Date().toISOString() } })}>Mark posted</Button>
                </div>
              </div>
            </details>
          )}
        </>
      )}
    </Card>
  );
}

function JobCard({ job }: { job: PublishJob }) {
  const running = job.status === "queued" || job.status === "running";
  return (
    <div className={clsx("grid gap-1 rounded-xl p-3 text-xs", job.status === "failed" ? "bg-vermilion/10 text-vermilion" : job.status === "done" ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-300")}>
      <div className="flex items-center gap-1.5 font-semibold">{running && <Loader2 size={13} className="animate-spin" />}{job.status === "failed" ? "Posting failed" : job.status === "done" ? "Posted" : job.step ?? "Starting"}</div>
      {job.result_url && <a href={job.result_url} target="_blank" rel="noreferrer" className="break-all underline">{job.result_url}</a>}
      <details><summary className="cursor-pointer">Details</summary><pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px]">{job.log}</pre></details>
    </div>
  );
}

function MasterLink({ f }: { f: FileRow }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid gap-1.5 rounded-lg bg-black/[.04] p-2.5 text-xs dark:bg-white/5">
      <div className="font-mono break-all">{f.path?.split("/").pop() ?? f.url?.split("/").pop()}</div>
      <div className="text-ink-soft dark:text-parchment/60">{[f.spec, fmtBytes(f.bytes)].filter(Boolean).join(" · ")}</div>
      {f.store === "external" && <div className="text-ink-soft dark:text-parchment/60">Stored privately on Hugging Face; be signed in there.</div>}
      <Button size="sm" disabled={busy} onClick={async () => { setBusy(true); const u = await mediaUrl(f, true); setBusy(false); if (u) window.open(u, "_blank", "noopener"); }}><Download size={14} /> Download master</Button>
    </div>
  );
}

function ScriptTab({ r }: { r: Reel }) {
  const shots = r.script?.shots ?? [];
  return (
    <div className="grid gap-2">
      {r.script?.source && <p className="text-sm text-ink-soft dark:text-parchment/60">Source: {r.script.source}</p>}
      <div className="overflow-x-auto rounded-2xl border border-parchment-deep dark:border-night-700">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-black/[.03] text-left text-xs uppercase tracking-wider text-ink-soft dark:bg-white/5 dark:text-parchment/60"><tr><th className="p-3">#</th><th className="p-3">Voice</th><th className="p-3">Line (Hindi / English)</th><th className="p-3">Verse</th></tr></thead>
          <tbody>
            {shots.map((s) => (
              <tr key={s.id} className="border-t border-parchment-deep align-top dark:border-night-800">
                <td className="tabular p-3 text-ink-soft">{s.id}</td>
                <td className="p-3 font-semibold capitalize">{s.voice ?? <span className="text-ink-soft">music</span>}</td>
                <td className="p-3"><div className="text-[15px]">{s.hi || <span className="text-ink-soft">—</span>}</div>{s.en && <div className="text-ink-soft dark:text-parchment/60">{s.en}</div>}</td>
                <td className="p-3 font-mono text-xs text-gold-deep dark:text-gold">{s.cite ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClaimsTab({ r }: { r: Reel }) {
  const claims = useClaims(r.id);
  if (claims.isLoading) return <Spinner />;
  if (!claims.data?.length) return <Empty>No claims recorded yet. Every factual claim needs a verse reference before the reel can be scripted.</Empty>;
  return (
    <div className="grid gap-3">
      {claims.data.map((c) => (
        <Card key={c.id} className="!p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-semibold">{c.claim}</p>
            <span className={clsx("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", c.verified ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-900")}>{c.verified ? "Verified" : "Unverified"}</span>
          </div>
          <div className="mt-1 font-mono text-xs text-gold-deep dark:text-gold">{c.ref}</div>
          {c.quote_sa && <p className="mt-2 rounded-lg bg-black/[.04] p-3 text-[15px] leading-relaxed dark:bg-white/5">{c.quote_sa}</p>}
          {c.sources.length > 0 && <p className="mt-2 text-xs text-ink-soft dark:text-parchment/60">Checked against: {c.sources.join(" · ")}</p>}
        </Card>
      ))}
      {r.verify_note && <p className="text-sm text-ink-soft dark:text-parchment/60">{r.verify_note}</p>}
    </div>
  );
}

function FilesTab({ files, loading }: { files: FileRow[]; loading: boolean }) {
  if (loading) return <Spinner />;
  if (!files.length) return <Empty>No files yet.</Empty>;
  return (
    <ul className="grid gap-2">
      {files.map((f) => (
        <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-parchment-deep p-3 dark:border-night-700">
          <div className="min-w-0"><div className="flex items-center gap-2 text-sm font-semibold"><FileText size={15} /> <span className="break-all">{f.path?.split("/").pop() ?? f.url}</span></div>
            <div className="text-xs text-ink-soft dark:text-parchment/60">{f.kind.replace("_", " ")} · {[f.spec, fmtBytes(f.bytes), f.store === "external" ? "Hugging Face (sign in there to download)" : f.store === "github_release" ? "GitHub release" : "studio storage"].filter(Boolean).join(" · ")}</div></div>
          <Button size="sm" onClick={async () => { const u = await mediaUrl(f, true); if (u) window.open(u, "_blank", "noopener"); }}><Download size={14} /> Download</Button>
        </li>
      ))}
    </ul>
  );
}

function NotesTab({ r }: { r: Reel }) {
  const update = useUpdateReel();
  const [notes, setNotes] = useState(r.notes ?? "");
  return (
    <div className="grid gap-4">
      {r.plan_note && <Card className="!p-4"><SectionTitle>From the plan</SectionTitle><p className="text-sm">{r.plan_note}</p></Card>}
      {r.script?.avoid?.length ? <Card className="!p-4"><SectionTitle>Deliberately left out</SectionTitle><ul className="list-disc pl-5 text-sm">{r.script.avoid.map((a) => <li key={a}>{a}</li>)}</ul></Card> : null}
      <Card className="!p-4">
        <SectionTitle>Your notes</SectionTitle>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="Feedback for the next version, ideas, reminders…"
          className="w-full rounded-xl border border-parchment-deep bg-white/80 p-3 text-sm dark:border-night-700 dark:bg-night-950" />
        <Button className="mt-2" variant="primary" disabled={update.isPending || notes === (r.notes ?? "")} onClick={() => update.mutate({ reel: r, patch: { notes }, action: "notes edited" })}>{update.isPending ? "Saving…" : "Save notes"}</Button>
      </Card>
    </div>
  );
}
