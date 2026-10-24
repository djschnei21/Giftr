import Link from "next/link";
import { ChevronLeftIcon, Settings2Icon } from "lucide-react";
import type { Event } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { longDateLabel } from "@/lib/format";
import { statusBadge } from "./status";

export function EventHeader({
  event,
  isOrganizer,
  back = { href: "/events", label: "All exchanges" },
  showManage = true,
}: {
  event: Event;
  isOrganizer: boolean;
  back?: { href: string; label: string };
  showManage?: boolean;
}) {
  const badge = statusBadge(event);
  return (
    <header className="grid gap-4">
      <Link
        href={back.href}
        className="-ml-1 flex w-fit items-center gap-1 rounded-lg text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" /> {back.label}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {isOrganizer ? <Badge variant="outline">You&apos;re organizing</Badge> : null}
          </div>
          <h1 className="font-display text-3xl leading-tight font-semibold break-words sm:text-4xl">{event.name}</h1>
          <p className="text-muted-foreground">{longDateLabel(event.exchangeDate)}</p>
        </div>
        {isOrganizer && showManage && event.status !== "cancelled" ? (
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}/manage`}>
              <Settings2Icon /> Manage
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
