import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MEDIA_BUCKET, supabase } from "./supabase";
import type { Activity, Channel, Character, Claim, Doc, FileRow, Location, Publication, Reel, Series, Stage } from "./types";

async function must<T>(p: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

const REEL_LIST = "id,series_id,code,plan_no,title,kind,stage,source_ref,art_cost,plan_note,hook_hi,hook_en,length_s,reviewed,reviewed_at,updated_at,created_at,hashtags,captions,verify_note,notes,follows:script->>follows,category:script->>category,hook_score:script->hook_options->0->>score,requested_at,request_pos,request_note,requested_by";

// the pipeline: every reel except dropped / merged ones
export const useReels = () =>
  useQuery({ queryKey: ["reels"], queryFn: async () => (await must<Reel[]>(supabase.from("reels").select(REEL_LIST).neq("stage", "dropped").order("plan_no", { ascending: true, nullsFirst: false }))).filter((r) => r.kind !== "longform") });   // long-form rows (if any) stay out of reel lists
export const useDroppedReels = () =>
  useQuery({ queryKey: ["reels", "dropped"], queryFn: () => must<Reel[]>(supabase.from("reels").select(REEL_LIST).eq("stage", "dropped").order("plan_no", { ascending: true })) });

export const useReel = (code: string) =>
  useQuery({ queryKey: ["reel", code], queryFn: () => must<Reel>(supabase.from("reels").select("*").eq("code", code).single()) });

export const useClaims = (reelId?: string) =>
  useQuery({ enabled: !!reelId, queryKey: ["claims", reelId], queryFn: () => must<Claim[]>(supabase.from("claims").select("*").eq("reel_id", reelId!).order("position")) });

export const useFiles = (reelId?: string) =>
  useQuery({ enabled: !!reelId, queryKey: ["files", reelId], queryFn: () => must<FileRow[]>(supabase.from("files").select("*").eq("reel_id", reelId!).order("created_at")) });

export const useAllFiles = () => useQuery({ queryKey: ["files"], queryFn: () => must<FileRow[]>(supabase.from("files").select("*")) });

export const usePublications = (reelId?: string) =>
  useQuery({ queryKey: ["pubs", reelId ?? "all"], queryFn: () => must<Publication[]>(reelId ? supabase.from("publications").select("*").eq("reel_id", reelId) : supabase.from("publications").select("*")) });

export const useCharacters = () => useQuery({ queryKey: ["characters"], queryFn: () => must<Character[]>(supabase.from("characters").select("*").order("tier").order("name")) });
export const useLocations = () => useQuery({ queryKey: ["locations"], queryFn: () => must<Location[]>(supabase.from("locations").select("*").order("name")) });
export const useDocs = () => useQuery({ queryKey: ["docs"], queryFn: () => must<Doc[]>(supabase.from("docs").select("*").order("title")) });
export const useDoc = (slug: string) => useQuery({ queryKey: ["doc", slug], queryFn: () => must<Doc>(supabase.from("docs").select("*").eq("slug", slug).single()) });
export const useSeries = () => useQuery({ queryKey: ["series"], queryFn: () => must<Series[]>(supabase.from("series").select("*")) });
export const useChannels = () => useQuery({ queryKey: ["channels"], queryFn: () => must<Channel[]>(supabase.from("channels").select("*")) });
export const useActivity = () => useQuery({ queryKey: ["activity"], queryFn: () => must<Activity[]>(supabase.from("activity").select("*").order("at", { ascending: false }).limit(30)) });
export const useAdmins = () => useQuery({ queryKey: ["admins"], queryFn: () => must<{ email: string; added_at: string }[]>(supabase.from("app_admins").select("*").order("added_at")) });

async function log(action: string, reel_id: string | null, detail: Record<string, unknown> = {}) {
  const { data } = await supabase.auth.getUser();
  await supabase.from("activity").insert({ action, reel_id, detail, actor: data.user?.email ?? null });
}

export function useUpdateReel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reel, patch, action }: { reel: Reel; patch: Partial<Reel>; action?: string }) => {
      await must(supabase.from("reels").update(patch).eq("id", reel.id).select("id"));
      if (action) await log(action, reel.id, { code: reel.code, ...patch });
    },
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["reels"] }); qc.invalidateQueries({ queryKey: ["reel", v.reel.code] }); qc.invalidateQueries({ queryKey: ["activity"] }); },
  });
}

