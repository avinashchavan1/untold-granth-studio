// Shared helpers for the studio's edge functions.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

export const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
export const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
// channel settings come from function secrets (setup.sh prints them from channel.json): APP_URL, GITHUB_REPO, HF_MASTERS_REPO, IG_HANDLE
export const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";
export const FN_URL = `${SUPABASE_URL}/functions/v1`;
export const REPO = Deno.env.get("GITHUB_REPO") ?? "";
export const HF_REPO = Deno.env.get("HF_MASTERS_REPO") ?? "";
export const IG_HANDLE = Deno.env.get("IG_HANDLE") ?? "your Instagram account";
export const IG_API = "https://graph.instagram.com/v21.0";

export const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-job-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

export async function sha256(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export const randomToken = (n = 32) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function getIntegration(provider: string): Promise<Record<string, any> | null> {
  const { data } = await admin.from("integrations").select("data").eq("provider", provider).maybeSingle();
  return (data?.data as Record<string, any>) ?? null;
}
export async function setIntegration(provider: string, data: Record<string, unknown>, connected = true) {
  const { error } = await admin.from("integrations").upsert({ provider, data, connected_at: connected ? new Date().toISOString() : null, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

/** The signed-in user, only if their email is on the admin list. */
export async function requireAdmin(req: Request): Promise<string> {
  const auth = req.headers.get("Authorization") ?? "";
  const user = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: u } = await user.auth.getUser();
  const { data: ok } = await user.rpc("is_admin");
  if (!u?.user || ok !== true) throw new Response(JSON.stringify({ error: "not allowed" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
  return u.user.email ?? "admin";
}

// ---------- YouTube (Google OAuth) ----------
export async function youtubeAccessToken(): Promise<string> {
  const app = await getIntegration("google_app");
  const yt = await getIntegration("youtube");
  if (!app?.client_id || !yt?.refresh_token) throw new Error("YouTube is not connected");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: app.client_id, client_secret: app.client_secret, refresh_token: yt.refresh_token, grant_type: "refresh_token" }),
  });
  const t = await r.json();
  if (!t.access_token) throw new Error("YouTube token refresh failed: " + (t.error_description ?? t.error ?? r.status));
  return t.access_token;
}

// ---------- Instagram ----------
// Two ways to connect: a Meta system-user token from "API setup with Unified login" (graph.facebook.com, never expires),
// or the older Instagram Login OAuth (graph.instagram.com, 60-day token, refreshed here).
export const FB_GRAPH = "https://graph.facebook.com/v21.0";
export async function instagramToken(): Promise<{ token: string; user_id: string; api_base: string }> {
  const ig = await getIntegration("instagram");
  if (!ig?.access_token) throw new Error("Instagram is not connected");
  if (!ig.system_user && Date.now() - (ig.refreshed_at ?? 0) > 7 * 864e5) {
    const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(ig.access_token)}`);
    const t = await r.json();
    if (t.access_token) { ig.access_token = t.access_token; ig.refreshed_at = Date.now(); ig.expires_at = Date.now() + (t.expires_in ?? 5184000) * 1000; await setIntegration("instagram", ig); }
  }
  return { token: ig.access_token, user_id: ig.user_id, api_base: ig.api_base ?? IG_API };
}

/** Find + verify the Instagram professional account a Meta token can publish to.
 *  Order: account ID given by the user → assets granted to this token (debug_token granular scopes)
 *  → Pages' linked Instagram accounts → Instagram accounts owned by the token's business portfolios. */
export async function resolveInstagramFromToken(token: string, givenId?: string): Promise<{ user_id: string; username: string | null }> {
  const g = async (path: string, tok = token) => { const r = await fetch(`${FB_GRAPH}/${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(tok)}`); return r.json(); };
  const me = await g("me?fields=id,name");
  if (me.error) throw new Error(`Meta refused this token: ${me.error.message}`);
  const candidates: string[] = [];
  const notes: string[] = [];
  if (givenId) candidates.push(givenId.trim());
  const app = await getIntegration("meta_app");
  if (app?.app_id && app?.app_secret) {
    const dbg = await (await fetch(`${FB_GRAPH}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(`${app.app_id}|${app.app_secret}`)}`)).json();
    const scopes = (dbg.data?.granular_scopes ?? []) as { scope: string; target_ids?: string[] }[];
    notes.push(`granted: ${scopes.map((x) => `${x.scope}(${(x.target_ids ?? []).length})`).join(", ") || dbg.error?.message || "none"}`);
    for (const sc of scopes) if (/^instagram/.test(sc.scope)) for (const id of sc.target_ids ?? []) candidates.push(id);
  }
  const pages = await g("me/accounts?fields=instagram_business_account{id,username}&limit=50");
  for (const p of pages.data ?? []) if (p.instagram_business_account?.id) candidates.push(p.instagram_business_account.id);
  const biz = await g("me/businesses?fields=id&limit=10");
  for (const b of biz.data ?? []) {
    for (const edge of ["owned_instagram_accounts", "instagram_business_accounts", "instagram_accounts"]) {
      const r = await g(`${b.id}/${edge}?fields=id,username&limit=25`);
      for (const a of r.data ?? []) if (a.id) candidates.push(a.id);
    }
  }
  for (const id of [...new Set(candidates)]) {
    const a = await g(`${id}?fields=id,username`);
    if (a.id && !a.error) return { user_id: String(a.id), username: a.username ?? null };
    notes.push(`${id}: ${a.error?.message ?? "no access"}`);
  }
  throw new Error(`No Instagram account is attached to this login. When Meta asks which assets to share, pick ${IG_HANDLE} under "Instagram account". (${notes.join("; ").slice(0, 300)})`);
}
