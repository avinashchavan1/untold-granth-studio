// Start posting one reel to one platform: checks, a one-time job token, then GitHub Actions runs scripts/publish_job.py.
// Used by "Post now", "Post everywhere" (studio function) and the scheduler (job function, ?cron).
import { admin, facebookPage, FN_URL, getIntegration, randomToken, REPO, sha256 } from "./util.ts";

export const PLATFORMS = ["instagram", "youtube", "facebook"] as const;
export class PublishError extends Error { constructor(msg: string, public status = 400) { super(msg); } }

/** Everything that must be true before a reel can go to `platform` (also used when scheduling, so problems show up early). */
export async function checkPublish(reel_id: string, platform: string) {
  if (!(PLATFORMS as readonly string[]).includes(platform)) throw new PublishError(`Auto-posting is available for ${PLATFORMS.join(", ")}`);
  const { data: reel } = await admin.from("reels").select("id,code,reviewed,kind").eq("id", reel_id).single();
  if (!reel) throw new PublishError("reel not found", 404);
  if (reel.kind === "longform" && platform !== "youtube") throw new PublishError("Full-length videos post to YouTube only");
  if (!reel.reviewed) throw new PublishError("Tick the citation check before posting");
  const kind = platform === "youtube" ? "master_youtube" : "master_instagram";
  const { data: master } = await admin.from("files").select("id").eq("reel_id", reel_id).eq("kind", kind).maybeSingle();
  if (!master) throw new PublishError(`No ${platform} master attached to ${reel.code}`);
  const need = platform === "youtube" ? ["github", "huggingface", "google_app", "youtube"] : ["github", "huggingface", "instagram"];
  for (const p of need) if (!(await getIntegration(p))) throw new PublishError(`Connect ${p.replace("_app", "")} first (Settings → Connections)`);
  if (platform === "facebook") { try { await facebookPage(); } catch (e) { throw new PublishError(e instanceof Error ? e.message : String(e)); } }
  return reel as { id: string; code: string; reviewed: boolean };
}

