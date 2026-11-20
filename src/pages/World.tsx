import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { Card, ErrorNote, SectionTitle, Spinner } from "../components/ui";
import { mediaUrl, useCharacters, useLocations } from "../lib/api";
import type { Character } from "../lib/types";

// Cast & world: every character's look (portrait rendered from the same rig the reels use), voice (with a real line to play),
// where they appear, and who chose it. Looks Claude chose that you haven't seen in a posted reel are listed first for review.
type Look = { rig?: string; portrait?: string; appears_in?: string[]; posted_in?: string[]; look_chosen?: "user" | "seen" | "claude"; note?: string | null };
type Voice = Record<string, unknown> & { name?: string; engine?: string; chosen?: string; character?: string; sample?: string; sample_line?: { reel: string; hi: string; en: string } };

const useStorage = (path?: string) => useQuery({ enabled: !!path, queryKey: ["media-path", path], staleTime: 45 * 60 * 1000, queryFn: () => mediaUrl({ store: "supabase", path: path!, url: null }) });

export default function World() {
  const chars = useCharacters();
  const locs = useLocations();
  if (chars.isLoading) return <Spinner />;
  if (chars.error) return <ErrorNote error={chars.error} />;
  const all = chars.data ?? [];
  const look = (c: Character) => c.look as Look;
  const review = all.filter((c) => look(c).look_chosen === "claude").sort((a, b) => (a.tier === "major" ? 0 : 1) - (b.tier === "major" ? 0 : 1));
  const shown = (tier: "major" | "minor") => all.filter((c) => c.tier === tier && c.status !== "needed" && look(c).look_chosen !== "claude" && (look(c).portrait || (c.voice as Voice).engine));
  const needed = all.filter((c) => c.status === "needed");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide">Cast & world</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft dark:text-parchment/60">Every character's look and voice, exactly as they appear in the reels. Major characters are your choice; tell me in the chat (with the name) if any look or voice should change.</p>
      </div>
      {review.length > 0 && (
        <section>
          <SectionTitle>Please review · looks I chose</SectionTitle>
          <p className="-mt-2 mb-3 text-sm text-ink-soft dark:text-parchment/60">These looks were my choice and haven't been in a posted reel yet. Say "change Mandodari: …" and I'll redo it before posting.</p>
          <Grid list={review} />
        </section>
      )}
      <section><SectionTitle>Major characters</SectionTitle><Grid list={shown("major")} /></section>
      <section><SectionTitle>Minor characters</SectionTitle><Grid list={shown("minor")} /></section>
      {needed.length > 0 && (
        <section>
          <SectionTitle>Not cast yet · you'll choose these when they first appear</SectionTitle>
          <div className="flex flex-wrap gap-2">{needed.map((c) => <span key={c.id} className="rounded-full border border-parchment-deep px-3 py-1 text-sm dark:border-night-700">{c.name}</span>)}</div>
        </section>
      )}
      <section>
        <SectionTitle>Locations</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(locs.data ?? []).map((l) => (
            <Card key={l.id} className="!p-4"><div className="font-semibold">{l.name}</div><p className="mt-1 text-sm text-ink-soft dark:text-parchment/70">{l.description}</p></Card>
          ))}
        </div>
      </section>
    </div>
  );
}

const Grid = ({ list }: { list: Character[] }) => <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{list.map((c) => <CharCard key={c.id} c={c} />)}</div>;

function CharCard({ c }: { c: Character }) {
  const L = c.look as Look, V = c.voice as Voice;
  const img = useStorage(L.portrait), audio = useStorage(V.sample);
  const lookTag = L.look_chosen === "user" ? ["Look approved by you", "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"]
    : L.look_chosen === "seen" ? [`Look seen in ${L.posted_in?.[0]} (posted)`, "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"]
    : L.portrait ? ["Look chosen by Claude", "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"] : null;
  const voiceByYou = /USER/i.test(String(V.chosen ?? ""));
  return (
    <Card className="flex flex-col overflow-hidden !p-0">
      <div className="relative aspect-[4/5] w-full bg-night-900">
        {L.portrait && (img.data ? <img src={img.data} alt={`${c.name} as drawn in the reels`} className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full animate-pulse bg-night-800" />)}
        {!L.portrait && <div className="flex h-full items-center justify-center p-3 text-center text-xs text-parchment/60">{c.key === "narrator" ? "Voice only: the storyteller" : "No look yet"}</div>}
        {c.tier === "major" && <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-night-950">Major</span>}
      </div>
      <div className="grid gap-2 p-3">
        <div className="font-display text-base font-semibold leading-tight sm:text-lg">{c.name}</div>
        {lookTag && <span className={clsx("w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold", lookTag[1])}>{lookTag[0]}</span>}
        {L.note && <p className="text-xs text-ink-soft dark:text-parchment/60">{L.note}</p>}
        {V.engine ? (
          <div className="grid gap-1 text-xs">
            <div><span className="text-ink-soft dark:text-parchment/60">Voice: </span><span className="font-semibold">{String(V.name ?? "").split(/ [-–(]/)[0]}</span>{voiceByYou && <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-px text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">your pick</span>}</div>
            {audio.data && <audio controls preload="none" src={audio.data} className="h-8 w-full" />}
            {V.sample_line && <div className="text-ink-soft dark:text-parchment/60">“{V.sample_line.hi}” <span className="opacity-70">({V.sample_line.reel})</span></div>}
          </div>
        ) : c.key !== "narrator" && <div className="text-xs text-ink-soft dark:text-parchment/60">No speaking lines yet.</div>}
        {(L.appears_in?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1">{L.appears_in!.map((r) => <Link key={r} to={`/reels/${r}`} className="rounded border border-gold-deep/50 px-1.5 py-px font-mono text-[11px] text-gold-deep hover:bg-gold/10 dark:border-gold/40 dark:text-gold">{r}</Link>)}</div>
        )}
      </div>
    </Card>
  );
}
