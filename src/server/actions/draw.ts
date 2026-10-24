"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { assignment, event as eventTable, exclusion, household, participant } from "@/db/schema";
import { runAction, UserError } from "@/lib/action";
import { assertEventAccess } from "@/lib/authz";
import { lockEvent, performDraw } from "@/server/draw";

async function assertOpenOrganizer(eventId: string) {
  const access = await assertEventAccess(eventId, { organizer: true });
  if (access.event.status !== "open")
    throw new UserError("Households and exclusions are locked once names are drawn. Redraw to change them.");
  return access;
}

async function assertMembers(eventId: string, ids: string[]) {
  if (ids.length === 0) return;
  const rows = await db
    .select({ id: participant.id })
    .from(participant)
    .where(and(eq(participant.eventId, eventId), eq(participant.status, "joined"), inArray(participant.id, ids)));
  if (rows.length !== new Set(ids).size) throw new UserError("Some of those people aren't in this exchange.");
}

const householdSchema = z.object({
  name: z.string().trim().min(1, "Name the household.").max(60, "Keep it under 60 characters."),
  memberIds: z.array(z.string()).min(2, "A household needs at least two people.").max(50),
});

function refresh(eventId: string) {
  revalidatePath(`/events/${eventId}`, "layout");
}

export async function saveHousehold(eventId: string, householdId: string | null, input: z.input<typeof householdSchema>) {
  return runAction(async () => {
    await assertOpenOrganizer(eventId);
    const { name, memberIds } = householdSchema.parse(input);
    await assertMembers(eventId, memberIds);
    await db.transaction(async (tx) => {
      let id = householdId;
      if (id) {
        const [row] = await tx
          .update(household)
          .set({ name })
          .where(and(eq(household.id, id), eq(household.eventId, eventId)))
          .returning({ id: household.id });
        if (!row) throw new UserError("That household doesn't exist.");
        await tx.update(participant).set({ householdId: null }).where(eq(participant.householdId, id));
      } else {
        const [row] = await tx.insert(household).values({ eventId, name }).returning({ id: household.id });
        id = row.id;
      }
      await tx.update(participant).set({ householdId: id }).where(inArray(participant.id, memberIds));
      // Households left with fewer than two people no longer mean anything.
      const all = await tx.select({ id: household.id }).from(household).where(eq(household.eventId, eventId));
      for (const h of all) {
        const members = await tx.select({ id: participant.id }).from(participant).where(eq(participant.householdId, h.id));
        if (members.length < 2) {
          await tx.update(participant).set({ householdId: null }).where(eq(participant.householdId, h.id));
          await tx.delete(household).where(eq(household.id, h.id));
        }
      }
    });
    refresh(eventId);
  });
}

export async function deleteHousehold(eventId: string, householdId: string) {
  return runAction(async () => {
    await assertOpenOrganizer(eventId);
    await db.transaction(async (tx) => {
      await tx.update(participant).set({ householdId: null }).where(eq(participant.householdId, householdId));
      await tx.delete(household).where(and(eq(household.id, householdId), eq(household.eventId, eventId)));
    });
    refresh(eventId);
  });
}

export async function addExclusion(eventId: string, giverId: string, recipientId: string, bothWays: boolean) {
  return runAction(async () => {
    await assertOpenOrganizer(eventId);
    if (giverId === recipientId) throw new UserError("Pick two different people.");
    await assertMembers(eventId, [giverId, recipientId]);
    const rows = [{ eventId, giverId, recipientId }];
    if (bothWays) rows.push({ eventId, giverId: recipientId, recipientId: giverId });
    await db.insert(exclusion).values(rows).onConflictDoNothing();
    refresh(eventId);
  });
}

export async function removeExclusion(eventId: string, ids: string[]) {
  return runAction(async () => {
    await assertOpenOrganizer(eventId);
    await db.delete(exclusion).where(and(eq(exclusion.eventId, eventId), inArray(exclusion.id, ids)));
    refresh(eventId);
  });
}

export async function drawNow(eventId: string) {
  return runAction(async () => {
    await assertEventAccess(eventId, { organizer: true });
    const result = await performDraw(eventId, { expectStatus: "open" });
    if (!result.ok) throw new UserError(result.blockers.map((b) => b.message).join(" "));
    refresh(eventId);
    revalidatePath("/events");
    return { count: result.count, relaxedSoftRules: result.relaxedSoftRules };
  });
}

export async function redrawAll(eventId: string) {
  return runAction(async () => {
    await assertEventAccess(eventId, { organizer: true });
    const result = await performDraw(eventId, { redraw: true });
    if (!result.ok) throw new UserError(result.blockers.map((b) => b.message).join(" "));
    refresh(eventId);
    return { count: result.count };
  });
}

/** Clears every match and reopens the exchange so rules and people can change before drawing again. */
export async function resetDraw(eventId: string) {
  return runAction(async () => {
    await assertEventAccess(eventId, { organizer: true });
    await db.transaction(async (tx) => {
      const ev = await lockEvent(tx, eventId);
      if (!ev || ev.status !== "drawn") throw new UserError("Names haven't been drawn.");
      await tx.delete(assignment).where(eq(assignment.eventId, eventId));
      await tx.update(participant).set({ matchViewedAt: null }).where(eq(participant.eventId, eventId));
      await tx.update(eventTable).set({ status: "open", drawnAt: null }).where(eq(eventTable.id, eventId));
    });
    refresh(eventId);
    revalidatePath("/events");
  });
}

export async function markMatchViewed(eventId: string) {
  return runAction(async () => {
    const { me } = await assertEventAccess(eventId);
    if (!me) return;
    await db
      .update(participant)
      .set({ matchViewedAt: new Date() })
      .where(and(eq(participant.id, me.id), isNull(participant.matchViewedAt)));
  });
}
