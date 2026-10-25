"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, MoreHorizontalIcon, PencilIcon, StarIcon, Trash2Icon } from "lucide-react";
import { deleteWishlist, makeDefaultWishlist, renameWishlist } from "@/server/actions/wishlists";
import { useAction } from "@/components/use-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, ResponsiveDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/misc";

export function WishlistHeader({
  wishlist,
  sharedIn,
}: {
  wishlist: { id: string; name: string; isDefault: boolean };
  sharedIn: string[];
}) {
  const router = useRouter();
  const [pending, run] = useAction();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(wishlist.name);
  const [deleting, setDeleting] = useState(false);

  return (
    <header className="grid grid-cols-1 gap-3">
      <Link href="/wishlists" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeftIcon className="size-4" /> All wishlists
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-2">
          <h1 className="font-display text-3xl font-semibold break-words sm:text-4xl">{wishlist.name}</h1>
          <div className="flex flex-wrap gap-2">
            {wishlist.isDefault ? (
              <Badge variant="gold">
                <StarIcon /> Default for new exchanges
              </Badge>
            ) : null}
            {sharedIn.length ? (
              <Badge variant="secondary" className="max-w-full shrink text-left whitespace-normal">
                Shared in {sharedIn.join(", ")}
              </Badge>
            ) : (
              <Badge variant="outline">Not shared in any exchange</Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Wishlist options" disabled={pending}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRenaming(true)}>
              <PencilIcon /> Rename
            </DropdownMenuItem>
            {!wishlist.isDefault ? (
              <>
                <DropdownMenuItem onSelect={() => run(() => makeDefaultWishlist(wishlist.id), { success: "Default wishlist updated" })}>
                  <StarIcon /> Make default
                </DropdownMenuItem>
                <DropdownMenuItem
                  destructive
                  onSelect={() => setDeleting(true)}
                >
                  <Trash2Icon /> Delete
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete “${wishlist.name}”?`}
        description="Everything on it goes too. Exchanges sharing it will show only your gift preferences."
        confirmLabel="Delete wishlist"
        destructive
        onConfirm={() =>
          run(() => deleteWishlist(wishlist.id), { success: "Wishlist deleted", onSuccess: () => router.push("/wishlists") })
        }
      />

      <ResponsiveDialog open={renaming} onOpenChange={setRenaming} title="Rename wishlist">
        <form
          className="grid gap-4 pb-5 sm:pb-0"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => renameWishlist(wishlist.id, name), { success: "Renamed", onSuccess: () => setRenaming(false) });
          }}
        >
          <Field label="Name" htmlFor="rename-wishlist">
            <Input id="rename-wishlist" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
          </Field>
          <Button type="submit" disabled={pending || !name.trim()}>
            Save
          </Button>
        </form>
      </ResponsiveDialog>
    </header>
  );
}
