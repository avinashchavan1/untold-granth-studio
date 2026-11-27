// Telegram alerts (owner, Nov 27 2026): post results, "needs you" alerts, and a daily summary.
// Settings → Connections → Telegram: the bot token (from @BotFather) is saved like the other connections; the chat is found
// from the owner's "/start" message to the bot (getUpdates) and remembered. Every send is best-effort: it never breaks a post.
import { admin, APP_URL, getIntegration, setIntegration } from "./util.ts";

const TG = (token: string, method: string) => `https://api.telegram.org/bot${token}/${method}`;

/** Find the owner's chat with the bot (the newest private chat that wrote to it) and remember it. */
export async function telegramChat(): Promise<{ token: string; chat_id: string } | null> {
  const tg = await getIntegration("telegram");
  if (!tg?.bot_token) return null;
  if (tg.chat_id) return { token: tg.bot_token, chat_id: String(tg.chat_id) };
  const r = await fetch(TG(tg.bot_token, "getUpdates")).then((x) => x.json()).catch(() => null);
  const msgs = ((r?.result ?? []) as any[]).map((u) => u.message ?? u.edited_message).filter((m) => m?.chat?.type === "private");
  const chat = msgs.at(-1)?.chat; if (!chat?.id) return null;
  await setIntegration("telegram", { ...tg, chat_id: String(chat.id), chat_name: chat.first_name ?? chat.username ?? "" }, true);
  return { token: tg.bot_token, chat_id: String(chat.id) };
}

export async function notify(text: string) {
  try {
    const c = await telegramChat(); if (!c) return false;
    const r = await fetch(TG(c.token, "sendMessage"), { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: c.chat_id, text: text.slice(0, 4000), disable_web_page_preview: true }) });
    return r.ok;
  } catch { return false; }
}

const NAME: Record<string, string> = { youtube: "YouTube", instagram: "Instagram", facebook: "Facebook" };

/** Called by the job API when the publisher reports done/failed. */
export async function notifyPostResult(reel_id: string, platform: string, ok: boolean, url?: string | null, willRetry?: string | null) {
  const { data: r } = await admin.from("reels").select("code,title").eq("id", reel_id).maybeSingle();
  const name = `${r?.code ?? "A reel"} · ${r?.title ?? ""}`.trim();
  if (ok) return notify(`✅ Live on ${NAME[platform] ?? platform}: ${name}\n${url ?? ""}\nPin the first comment when you can.`);
  if (willRetry) return;                                   // quiet: the scheduler retries by itself
  return notify(`⚠️ Needs you: ${name} could not be posted to ${NAME[platform] ?? platform}, and retrying won't fix it.\nOpen: ${APP_URL}/reels/${r?.code ?? ""}`);
}

/** Daily summary (with the 8:17 IST daily job). */
export async function dailySummary(issues: { level: string; text: string }[]) {
  const now = new Date(), ist = new Date(now.getTime() + 5.5 * 3600e3), day = ist.toISOString().slice(0, 10);
  const from = new Date(Date.parse(day + "T00:00:00Z") - 5.5 * 3600e3).toISOString(), to = new Date(Date.parse(day + "T00:00:00Z") + 18.5 * 3600e3).toISOString();
  const { data: today } = await admin.from("publications").select("platform,scheduled_for,reels(code,title)").eq("state", "scheduled").gte("scheduled_for", from).lt("scheduled_for", to).order("scheduled_for");
  const { data: review } = await admin.from("reels").select("code,title").eq("stage", "review").eq("reviewed", false).order("plan_no");
  const t = (iso: string) => new Date(new Date(iso).getTime() + 5.5 * 3600e3).toISOString().slice(11, 16);
  const lines = [`🪔 Good morning! Today (${day}):`];
  lines.push(...((today ?? []) as any[]).map((p) => `• ${t(p.scheduled_for)} ${NAME[p.platform] ?? p.platform}: ${p.reels?.code} ${p.reels?.title ?? ""}`));
  if (!(today ?? []).length) lines.push("• Nothing scheduled today.");
  if ((review ?? []).length) lines.push("", `📝 Waiting for your review (${review!.length}): ${review!.map((r) => r.code).join(", ")}`, `${APP_URL}/reels`);
  const bad = issues.filter((i) => i.level === "error" || i.level === "warn");
  if (bad.length) lines.push("", "⚠️ To look at:", ...bad.slice(0, 6).map((i) => `• ${i.text}`));
  return notify(lines.join("\n"));
}
