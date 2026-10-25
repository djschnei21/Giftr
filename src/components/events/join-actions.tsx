"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleNotchIcon, ConfettiIcon } from "@/components/icons";
import { toast } from "sonner";
import { declineInvite, joinEvent } from "@/server/actions/invites";
import { Button } from "@/components/ui/button";

export function JoinActions({ code, token }: { code: string; token?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <p className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
        No problem. We let the organizer know you can&apos;t make it this time.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      <Button
        size="lg"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await joinEvent(code, token);
            if (!res.ok) return void toast.error(res.error);
            toast.success("You're in! Add a few wishlist ideas while you wait.");
            router.push(`/events/${res.data.eventId}`);
          })
        }
      >
        {pending ? <CircleNotchIcon className="animate-spin" /> : <ConfettiIcon />}
        Count me in
      </Button>
      <Button
        variant="ghost"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await declineInvite(code, token);
            if (!res.ok) return void toast.error(res.error);
            setDeclined(true);
          })
        }
      >
        I can&apos;t make it
      </Button>
    </div>
  );
}
