import "server-only";
import { and, asc, count, countDistinct, desc, eq, inArray, isNotNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { assignment, event, household, invitation, participant, user } from "@/db/schema";

export async function listMyEvents(userId: string) {
  const rows = await db
    .select({ event, me: participant })
    .from(event)
    .leftJoin(participant, and(eq(participant.eventId, event.id), eq(participant.userId, userId)))
    .where(or(eq(event.organizerId, userId), and(isNotNull(participant.id), eq(participant.status, "joined"))))
    .orderBy(asc(event.exchangeDate));

  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.event.id);

  const people = await db
    .select({ eventId: participant.eventId, id: participant.id, name: participant.displayName, image: user.image })
    .from(participant)
    .leftJoin(user, eq(user.id, participant.userId))
    .where(and(inArray(participant.eventId, ids), eq(participant.status, "joined")))
    .orderBy(asc(participant.joinedAt));

  return rows.map((r) => ({
    ...r,
    isOrganizer: r.event.organizerId === userId,
    people: people.filter((p) => p.eventId === r.event.id),
  }));
}

export async function listMyPendingInvites(email: string, userId: string) {
  const rows = await db
    .select({ invitation, event, organizerName: user.name })
    .from(invitation)
    .innerJoin(event, eq(event.id, invitation.eventId))
    .innerJoin(user, eq(user.id, event.organizerId))
    .leftJoin(participant, and(eq(participant.eventId, event.id), eq(participant.userId, userId)))
    .where(
      and(
        sql`lower(${invitation.email}) = ${email.toLowerCase()}`,
        eq(invitation.status, "pending"),
        eq(event.status, "open"),
        sql`${participant.id} is null`,
      ),
    )
    .orderBy(desc(invitation.lastSentAt));
  return rows;
}

export type EventPerson = Awaited<ReturnType<typeof getEventPeople>>[number];

export async function getEventPeople(eventId: string) {
  return db
    .select({
      id: participant.id,
      userId: participant.userId,
      name: participant.displayName,
      image: user.image,
      email: user.email,
      role: participant.role,
      status: participant.status,
      inDraw: participant.inDraw,
      householdId: participant.householdId,
      wishlistId: participant.wishlistId,
      matchViewedAt: participant.matchViewedAt,
      joinedAt: participant.joinedAt,
    })
    .from(participant)
    .leftJoin(user, eq(user.id, participant.userId))
    .where(and(eq(participant.eventId, eventId), ne(participant.status, "removed")))
    .orderBy(asc(participant.joinedAt));
}

export async function getHouseholds(eventId: string) {
  return db.select().from(household).where(eq(household.eventId, eventId)).orderBy(asc(household.createdAt));
}

export async function getEventCounts(eventId: string) {
  const [joined] = await db
    .select({ n: count() })
    .from(participant)
    .where(and(eq(participant.eventId, eventId), eq(participant.status, "joined")));
  const [inDraw] = await db
    .select({ n: count() })
    .from(participant)
    .where(and(eq(participant.eventId, eventId), eq(participant.status, "joined"), eq(participant.inDraw, true)));
  // Each person can have two assignment rows (main + wildcard), so count people, not rows.
  const [viewed] = await db
    .select({ n: countDistinct(assignment.giverId) })
    .from(assignment)
    .innerJoin(participant, eq(participant.id, assignment.giverId))
    .where(and(eq(assignment.eventId, eventId), isNotNull(participant.matchViewedAt)));
  const [assigned] = await db
    .select({ n: countDistinct(assignment.giverId) })
    .from(assignment)
    .where(eq(assignment.eventId, eventId));
  return { joined: joined.n, inDraw: inDraw.n, viewed: viewed.n, assigned: assigned.n };
}

/** A participant's gift(s): just the main one for Classic, both for Wildcard. */
export async function getMyAssignments(participantId: string) {
  return db.select().from(assignment).where(eq(assignment.giverId, participantId));
}
