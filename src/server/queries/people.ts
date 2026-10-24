import "server-only";
import { and, desc, eq, inArray, ne, notInArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { event, invitation, participant, user } from "@/db/schema";

/**
 * People who shared a past exchange with this user and aren't already part
 * of (or invited to) the given event.
 */
export async function listPastPeople(userId: string, eventId: string) {
  const mine = await db
    .select({ eventId: participant.eventId })
    .from(participant)
    .where(and(eq(participant.userId, userId), eq(participant.status, "joined"), ne(participant.eventId, eventId)));
  const eventIds = mine.map((m) => m.eventId);
  if (eventIds.length === 0) return [];

  const current = await db
    .select({ userId: participant.userId })
    .from(participant)
    .where(and(eq(participant.eventId, eventId), ne(participant.status, "declined")));
  const invited = await db
    .select({ email: sql<string>`lower(${invitation.email})` })
    .from(invitation)
    .where(and(eq(invitation.eventId, eventId), inArray(invitation.status, ["pending", "accepted"])));
  const excludeUsers = [userId, ...current.map((c) => c.userId).filter((u): u is string => !!u)];
  const invitedEmails = new Set(invited.map((i) => i.email));

  const other = alias(participant, "other");
  const rows = await db
    .select({
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      eventName: event.name,
      exchangeDate: event.exchangeDate,
    })
    .from(other)
    .innerJoin(user, eq(user.id, other.userId))
    .innerJoin(event, eq(event.id, other.eventId))
    .where(
      and(inArray(other.eventId, eventIds), eq(other.status, "joined"), notInArray(other.userId, excludeUsers)),
    )
    .orderBy(desc(event.exchangeDate));

  const seen = new Map<string, (typeof rows)[number]>();
  for (const r of rows) if (!seen.has(r.userId) && !invitedEmails.has(r.email.toLowerCase())) seen.set(r.userId, r);
  return [...seen.values()];
}

export async function listInvitations(eventId: string) {
  return db
    .select()
    .from(invitation)
    .where(and(eq(invitation.eventId, eventId), ne(invitation.status, "accepted")))
    .orderBy(desc(invitation.lastSentAt));
}
