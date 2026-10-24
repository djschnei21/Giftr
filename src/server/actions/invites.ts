"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { event as eventTable, invitation, participant, user as userTable, wishlist, type Event } from "@/db/schema";
import { runAction, UserError } from "@/lib/action";
import { assertEventAccess, assertUser } from "@/lib/authz";
import { emailList, parseEmailList } from "@/lib/validation";
import { lockEvent, notifyParticipants, spliceLateJoiner } from "@/server/draw";
import { findInvitationByToken, getEventByInviteCode, inviteByEmail } from "@/server/invites";
import { listPastPeople } from "@/server/queries/people";

const RESEND_COOLDOWN_MS = 10 * 60 * 1000;

export async function leaveEvent(eventId: string) {
  return runAction(async () => {
    const { event: ev, me, isOrganizer } = await assertEventAccess(eventId);
    if (!me) throw new UserError("You're not in this exchange.");
    if (isOrganizer) throw new UserError("Organizers can't leave their own exchange — cancel it instead.");
    if (ev.status !== "open") throw new UserError("Names are already drawn. Ask the organizer to remove you.");
    await db.update(participant).set({ status: "declined" }).where(eq(participant.id, me.id));
    revalidatePath("/events");
  });
}

export async function joinEvent(code: string, token?: string) {
  return runAction(async () => {
    const me = await assertUser();
    if (!me.name.trim()) throw new UserError("Add your name first.");
    const ev = await getEventByInviteCode(code);
    if (!ev) throw new UserError("This invite link doesn't exist anymore.");
    const invite = await findInvitationByToken(ev.id, token);
    const validInvite = invite && invite.status !== "revoked" ? invite : null;

    const [defaultList] = await db
      .select({ id: wishlist.id })
      .from(wishlist)
      .where(and(eq(wishlist.ownerId, me.id), eq(wishlist.isDefault, true)))
      .limit(1);

    type Outcome = { participantId: string; changedGivers: string[]; spliced: boolean; event?: Event };
    const outcome = await db.transaction(async (tx): Promise<Outcome> => {
      const locked = await lockEvent(tx, ev.id);
      if (!locked) throw new UserError("This exchange doesn't exist anymore.");
      if (locked.status === "cancelled") throw new UserError("This exchange was cancelled.");
      if (locked.status === "completed") throw new UserError("This exchange has already wrapped up.");
      if (locked.status === "drawn" && !validInvite)
        throw new UserError("Names have already been drawn. Ask the organizer for an email invite.");
      if (!locked.inviteLinkEnabled && !validInvite) throw new UserError("This invite link was turned off.");

      const [existing] = await tx
        .select()
        .from(participant)
        .where(and(eq(participant.eventId, ev.id), eq(participant.userId, me.id)))
        .limit(1);
      if (existing?.status === "joined") return { participantId: existing.id, changedGivers: [], spliced: false };
      if (existing?.status === "removed") throw new UserError("The organizer removed you from this exchange.");

      let participantId: string;
      if (existing) {
        await tx
          .update(participant)
          .set({ status: "joined", inDraw: true, displayName: me.name, matchViewedAt: null })
          .where(eq(participant.id, existing.id));
        participantId = existing.id;
      } else {
        const [row] = await tx
          .insert(participant)
          .values({ eventId: ev.id, userId: me.id, displayName: me.name, wishlistId: defaultList?.id ?? null })
          .returning({ id: participant.id });
        participantId = row.id;
      }

      const inviteWhere = validInvite
        ? eq(invitation.id, validInvite.id)
        : and(eq(invitation.eventId, ev.id), sql`lower(${invitation.email}) = ${me.email.toLowerCase()}`);
      await tx
        .update(invitation)
        .set({ status: "accepted", respondedAt: new Date() })
        .where(and(inviteWhere, ne(invitation.status, "revoked")));

      if (locked.status !== "drawn") return { participantId, changedGivers: [], spliced: false };

      const spliced = await spliceLateJoiner(tx, locked, participantId);
      if (!spliced.ok) {
        // They're in the exchange, but the organizer has to redraw to include them.
        await tx.update(participant).set({ inDraw: false }).where(eq(participant.id, participantId));
        return { participantId, changedGivers: [], spliced: false };
      }
      return { participantId, changedGivers: spliced.changedGivers, spliced: true, event: locked };
    });

    if (outcome.spliced && outcome.event) {
      notifyParticipants(outcome.event, outcome.changedGivers, "changed");
      notifyParticipants(outcome.event, [outcome.participantId], "drawn");
    }
    revalidatePath("/events");
    revalidatePath(`/events/${ev.id}`, "layout");
    return { eventId: ev.id };
  });
}

