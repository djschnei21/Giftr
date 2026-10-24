import "server-only";
import { after } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, type Tx } from "@/db";
import { assignment, event as eventTable, exclusion, participant, user, type Event } from "@/db/schema";
import { matchChangedEmail, namesDrawnEmail, redrawEmail } from "@/emails/templates";
import { sendEmails } from "@/lib/email";
import { addToDraw, drawNames, removeFromDraw, type Blocker, type DrawPerson, type DrawRules, type Pair } from "@/lib/draw";
import { appUrl } from "@/lib/utils";

/** Row lock that serializes draws, repairs and late joins for one event. */
export async function lockEvent(tx: Tx, eventId: string) {
  const [row] = await tx.select().from(eventTable).where(eq(eventTable.id, eventId)).for("update");
  return row ?? null;
}

export async function loadDrawInputs(tx: Tx | typeof db, ev: Event) {
  const rows = await tx
    .select({ id: participant.id, name: participant.displayName, householdId: participant.householdId })
    .from(participant)
    .where(and(eq(participant.eventId, ev.id), eq(participant.status, "joined"), eq(participant.inDraw, true)));
  const people: DrawPerson[] = rows;
  const ids = new Set(rows.map((r) => r.id));

  const exclusionRows = await tx
    .select({ giverId: exclusion.giverId, recipientId: exclusion.recipientId })
    .from(exclusion)
    .where(eq(exclusion.eventId, ev.id));

  let avoid: Pair[] = [];
  if (ev.previousEventId) {
    // Map last year's pairings onto this year's participants by user.
    const giver = alias(participant, "giver");
    const recipient = alias(participant, "recipient");
    const prev = await tx
      .select({ giverUser: giver.userId, recipientUser: recipient.userId })
      .from(assignment)
      .innerJoin(giver, eq(giver.id, assignment.giverId))
      .innerJoin(recipient, eq(recipient.id, assignment.recipientId))
      .where(eq(assignment.eventId, ev.previousEventId));
    const current = await tx
      .select({ id: participant.id, userId: participant.userId })
      .from(participant)
      .where(eq(participant.eventId, ev.id));
    const byUser = new Map(current.filter((c) => c.userId).map((c) => [c.userId!, c.id]));
    avoid = prev
      .map((p) => ({ giverId: byUser.get(p.giverUser ?? "") ?? "", recipientId: byUser.get(p.recipientUser ?? "") ?? "" }))
      .filter((p) => ids.has(p.giverId) && ids.has(p.recipientId));
  }

  const rules: DrawRules = {
    exclusions: exclusionRows.filter((e) => ids.has(e.giverId) && ids.has(e.recipientId)),
    noReciprocal: ev.noReciprocal,
    singleLoop: ev.singleLoop,
    avoid,
  };

  const pairs: Pair[] = await tx
    .select({ giverId: assignment.giverId, recipientId: assignment.recipientId })
    .from(assignment)
    .where(eq(assignment.eventId, ev.id));

  return { people, rules, pairs };
}

/** Writes the difference between two assignment sets; returns givers whose match changed. */
async function applyPairs(tx: Tx, eventId: string, before: Pair[], next: Pair[]) {
  const prev = new Map(before.map((p) => [p.giverId, p.recipientId]));
  const nextGivers = new Set(next.map((p) => p.giverId));
  const gone = before.filter((p) => !nextGivers.has(p.giverId)).map((p) => p.giverId);
  const changedOrNew = next.filter((p) => prev.get(p.giverId) !== p.recipientId);
  const replace = [...gone, ...changedOrNew.map((p) => p.giverId)];

  // Old rows go (with their anonymous threads and private notes) so a new
  // recipient never sees messages meant for someone else.
  if (replace.length) await tx.delete(assignment).where(inArray(assignment.giverId, replace));
  if (changedOrNew.length) {
    const now = new Date();
    await tx.insert(assignment).values(
      changedOrNew.map((p) => ({
        eventId,
        giverId: p.giverId,
        recipientId: p.recipientId,
        changedAt: prev.has(p.giverId) ? now : null,
      })),
    );
    const changedExisting = changedOrNew.filter((p) => prev.has(p.giverId)).map((p) => p.giverId);
    if (changedExisting.length)
      await tx.update(participant).set({ matchViewedAt: null }).where(inArray(participant.id, changedExisting));
  }
  return changedOrNew.filter((p) => prev.has(p.giverId)).map((p) => p.giverId);
}

