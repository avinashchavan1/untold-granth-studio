// Weekly database backup (owner, Nov 27 2026): every table except secrets, as one JSON file in the PRIVATE
// Hugging Face masters dataset: backups/db/<YYYY-MM-DD>.json (Hugging Face keeps every version too).
// Never included: integrations (tokens), oauth_states (login state). Restore: read the file, upsert table by table.
import { admin, getIntegration, HF_REPO } from "./util.ts";

const SKIP = new Set(["integrations", "oauth_states"]);

export async function backupDatabase() {
  const hf = await getIntegration("huggingface");
  if (!hf?.token || !HF_REPO) return { skipped: "no Hugging Face token or HF_MASTERS_REPO" };
  const { data: tabs, error } = await admin.rpc("backup_tables");
  if (error) return { error: `listing tables: ${error.message}` };
  const dump: Record<string, unknown[]> = {}, counts: Record<string, number> = {};
  for (const t of (tabs ?? []) as string[]) {
    if (SKIP.has(t)) continue;
    const rows: unknown[] = [];
    for (let from = 0; ; from += 1000) {                    // page through big tables
      const { data, error: e } = await admin.from(t).select("*").range(from, from + 999);
      if (e) { counts[t] = -1; break; }
      rows.push(...(data ?? [])); if (!data || data.length < 1000) break;
    }
    dump[t] = rows; counts[t] = rows.length;
  }
  const day = new Date().toISOString().slice(0, 10);
  const body = JSON.stringify({ at: new Date().toISOString(), counts, tables: dump });
  const bytes = new TextEncoder().encode(body); let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const ndjson = [
    { key: "header", value: { summary: `database backup ${day}`, description: Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", ") } },
    { key: "file", value: { path: `backups/db/${day}.json`, content: btoa(bin), encoding: "base64" } },
  ].map((l) => JSON.stringify(l)).join("\n");
  const r = await fetch(`https://huggingface.co/api/datasets/${HF_REPO}/commit/main`, { method: "POST", headers: { Authorization: `Bearer ${hf.token}`, "Content-Type": "application/x-ndjson" }, body: ndjson });
  const total = Object.values(counts).reduce((a, b) => a + Math.max(0, b), 0);
  const out = { file: `backups/db/${day}.json`, bytes: body.length, rows: total, counts, status: r.status, reply: r.ok ? undefined : (await r.text()).slice(0, 300) };
  await admin.from("activity").insert({ actor: "backup", action: r.ok ? `database backed up (${total} rows)` : "database backup FAILED", detail: out });
  return out;
}