export async function startPublish(reel_id: string, platform: string, options: Record<string, unknown>, by: string) {
  const reel = await checkPublish(reel_id, platform);
  const { data: running } = await admin.from("publish_jobs").select("id").eq("reel_id", reel_id).eq("platform", platform).in("status", ["queued", "running"]).maybeSingle();
  if (running) throw new PublishError("Already posting this reel to " + platform, 409);
  const token = randomToken();
  const { data: job, error } = await admin.from("publish_jobs").insert({
    reel_id, platform, requested_by: by, token_hash: await sha256(token), token_expires_at: new Date(Date.now() + 3 * 3600e3).toISOString(),
    options: { privacy: (options?.privacy as string) ?? "public" }, step: "queued", log: `Queued by ${by}\n`,
  }).select("id").single();
  if (error || !job) throw new PublishError(error?.message ?? "could not create job", 500);
  await admin.from("publications").upsert({ reel_id, platform, state: "posting", last_error: null }, { onConflict: "reel_id,platform" });
  const gh = await getIntegration("github");
  const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/publish.yml/dispatches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${gh!.token}`, Accept: "application/vnd.github+json", "User-Agent": "storyreel-studio", "Content-Type": "application/json" },
    body: JSON.stringify({ ref: "main", inputs: { job_id: job.id, job_token: token, api: `${FN_URL}/job` } }),
  });
  if (!r.ok) {
    const msg = `GitHub did not start the publisher (${r.status}): ${(await r.text()).slice(0, 200)}`;
    await admin.from("publish_jobs").update({ status: "failed", step: "dispatch", log: msg, finished_at: new Date().toISOString(), token_hash: null }).eq("id", job.id);
    await admin.from("publications").upsert({ reel_id, platform, state: "failed", last_error: msg }, { onConflict: "reel_id,platform" });
    throw new PublishError(msg, 502);
  }
  await admin.from("activity").insert({ actor: by, reel_id, action: `${platform}: posting started`, detail: { code: reel.code, job: job.id } });
  return job.id as string;
}

/** The scheduler: start every post whose time has come. Returns one line per post for the activity log. */
export async function runDue() {
  const { data: due } = await admin.from("publications").select("reel_id,platform,schedule_options,scheduled_by,scheduled_for")
    .eq("state", "scheduled").lte("scheduled_for", new Date().toISOString()).order("scheduled_for").limit(10);
  const out: { reel_id: string; platform: string; ok: boolean; detail: string }[] = [];
  for (const p of due ?? []) {
    try {
      const id = await startPublish(p.reel_id, p.platform, p.schedule_options ?? {}, `scheduler (for ${p.scheduled_by ?? "owner"})`);
      out.push({ reel_id: p.reel_id, platform: p.platform, ok: true, detail: id });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!(e instanceof PublishError && e.status === 409)) {
        await admin.from("publications").update({ state: "failed", last_error: `Scheduled post could not start: ${msg}` }).eq("reel_id", p.reel_id).eq("platform", p.platform);
        await admin.from("activity").insert({ actor: "scheduler", reel_id: p.reel_id, action: `${p.platform}: scheduled post failed`, detail: { error: msg } });
      }
      out.push({ reel_id: p.reel_id, platform: p.platform, ok: false, detail: msg });
    }
  }
  // automatic retries (owner, Nov 27 2026: "keep retrying so I don't have to press publish again")
  for (const r of await retryFailed()) out.push(r);
  return out;
}

export const RETRY_MAX = 8, RETRY_WINDOW_H = 24;
const RETRY_WAIT_MIN = (n: number) => (n <= 1 ? 15 : n === 2 ? 30 : 60);       // after the 1st failure 15 min, then 30, then hourly
// failures a retry cannot fix: leave them for the owner (they show in the health banner)
export const NO_RETRY = /Tick the citation check|No \w+ master attached|Connect \w+ first|Cancelled by the owner|reel not found|post to YouTube only|Auto-posting is available/i;
// a job that got this far may already be live: never retry it (no duplicate posts)
export const MAYBE_LIVE = /YouTube has the video|Uploaded video|Instagram published media|Published reel|Published Facebook reel|Upload complete; Facebook is processing|first comment posted/i;
export async function retryFailed() {
  const out: { reel_id: string; platform: string; ok: boolean; detail: string }[] = [];
  const since = new Date(Date.now() - RETRY_WINDOW_H * 3600e3).toISOString();
  const { data: failed } = await admin.from("publications").select("reel_id,platform,schedule_options,scheduled_by,last_error").eq("state", "failed").limit(20);
  for (const p of failed ?? []) {
    const { data: jobs } = await admin.from("publish_jobs").select("status,step,log,finished_at,created_at").eq("reel_id", p.reel_id).eq("platform", p.platform)
      .gte("created_at", since).order("created_at", { ascending: false }).limit(RETRY_MAX + 1);
    const js = jobs ?? []; const last = js[0];
    if (!last || last.status !== "failed") continue;                              // nothing failed recently (or one is running)
    const why = `${p.last_error ?? ""} ${last.log ?? ""}`;
    if (NO_RETRY.test(why) || MAYBE_LIVE.test(last.log ?? "")) continue;
    const n = js.filter((j) => j.status === "failed").length;
    if (n >= RETRY_MAX) continue;
    const waitMs = RETRY_WAIT_MIN(n) * 60e3, endedAt = new Date(last.finished_at ?? last.created_at).getTime();
    if (Date.now() - endedAt < waitMs) continue;
    try {
      const id = await startPublish(p.reel_id, p.platform, p.schedule_options ?? {}, `auto-retry ${n + 1} of ${RETRY_MAX} (for ${p.scheduled_by ?? "owner"})`);
      await admin.from("activity").insert({ actor: "scheduler", reel_id: p.reel_id, action: `${p.platform}: automatic retry ${n + 1}`, detail: { job: id } });
      out.push({ reel_id: p.reel_id, platform: p.platform, ok: true, detail: `retry ${n + 1}: ${id}` });
    } catch (e) { out.push({ reel_id: p.reel_id, platform: p.platform, ok: false, detail: `retry: ${e instanceof Error ? e.message : String(e)}` }); }
  }
  return out;
}
