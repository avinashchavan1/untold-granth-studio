export type Stage = "idea" | "researching" | "scripted" | "voiced" | "rendered" | "review" | "approved" | "published" | "dropped";
export type ReelKind = "myth_buster" | "reveal" | "dialogue";
export type Platform = "instagram" | "youtube" | "facebook" | "threads" | "moj" | "sharechat" | "josh" | "whatsapp";
export type PubState = "todo" | "scheduled" | "posting" | "posted" | "failed" | "skipped";

export const STAGES: { key: Stage; label: string; hint: string }[] = [
  { key: "idea", label: "Idea", hint: "In the plan, not started" },
  { key: "researching", label: "Researching", hint: "Reading the verses, filling claims" },
  { key: "scripted", label: "Scripted", hint: "Script written and checked" },
  { key: "voiced", label: "Voiced", hint: "Narrator and character takes picked" },
  { key: "rendered", label: "Rendered", hint: "Video and masters built" },
  { key: "review", label: "In review", hint: "Waiting for your citation check" },
  { key: "approved", label: "Approved", hint: "Ready to post" },
  { key: "published", label: "Published", hint: "Live on the platforms" },
];
export const KIND_LABEL: Record<ReelKind, string> = { myth_buster: "Myth-buster", reveal: "Reveal", dialogue: "Dialogue" };
export const PLATFORMS: { key: Platform; label: string; uploadUrl: string; capField: string; titleField?: string; master: "instagram" | "youtube" }[] = [
  { key: "instagram", label: "Instagram Reels", uploadUrl: "https://www.instagram.com/", capField: "instagram", master: "instagram" },
  { key: "youtube", label: "YouTube Shorts", uploadUrl: "https://www.youtube.com/upload", capField: "youtube_description", titleField: "youtube_title", master: "youtube" },
  { key: "facebook", label: "Facebook Reels", uploadUrl: "https://www.facebook.com/reels/create", capField: "facebook", master: "instagram" },
];

export interface ScriptShot { id: number; voice: string | null; hi: string; en: string; cite?: string; card?: [string, string | null][]; }
export interface Script { reel: string; title: string; source?: string; status?: string; shots: ScriptShot[]; caption?: string; avoid?: string[]; }

export interface Reel {
  id: string; series_id: string; code: string; plan_no: number | null; title: string; kind: ReelKind | null; stage: Stage;
  source_ref: string | null; art_cost: string | null; plan_note: string | null; hook_hi: string | null; hook_en: string | null;
  length_s: number | null; script: Script | null; captions: Record<string, string>; hashtags: string[]; verify_note: string | null;
  reviewed: boolean; reviewed_at: string | null; notes: string | null; created_at: string; updated_at: string;
  follows?: string | null;   // script.json "follows": post the day after this reel
}
export interface Claim { id: string; reel_id: string; position: number; claim: string; ref: string; quote_sa: string | null; verified: boolean; sources: string[]; }
export interface FileRow { id: string; reel_id: string | null; kind: string; store: "supabase" | "github_release" | "github_repo" | "external"; path: string | null; url: string | null; bytes: number | null; spec: string | null; created_at: string; }
export interface Publication { external_id?: string | null; stats?: Record<string, number | null>; stats_at?: string | null; id: string; reel_id: string; platform: Platform; state: PubState; post_url: string | null; posted_at: string | null; scheduled_for: string | null; notes: string | null; }
export interface Character { id: string; series_id: string; key: string; name: string; tier: "major" | "minor"; status: "needed" | "audition" | "provisional" | "locked"; voice: Record<string, unknown>; look: Record<string, unknown>; notes: string | null; first_reel: string | null; }
export interface Location { id: string; key: string; name: string; builder: string | null; description: string | null; }
export interface Doc { id: string; series_id: string | null; slug: string; title: string; kind: string; body_md: string; updated_at: string; }
export interface Series { id: string; name: string; book: string; edition: string | null; config: Record<string, unknown>; }
export interface Channel { platform: Platform; handle: string; url: string | null; profile?: Record<string, unknown>; applied?: Record<string, unknown>; }
export interface Activity { id: number; at: string; actor: string | null; reel_id: string | null; action: string; detail: Record<string, unknown>; }
