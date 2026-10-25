"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons";
import { createWishlist } from "@/server/actions/wishlists";
import { useAction } from "@/components/use-action";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";

export function NewWishlistButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, run] = useAction();

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="New wishlist"
      description="Name it after the occasion or the vibe — “Cozy winter”, “Kitchen upgrades”…"
      trigger={
        <Button>
          <PlusIcon /> New wishlist
        </Button>
      }
    >
      <form
        className="grid gap-4 pb-5 sm:pb-0"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createWishlist(name), {
            onSuccess: (data) => {
              setOpen(false);
              setName("");
              router.push(`/wishlists/${data.id}`);
            },
          });
        }}
      >
        <Field label="Name" htmlFor="wishlist-name">
          <Input id="wishlist-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={60} />
        </Field>
        <Button type="submit" disabled={pending || !name.trim()}>
          Create wishlist
        </Button>
      </form>
    </ResponsiveDialog>
  );
}
