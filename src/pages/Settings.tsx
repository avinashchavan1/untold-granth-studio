import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useSession } from "../components/Auth";
import { Button, Card, SectionTitle, Spinner, fmtDate } from "../components/ui";
import { useAdminMutations, useAdmins, useChannels, useSeries } from "../lib/api";
import Connections from "./Connections";
import { CHANNEL } from "../lib/channel";

export default function SettingsPage() {
  const series = useSeries();
  const ch = useChannels();
  const admins = useAdmins();
  const { add, remove } = useAdminMutations();
  const me = useSession()?.user.email?.toLowerCase();
  const [email, setEmail] = useState("");
  const s = series.data?.[0];
  const cfg = (s?.config ?? {}) as Record<string, unknown>;
  const palette = (cfg.palette ?? {}) as Record<string, string>;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <h1 className="font-display text-3xl font-extrabold tracking-wide">Settings</h1>
      <Card><Connections /></Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>Brand</SectionTitle>
          {series.isLoading ? <Spinner size="sm" /> : s && (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
              <dt className="text-ink-soft dark:text-parchment/60">Channel</dt><dd className="font-display font-semibold tracking-wider">{String(cfg.logo ?? "")}</dd>
              <dt className="text-ink-soft dark:text-parchment/60">Series</dt><dd>{s.name} · {s.book}</dd>
              <dt className="text-ink-soft dark:text-parchment/60">Edition</dt><dd>{s.edition}</dd>
              <dt className="text-ink-soft dark:text-parchment/60">Tagline</dt><dd className="italic">{String(cfg.tagline ?? "")}</dd>
              <dt className="text-ink-soft dark:text-parchment/60">CTA</dt><dd>{String(cfg.cta_hi ?? "")}</dd>
              <dt className="text-ink-soft dark:text-parchment/60">Palette</dt>
              <dd className="flex flex-wrap gap-2">{Object.entries(palette).map(([k, v]) => <span key={k} className="flex items-center gap-1.5 text-xs"><span className="h-5 w-5 rounded-full border border-black/10" style={{ background: v }} />{k}</span>)}</dd>
              <dt className="text-ink-soft dark:text-parchment/60">Loudness</dt><dd>{String(cfg.loudness_lufs ?? "")} LUFS</dd>
            </dl>
          )}
        </Card>
        <Card>
          <SectionTitle>Channels</SectionTitle>
          <ul className="grid gap-2 text-sm">{(ch.data ?? []).map((c) => <li key={c.platform} className="flex justify-between gap-2"><span className="capitalize">{c.platform}</span><a className="font-mono text-gold-deep underline dark:text-gold" href={c.url ?? "#"} target="_blank" rel="noreferrer">{c.handle}</a></li>)}</ul>
        </Card>
        <Card>
          <SectionTitle>People with access</SectionTitle>
          <p className="mb-3 text-sm text-ink-soft dark:text-parchment/60">Only these emails can sign in and see anything in the studio.</p>
          <ul className="grid gap-2">
            {(admins.data ?? []).map((a) => (
              <li key={a.email} className="flex items-center justify-between gap-2 rounded-xl border border-parchment-deep p-2.5 text-sm dark:border-night-700">
                <span className="break-all">{a.email} <span className="text-xs text-ink-soft">· since {fmtDate(a.added_at)}</span></span>
                {a.email.toLowerCase() !== me && <Button size="sm" variant="danger" aria-label={`Remove ${a.email}`} onClick={() => remove.mutate(a.email)}><Trash2 size={14} /></Button>}
              </li>
            ))}
          </ul>
          <form className="mt-3 flex gap-2" onSubmit={async (e) => { e.preventDefault(); await add.mutateAsync(email); setEmail(""); }}>
            <input id="new-admin" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" aria-label="Email to give access"
              className="min-w-0 flex-1 rounded-xl border border-parchment-deep bg-white/80 px-3 py-2 text-sm dark:border-night-700 dark:bg-night-950" />
            <Button type="submit" variant="primary" disabled={add.isPending}>Give access</Button>
          </form>
          {add.error && <p className="mt-2 text-sm text-vermilion">{(add.error as Error).message}</p>}
        </Card>
        <Card>
          <SectionTitle>How data gets here</SectionTitle>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            <li>Claude produces each reel in the studio engine (in this repo), then syncs it here: script, citations, captions, preview and files.</li>
            <li>Full-quality masters live in your private Hugging Face repo ({CHANNEL.infra.hf_masters_repo}) and are linked from each reel's Publish tab.</li>
            <li>You review the citations, post on each platform, and mark it posted. Everything is logged in Recent activity.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
