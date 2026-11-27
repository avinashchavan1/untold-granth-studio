// OAuth callbacks: /functions/v1/oauth/youtube and /functions/v1/oauth/instagram
import { admin, APP_URL, FB_GRAPH, FN_URL, getIntegration, facebookPage, resolveInstagramFromToken, setIntegration } from "../_shared/util.ts";

const ALLOWED = [APP_URL, ...(Deno.env.get("APP_URL_ALT") ?? "").split(",").filter(Boolean), "http://localhost:5173"];   // APP_URL_ALT: extra allowed app addresses, comma-separated
let returnTo = APP_URL;   // the app address the user started from (must be one of ALLOWED)
const back = (status: string, provider: string, msg = "") =>
  Response.redirect(`${returnTo}/settings?${new URLSearchParams({ connect: provider, status, msg }).toString()}#connections`, 302);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const provider = url.pathname.split("/").filter(Boolean).pop() ?? "";
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error")) return back("error", provider, url.searchParams.get("error_description") ?? url.searchParams.get("error") ?? "");
  if (!code || !state) return back("error", provider, "missing code");
  const { data: st } = await admin.from("oauth_states").delete().eq("state", state).eq("provider", provider).select("created_at,return_to").maybeSingle();
  returnTo = st?.return_to && ALLOWED.includes(st.return_to) ? st.return_to : APP_URL;
  if (!st || Date.now() - new Date(st.created_at).getTime() > 15 * 60e3) return back("error", provider, "this sign-in link expired; try Connect again");
  try {
    if (provider === "youtube") {
      const app = await getIntegration("google_app");
      const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: app!.client_id, client_secret: app!.client_secret, redirect_uri: `${FN_URL}/oauth/youtube`, grant_type: "authorization_code" }) });
      const t = await r.json();
      if (!t.refresh_token) return back("error", provider, t.error_description ?? "Google returned no refresh token");
      const ch = await (await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: `Bearer ${t.access_token}` } })).json();
      await setIntegration("youtube", { refresh_token: t.refresh_token, channel_id: ch.items?.[0]?.id ?? null, channel_title: ch.items?.[0]?.snippet?.title ?? null });
    } else if (provider === "instagram") {
      const app = await getIntegration("meta_app");
      const q = new URLSearchParams({ client_id: app!.app_id, client_secret: app!.app_secret, redirect_uri: `${FN_URL}/oauth/instagram`, code });
      const t = await (await fetch(`${FB_GRAPH}/oauth/access_token?${q}`)).json();
      if (!t.access_token) return back("error", provider, t.error?.message ?? "Meta returned no token");
      const ig = await resolveInstagramFromToken(t.access_token, app!.ig_user_id);
      await setIntegration("instagram", { access_token: t.access_token, user_id: ig.user_id, username: ig.username, api_base: FB_GRAPH, system_user: true });
      try { await facebookPage(true); } catch (_) { /* Page posting is optional; the app shows how to enable it */ }
    } else return back("error", provider, "unknown provider");
    await admin.from("activity").insert({ actor: "owner", action: `connected ${provider}` });
    return back("ok", provider);
  } catch (e) {
    return back("error", provider, e instanceof Error ? e.message : String(e));
  }
});
