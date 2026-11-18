import clsx from "clsx";
import { ExternalLink, Instagram, Youtube } from "lucide-react";
import type { ProviderStatus } from "../lib/api";

/** Where "Post now" will publish: account name + platform ID, linked to the live profile. */
export function targetFor(platform: string, providers: Record<string, ProviderStatus | undefined>) {
  const p = providers[platform];
  if (!p?.connected) return null;
  if (platform === "instagram")
    return { label: p.name ? `@${p.name}` : "Instagram account", id: p.account_id, idLabel: "Account ID", url: p.name ? `https://www.instagram.com/${p.name}/` : null };
  if (platform === "youtube")
    return { label: p.name ?? "YouTube channel", id: p.account_id, idLabel: "Channel ID", url: p.account_id ? `https://www.youtube.com/channel/${p.account_id}` : null };
  return null;
}

export function Target({ platform, providers, className }: { platform: "instagram" | "youtube"; providers: Record<string, ProviderStatus | undefined>; className?: string }) {
  const t = targetFor(platform, providers);
  const Icon = platform === "instagram" ? Instagram : Youtube;
  if (!t) return null;
  return (
    <div className={clsx("flex min-w-0 items-start gap-2 rounded-lg bg-white/70 p-2 text-xs dark:bg-night-950/60", className)}>
      <Icon size={16} className={clsx("mt-0.5 shrink-0", platform === "instagram" ? "text-pink-600" : "text-red-600")} />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-ink-soft dark:text-parchment/60">Posts to</div>
        {t.url ? (
          <a href={t.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all font-semibold text-ink underline decoration-gold-deep/50 underline-offset-2 dark:text-parchment">{t.label}<ExternalLink size={11} /></a>
        ) : <span className="font-semibold">{t.label}</span>}
        {t.id && <div className="break-all font-mono text-[11px] text-ink-soft dark:text-parchment/60">{t.idLabel}: {t.id}</div>}
      </div>
    </div>
  );
}
