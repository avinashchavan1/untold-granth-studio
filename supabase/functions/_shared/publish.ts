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
  return out;
}
