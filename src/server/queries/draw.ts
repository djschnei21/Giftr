import "server-only";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { assignment, exclusion, invitation, participant, wishlistItem, type Event } from "@/db/schema";
import { checkCoupledDraw, checkDraw } from "@/lib/draw";
import { todayISO } from "@/lib/format";
import { loadDrawInputs } from "@/server/draw";

export type DrawCheck = {
  level: "ok" | "warn" | "block";
  message: string;
};

export async function getPreDrawChecks(ev: Event) {
  const wildcard = ev.drawFormat === "wildcard";
  const { people, rules } = await loadDrawInputs(db, ev, "main");
  const checks: DrawCheck[] = [];

  let result: Awaited<ReturnType<typeof checkDraw>> | Awaited<ReturnType<typeof checkCoupledDraw>> | null = null;
  if (people.length >= 2) {
    if (wildcard) {
      const wildcardInputs = await loadDrawInputs(db, ev, "wildcard");
      result = checkCoupledDraw(people, {
        exclusions: rules.exclusions,
        noReciprocal: rules.noReciprocal,
        singleLoop: rules.singleLoop,
        mainAvoid: rules.avoid,
        wildcardAvoid: wildcardInputs.rules.avoid,
      });
    } else {
      result = checkDraw(people, rules);
    }
  }
  if (people.length < 3)
    checks.push({
      level: people.length < 2 ? "block" : "warn",
      message:
        people.length < 2
          ? "You need at least 2 people in the draw (3 or more is more fun)."
          : "Only 2 people are in the draw — they'll just swap gifts.",
    });
  else
    checks.push({
      level: "ok",
      message: wildcard
        ? `${people.length} people are in the draw — each one gets two gifts to shop for.`
        : `${people.length} people are in the draw.`,
    });

  if (result && !result.ok) for (const b of result.blockers) checks.push({ level: "block", message: b.message });
  else if (result?.relaxedSoftRules)
    checks.push({ level: "warn", message: "Some people may get the same match as last time — there was no way around it." });
  else if (result) checks.push({ level: "ok", message: "Every rule can be satisfied." });

  const [{ n: pendingInvites }] = await db
    .select({ n: count() })
    .from(invitation)
    .where(and(eq(invitation.eventId, ev.id), eq(invitation.status, "pending")));
  if (pendingInvites)
    checks.push({
      level: "warn",
      message: `${pendingInvites} ${pendingInvites === 1 ? "invite hasn't" : "invites haven't"} been answered yet. Late joiners can still be added after the draw.`,
    });

  if (ev.joinDeadline && ev.joinDeadline > todayISO())
    checks.push({ level: "warn", message: "The join deadline hasn't passed yet." });

  const ids = people.map((p) => p.id);
  if (ids.length) {
    const withItems = await db
      .selectDistinct({ id: participant.id })
      .from(participant)
      .innerJoin(wishlistItem, eq(wishlistItem.wishlistId, participant.wishlistId))
      .where(inArray(participant.id, ids));
    const missing = people.filter((p) => !withItems.some((w) => w.id === p.id));
    if (missing.length)
      checks.push({
        level: "warn",
        message:
          missing.length <= 3
            ? `${missing.map((m) => m.name).join(", ")} ${missing.length === 1 ? "hasn't" : "haven't"} added wishlist ideas yet.`
            : `${missing.length} people haven't added wishlist ideas yet.`,
      });
    else checks.push({ level: "ok", message: "Everyone has wishlist ideas." });
  }

  return { checks, canDraw: !checks.some((c) => c.level === "block"), inDraw: people.length };
}

export async function getExclusions(eventId: string) {
  const giver = alias(participant, "giver");
  const recipient = alias(participant, "recipient");
  return db
    .select({
      id: exclusion.id,
      giverId: exclusion.giverId,
      recipientId: exclusion.recipientId,
      giverName: giver.displayName,
      recipientName: recipient.displayName,
    })
    .from(exclusion)
    .innerJoin(giver, eq(giver.id, exclusion.giverId))
    .innerJoin(recipient, eq(recipient.id, exclusion.recipientId))
    .where(and(eq(exclusion.eventId, eventId), eq(giver.status, "joined"), eq(recipient.status, "joined")))
    .orderBy(asc(exclusion.createdAt));
}

/** Only for organizers who turned on "organizer can view matches" (visible to everyone). */
export async function getAllMatches(eventId: string) {
  const giver = alias(participant, "giver");
  const recipient = alias(participant, "recipient");
  return db
    .select({
      giverName: giver.displayName,
      recipientName: recipient.displayName,
      slot: assignment.slot,
      viewed: giver.matchViewedAt,
    })
    .from(assignment)
    .innerJoin(giver, eq(giver.id, assignment.giverId))
    .innerJoin(recipient, eq(recipient.id, assignment.recipientId))
    .where(eq(assignment.eventId, eventId))
    .orderBy(asc(giver.displayName), asc(assignment.slot));
}
