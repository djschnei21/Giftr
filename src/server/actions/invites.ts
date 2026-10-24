"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { participant } from "@/db/schema";
import { runAction, UserError } from "@/lib/action";
import { assertEventAccess } from "@/lib/authz";

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
