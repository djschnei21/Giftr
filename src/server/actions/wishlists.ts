"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { participant, wishlist } from "@/db/schema";
import { runAction, UserError } from "@/lib/action";
import { assertEventAccess } from "@/lib/authz";

export async function setSharedWishlist(eventId: string, wishlistId: string | null) {
  return runAction(async () => {
    const { me, user } = await assertEventAccess(eventId);
    if (!me) throw new UserError("You're not a participant in this exchange.");
    if (wishlistId) {
      const [owned] = await db
        .select({ id: wishlist.id })
        .from(wishlist)
        .where(and(eq(wishlist.id, wishlistId), eq(wishlist.ownerId, user.id)))
        .limit(1);
      if (!owned) throw new UserError("That wishlist isn't yours.");
    }
    await db.update(participant).set({ wishlistId }).where(eq(participant.id, me.id));
    revalidatePath(`/events/${eventId}`);
  });
}
