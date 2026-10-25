import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { event, participant } from "@/db/schema";
import { WishlistEditor } from "@/components/wishlists/wishlist-editor";
import { WishlistHeader } from "@/components/wishlists/wishlist-header";
import { requireUser } from "@/lib/authz";
import { getOwnedWishlist, getWishlistItems } from "@/server/queries/wishlists";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage({ params }: PageProps<"/wishlists/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/wishlists/${id}`);
  const list = await getOwnedWishlist(user.id, id);
  if (!list) notFound();

  const [items, shared] = await Promise.all([
    getWishlistItems(id),
    db
      .select({ name: event.name })
      .from(participant)
      .innerJoin(event, eq(event.id, participant.eventId))
      .where(
        and(
          eq(participant.wishlistId, id),
          eq(participant.userId, user.id),
          eq(participant.status, "joined"),
          inArray(event.status, ["open", "drawn"]),
        ),
      ),
  ]);
  return (
    <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-8">
      <WishlistHeader wishlist={list} sharedIn={shared.map((s) => s.name)} />
      <WishlistEditor wishlistId={id} items={items} />
    </div>
  );
}