export function useSetStage() {
  const up = useUpdateReel();
  return (reel: Reel, stage: Stage) => up.mutateAsync({ reel, patch: { stage }, action: `stage → ${stage}` });
}

export function useUpsertPublication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reel, platform, patch }: { reel: Reel; platform: string; patch: Partial<Publication> }) => {
      await must(supabase.from("publications").upsert({ reel_id: reel.id, platform, ...patch }, { onConflict: "reel_id,platform" }).select("id"));
      await log(`${platform}: ${patch.state ?? "updated"}`, reel.id, { code: reel.code, url: patch.post_url ?? null });
      // all three main platforms posted → reel is published
      const pubs = await must<Publication[]>(supabase.from("publications").select("*").eq("reel_id", reel.id));
      const done = ["instagram", "youtube", "facebook"].every((p) => pubs.find((x) => x.platform === p)?.state === "posted");
      if (done && reel.stage !== "published") await must(supabase.from("reels").update({ stage: "published" }).eq("id", reel.id).select("id"));
    },
    onSuccess: (_d, v) => { ["pubs", "reels", "activity"].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); qc.invalidateQueries({ queryKey: ["reel", v.reel.code] }); },
  });
}

export function useSaveDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: Pick<Doc, "id" | "slug" | "body_md" | "title">) => {
      await must(supabase.from("docs").update({ body_md: doc.body_md, title: doc.title }).eq("id", doc.id).select("id"));
      await log(`doc edited: ${doc.slug}`, null);
    },
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["docs"] }); qc.invalidateQueries({ queryKey: ["doc", v.slug] }); },
  });
}

export function useSaveCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Character> }) => { await must(supabase.from("characters").update(patch).eq("id", id).select("id")); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["characters"] }),
  });
}

export function useAddReel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: { series_id: string; code: string; title: string; kind: string | null; source_ref: string; plan_note: string; plan_no: number }) => {
      await must(supabase.from("reels").insert(r).select("id"));
      await log("reel added", null, { code: r.code });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reels"] }),
  });
}

export function useAdminMutations() {
  const qc = useQueryClient();
  const add = useMutation({ mutationFn: async (email: string) => { await must(supabase.from("app_admins").insert({ email: email.trim().toLowerCase() }).select("email")); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admins"] }) });
  const remove = useMutation({ mutationFn: async (email: string) => { await must(supabase.from("app_admins").delete().eq("email", email).select("email")); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admins"] }) });
  return { add, remove };
}

// ---------- media ----------
const urlCache = new Map<string, { url: string; exp: number }>();
export async function mediaUrl(f: Pick<FileRow, "store" | "path" | "url">, download = false): Promise<string | null> {
  if (f.store !== "supabase") return f.url;
  if (!f.path) return null;
  const key = f.path + (download ? "#dl" : "");
  const hit = urlCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(f.path, 3600, download ? { download: true } : undefined);
  if (error || !data) return null;
  urlCache.set(key, { url: data.signedUrl, exp: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}
export const useMediaUrl = (f?: FileRow | null, download = false) =>
  useQuery({ enabled: !!f, queryKey: ["media", f?.id, download], staleTime: 45 * 60 * 1000, queryFn: () => mediaUrl(f!, download) });

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

// ---------- publishing (server functions) ----------
export async function studio<T = Record<string, unknown>>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("studio", { body: { action, ...body } });
  if (error) {
    let msg = error.message;
    try { const ctx = (error as { context?: Response }).context; if (ctx) msg = (await ctx.json()).error ?? msg; } catch { /* keep message */ }
    throw new Error(msg);
  }
  return data as T;
}

export interface ProviderStatus { connected: boolean; at: string | null; name: string | null; account_id: string | null; expires_at: number | null; has_values: boolean; }
export interface Connections { providers: Record<string, ProviderStatus | undefined>; redirect_uris: { youtube: string; instagram: string }; }
export interface StatDay { reel_id: string; platform: string; day: string; stats: Record<string, number | null> }
export interface FollowerDay { platform: string; day: string; followers: number | null; extra: Record<string, number | null> }
export interface StatLog { reel_id: string; platform: string; at: string; views: number | null; likes: number | null; comments: number | null; shares: number | null; saves: number | null; reach: number | null }
export const useStatsLog = () => useQuery({ queryKey: ["stats_log"], refetchInterval: 60e3, queryFn: () => must<StatLog[]>(supabase.from("stats_log").select("*").order("at").limit(5000)) });
export const useStatsDaily = () => useQuery({ queryKey: ["stats_daily"], refetchInterval: 60e3, queryFn: () => must<StatDay[]>(supabase.from("stats_daily").select("*").order("day")) });
export const useFollowers = () => useQuery({ queryKey: ["follower_daily"], refetchInterval: 60e3, queryFn: () => must<FollowerDay[]>(supabase.from("follower_daily").select("*").order("day")) });
export const useConnections = () => useQuery({ queryKey: ["connections"], queryFn: () => studio<Connections>("status") });

export interface PublishJob { id: string; reel_id: string; platform: string; status: "queued" | "running" | "done" | "failed"; step: string | null; log: string; result_url: string | null; created_at: string; finished_at: string | null; }
export const useJobs = (reelId?: string) =>
  useQuery({
    enabled: !!reelId, queryKey: ["jobs", reelId],
    queryFn: () => must<PublishJob[]>(supabase.from("publish_jobs").select("id,reel_id,platform,status,step,log,result_url,created_at,finished_at").eq("reel_id", reelId!).order("created_at", { ascending: false }).limit(20)),
    refetchInterval: (q) => ((q.state.data as PublishJob[] | undefined)?.some((j) => j.status === "queued" || j.status === "running") ? 4000 : false),
  });

export function usePublishNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reel, platform, privacy }: { reel: Reel; platform: string; privacy?: string }) => studio("publish", { reel_id: reel.id, platform, options: { privacy } }),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["jobs", v.reel.id] }); qc.invalidateQueries({ queryKey: ["pubs"] }); },
    onSettled: (_d, _e, v) => qc.invalidateQueries({ queryKey: ["jobs", v.reel.id] }),
  });
}

