import { CalendarCheckIcon, HourglassIcon } from "@/components/icons";
import type { Assignment, Event, Participant } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { dateLabel } from "@/lib/format";
import { RevealCard } from "./reveal-card";

export function MatchSection({
  event,
  me,
  assignments,
  giftees,
}: {
  event: Event;
  me: Participant;
  assignments: { main: Assignment | null; wildcard: Assignment | null };
  giftees: {
    main: { name: string; image: string | null } | null;
    wildcard: { name: string; image: string | null } | null;
  };
}) {
  if (!me.inDraw) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">
          {me.role === "organizer"
            ? "You're organizing this one without taking part in the draw."
            : event.status === "open"
              ? "The organizer has you sitting out of the draw this time."
              : "You joined after the draw and couldn't be slotted in automatically. The organizer can redraw to include you, and we'll email you."}
        </CardContent>
      </Card>
    );
  }

  const wildcard = event.drawFormat === "wildcard";
  const ready = assignments.main && giftees.main && (!wildcard || (assignments.wildcard && giftees.wildcard));

  if (event.status === "open" || !ready) {
    const scheduled = event.drawMode === "scheduled" && event.drawDate;
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex min-w-0 items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-foreground">
            {scheduled ? <CalendarCheckIcon className="size-6" /> : <HourglassIcon className="size-6" />}
          </span>
          <div className="min-w-0">
            <p className="font-semibold">Names haven&apos;t been drawn yet</p>
            <p className="text-sm break-words text-muted-foreground">
              {scheduled
                ? `Giftr will draw names on ${dateLabel(event.drawDate)}. We'll email you.`
                : "We'll email you as soon as the organizer draws names."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!wildcard) {
    return (
      <RevealCard
        eventId={event.id}
        giftee={giftees.main!}
        alreadyViewed={!!me.matchViewedAt}
        changed={!!assignments.main!.changedAt && !me.matchViewedAt}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <RevealCard
        eventId={event.id}
        giftee={giftees.main!}
        alreadyViewed={!!me.matchViewedAt}
        changed={!!assignments.main!.changedAt && !me.matchViewedAt}
        label="Your main gift is for"
      />
      <RevealCard
        eventId={event.id}
        giftee={giftees.wildcard!}
        alreadyViewed={!!me.matchViewedAt}
        changed={!!assignments.wildcard!.changedAt && !me.matchViewedAt}
        label="Your wild card is for"
        cta="match"
      />
    </div>
  );
}
