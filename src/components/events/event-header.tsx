import Link from "next/link";
import { CaretLeftIcon, SlidersHorizontalIcon } from "@/components/icons";
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
        <CaretLeftIcon className="size-4" /> {back.label}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid w-full min-w-0 gap-2 sm:w-auto">
          <div className="flex flex-wrap gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {isOrganizer ? <Badge variant="outline">You&apos;re organizing</Badge> : null}
          </div>
          <h1 className="max-w-full font-display text-4xl break-words sm:text-5xl">
            {event.name.replaceAll("/", "/\u200b")}
          </h1>
          <p className="font-medium text-muted-foreground">{longDateLabel(event.exchangeDate)}</p>
        </div>
        {isOrganizer && showManage && event.status !== "cancelled" ? (
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}/manage`}>
              <SlidersHorizontalIcon /> Manage
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
