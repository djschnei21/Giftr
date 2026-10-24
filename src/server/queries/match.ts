import "server-only";
import { and, asc, count, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { assignment, message, participant, profile, user, wishlist, wishlistItem, type Event } from "@/db/schema";

export type ThreadRole = "santa" | "giftee";

export type ThreadMessage = { id: string; mine: boolean; body: string; createdAt: string };

/** The assignment a participant sees from one side of the thread. */
export async function findThreadAssignment(participantId: string, as: ThreadRole) {
  const [row] = await db
    .select()
    .from(assignment)
    .where(as === "santa" ? eq(assignment.giverId, participantId) : eq(assignment.recipientId, participantId))
    .limit(1);
  return row ?? null;
}

/**
 * Messages carry only which side sent them, so the giftee's view can never
 * reveal who their Santa is.
 */
export async function getThread(assignmentId: string, as: ThreadRole): Promise<ThreadMessage[]> {
  const rows = await db
    .select({ id: message.id, senderRole: message.senderRole, body: message.body, createdAt: message.createdAt })
    .from(message)
    .where(eq(message.assignmentId, assignmentId))
    .orderBy(asc(message.createdAt));
  return rows.map((m) => ({ id: m.id, mine: m.senderRole === as, body: m.body, createdAt: m.createdAt.toISOString() }));
}

export async function countUnread(assignmentId: string, as: ThreadRole) {
  const [row] = await db
    .select({ n: count() })
    .from(message)
    .where(and(eq(message.assignmentId, assignmentId), ne(message.senderRole, as), isNull(message.readAt)));
  return row.n;
}

/** Opening the match page counts as having seen your match. */
export async function markViewedOnOpen(participantId: string) {
  await db
    .update(participant)
    .set({ matchViewedAt: new Date() })
    .where(and(eq(participant.id, participantId), isNull(participant.matchViewedAt)));
}

/** Everything a Santa needs to shop: the giftee's shared wishlist, preferences, and (for shipped exchanges) address. */
export async function getMatchDetails(ev: Event, santaParticipantId: string) {
  const mine = await findThreadAssignment(santaParticipantId, "santa");
  if (!mine) return null;

  const [giftee] = await db
    .select({
      id: participant.id,
      name: participant.displayName,
      image: user.image,
      wishlistId: participant.wishlistId,
      profile,
    })
    .from(participant)
    .leftJoin(user, eq(user.id, participant.userId))
    .leftJoin(profile, eq(profile.userId, participant.userId))
    .where(eq(participant.id, mine.recipientId))
    .limit(1);
  if (!giftee) return null;

  const [list] = giftee.wishlistId
    ? await db.select({ name: wishlist.name }).from(wishlist).where(eq(wishlist.id, giftee.wishlistId)).limit(1)
    : [];
  const items = giftee.wishlistId
    ? await db
        .select()
        .from(wishlistItem)
        .where(eq(wishlistItem.wishlistId, giftee.wishlistId))
        .orderBy(asc(wishlistItem.position), asc(wishlistItem.createdAt))
    : [];

  const p = giftee.profile;
  return {
    assignment: mine,
    giftee: { id: giftee.id, name: giftee.name, image: giftee.image },
    wishlistName: list?.name ?? null,
    items,
    preferences: p
      ? {
          aboutMe: p.aboutMe,
          likes: p.likes,
          dislikes: p.dislikes,
          favoriteColors: p.favoriteColors,
          sizes: p.sizes,
        }
      : null,
    address: ev.exchangeType === "shipped" ? (p?.address ?? null) : null,
  };
}
