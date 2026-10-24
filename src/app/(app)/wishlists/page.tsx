import type { Metadata } from "next";
import Link from "next/link";
import { GiftIcon, ListChecksIcon, StarIcon } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { NewWishlistButton } from "@/components/wishlists/new-wishlist-button";
import { requireUser } from "@/lib/authz";
import { pluralize } from "@/lib/format";
import { getWishlistPreview, listMyWishlists } from "@/server/queries/wishlists";

export const metadata: Metadata = { title: "Wishlists" };

export default async function WishlistsPage() {
  const user = await requireUser("/wishlists");
  const lists = await listMyWishlists(user.id);
  const previews = await Promise.all(lists.map((l) => getWishlistPreview(l.id, 4)));

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Wishlists</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep one for everything, or a list per exchange. You choose which one each Santa sees.
          </p>
        </div>
        <NewWishlistButton />
      </header>

      {lists.length === 0 ? (
        <EmptyState
          icon={<ListChecksIcon />}
          title="No wishlists yet"
          description="Start one and paste links to things you love — we'll fill in the title, picture and price."
          action={<NewWishlistButton />}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {lists.map((list, i) => (
            <li key={list.id}>
              <Link
                href={`/wishlists/${list.id}`}
                className="group flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-xl font-semibold">{list.name}</h2>
                    <p className="text-sm text-muted-foreground">{pluralize(list.itemCount, "idea")}</p>
                  </div>
                  {list.isDefault ? (
                    <Badge variant="gold">
                      <StarIcon /> Default
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-auto grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, j) => {
                    const item = previews[i][j];
                    return (
                      <div
                        key={j}
                        className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-secondary text-muted-foreground"
                      >
                        {item?.imageUrl ? (
                          <img src={item.imageUrl} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
                        ) : item ? (
                          <span className="line-clamp-3 px-1.5 text-center text-[10px] leading-tight">{item.title}</span>
                        ) : (
                          <GiftIcon className="size-4 opacity-40" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
