// Job API for the GitHub Actions publisher. Auth: header x-job-token (one-time, expires in 3 h).
//   GET  ?job_id=…   → everything the runner needs (captions, master URL, short-lived platform tokens)
//   POST {job_id, status?, step?, log?, result_url?, external_id?} → progress / result
import { MAYBE_LIVE, NO_RETRY, RETRY_MAX, RETRY_WINDOW_H, runDue } from "../_shared/publish.ts";
import { dailySummary, notifyPostResult } from "../_shared/notify.ts";
import { healthCheck, inQuietHours, refreshStats } from "../_shared/stats.ts";
import { dailyTiming } from "../_shared/timing.ts";
import { backupDatabase } from "../_shared/backup.ts";
import { admin, cors, facebookPage, FB_GRAPH, getIntegration, instagramToken, json, sha256, youtubeAccessToken } from "../_shared/util.ts";

async function loadJob(req: Request, jobId: string) {
  const token = req.headers.get("x-job-token") ?? "";
  const { data: job } = await admin.from("publish_jobs").select("*").eq("id", jobId).maybeSingle();
  if (!job || !job.token_hash || job.token_hash !== (await sha256(token)) || new Date(job.token_expires_at) < new Date()) return null;
  return job;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    // the timer (pg_cron, every 5 minutes): start every scheduled post that is due
    if (new URL(req.url).searchParams.has("cron")) {
      const secret = Deno.env.get("CRON_SECRET");
      if (!secret || req.headers.get("x-cron-secret") !== secret) return json({ error: "not allowed" }, 403);
      const which = new URL(req.url).searchParams.get("cron");
      if (which === "backup") return json({ ok: true, backup: await backupDatabase() });   // weekly: the database, minus secrets, to the private HF dataset
      if (which === "daily") { const timing = await dailyTiming(), health = await healthCheck(); await dailySummary(health.issues as { level: string; text: string }[]); return json({ ok: true, timing, health }); }   // timing first: autopilot fills the week, then health checks it
      if (which === "stats") return json(inQuietHours() ? { ok: true, skipped: "quiet hours (00:00-08:00 IST)" } : { ok: true, stats: await refreshStats(true) });   // hourly: only the posts whose turn it is
      return json({ ok: true, started: await runDue() });
    }
    if (req.method === "GET") {
      const jobId = new URL(req.url).searchParams.get("job_id") ?? "";
      const job = await loadJob(req, jobId);
      if (!job) return json({ error: "invalid or expired job token" }, 401);
      const { data: reel } = await admin.from("reels").select("id,code,title,captions,hashtags,hook_en,kind").eq("id", job.reel_id).single();
      const kind = job.platform === "youtube" ? "master_youtube" : "master_instagram";
      const { data: master } = await admin.from("files").select("url,bytes,path").eq("reel_id", job.reel_id).eq("kind", kind).single();
      const hf = await getIntegration("huggingface");
      const caps = (reel!.captions ?? {}) as Record<string, string>;
      const out: Record<string, unknown> = { job_id: job.id, platform: job.platform, options: job.options, code: reel!.code, master: master, hf_token: hf?.token ?? null, longform: reel!.kind === "longform" };
      // cover (out/<ID>_cover.jpg): Instagram fetches it by URL, YouTube gets it via thumbnails.set; signed for the job's lifetime
      const { data: thumb } = await admin.from("files").select("path").eq("reel_id", job.reel_id).eq("kind", "thumbnail").eq("store", "supabase").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (thumb?.path) out.cover_url = (await admin.storage.from("reel-media").createSignedUrl(thumb.path, 3 * 3600)).data?.signedUrl ?? null;
      if (job.platform === "youtube") {
        out.youtube = { access_token: await youtubeAccessToken(), title: caps.youtube_title || (reel!.kind === "longform" ? reel!.title : `${reel!.title} #Shorts`), description: caps.youtube_description || caps.instagram || "",
          tags: (reel!.hashtags ?? []).map((t: string) => t.replace(/^#/, "")), playlist_id: (await getIntegration("youtube"))?.playlist_id ?? null };
      } else if (job.platform === "facebook") {
        const pg = await facebookPage();
        out.facebook = { page_id: pg.page_id, page_name: pg.page_name, access_token: pg.token, api_base: FB_GRAPH, description: caps.facebook || caps.instagram || "" };
      } else {
        const ig = await instagramToken();
        out.instagram = { access_token: ig.token, user_id: ig.user_id, api_base: ig.api_base, caption: caps.instagram || "" };
      }
      out.first_comment = caps.first_comment || null;            // posted under the reel right after it goes live
      await admin.from("publish_jobs").update({ status: "running", started_at: new Date().toISOString(), step: "starting" }).eq("id", job.id);
      return json(out);
    }
    if (req.method === "POST") {
      const b = await req.json();
      const job = await loadJob(req, b.job_id ?? "");
      if (!job) return json({ error: "invalid or expired job token" }, 401);
      const patch: Record<string, unknown> = {};
      if (b.step) patch.step = b.step;
      if (b.log) patch.log = (job.log ?? "") + `[${new Date().toISOString().slice(11, 19)}] ${String(b.log).slice(0, 2000)}\n`;
      if (b.result_url) patch.result_url = b.result_url;
      if (b.external_id) patch.external_id = b.external_id;
      if (b.status === "done" || b.status === "failed") {
        patch.status = b.status; patch.finished_at = new Date().toISOString(); patch.token_hash = null;   // token is single-use
        const pub: Record<string, unknown> = { reel_id: job.reel_id, platform: job.platform, state: b.status === "done" ? "posted" : "failed" };
        if (b.status === "done") { pub.post_url = b.result_url ?? null; pub.posted_at = new Date().toISOString(); pub.external_id = b.external_id ?? null; }
        await admin.from("publications").upsert(pub, { onConflict: "reel_id,platform" });
        await admin.from("activity").insert({ actor: "publisher", reel_id: job.reel_id, action: `${job.platform}: ${b.status === "done" ? "posted" : "posting failed"}`, detail: { url: b.result_url ?? null } });
        // "published" is set by the database trigger publications_mark_published once Instagram AND YouTube are posted
        // Telegram: every success; a failure only when the automatic retries can't or won't fix it
        let willRetry: string | null = null;
        if (b.status === "failed") {
          const log = `${job.log ?? ""}${b.log ?? ""}`;
          const { count } = await admin.from("publish_jobs").select("id", { count: "exact", head: true }).eq("reel_id", job.reel_id).eq("platform", job.platform).eq("status", "failed").gte("created_at", new Date(Date.now() - RETRY_WINDOW_H * 3600e3).toISOString());
          if (!NO_RETRY.test(log) && !MAYBE_LIVE.test(log) && (count ?? 0) + 1 < RETRY_MAX) willRetry = "auto";
        }
        await notifyPostResult(job.reel_id, job.platform, b.status === "done", b.result_url ?? null, willRetry);
      }
      await admin.from("publish_jobs").update(patch).eq("id", job.id);
      return json({ ok: true });
    }
    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
