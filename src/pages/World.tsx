import clsx from "clsx";
import { Card, ErrorNote, SectionTitle, Spinner } from "../components/ui";
import { useCharacters, useLocations } from "../lib/api";
import type { Character } from "../lib/types";

const STATUS: Record<Character["status"], string> = {
  locked: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  provisional: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  audition: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  needed: "bg-stone-200 text-stone-700 dark:bg-night-700 dark:text-parchment/70",
};

export default function World() {
  const chars = useCharacters();
  const locs = useLocations();
  if (chars.isLoading) return <Spinner />;
  if (chars.error) return <ErrorNote error={chars.error} />;
  const all = chars.data ?? [];
  const group = (tier: "major" | "minor") => all.filter((c) => c.tier === tier);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide">Cast & world</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft dark:text-parchment/60">Locked voices and looks keep every reel consistent. You choose voices for major characters; minor, one-episode characters are cast by Claude and noted here.</p>
      </div>
      {(["major", "minor"] as const).map((tier) => (
        <section key={tier}>
          <SectionTitle>{tier === "major" ? "Major characters · you choose the voice" : "Minor characters · cast by Claude"}</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group(tier).map((c) => {
              const v = c.voice as Record<string, string | number | string[]>;
              const rig = (c.look as { rig?: string }).rig ?? "";
              const swatches = [...rig.matchAll(/#[0-9a-f]{6}/gi)].map((m) => m[0]).slice(0, 6);
              return (
                <Card key={c.id} className="!p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><div className="font-display text-lg font-semibold">{c.name}</div><div className="text-xs text-ink-soft dark:text-parchment/60">{c.first_reel ? `First in ${c.first_reel}` : "Not cast yet"}</div></div>
                    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider", STATUS[c.status])}>{c.status}</span>
                  </div>
                  {v.engine ? (
                    <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                      <dt className="text-ink-soft dark:text-parchment/60">Voice</dt><dd className="break-words">{String(v.name ?? v.source ?? v.ref ?? "")}</dd>
                      <dt className="text-ink-soft dark:text-parchment/60">Engine</dt><dd>{String(v.engine)}{v.voice_id ? <span className="ml-1 font-mono text-xs text-ink-soft">{String(v.voice_id)}</span> : null}</dd>
                      {v.character ? <><dt className="text-ink-soft dark:text-parchment/60">Delivery</dt><dd>{String(v.character)}</dd></> : null}
                      {v.chosen ? <><dt className="text-ink-soft dark:text-parchment/60">Chosen</dt><dd className="text-xs">{String(v.chosen)}</dd></> : null}
                    </dl>
                  ) : <p className="mt-3 text-sm text-ink-soft dark:text-parchment/60">Voice audition happens the first time this character speaks.</p>}
                  {swatches.length > 0 && <div className="mt-3 flex gap-1.5" aria-label="Locked colours">{swatches.map((s) => <span key={s} title={s} className="h-5 w-5 rounded-full border border-black/10" style={{ background: s }} />)}</div>}
                </Card>
              );
            })}
          </div>
        </section>
      ))}
      <section>
        <SectionTitle>Locations</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(locs.data ?? []).map((l) => (
            <Card key={l.id} className="!p-4"><div className="font-semibold">{l.name}</div><div className="mt-0.5 font-mono text-xs text-gold-deep dark:text-gold">{l.builder}</div><p className="mt-2 text-sm text-ink-soft dark:text-parchment/70">{l.description}</p></Card>
          ))}
        </div>
      </section>
    </div>
  );
}
