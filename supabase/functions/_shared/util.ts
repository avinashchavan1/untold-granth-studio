// Shared helpers for the studio's edge functions.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

export const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
export const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
export const APP_URL = "https://untold-granth-studio.netlify.app";
export const FN_URL = `${SUPABASE_URL}/functions/v1`;
export const REPO = "avinashchavan1/untold-granth-studio";
export const HF_REPO = "Avinash1443/untold-granth-masters";
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

// ---------- Instagram (Instagram API with Instagram Login) ----------
export async function instagramToken(): Promise<{ token: string; user_id: string }> {
  const ig = await getIntegration("instagram");
  if (!ig?.access_token) throw new Error("Instagram is not connected");
  // long-lived tokens last 60 days; refresh when older than 7 days
  if (Date.now() - (ig.refreshed_at ?? 0) > 7 * 864e5) {
    const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(ig.access_token)}`);
    const t = await r.json();
    if (t.access_token) { ig.access_token = t.access_token; ig.refreshed_at = Date.now(); ig.expires_at = Date.now() + (t.expires_in ?? 5184000) * 1000; await setIntegration("instagram", ig); }
  }
  return { token: ig.access_token, user_id: ig.user_id };
}
