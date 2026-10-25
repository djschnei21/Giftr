"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { subDays } from "date-fns";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { event, participant, user as userTable, wishlist } from "@/db/schema";
import { eventCancelledEmail } from "@/emails/templates";
import { runAction, UserError } from "@/lib/action";
import { assertEventAccess, assertUser } from "@/lib/authz";
import { sendEmails } from "@/lib/email";
import { todayISO } from "@/lib/format";
import { createEventSchema, updateEventSchema, type CreateEventInput, type UpdateEventInput } from "@/lib/validation";
import { inviteByEmail } from "@/server/invites";

/** One day of slack so organizers west of UTC aren't told "today" is in the past. */
const validationToday = () => todayISO(subDays(new Date(), 1));

export async function createEvent(input: CreateEventInput) {
  return runAction(async () => {
    const me = await assertUser();
    const data = createEventSchema(validationToday()).parse(input);
    const { organizerInDraw, inviteEmails, ...fields } = data;

    const [defaultList] = await db
      .select({ id: wishlist.id })
      .from(wishlist)
      .where(and(eq(wishlist.ownerId, me.id), eq(wishlist.isDefault, true)))
      .limit(1);

    const created = await db.transaction(async (tx) => {
      const [ev] = await tx
        .insert(event)
        .values({ ...fields, drawDate: fields.drawMode === "scheduled" ? fields.drawDate : null, organizerId: me.id })
        .returning();
      await tx.insert(participant).values({
        eventId: ev.id,
        userId: me.id,
        displayName: me.name,
        role: "organizer",
        inDraw: organizerInDraw,
        wishlistId: defaultList?.id ?? null,
      });
      return ev;
    });

    const { invited } = await inviteByEmail(created, me, inviteEmails);
    revalidatePath("/events");
    return { id: created.id, invited: invited.length };
  });
}

export async function updateEvent(eventId: string, input: UpdateEventInput) {
  return runAction(async () => {
    const { event: ev } = await assertEventAccess(eventId, { organizer: true });
    if (ev.status === "cancelled" || ev.status === "completed") throw new UserError("This exchange is closed.");
    const data = updateEventSchema(validationToday()).parse(input);

    const drawn = ev.status === "drawn";
    if (drawn) {
      if (data.noReciprocal !== ev.noReciprocal || data.singleLoop !== ev.singleLoop)
        throw new UserError("Draw rules can't change after names are drawn. Redraw first if you need different rules.");
      if (data.organizerCanViewMatches && !ev.organizerCanViewMatches)
        throw new UserError("Organizer access to matches can't be turned on after the draw.");
      if (data.drawFormat !== ev.drawFormat) throw new UserError("The exchange format can't change after names are drawn.");
    }

    await db
      .update(event)
      .set({
        ...data,
        drawFormat: drawn ? ev.drawFormat : data.drawFormat,
        drawMode: drawn ? ev.drawMode : data.drawMode,
        drawDate: drawn ? ev.drawDate : data.drawMode === "scheduled" ? data.drawDate : null,
      })
      .where(eq(event.id, eventId));
    revalidatePath(`/events/${eventId}`, "layout");
  });
}

export async function cancelEvent(eventId: string) {
  return runAction(async () => {
    const { event: ev, user } = await assertEventAccess(eventId, { organizer: true });
    if (ev.status === "cancelled") return;
    await db.update(event).set({ status: "cancelled" }).where(eq(event.id, eventId));

    const recipients = await db
      .select({ email: userTable.email })
      .from(participant)
      .innerJoin(userTable, eq(userTable.id, participant.userId))
      .where(and(eq(participant.eventId, eventId), eq(participant.status, "joined"), ne(participant.userId, user.id)));
    after(() =>
      sendEmails(
        recipients.map((r) => ({
          to: r.email,
          kind: "event_cancelled",
          dedupeKey: `cancelled:${eventId}:${r.email}`,
          content: eventCancelledEmail({ eventName: ev.name, organizerName: user.name }),
        })),
      ),
    );
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`, "layout");
  });
}

export async function setOrganizerInDraw(eventId: string, inDraw: boolean) {
  return runAction(async () => {
    const { event: ev, me } = await assertEventAccess(eventId, { organizer: true });
    if (ev.status !== "open") throw new UserError("You can only change this before names are drawn.");
    if (!me) throw new UserError("You're not a participant in this exchange.");
    await db.update(participant).set({ inDraw }).where(eq(participant.id, me.id));
    revalidatePath(`/events/${eventId}`, "layout");
  });
}
