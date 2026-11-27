import clsx from "clsx";
import { CheckCircle2, CircleDashed, ExternalLink, Link2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Card, CopyButton, SectionTitle, Spinner } from "../components/ui";
import { Target } from "../components/Target";
import { studio, useConnections, type Connections as Conn } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { CHANNEL, IG, YT } from "../lib/channel";

export default function Connections() {
  const c = useConnections();
  const [params, setParams] = useSearchParams();
  const flash = params.get("connect") ? { provider: params.get("connect")!, ok: params.get("status") === "ok", msg: params.get("msg") ?? "" } : null;
  useEffect(() => { if (flash) setTimeout(() => setParams({}, { replace: true }), 8000); }, [flash, setParams]);
  useEffect(() => { if (window.location.hash === "#connections" && !c.isLoading) document.getElementById("connections")?.scrollIntoView({ behavior: "smooth" }); }, [c.isLoading]);
  if (c.isLoading) return <Spinner label="Checking connections…" />;
  if (c.error) return <p className="text-sm text-vermilion">Couldn't load connections: {(c.error as Error).message}</p>;
  const p = c.data!.providers;
  const ready = (keys: string[]) => keys.every((k) => p[k]?.connected);
  return (
    <section id="connections" className="grid gap-4">
      <SectionTitle>Posting connections</SectionTitle>
      {flash && <div className={clsx("rounded-xl p-3 text-sm", flash.ok ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" : "bg-vermilion/10 text-vermilion")}>{flash.ok ? `${flash.provider} connected.` : `${flash.provider} didn't connect: ${flash.msg}`}</div>}
      <div className="grid gap-2 sm:grid-cols-3">
        <Ready label="Post to YouTube from the app" ok={ready(["github", "huggingface", "google_app", "youtube"])} />
        <Ready label="Post to Instagram from the app" ok={ready(["github", "huggingface", "instagram"])} />
        <Ready label="Post to the Facebook Page from the app" ok={ready(["github", "huggingface", "instagram", "facebook"])} />
      </div>
      {(p.instagram?.connected || p.youtube?.connected) && (
        <div className="grid gap-2 sm:grid-cols-2"><Target platform="instagram" providers={p} className="border border-parchment-deep dark:border-night-700" /><Target platform="youtube" providers={p} className="border border-parchment-deep dark:border-night-700" /></div>
      )}

      <Step n={1} title="Publisher (GitHub)" done={!!p.github?.connected} detail={p.github?.connected ? "Can start the publisher" : undefined}>
        <p>Lets the app start the publisher that uploads your full-quality files.</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Open <A href="https://github.com/settings/personal-access-tokens/new">GitHub → new fine-grained token</A>.</li>
          <li>Name <code>{CHANNEL.id}-publisher</code>, expiration up to 1 year, Repository access → <b>Only select repositories</b> → <code>{CHANNEL.infra.github_repo.split("/")[1]}</code>.</li>
          <li>Permissions → Repository → <b>Actions: Read and write</b>. Generate, copy, paste below.</li>
        </ol>
        <SaveForm provider="github" fields={[["token", "GitHub token"]]} />
      </Step>

      <Step n={2} title="Master files (Hugging Face)" done={!!p.huggingface?.connected} detail={p.huggingface?.name ? `Signed in as ${p.huggingface.name}` : undefined}>
        <p>Lets the publisher read the masters in your private repo and hand Instagram the video by link.</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Open <A href="https://huggingface.co/settings/tokens/new?tokenType=write">Hugging Face → new token</A>, type <b>Write</b>, name <code>{CHANNEL.id}-publisher</code>. (Write: the publisher also shares the Instagram file through a short-lived public drop.)</li>
          <li>Copy and paste below.</li>
        </ol>
        <SaveForm provider="huggingface" fields={[["token", "Hugging Face token"]]} />
      </Step>

      <Step n={3} title="YouTube" done={!!p.youtube?.connected} detail={p.youtube?.connected ? `${p.youtube.name ?? "Channel"}${p.youtube.account_id ? ` · ${p.youtube.account_id}` : ""}` : undefined}>
        <p>One-time Google setup (about 10 minutes):</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Open <A href="https://console.cloud.google.com/projectcreate">Google Cloud → new project</A> named <code>{CHANNEL.id}</code>.</li>
          <li>Enable <A href="https://console.cloud.google.com/apis/library/youtube.googleapis.com">YouTube Data API v3</A>.</li>
          <li><A href="https://console.cloud.google.com/auth/overview">Google Auth Platform</A> → Get started: app name <i>{CHANNEL.app_title}</i>, audience <b>External</b>, your email. Then <b>Audience → Publish app</b> (keeps you signed in permanently; Google shows an "unverified" warning you can click through).</li>
          <li><A href="https://console.cloud.google.com/auth/clients/create">Clients → Create client</A> → <b>Web application</b> → Authorized redirect URI:
            <Copyable text={c.data!.redirect_uris.youtube} /></li>
          <li>Paste the Client ID and Client secret below, then press <b>Connect YouTube</b> and choose your {YT.handle} channel.</li>
        </ol>
        <SaveForm provider="google_app" fields={[["client_id", "Client ID"], ["client_secret", "Client secret"]]} saved={!!p.google_app?.connected} />
        <ConnectButton provider="youtube" label="Connect YouTube" disabled={!p.google_app?.connected} connected={!!p.youtube?.connected} />
        <p className="text-xs text-ink-soft dark:text-parchment/60">Connected YouTube before the Profiles page existed? Press <b>Reconnect YouTube</b> once so the app can also edit the channel (banner, description, playlist) from the <b>Profiles</b> page.</p>
        <p className="text-xs text-ink-soft dark:text-parchment/60">Until Google audits the app, YouTube keeps API uploads <b>private</b>; open YouTube Studio and set them to Public (one tap). You can request the free audit later.</p>
      </Step>

      <Step n={4} title="Instagram" done={!!p.instagram?.connected} detail={p.instagram?.connected ? `@${p.instagram.name ?? "account"}${p.instagram.account_id ? ` · ID ${p.instagram.account_id}` : ""}` : undefined}>
        <p>One-time Meta setup (Instagram must be a professional/Creator account):</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li><A href="https://developers.facebook.com/apps/">Meta for Developers → My Apps</A> → <b>{CHANNEL.app_title}</b> → Use cases → <b>Customize</b> → <b>API setup with Unified login</b>.</li>
          <li>Under <b>1. Configure your app</b>, keep the "Instagram API (unified login)" configuration selected and copy its <b>Configuration ID</b>.</li>
          <li>Same section → <b>Register a new redirect URL</b> → paste and <b>Save</b>:
            <Copyable text={c.data!.redirect_uris.instagram} /></li>
          <li>Left menu → <b>App settings → Basic</b> → copy <b>App ID</b> and <b>App secret</b> (Show).</li>
          <li>Paste all three below → <b>Save</b> → <b>Connect Instagram</b> → log in and choose <b>{IG.handle}</b>.</li>
        </ol>
        <SaveForm provider="meta_app" fields={[["app_id", "App ID"], ["app_secret", "App secret"], ["config_id", "Configuration ID"]]} saved={!!p.meta_app?.connected} />
        <ConnectButton provider="instagram" label="Connect Instagram" disabled={!p.meta_app?.connected} connected={!!p.instagram?.connected} />
        <p className="text-xs text-ink-soft dark:text-parchment/60">This creates a system-user token that never expires, so you won't need to reconnect.</p>
      </Step>
      <Step n={5} title="Facebook Page" done={!!p.facebook?.connected} detail={p.facebook?.connected ? `${p.facebook.name ?? "Page"}${p.facebook.account_id ? ` · ID ${p.facebook.account_id}` : ""}` : undefined}>
        <p>Posts each reel as a Facebook Reel on your Page too. It uses the same Meta login as Instagram, so there's nothing new to paste.</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Link the Page to {IG.handle} (Page → Settings → Linked accounts → Instagram) and give yourself full control of it in the <A href="https://business.facebook.com/latest/settings/pages">business portfolio</A>.</li>
          <li>In <A href="https://developers.facebook.com/apps/">Meta for Developers</A> → <b>{CHANNEL.app_title}</b>, make sure the login configuration also asks for <code>pages_show_list</code>, <code>pages_read_engagement</code> and <code>pages_manage_posts</code>.</li>
          <li>Press <b>Connect Instagram</b> above again and pick the Page and {IG.handle}. Or, if those were already allowed, press <b>Find my Page</b>.</li>
        </ol>
        <FindPage />
      </Step>

      <Step n={6} title="Telegram alerts" done={!!p.telegram?.connected} detail={p.telegram?.name ? `Bot @${p.telegram.name}` : undefined}>
        <p>Post results, anything that needs you, and a summary every morning at 8:17, on your phone.</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>In Telegram, open <A href="https://t.me/BotFather">@BotFather</A> → send <code>/newbot</code> → pick a name (e.g. <b>{CHANNEL.name} Studio</b>) and a username ending in <code>bot</code>.</li>
          <li>BotFather replies with a <b>token</b> (looks like <code>123456:ABC…</code>). Paste it below and Save.</li>
          <li>Open your new bot in Telegram and press <b>Start</b>. Then press <b>Send test</b>.</li>
        </ol>
        <SaveForm provider="telegram" fields={[["bot_token", "Telegram bot token"]]} />
        <TelegramTest />
      </Step>
      <p className="text-xs text-ink-soft dark:text-parchment/60">Tokens are stored only on the studio's server; this page never shows them again.</p>
    </section>
  );
}

const A = ({ href, children }: { href: string; children: ReactNode }) => <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-gold-deep underline dark:text-gold">{children}<ExternalLink size={12} /></a>;
const Copyable = ({ text }: { text: string }) => <span className="mt-1 flex flex-wrap items-center gap-2"><code className="break-all rounded bg-black/5 px-2 py-1 text-xs dark:bg-white/10">{text}</code><CopyButton text={text} label="Copy" /></span>;
const Ready = ({ label, ok }: { label: string; ok: boolean }) => (
  <div className={clsx("flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold", ok ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-parchment-deep text-ink-soft dark:border-night-700 dark:text-parchment/60")}>
    {ok ? <CheckCircle2 size={18} /> : <CircleDashed size={18} />} {label}: {ok ? "ready" : "not yet"}
  </div>
);

function Step({ n, title, done, detail, children }: { n: number; title: string; done: boolean; detail?: string; children: ReactNode }) {
  const [open, setOpen] = useState(!done);
  return (
    <Card className="!p-4">
      <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="flex items-center gap-3"><span className={clsx("grid h-7 w-7 place-items-center rounded-full text-sm font-bold", done ? "bg-emerald-600 text-white" : "bg-night-800 text-parchment dark:bg-gold dark:text-night-950")}>{done ? "✓" : n}</span>
          <span className="min-w-0"><span className="font-bold">{title}</span>{detail && <span className="block break-all text-sm text-ink-soft sm:ml-2 sm:inline dark:text-parchment/60">{detail}</span>}</span></span>
        <span className="shrink-0 text-sm text-ink-soft">{open ? "Hide" : done ? "Change" : "Set up"}</span>
      </button>
      {open && <div className="mt-3 grid gap-3 text-sm leading-relaxed">{children}</div>}
    </Card>
  );
}

function SaveForm({ provider, fields, saved }: { provider: string; fields: [string, string][]; saved?: boolean }) {
  const qc = useQueryClient();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [state, setState] = useState<{ busy?: boolean; err?: string; ok?: boolean }>({});
  return (
    <form className="grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))_auto]" onSubmit={async (e) => {
      e.preventDefault(); setState({ busy: true });
      try { await studio("save", { provider, values: vals }); setVals({}); setState({ ok: true }); qc.invalidateQueries({ queryKey: ["connections"] }); }
      catch (err) { setState({ err: (err as Error).message }); }
    }}>
      {fields.map(([k, label]) => (
        <input key={k} id={`${provider}-${k}`} type={k.includes("secret") || k === "token" ? "password" : "text"} autoComplete="off" required placeholder={saved ? `${label} (saved — enter to replace)` : label} aria-label={label}
          value={vals[k] ?? ""} onChange={(e) => setVals({ ...vals, [k]: e.target.value })}
          className="min-w-0 rounded-lg border border-parchment-deep bg-white/80 px-3 py-2 text-sm dark:border-night-700 dark:bg-night-950" />
      ))}
      <Button type="submit" variant="primary" disabled={state.busy}>{state.busy ? "Checking…" : "Save"}</Button>
      {state.err && <p className="text-sm text-vermilion sm:col-span-full">{state.err}</p>}
      {state.ok && <p className="text-sm text-emerald-700 sm:col-span-full dark:text-emerald-300">Saved.</p>}
    </form>
  );
}

function ConnectButton({ provider, label, disabled, connected }: { provider: string; label: string; disabled: boolean; connected: boolean }) {
  const [err, setErr] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary" disabled={disabled} onClick={async () => {
        setErr("");
        try { const r = await studio<{ url: string }>("oauth_start", { provider, return_to: window.location.origin }); window.location.href = r.url; } catch (e) { setErr((e as Error).message); }
      }}><Link2 size={15} /> {connected ? `Reconnect ${provider}` : label}</Button>
      {disabled && <span className="text-xs text-ink-soft">Save the app keys above first.</span>}
      {err && <span className="text-sm text-vermilion">{err}</span>}
    </div>
  );
}

export type { Conn };

function FindPage() {
  const qc = useQueryClient();
  const [st, setSt] = useState<{ busy?: boolean; ok?: string; err?: string }>({});
  return (
    <div className="grid gap-1">
      <Button size="sm" disabled={st.busy} onClick={async () => {
        setSt({ busy: true });
        try { const r = await studio<{ page: string }>("facebook_page"); setSt({ ok: `Connected to the Page "${r.page}".` }); qc.invalidateQueries({ queryKey: ["connections"] }); }
        catch (e) { setSt({ err: (e as Error).message }); }
      }}><Link2 size={14} /> {st.busy ? "Looking…" : "Find my Page"}</Button>
      {st.ok && <p className="text-xs text-emerald-700 dark:text-emerald-300">{st.ok}</p>}
      {st.err && <p className="text-xs text-vermilion">{st.err}</p>}
    </div>
  );
}

function TelegramTest() {
  const [st, setSt] = useState<{ busy?: boolean; msg?: string; err?: string }>({});
  return <div className="mt-2 flex flex-wrap items-center gap-2">
    <Button size="sm" disabled={st.busy} onClick={async () => { setSt({ busy: true }); try { await studio("telegram_test"); setSt({ msg: "Sent. Check Telegram." }); } catch (e) { setSt({ err: e instanceof Error ? e.message : String(e) }); } }}>Send test</Button>
    {st.msg && <span className="text-sm text-emerald-600">{st.msg}</span>}{st.err && <span className="text-sm text-vermilion">{st.err}</span>}
  </div>;
}
