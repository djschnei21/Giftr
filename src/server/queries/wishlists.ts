import "server-only";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlist, wishlistItem } from "@/db/schema";

export async function listMyWishlists(userId: string) {
  return db
    .select({
      id: wishlist.id,
      name: wishlist.name,
      isDefault: wishlist.isDefault,
      updatedAt: wishlist.updatedAt,
      itemCount: count(wishlistItem.id),
    })
    .from(wishlist)
    .leftJoin(wishlistItem, eq(wishlistItem.wishlistId, wishlist.id))
    .where(eq(wishlist.ownerId, userId))
    .groupBy(wishlist.id)
    .orderBy(desc(wishlist.isDefault), asc(wishlist.createdAt));
}

export async function getWishlistItems(wishlistId: string) {
  return db
    .select()
    .from(wishlistItem)
    .where(eq(wishlistItem.wishlistId, wishlistId))
    .orderBy(asc(wishlistItem.position), asc(wishlistItem.createdAt));
}

export async function getOwnedWishlist(userId: string, wishlistId: string) {
  const [row] = await db
    .select()
    .from(wishlist)
    .where(and(eq(wishlist.id, wishlistId), eq(wishlist.ownerId, userId)))
    .limit(1);
  return row ?? null;
}

export async function getWishlistPreview(wishlistId: string, limit = 3) {
  return db
    .select({ id: wishlistItem.id, title: wishlistItem.title, imageUrl: wishlistItem.imageUrl })
    .from(wishlistItem)
    .where(eq(wishlistItem.wishlistId, wishlistId))
    .orderBy(asc(wishlistItem.position))
    .limit(limit);
}
