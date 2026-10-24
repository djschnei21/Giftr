"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { GiftIcon } from "lucide-react";
import { toast } from "sonner";
import { setSharedWishlist } from "@/server/actions/wishlists";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";

export function WishlistPicker({
  eventId,
  wishlists,
  selectedId,
}: {
  eventId: string;
  wishlists: { id: string; name: string; itemCount: number }[];
  selectedId: string | null;
}) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(selectedId);
  const selected = wishlists.find((w) => w.id === optimistic);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <GiftIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">Wishlist you&apos;re sharing</p>
            <p className="text-[13px] text-muted-foreground">
              {selected ? (
                selected.itemCount === 0 ? (
                  <>
                    It&apos;s empty —{" "}
                    <Link href={`/wishlists/${selected.id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                      add a few ideas
                    </Link>
                  </>
                ) : (
                  <>
                    {selected.itemCount} {selected.itemCount === 1 ? "idea" : "ideas"} ·{" "}
                    <Link href={`/wishlists/${selected.id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                      edit
                    </Link>
                  </>
                )
              ) : (
                "Your Santa will only see your profile preferences."
              )}
            </p>
          </div>
        </div>
        <NativeSelect
          aria-label="Wishlist to share"
          className="sm:w-56"
          value={optimistic ?? ""}
          onChange={(e) => {
            const value = e.target.value || null;
            startTransition(async () => {
              setOptimistic(value);
              const res = await setSharedWishlist(eventId, value);
              if (!res.ok) toast.error(res.error);
            });
          }}
        >
          <option value="">Don&apos;t share a wishlist</option>
          {wishlists.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </NativeSelect>
      </CardContent>
    </Card>
  );
}
