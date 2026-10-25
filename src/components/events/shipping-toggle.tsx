"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { TruckIcon } from "lucide-react";
import { toast } from "sonner";
import { setMyShipping } from "@/server/actions/participants";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/misc";

export function ShippingToggle({
  eventId,
  initial,
  hasAddress,
}: {
  eventId: string;
  initial: boolean;
  hasAddress: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [, start] = useTransition();

  function toggle(next: boolean) {
    const before = on;
    setOn(next);
    start(async () => {
      const res = await setMyShipping(eventId, next);
      if (!res.ok) {
        setOn(before);
        toast.error(res.error);
      } else toast.success(next ? "Your Santa will see your shipping address" : "Turned off — back to in person");
    });
  }

  return (
    <Card>
      <CardContent className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <TruckIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">Can&apos;t make it in person?</p>
            <p className="text-[13px] break-words text-muted-foreground">
              {on
                ? hasAddress
                  ? "Your Santa sees your shipping address instead of the usual meetup. Only they know — nobody else."
                  : "Add a shipping address on your profile so your Santa knows where to send it."
                : "Turn this on and only your Secret Santa will see your shipping address instead of the usual meetup."}
            </p>
            {on && !hasAddress ? (
              <Link
                href="/profile#shipping-address"
                className="text-[13px] font-medium text-primary underline-offset-2 hover:underline"
              >
                Add your address
              </Link>
            ) : null}
          </div>
        </div>
        <Switch id="needs-shipping" checked={on} onCheckedChange={toggle} aria-label="Ship my gift to me instead" />
      </CardContent>
    </Card>
  );
}