export async function declineInvite(code: string, token?: string) {
  return runAction(async () => {
    const ev = await getEventByInviteCode(code);
    if (!ev) throw new UserError("This invite link doesn't exist anymore.");
    const invite = await findInvitationByToken(ev.id, token);
    if (invite && invite.status === "pending")
      await db.update(invitation).set({ status: "declined", respondedAt: new Date() }).where(eq(invitation.id, invite.id));

    const me = await assertUser().catch(() => null);
    if (me) {
      await db
        .update(invitation)
        .set({ status: "declined", respondedAt: new Date() })
        .where(
          and(
            eq(invitation.eventId, ev.id),
            eq(invitation.status, "pending"),
            sql`lower(${invitation.email}) = ${me.email.toLowerCase()}`,
          ),
        );
    }
    revalidatePath(`/events/${ev.id}/manage`);
  });
}

async function assertCanInvite(eventId: string) {
  const access = await assertEventAccess(eventId, { organizer: true });
  if (access.event.status === "cancelled" || access.event.status === "completed")
    throw new UserError("This exchange is closed.");
  return access;
}

export async function sendInvites(eventId: string, raw: string | string[]) {
  return runAction(async () => {
    const { event: ev, user } = await assertCanInvite(eventId);
    const emails = emailList.parse(Array.isArray(raw) ? raw : parseEmailList(raw));
    if (emails.length === 0) throw new UserError("Add at least one email address.");
    const result = await inviteByEmail(ev, user, emails);
    revalidatePath(`/events/${eventId}/manage`);
    return { invited: result.invited.length, skipped: result.skipped.length };
  });
}

export async function resendInvite(eventId: string, invitationId: string) {
  return runAction(async () => {
    const { event: ev, user } = await assertCanInvite(eventId);
    const [inv] = await db
      .select()
      .from(invitation)
      .where(and(eq(invitation.id, invitationId), eq(invitation.eventId, ev.id)))
      .limit(1);
    if (!inv) throw new UserError("That invite doesn't exist.");
    if (inv.status === "accepted") throw new UserError("They've already joined.");
    if (inv.status === "pending" && Date.now() - inv.lastSentAt.getTime() < RESEND_COOLDOWN_MS)
      throw new UserError("Sent just now — give it a few minutes before resending.");
    await inviteByEmail(ev, user, [inv.email]);
    revalidatePath(`/events/${eventId}/manage`);
  });
}

export async function revokeInvite(eventId: string, invitationId: string) {
  return runAction(async () => {
    await assertCanInvite(eventId);
    await db
      .update(invitation)
      .set({ status: "revoked" })
      .where(and(eq(invitation.id, invitationId), eq(invitation.eventId, eventId), ne(invitation.status, "accepted")));
    revalidatePath(`/events/${eventId}/manage`);
  });
}

export async function setInviteLinkEnabled(eventId: string, enabled: boolean) {
  return runAction(async () => {
    await assertCanInvite(eventId);
    await db.update(eventTable).set({ inviteLinkEnabled: enabled }).where(eq(eventTable.id, eventId));
    revalidatePath(`/events/${eventId}`, "layout");
  });
}

export async function regenerateInviteLink(eventId: string) {
  return runAction(async () => {
    await assertCanInvite(eventId);
    const [row] = await db
      .update(eventTable)
      .set({ inviteCode: nanoid(10), inviteLinkEnabled: true })
      .where(eq(eventTable.id, eventId))
      .returning({ inviteCode: eventTable.inviteCode });
    revalidatePath(`/events/${eventId}`, "layout");
    return { inviteCode: row.inviteCode };
  });
}

export async function quickAddPeople(eventId: string, userIds: string[]) {
  return runAction(async () => {
    const { event: ev, user } = await assertCanInvite(eventId);
    if (userIds.length === 0) throw new UserError("Pick at least one person.");
    // Only people who actually shared an exchange with the organizer.
    const allowed = new Set((await listPastPeople(user.id, eventId)).map((p) => p.userId));
    const ids = userIds.filter((id) => allowed.has(id));
    if (ids.length === 0) throw new UserError("Those people aren't from your past exchanges.");
    const rows = await db.select({ email: userTable.email }).from(userTable).where(inArray(userTable.id, ids));
    const result = await inviteByEmail(
      ev,
      user,
      rows.map((r) => r.email),
    );
    revalidatePath(`/events/${eventId}/manage`);
    return { invited: result.invited.length };
  });
}
