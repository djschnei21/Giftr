import "server-only";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { assignment, event, exclusion, participant, user, type Event } from "@/db/schema";
import { eventCancelledEmail, reminderEmail } from "@/emails/templates";
import { sendEmails } from "@/lib/email";
import { appUrl } from "@/lib/utils";
import { lockEvent, notifyParticipants, patchOutOfDraw, performDraw } from "@/server/draw";

/**
 * Permanently delete a user. Exchanges they organize are cancelled (and
 * deleted); in everyone else's exchanges they leave the draw the same way a
 * removed participant does, so the rest of the group can carry on.
 */
export async function deleteUserAccount(userId: string) {
  const [me] = await db.select({ name: user.name }).from(user).where(eq(user.id, userId)).limit(1);
  if (!me) return;

  const organized = await db
    .select()
    .from(event)
    .where(and(eq(event.organizerId, userId), inArray(event.status, ["open", "drawn"])));
  for (const ev of organized) {
    const others = await db
      .select({ email: user.email })
      .from(participant)
      .innerJoin(user, eq(user.id, participant.userId))
      .where(and(eq(participant.eventId, ev.id), eq(participant.status, "joined"), ne(participant.userId, userId)));
    await sendEmails(
      others.map((o) => ({
        to: o.email,
        kind: "event_cancelled",
        dedupeKey: `cancelled:${ev.id}:${o.email}`,
        content: eventCancelledEmail({ eventName: ev.name, organizerName: me.name }),
      })),
    );
  }

  const memberships = await db
    .select({ id: participant.id, eventId: participant.eventId })
    .from(participant)
    .innerJoin(event, eq(event.id, participant.eventId))
    .where(and(eq(participant.userId, userId), ne(event.organizerId, userId), eq(participant.status, "joined")));
  for (const m of memberships) await leaveForGood(m.eventId, m.id);

  // Cascades remove sessions, accounts, profile, wishlists and organized events.
  await db.delete(user).where(eq(user.id, userId));
}

async function leaveForGood(eventId: string, participantId: string) {
  type Outcome = { event: Event; changedGivers: string[]; needsRedraw: boolean };
  const outcome = await db.transaction(async (tx): Promise<Outcome | null> => {
    const ev = await lockEvent(tx, eventId);
    if (!ev) return null;
    let changedGivers: string[] = [];
    let needsRedraw = false;
    if (ev.status === "drawn") {
      const patched = await patchOutOfDraw(tx, ev, participantId);
      if (patched.ok) changedGivers = patched.changedGivers;
      else needsRedraw = true;
    }
    await tx
      .update(participant)
      .set({ status: "removed", householdId: null, wishlistId: null, displayName: "Former member" })
      .where(eq(participant.id, participantId));
    await tx
      .delete(exclusion)
      .where(or(eq(exclusion.giverId, participantId), eq(exclusion.recipientId, participantId)));
    return { event: ev, changedGivers, needsRedraw };
  });
  if (!outcome) return;
  notifyParticipants(outcome.event, outcome.changedGivers, "changed");
  if (!outcome.needsRedraw) return;

  const redraw = await performDraw(eventId, { redraw: true });
  if (redraw.ok) return;
  // No valid redraw either (e.g. too few people left): drop the broken pairings and let the organizer decide.
  await db
    .delete(assignment)
    .where(or(eq(assignment.giverId, participantId), eq(assignment.recipientId, participantId)));
  const [org] = await db
    .select({ email: user.email })
    .from(event)
    .innerJoin(user, eq(user.id, event.organizerId))
    .where(eq(event.id, eventId))
    .limit(1);
  if (org)
    await sendEmails([
      {
        to: org.email,
        kind: "member_left",
        content: reminderEmail({
          subject: `Someone left ${outcome.event.name}`,
          heading: "A participant deleted their account",
          body: "Giftr couldn't patch the draw automatically, so one person no longer has a match. Open the Draw tab to redraw or adjust the rules.",
          cta: { label: "Open the Draw tab", href: appUrl(`/events/${eventId}/manage?tab=draw`) },
        }),
      },
    ]);
}
