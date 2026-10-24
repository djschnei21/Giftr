import "server-only";
import { render } from "@react-email/components";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { emailLog } from "@/db/schema";
import type { EmailContent } from "@/emails/templates";
import { oneClickUnsubscribeUrl, type UnsubscribeType } from "@/lib/unsubscribe";

let resend: Resend | null = null;

function shouldUseDevOutbox() {
  return !process.env.RESEND_API_KEY || process.env.GIFTR_DEV_OUTBOX === "1";
}

export function devOutboxEnabled() {
  return shouldUseDevOutbox() && process.env.VERCEL_ENV !== "production";
}

type SendOptions = {
  to: string;
  content: EmailContent;
  kind: string;
  /** When set, the email is sent at most once for this key. */
  dedupeKey?: string;
  unsubscribe?: { token: string; type: UnsubscribeType };
};

export async function sendEmail({ to, content, kind, dedupeKey, unsubscribe }: SendOptions) {
  const unsubscribeUrl = unsubscribe ? oneClickUnsubscribeUrl(unsubscribe.token, unsubscribe.type) : null;
  const html = await render(content.react);
  const dev = shouldUseDevOutbox();

  const [logged] = await db
    .insert(emailLog)
    .values({
      kind,
      dedupeKey: dedupeKey ?? null,
      toEmail: to,
      subject: content.subject,
      provider: dev ? "dev" : "resend",
      html: dev ? html : null,
    })
    .onConflictDoNothing({ target: emailLog.dedupeKey })
    .returning({ id: emailLog.id });

  if (!logged) return { sent: false as const, reason: "duplicate" };

  if (dev) {
    if (process.env.NODE_ENV !== "test") console.info(`[email:dev] ${kind} → ${to}: ${content.subject}`);
    return { sent: true as const };
  }

  resend ??= new Resend(process.env.RESEND_API_KEY);
  const text = await render(content.react, { plainText: true });
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Giftr <onboarding@resend.dev>",
    to,
    subject: content.subject,
    html,
    text,
    headers: unsubscribeUrl
      ? { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
      : undefined,
  });

  if (error) {
    await db.delete(emailLog).where(eq(emailLog.id, logged.id));
    console.error(`[email] failed to send ${kind} to ${to}`, error);
    return { sent: false as const, reason: "error" };
  }
  return { sent: true as const };
}

/** Fire-and-forget batch helper; one failure never blocks the rest. */
export async function sendEmails(messages: SendOptions[]) {
  const results = await Promise.allSettled(messages.map((m) => sendEmail(m)));
  return results.filter((r) => r.status === "fulfilled" && r.value.sent).length;
}
