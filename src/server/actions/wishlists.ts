"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, inArray, max, ne } from "drizzle-orm";
import { db } from "@/db";
import { participant, wishlist, wishlistItem } from "@/db/schema";
import { runAction, UserError } from "@/lib/action";
import { assertEventAccess, assertUser } from "@/lib/authz";
import { fetchLinkPreview } from "@/lib/link-preview";
import { wishlistItemSchema, wishlistNameSchema, type WishlistItemInput } from "@/lib/validation";

async function ownedList(userId: string, wishlistId: string) {
  const [row] = await db
    .select()
    .from(wishlist)
    .where(and(eq(wishlist.id, wishlistId), eq(wishlist.ownerId, userId)))
    .limit(1);
  if (!row) throw new UserError("That wishlist isn't yours.");
  return row;
}

async function ownedItem(userId: string, itemId: string) {
  const [row] = await db
    .select({ item: wishlistItem })
    .from(wishlistItem)
    .innerJoin(wishlist, eq(wishlist.id, wishlistItem.wishlistId))
    .where(and(eq(wishlistItem.id, itemId), eq(wishlist.ownerId, userId)))
    .limit(1);
  if (!row) throw new UserError("That item isn't yours.");
  return row.item;
}

function touch(wishlistId: string) {
  revalidatePath("/wishlists");
  revalidatePath(`/wishlists/${wishlistId}`);
}

export async function setSharedWishlist(eventId: string, wishlistId: string | null) {
  return runAction(async () => {
    const { me, user } = await assertEventAccess(eventId);
    if (!me) throw new UserError("You're not a participant in this exchange.");
    if (wishlistId) await ownedList(user.id, wishlistId);
    await db.update(participant).set({ wishlistId }).where(eq(participant.id, me.id));
    revalidatePath(`/events/${eventId}`);
  });
}

export async function createWishlist(name: string) {
  return runAction(async () => {
    const user = await assertUser();
    const parsed = wishlistNameSchema.parse(name);
    const existing = await db.select({ id: wishlist.id }).from(wishlist).where(eq(wishlist.ownerId, user.id));
    if (existing.length >= 20) throw new UserError("You can have up to 20 wishlists.");
    const [row] = await db
      .insert(wishlist)
      .values({ ownerId: user.id, name: parsed, isDefault: existing.length === 0 })
      .returning({ id: wishlist.id });
    revalidatePath("/wishlists");
    return { id: row.id };
  });
}

export async function renameWishlist(wishlistId: string, name: string) {
  return runAction(async () => {
    const user = await assertUser();
    await ownedList(user.id, wishlistId);
    await db.update(wishlist).set({ name: wishlistNameSchema.parse(name) }).where(eq(wishlist.id, wishlistId));
    touch(wishlistId);
  });
}

export async function makeDefaultWishlist(wishlistId: string) {
  return runAction(async () => {
    const user = await assertUser();
    await ownedList(user.id, wishlistId);
    await db.transaction(async (tx) => {
      await tx.update(wishlist).set({ isDefault: false }).where(and(eq(wishlist.ownerId, user.id), ne(wishlist.id, wishlistId)));
      await tx.update(wishlist).set({ isDefault: true }).where(eq(wishlist.id, wishlistId));
    });
    touch(wishlistId);
  });
}

export async function deleteWishlist(wishlistId: string) {
  return runAction(async () => {
    const user = await assertUser();
    const list = await ownedList(user.id, wishlistId);
    if (list.isDefault) throw new UserError("Make another wishlist your default before deleting this one.");
    await db.delete(wishlist).where(eq(wishlist.id, wishlistId));
    revalidatePath("/wishlists");
  });
}

export async function addWishlistItem(wishlistId: string, input: WishlistItemInput) {
  return runAction(async () => {
    const user = await assertUser();
    await ownedList(user.id, wishlistId);
    const data = wishlistItemSchema.parse(input);
    const [{ top }] = await db
      .select({ top: max(wishlistItem.position) })
      .from(wishlistItem)
      .where(eq(wishlistItem.wishlistId, wishlistId));
    const [row] = await db
      .insert(wishlistItem)
      .values({ ...data, wishlistId, position: (top ?? -1) + 1 })
      .returning();
    touch(wishlistId);
    return row;
  });
}

export async function updateWishlistItem(itemId: string, input: WishlistItemInput) {
  return runAction(async () => {
    const user = await assertUser();
    const item = await ownedItem(user.id, itemId);
    const data = wishlistItemSchema.parse(input);
    await db.update(wishlistItem).set(data).where(eq(wishlistItem.id, itemId));
    touch(item.wishlistId);
  });
}

export async function toggleMostWanted(itemId: string, mostWanted: boolean) {
  return runAction(async () => {
    const user = await assertUser();
    const item = await ownedItem(user.id, itemId);
    await db.update(wishlistItem).set({ mostWanted }).where(eq(wishlistItem.id, itemId));
    touch(item.wishlistId);
  });
}

export async function deleteWishlistItem(itemId: string) {
  return runAction(async () => {
    const user = await assertUser();
    const item = await ownedItem(user.id, itemId);
    await db.delete(wishlistItem).where(eq(wishlistItem.id, itemId));
    touch(item.wishlistId);
  });
}

export async function reorderWishlistItems(wishlistId: string, orderedIds: string[]) {
  return runAction(async () => {
    const user = await assertUser();
    await ownedList(user.id, wishlistId);
    const items = await db
      .select({ id: wishlistItem.id })
      .from(wishlistItem)
      .where(eq(wishlistItem.wishlistId, wishlistId))
      .orderBy(asc(wishlistItem.position));
    const known = new Set(items.map((i) => i.id));
    const ordered = [...new Set(orderedIds)].filter((id) => known.has(id));
    // Anything the client didn't send keeps its relative order at the end.
    const rest = items.map((i) => i.id).filter((id) => !ordered.includes(id));
    const all = [...ordered, ...rest];
    await db.transaction(async (tx) => {
      for (const [position, id] of all.entries())
        await tx
          .update(wishlistItem)
          .set({ position })
          .where(and(eq(wishlistItem.id, id), inArray(wishlistItem.wishlistId, [wishlistId])));
    });
    touch(wishlistId);
  });
}

const previewHits = new Map<string, number[]>();

export async function previewLink(url: string) {
  return runAction(async () => {
    const user = await assertUser();
    const now = Date.now();
    const recent = (previewHits.get(user.id) ?? []).filter((t) => now - t < 60_000);
    if (recent.length >= 20) throw new UserError("Slow down a little — try again in a minute.");
    previewHits.set(user.id, [...recent, now]);
    return fetchLinkPreview(url);
  });
}