export function useSaveCaptions() {
  const up = useUpdateReel();
  return (reel: Reel, captions: Record<string, string>) => up.mutateAsync({ reel, patch: { captions }, action: "captions edited" });
}

// ---------- ideas inbox ----------
export interface Idea { id: string; body: string; tags: string[]; status: "new" | "promoted" | "dropped"; reel_id: string | null; created_by: string | null; created_at: string; updated_at: string; }
export const useIdeas = () => useQuery({ queryKey: ["ideas"], queryFn: () => must<Idea[]>(supabase.from("ideas").select("*").order("created_at", { ascending: false })) });
export function useIdeaMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["ideas"] });
  const add = useMutation({
    mutationFn: async (v: { body: string; tags: string[] }) => {
      const { data } = await supabase.auth.getUser();
      await must(supabase.from("ideas").insert({ ...v, created_by: data.user?.email ?? null }).select("id"));
    }, onSuccess: done });
  const update = useMutation({ mutationFn: async ({ id, patch }: { id: string; patch: Partial<Idea> }) => { await must(supabase.from("ideas").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select("id")); }, onSuccess: done });
  const remove = useMutation({ mutationFn: async (id: string) => { await must(supabase.from("ideas").delete().eq("id", id).select("id")); }, onSuccess: done });
  return { add, update, remove };
}

// live "what Claude is doing" status (scripts/status.py writes it; the bar on every page reads it)
export interface WorkPhase { name: string; state: "done" | "running" | "todo"; pct?: number }
export interface WorkQueueItem { code: string; title: string; state: "done" | "running" | "queued"; note?: string }
export interface WorkReel { step?: number; task?: string | null; state?: "queued" | "running" | "paused" | "done"; pct?: number | null }
export interface WorkInfo { batch?: { title: string; codes: string[]; started: string } | null; reels?: Record<string, WorkReel>; batch_pct?: number | null; title?: string | null; phase?: string | null; phases?: WorkPhase[]; queue?: WorkQueueItem[]; events?: { at: string; text: string }[]; overall_eta_min?: number | null; elapsed_min?: number | null }
export interface WorkStatus { lane: string; state: "working" | "waiting" | "idle"; reel_code: string | null; task: string | null; detail: string | null; step: number | null; steps: number | null; pct: number | null; eta_min: number | null; started_at: string | null; updated_at: string; info: WorkInfo | null }
export const useWorkStatus = () =>
  useQuery({ queryKey: ["work_status"], refetchInterval: 5_000, refetchIntervalInBackground: false, staleTime: 5_000,
    queryFn: () => must<WorkStatus[]>(supabase.from("work_status").select("*").eq("lane", "main")).then((r) => r[0] ?? null) });
