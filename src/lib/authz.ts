import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { event, participant, type Event, type Participant } from "@/db/schema";
import { auth } from "@/lib/auth";

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export type CurrentUser = { id: string; name: string; email: string; image: string | null };

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;
  const { id, name, email, image } = session.user;
  return { id, name, email, image: image ?? null };
});

export async function requireUser(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in");
  return user;
}

export class AuthError extends Error {}

export type EventAccess = {
  user: CurrentUser;
  event: Event;
  me: Participant | null;
  isOrganizer: boolean;
};

/**
 * Loads an event the current user may see: organizers always, otherwise only
 * active (not removed) participants. Everything else is a 404 so event IDs
 * can't be probed.
 */
export const getEventAccess = cache(async (eventId: string): Promise<EventAccess | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const [row] = await db
    .select({ event, me: participant })
    .from(event)
    .leftJoin(participant, and(eq(participant.eventId, event.id), eq(participant.userId, user.id)))
    .where(eq(event.id, eventId))
    .limit(1);
  if (!row) return null;
  const isOrganizer = row.event.organizerId === user.id;
  const me = row.me && row.me.status !== "removed" ? row.me : null;
  if (!isOrganizer && !me) return null;
  return { user, event: row.event, me, isOrganizer };
});

export async function requireEventAccess(eventId: string) {
  const access = await getEventAccess(eventId);
  if (!access) {
    const user = await getCurrentUser();
    if (!user) redirect(`/sign-in?next=/events/${eventId}`);
    notFound();
  }
  return access;
}

/** For Server Actions: throws instead of redirecting. */
export async function assertEventAccess(eventId: string, opts: { organizer?: boolean } = {}) {
  const access = await getEventAccess(eventId);
  if (!access) throw new AuthError("You don't have access to this exchange.");
  if (opts.organizer && !access.isOrganizer) throw new AuthError("Only the organizer can do that.");
  return access;
}

export async function assertUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Please sign in again.");
  return user;
}
