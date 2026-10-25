"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { and, count, eq, gt, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { assignment, message, participant, profile, user, wishlistItem, type AssignmentSlot } from "@/db/schema";
import { runAction, UserError } from "@/lib/action";
import { assertEventAccess } from "@/lib/authz";
import { sendEmail } from "@/lib/email";
import { newMessageEmail } from "@/emails/templates";
import { appUrl } from "@/lib/utils";
import { unsubscribePageUrl } from "@/lib/unsubscribe";
import { findThreadAssignment, getThread, type ThreadRole } from "@/server/queries/match";

const roleSchema = z.enum(["santa", "giftee"]);

/** At most this many messages per side of a thread in the window below. */
const MESSAGE_BURST = 20;
const MESSAGE_WINDOW_MS = 10 * 60 * 1000;
/** At most one "new message" email per direction in this window. */
const EMAIL_WINDOW_MS = 30 * 60 * 1000;

// Chat only ever exists for the main gift — a wildcard match has no wishlist or anonymous thread.
async function myThread(eventId: string, as: ThreadRole) {
  const access = await assertEventAccess(eventId);
  if (!access.me) throw new UserError("You're not part of this exchange.");
  if (access.event.status !== "drawn") throw new UserError("Messages open once names are drawn.");
  const a = await findThreadAssignment(access.me.id, as, "main");
  if (!a) throw new UserError(as === "santa" ? "You don't have a match yet." : "You don't have a Secret Santa yet.");
  return { ...access, me: access.me, assignment: a };
}

async function mySantaAssignment(eventId: string, slot: AssignmentSlot) {
  const access = await assertEventAccess(eventId);
  if (!access.me) throw new UserError("You're not part of this exchange.");
  const a = await findThreadAssignment(access.me.id, "santa", slot);
  if (!a) throw new UserError("You don't have a match yet.");
  return { ...access, assignment: a };
}

function refreshMatch(eventId: string) {
  revalidatePath(`/events/${eventId}/match`);
}

const messageSchema = z.object({
  as: roleSchema,
  body: z.string().trim().min(1, "Write a message first.").max(1000, "Keep it under 1,000 characters."),
});

export async function sendMessage(eventId: string, input: z.input<typeof messageSchema>) {
  return runAction(async () => {
    const { as, body } = messageSchema.parse(input);
    const { event: ev, assignment: a } = await myThread(eventId, as);

    const [recent] = await db
      .select({ n: count() })
      .from(message)
      .where(
        and(
          eq(message.assignmentId, a.id),
          eq(message.senderRole, as),
          gt(message.createdAt, new Date(Date.now() - MESSAGE_WINDOW_MS)),
        ),
      );
    if (recent.n >= MESSAGE_BURST) throw new UserError("That's a lot of messages at once. Give it a few minutes.");

    const [saved] = await db.insert(message).values({ assignmentId: a.id, senderRole: as, body }).returning();

    after(() => notifyRecipient(ev.id, ev.name, a, as));
    return { id: saved.id, mine: true, body: saved.body, createdAt: saved.createdAt.toISOString() };
  });
}

async function notifyRecipient(
  eventId: string,
  eventName: string,
  a: { id: string; giverId: string; recipientId: string },
  from: ThreadRole,
) {
  const toParticipant = from === "santa" ? a.recipientId : a.giverId;
  const [to] = await db
    .select({
      email: user.email,
      token: profile.unsubscribeToken,
      notify: profile.notifyMessages,
    })
    .from(participant)
    .innerJoin(user, eq(user.id, participant.userId))
    .leftJoin(profile, eq(profile.userId, user.id))
    .where(eq(participant.id, toParticipant))
    .limit(1);
  if (!to || to.notify === false) return;

  // The Santa already knows who their giftee is; the giftee only ever hears "your Secret Santa".
  let senderName: string | undefined;
  if (from === "giftee") {
    const [g] = await db
      .select({ name: participant.displayName })
      .from(participant)
      .where(eq(participant.id, a.recipientId))
      .limit(1);
    senderName = g?.name;
  }

  const bucket = Math.floor(Date.now() / EMAIL_WINDOW_MS);
  await sendEmail({
    to: to.email,
    kind: "new_message",
    dedupeKey: `message:${a.id}:${from}:${bucket}`,
    unsubscribe: to.token ? { token: to.token, type: "messages" } : undefined,
    content: newMessageEmail({
      eventName,
      fromSanta: from === "santa",
      senderName,
      url: appUrl(from === "santa" ? `/events/${eventId}#santa` : `/events/${eventId}/match#chat`),
      unsubscribeUrl: to.token ? unsubscribePageUrl(to.token, "messages") : undefined,
    }),
  });
}

export async function loadThread(eventId: string, as: ThreadRole) {
  return runAction(async () => {
    const role = roleSchema.parse(as);
    const { assignment: a } = await myThread(eventId, role);
    return getThread(a.id, role);
  });
}

export async function markThreadRead(eventId: string, as: ThreadRole) {
  return runAction(async () => {
    const role = roleSchema.parse(as);
    const { assignment: a } = await myThread(eventId, role);
    await db
      .update(message)
      .set({ readAt: new Date() })
      .where(and(eq(message.assignmentId, a.id), ne(message.senderRole, role), isNull(message.readAt)));
  });
}

const statusSchema = z.enum(["not_started", "purchased", "shipped", "given"]);
const slotSchema = z.enum(["main", "wildcard"]);

export async function setGiftStatus(eventId: string, slot: z.input<typeof slotSchema>, status: z.input<typeof statusSchema>) {
  return runAction(async () => {
    const value = statusSchema.parse(status);
    const { assignment: a } = await mySantaAssignment(eventId, slotSchema.parse(slot));
    await db.update(assignment).set({ giftStatus: value }).where(eq(assignment.id, a.id));
    refreshMatch(eventId);
  });
}

export async function toggleBoughtItem(eventId: string, itemId: string, bought: boolean) {
  return runAction(async () => {
    const id = z.string().min(1).parse(itemId);
    // Only the main gift has a wishlist to check items off of.
    const { assignment: a } = await mySantaAssignment(eventId, "main");
    const [giftee] = await db
      .select({ wishlistId: participant.wishlistId })
      .from(participant)
      .where(eq(participant.id, a.recipientId))
      .limit(1);
    const [item] = giftee?.wishlistId
      ? await db
          .select({ id: wishlistItem.id })
          .from(wishlistItem)
          .where(and(eq(wishlistItem.id, id), eq(wishlistItem.wishlistId, giftee.wishlistId)))
          .limit(1)
      : [];
    if (!item) throw new UserError("That item isn't on your giftee's wishlist anymore.");

    const next = new Set(a.boughtItemIds);
    if (bought) next.add(id);
    else next.delete(id);
    const update: Partial<typeof assignment.$inferInsert> = { boughtItemIds: [...next] };
    if (bought && a.giftStatus === "not_started") update.giftStatus = "purchased";
    await db.update(assignment).set(update).where(eq(assignment.id, a.id));
    refreshMatch(eventId);
  });
}

export async function saveGiverNotes(eventId: string, slot: z.input<typeof slotSchema>, notes: string) {
  return runAction(async () => {
    const value = z.string().max(2000, "Keep notes under 2,000 characters.").parse(notes).trim();
    const { assignment: a } = await mySantaAssignment(eventId, slotSchema.parse(slot));
    await db
      .update(assignment)
      .set({ giverNotes: value || null })
      .where(eq(assignment.id, a.id));
  });
}