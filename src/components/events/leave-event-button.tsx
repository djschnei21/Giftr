"use client";

import { useRouter } from "next/navigation";
import { SignOutIcon } from "@/components/icons";
import { toast } from "sonner";
import { leaveEvent } from "@/server/actions/invites";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";

export function LeaveEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" className="justify-self-start text-muted-foreground">
          <SignOutIcon /> Leave this exchange
        </Button>
      }
      title="Leave this exchange?"
      description="You won't be included when names are drawn. You can rejoin with the invite link until then."
      confirmLabel="Leave"
      destructive
      onConfirm={async () => {
        const res = await leaveEvent(eventId);
        if (!res.ok) return void toast.error(res.error);
        toast.success("You left the exchange");
        router.push("/events");
      }}
    />
  );
}
