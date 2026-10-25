import type { Metadata } from "next";
import Link from "next/link";
import { GiftIcon, StarIcon } from "@/components/icons";
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
    <div className="grid gap-12">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="grid min-w-0 gap-2">
          <h1 className="font-display text-4xl sm:text-5xl">Wishlists</h1>
          <p className="max-w-md text-muted-foreground">
            Keep one for everything, or a list per exchange. You choose which one each Santa sees.
          </p>
        </div>
        <NewWishlistButton />
      </header>

      {lists.length === 0 ? (
        <EmptyState
          title="No wishlists yet"
          description="Start one and paste links to things you love. We'll fill in the name and picture."
          action={<NewWishlistButton />}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {lists.map((list, i) => (
            <li key={list.id}>
              <Link
                href={`/wishlists/${list.id}`}
                className="group flex h-full flex-col gap-6 rounded-3xl bg-card p-4 shadow-sm transition outline-none hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-ring/30 active:scale-[0.98] sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-2xl">{list.name}</h2>
                    <p className="text-sm font-medium text-muted-foreground">{pluralize(list.itemCount, "idea")}</p>
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
                        className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-secondary text-muted-foreground transition duration-500 group-hover:-rotate-2 even:group-hover:rotate-2"
                      >
                        {item?.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="size-full object-cover"
                          />
                        ) : item ? (
                          <span className="line-clamp-3 px-2 text-center text-xs font-medium">
                            {item.title}
                          </span>
                        ) : (
                          <GiftIcon className="size-5 opacity-40" />
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
