"use server";

import { revalidatePath } from "next/cache";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { exclusion, participant, type Event } from "@/db/schema";
import { runAction, UserError } from "@/lib/action";
import { assertEventAccess } from "@/lib/authz";
import { lockEvent, notifyParticipants, patchOutOfDraw, performDraw } from "@/server/draw";

/**
 * Self-service only — there's no organizer equivalent. Only the Santa(s) who
 * draw this person will ever see that they asked for shipping; nobody else,
 * including the organizer, is told.
 */
export async function setMyShipping(eventId: string, needsShipping: boolean) {
  return runAction(async () => {
    const { me } = await assertEventAccess(eventId);
    if (!me) throw new UserError("You're not a participant in this exchange.");
    await db.update(participant).set({ needsShipping }).where(eq(participant.id, me.id));
    revalidatePath(`/events/${eventId}`, "layout");
  });
}

async function loadTarget(eventId: string, participantId: string) {
  const { event: ev } = await assertEventAccess(eventId, { organizer: true });
  const [target] = await db
    .select()
    .from(participant)
    .where(and(eq(participant.id, participantId), eq(participant.eventId, eventId)))
    .limit(1);
  if (!target || target.status === "removed") throw new UserError("That person isn't in this exchange.");
  return { ev, target };
}

export async function setParticipantInDraw(eventId: string, participantId: string, inDraw: boolean) {
  return runAction(async () => {
    const { ev } = await loadTarget(eventId, participantId);
    if (ev.status !== "open") throw new UserError("Names are already drawn. Use remove or redraw instead.");
    await db.update(participant).set({ inDraw }).where(eq(participant.id, participantId));
    revalidatePath(`/events/${eventId}`, "layout");
  });
}

/**
 * Remove someone. After the draw their Santa takes over their giftee; when
 * that can't satisfy the rules the organizer can opt into a full redraw.
 */
export async function removeParticipant(eventId: string, participantId: string, opts: { redraw?: boolean } = {}) {
  return runAction(async () => {
    const { ev, target } = await loadTarget(eventId, participantId);
    if (target.role === "organizer")
      throw new UserError("You can't remove yourself. Turn off “I'm in the draw” in Settings instead.");
    if (ev.status === "cancelled" || ev.status === "completed") throw new UserError("This exchange is closed.");

    type Outcome = { blocked: string } | { event: Event; changedGivers: string[]; needsRedraw: boolean };
    const outcome = await db.transaction(async (tx): Promise<Outcome> => {
      const locked = await lockEvent(tx, eventId);
      if (!locked) throw new UserError("This exchange doesn't exist anymore.");
      let changedGivers: string[] = [];
      let needsRedraw = false;
      if (locked.status === "drawn") {
        const patched = await patchOutOfDraw(tx, locked, participantId);
        if (patched.ok) changedGivers = patched.changedGivers;
        else if (opts.redraw) needsRedraw = true;
        else return { blocked: patched.reason };
      }
      await tx
        .update(participant)
        .set({ status: "removed", householdId: null })
        .where(eq(participant.id, participantId));
      await tx
        .delete(exclusion)
        .where(
          and(
            eq(exclusion.eventId, eventId),
            or(eq(exclusion.giverId, participantId), eq(exclusion.recipientId, participantId)),
          ),
        );
      return { event: locked, changedGivers, needsRedraw };
    });

    if ("blocked" in outcome) return { blocked: outcome.blocked as string | null, changed: 0, redrawn: false };
    notifyParticipants(outcome.event, outcome.changedGivers, "changed");
    if (outcome.needsRedraw) {
      const redraw = await performDraw(eventId, { redraw: true });
      if (!redraw.ok) throw new UserError(redraw.blockers[0]?.message ?? "The redraw failed.");
    }
    revalidatePath(`/events/${eventId}`, "layout");
    return { blocked: null as string | null, changed: outcome.changedGivers.length, redrawn: outcome.needsRedraw };
  });
}
