// OAuth callbacks: /functions/v1/oauth/youtube and /functions/v1/oauth/instagram
import { admin, APP_URL, FN_URL, getIntegration, IG_API, setIntegration } from "../_shared/util.ts";

const back = (status: string, provider: string, msg = "") =>
  Response.redirect(`${APP_URL}/settings?${new URLSearchParams({ connect: provider, status, msg }).toString()}#connections`, 302);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const provider = url.pathname.split("/").filter(Boolean).pop() ?? "";
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error")) return back("error", provider, url.searchParams.get("error_description") ?? url.searchParams.get("error") ?? "");
  if (!code || !state) return back("error", provider, "missing code");
  const { data: st } = await admin.from("oauth_states").delete().eq("state", state).eq("provider", provider).select("created_at").maybeSingle();
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
      const r = await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: app!.app_id, client_secret: app!.app_secret, grant_type: "authorization_code", redirect_uri: `${FN_URL}/oauth/instagram`, code }) });
      const short = await r.json();
      if (!short.access_token) return back("error", provider, short.error_message ?? "Instagram returned no token");
      const ll = await (await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(app!.app_secret)}&access_token=${encodeURIComponent(short.access_token)}`)).json();
      const token = ll.access_token ?? short.access_token;
      const me = await (await fetch(`${IG_API}/me?fields=user_id,username,account_type&access_token=${encodeURIComponent(token)}`)).json();
      await setIntegration("instagram", { access_token: token, user_id: String(me.user_id ?? short.user_id), username: me.username ?? null, account_type: me.account_type ?? null,
        refreshed_at: Date.now(), expires_at: Date.now() + (ll.expires_in ?? 3600) * 1000 });
    } else return back("error", provider, "unknown provider");
    await admin.from("activity").insert({ actor: "owner", action: `connected ${provider}` });
    return back("ok", provider);
  } catch (e) {
    return back("error", provider, e instanceof Error ? e.message : String(e));
  }
});
