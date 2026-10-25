"use client";

import { useState, useTransition } from "react";
import { CircleNotchIcon, WarningIcon } from "@/components/icons";
import { toast } from "sonner";
import { deleteAccount } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";

export function DeleteAccount({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTyped("");
      }}
      trigger={
        <Button variant="outline" className="w-fit border-destructive/40 text-destructive hover:bg-destructive/5">
          Delete account
        </Button>
      }
      title="Delete your account?"
      description="This can't be undone."
    >
      <form
        className="grid gap-6 pb-4 sm:pb-0"
        onSubmit={(e) => {
          e.preventDefault();
          if (!matches) return;
          start(async () => {
            const res = await deleteAccount(typed);
            if (res && !res.ok) toast.error(res.error);
          });
        }}
      >
        <div className="flex gap-3 rounded-2xl bg-destructive/5 p-4 text-sm">
          <WarningIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
          <ul className="grid gap-1">
            <li>Your wishlists, profile and sign-in connections are deleted.</li>
            <li>Exchanges you organize are cancelled, and their members get an email.</li>
            <li>In other exchanges you leave the draw, and we patch the chain so everyone still has a match.</li>
          </ul>
        </div>
        <Field label={`Type ${email} to confirm`} htmlFor="confirm-delete">
          <Input
            id="confirm-delete"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </Field>
        <Button type="submit" variant="destructive" disabled={!matches || pending}>
          {pending ? <CircleNotchIcon className="animate-spin" /> : null} Delete my account
        </Button>
      </form>
    </ResponsiveDialog>
  );
}
