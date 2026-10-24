import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { after } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { event as eventTable, invitation, participant, user, type Event } from "@/db/schema";
import { inviteEmail } from "@/emails/templates";
import { sendEmails } from "@/lib/email";
import { budgetLabel, longDateLabel } from "@/lib/format";
import { appUrl } from "@/lib/utils";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken() {
  return randomBytes(16).toString("base64url");
}

export function joinUrl(ev: Pick<Event, "inviteCode">, token?: string) {
  return appUrl(`/join/${ev.inviteCode}${token ? `?t=${token}` : ""}`);
}

/**
 * Creates or refreshes invitations and emails them after the response is sent.
 * Emails that already belong to a joined participant are skipped.
 */
export async function inviteByEmail(ev: Event, inviter: { id: string; name: string }, emails: string[]) {
  if (emails.length === 0) return { invited: [] as string[], skipped: [] as string[] };
  const lower = emails.map((e) => e.toLowerCase());

  const joined = await db
    .select({ email: user.email })
    .from(participant)
    .innerJoin(user, eq(user.id, participant.userId))
    .where(and(eq(participant.eventId, ev.id), eq(participant.status, "joined"), inArray(sql`lower(${user.email})`, lower)));
  const joinedSet = new Set(joined.map((j) => j.email.toLowerCase()));

  const existing = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.eventId, ev.id), inArray(sql`lower(${invitation.email})`, lower)));
  const byEmail = new Map(existing.map((i) => [i.email.toLowerCase(), i]));

  const toSend: { email: string; token: string }[] = [];
  const skipped: string[] = [];
  for (const email of lower) {
    if (joinedSet.has(email)) {
      skipped.push(email);
      continue;
    }
    const token = newToken();
    const prior = byEmail.get(email);
    if (prior) {
      await db
        .update(invitation)
        .set({ tokenHash: hashToken(token), status: "pending", lastSentAt: new Date(), respondedAt: null, invitedById: inviter.id })
        .where(eq(invitation.id, prior.id));
    } else {
      await db.insert(invitation).values({ eventId: ev.id, email, tokenHash: hashToken(token), invitedById: inviter.id });
    }
    toSend.push({ email, token });
  }

  after(() =>
    sendEmails(
      toSend.map(({ email, token }) => ({
        to: email,
        kind: "invite",
        content: inviteEmail({
          inviterName: inviter.name,
          eventName: ev.name,
          dateLabel: longDateLabel(ev.exchangeDate),
          budgetLabel: budgetLabel(ev.budgetMin, ev.budgetMax, ev.currency),
          url: joinUrl(ev, token),
        }),
      })),
    ),
  );

  return { invited: toSend.map((t) => t.email), skipped };
}

export async function findInvitationByToken(eventId: string, token: string | undefined | null) {
  if (!token) return null;
  const [row] = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.eventId, eventId), eq(invitation.tokenHash, hashToken(token))))
    .limit(1);
  return row ?? null;
}

export async function getEventByInviteCode(code: string) {
  const [row] = await db.select().from(eventTable).where(eq(eventTable.inviteCode, code)).limit(1);
  return row ?? null;
}