export type DrawOutcome =
  | { ok: true; count: number; relaxedSoftRules: boolean }
  | { ok: false; blockers: Blocker[] };

/**
 * Draw (or redraw) names in one transaction holding the event row lock, so a
 * double-click and the daily cron can never both draw.
 */
export async function performDraw(eventId: string, opts: { redraw?: boolean; expectStatus?: "open" | "drawn" } = {}) {
  const result = await db.transaction(async (tx): Promise<DrawOutcome & { event?: Event }> => {
    const ev = await lockEvent(tx, eventId);
    if (!ev) return { ok: false, blockers: [{ code: "rules_conflict", message: "Exchange not found." }] };
    const allowed = opts.redraw ? ev.status === "drawn" : ev.status === "open";
    if (!allowed || (opts.expectStatus && ev.status !== opts.expectStatus)) {
      const message =
        ev.status === "drawn" ? "Names have already been drawn." : "This exchange isn't open for a draw.";
      return { ok: false, blockers: [{ code: "rules_conflict", message }] };
    }

    const { people, rules } = await loadDrawInputs(tx, ev);
    const drawn = drawNames(people, rules);
    if (!drawn.ok) return drawn;

    await tx.delete(assignment).where(eq(assignment.eventId, ev.id));
    await tx.insert(assignment).values(drawn.pairs.map((p) => ({ eventId: ev.id, ...p })));
    await tx.update(participant).set({ matchViewedAt: null }).where(eq(participant.eventId, ev.id));
    const [updated] = await tx
      .update(eventTable)
      .set({ status: "drawn", drawnAt: new Date() })
      .where(eq(eventTable.id, ev.id))
      .returning();
    return { ok: true, count: drawn.pairs.length, relaxedSoftRules: drawn.relaxedSoftRules, event: updated };
  });

  if (result.ok && result.event) {
    const ev = result.event;
    const givers = await db
      .select({ id: assignment.giverId })
      .from(assignment)
      .where(eq(assignment.eventId, ev.id));
    notifyParticipants(
      ev,
      givers.map((g) => g.id),
      opts.redraw ? "redraw" : "drawn",
    );
  }
  const { event: _ev, ...outcome } = result;
  return outcome as DrawOutcome;
}

/** Splice a newly joined participant into an existing draw (inside the caller's locked transaction). */
export async function spliceLateJoiner(tx: Tx, ev: Event, participantId: string) {
  const { people, rules, pairs } = await loadDrawInputs(tx, ev);
  const result = addToDraw(people, rules, pairs, participantId);
  if (!result.ok) return result;
  const changedGivers = await applyPairs(tx, ev.id, pairs, result.pairs);
  return { ok: true as const, changedGivers };
}

/** Patch the chain around a participant leaving the draw (inside the caller's locked transaction). */
export async function patchOutOfDraw(tx: Tx, ev: Event, participantId: string) {
  const { people, rules, pairs } = await loadDrawInputs(tx, ev);
  if (!pairs.some((p) => p.giverId === participantId || p.recipientId === participantId))
    return { ok: true as const, changedGivers: [] as string[] };
  const result = removeFromDraw(people, rules, pairs, participantId);
  if (!result.ok) return result;
  const changedGivers = await applyPairs(tx, ev.id, pairs, result.pairs);
  return { ok: true as const, changedGivers };
}

type NotifyKind = "drawn" | "redraw" | "changed";

export function notifyParticipants(ev: Event, participantIds: string[], kind: NotifyKind) {
  if (participantIds.length === 0) return;
  after(async () => {
    const rows = await db
      .select({ id: participant.id, email: user.email })
      .from(participant)
      .innerJoin(user, eq(user.id, participant.userId))
      .where(inArray(participant.id, participantIds));
    const url = appUrl(`/events/${ev.id}`);
    const stamp = ev.drawnAt?.getTime() ?? Date.now();
    await sendEmails(
      rows.map((r) => ({
        to: r.email,
        kind: kind === "drawn" ? "names_drawn" : kind === "redraw" ? "redraw" : "match_changed",
        dedupeKey: kind === "changed" ? undefined : `${kind}:${ev.id}:${r.id}:${stamp}`,
        content:
          kind === "drawn"
            ? namesDrawnEmail({ eventName: ev.name, url, organizerCanView: ev.organizerCanViewMatches })
            : kind === "redraw"
              ? redrawEmail({ eventName: ev.name, url })
              : matchChangedEmail({ eventName: ev.name, url }),
      })),
    );
  });
}
