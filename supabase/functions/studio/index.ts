// Admin actions from the app: connections, OAuth start, and "Post now".
import { admin, cors, FN_URL, getIntegration, json, randomToken, REPO, requireAdmin, setIntegration, sha256 } from "../_shared/util.ts";

const SIMPLE: Record<string, string[]> = {
  github: ["token"],                         // fine-grained PAT: Actions read & write on the repo
  huggingface: ["token"],                    // read access to the masters repo
  google_app: ["client_id", "client_secret"],// Google Cloud OAuth client (Web)
  meta_app: ["app_id", "app_secret"],        // Meta app with "Instagram API with Instagram Login"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const email = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    switch (body.action) {
      case "status": {
        const { data } = await admin.from("integrations").select("provider,data,connected_at,updated_at");
        const out: Record<string, unknown> = {};
        for (const row of data ?? []) {
          const d = row.data as Record<string, any>;
          out[row.provider] = { connected: !!row.connected_at, at: row.connected_at, name: d.channel_title ?? d.username ?? d.login ?? null, expires_at: d.expires_at ?? null, has_values: Object.keys(d).length > 0 };
        }
        return json({ providers: out, redirect_uris: { youtube: `${FN_URL}/oauth/youtube`, instagram: `${FN_URL}/oauth/instagram` } });
      }
      case "save": {
        const keys = SIMPLE[body.provider];
        if (!keys) return json({ error: "unknown provider" }, 400);
        const values: Record<string, string> = {};
        for (const k of keys) { const v = String(body.values?.[k] ?? "").trim(); if (!v) return json({ error: `missing ${k}` }, 400); values[k] = v; }
        if (body.provider === "github") {
          const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows`, { headers: { Authorization: `Bearer ${values.token}`, Accept: "application/vnd.github+json", "User-Agent": "untold-granth-studio" } });
          if (!r.ok) return json({ error: `GitHub refused this token (${r.status}). It needs Actions: read & write on ${REPO}.` }, 400);
        }
        if (body.provider === "huggingface") {
          const r = await fetch("https://huggingface.co/api/whoami-v2", { headers: { Authorization: `Bearer ${values.token}` } });
          if (!r.ok) return json({ error: `Hugging Face refused this token (${r.status}).` }, 400);
          values.login = (await r.json()).name;
        }
        await setIntegration(body.provider, values, true);
        await admin.from("activity").insert({ actor: email, action: `connected ${body.provider}` });
        return json({ ok: true });
      }
      case "disconnect": {
        await admin.from("integrations").delete().eq("provider", body.provider);
        await admin.from("activity").insert({ actor: email, action: `disconnected ${body.provider}` });
        return json({ ok: true });
      }
      case "oauth_start": {
        const state = randomToken(16);
        await admin.from("oauth_states").insert({ state, provider: body.provider, return_to: body.return_to ?? null });
        if (body.provider === "youtube") {
          const app = await getIntegration("google_app");
          if (!app?.client_id) return json({ error: "Add the Google OAuth client first" }, 400);
          const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
          u.search = new URLSearchParams({ client_id: app.client_id, redirect_uri: `${FN_URL}/oauth/youtube`, response_type: "code", access_type: "offline", prompt: "consent", include_granted_scopes: "true",
            scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly", state }).toString();
          return json({ url: u.toString() });
        }
        if (body.provider === "instagram") {
          const app = await getIntegration("meta_app");
          if (!app?.app_id) return json({ error: "Add the Instagram app ID and secret first" }, 400);
          const u = new URL("https://www.instagram.com/oauth/authorize");
          u.search = new URLSearchParams({ client_id: app.app_id, redirect_uri: `${FN_URL}/oauth/instagram`, response_type: "code", scope: "instagram_business_basic,instagram_business_content_publish", state }).toString();
          return json({ url: u.toString() });
        }
        return json({ error: "unknown provider" }, 400);
      }
      case "publish": {
        const { reel_id, platform } = body;
        if (!["youtube", "instagram"].includes(platform)) return json({ error: "Auto-posting is available for Instagram and YouTube" }, 400);
        const { data: reel } = await admin.from("reels").select("id,code,reviewed").eq("id", reel_id).single();
        if (!reel) return json({ error: "reel not found" }, 404);
        if (!reel.reviewed) return json({ error: "Tick the citation check before posting" }, 400);
        const kind = platform === "youtube" ? "master_youtube" : "master_instagram";
        const { data: master } = await admin.from("files").select("id").eq("reel_id", reel_id).eq("kind", kind).maybeSingle();
        if (!master) return json({ error: `No ${platform} master attached to ${reel.code}` }, 400);
        const need = platform === "youtube" ? ["github", "huggingface", "google_app", "youtube"] : ["github", "huggingface", "meta_app", "instagram"];
        for (const p of need) if (!(await getIntegration(p))) return json({ error: `Connect ${p.replace("_app", "")} first (Settings → Connections)` }, 400);
        const { data: running } = await admin.from("publish_jobs").select("id").eq("reel_id", reel_id).eq("platform", platform).in("status", ["queued", "running"]).maybeSingle();
        if (running) return json({ error: "Already posting this reel to " + platform }, 409);

        const token = randomToken();
        const { data: job, error } = await admin.from("publish_jobs").insert({
          reel_id, platform, requested_by: email, token_hash: await sha256(token), token_expires_at: new Date(Date.now() + 3 * 3600e3).toISOString(),
          options: { privacy: body.options?.privacy ?? "public" }, step: "queued", log: `Queued by ${email}\n`,
        }).select("id").single();
        if (error || !job) return json({ error: error?.message ?? "could not create job" }, 500);
        await admin.from("publications").upsert({ reel_id, platform, state: "posting" }, { onConflict: "reel_id,platform" });
        const gh = await getIntegration("github");
        const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/publish.yml/dispatches`, {
          method: "POST",
          headers: { Authorization: `Bearer ${gh!.token}`, Accept: "application/vnd.github+json", "User-Agent": "untold-granth-studio", "Content-Type": "application/json" },
          body: JSON.stringify({ ref: "main", inputs: { job_id: job.id, job_token: token, api: `${FN_URL}/job` } }),
        });
        if (!r.ok) {
          const msg = `GitHub did not start the publisher (${r.status}): ${(await r.text()).slice(0, 200)}`;
          await admin.from("publish_jobs").update({ status: "failed", step: "dispatch", log: msg, finished_at: new Date().toISOString(), token_hash: null }).eq("id", job.id);
          await admin.from("publications").upsert({ reel_id, platform, state: "failed" }, { onConflict: "reel_id,platform" });
          return json({ error: msg }, 502);
        }
        await admin.from("activity").insert({ actor: email, reel_id, action: `${platform}: posting started`, detail: { code: reel.code, job: job.id } });
        return json({ ok: true, job_id: job.id });
      }
      default:
        return json({ error: "unknown action" }, 400);
    }
  } catch (e) {
    if (e instanceof Response) return e;
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
