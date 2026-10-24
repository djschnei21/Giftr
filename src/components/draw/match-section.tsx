import { CalendarClockIcon, HourglassIcon } from "lucide-react";
import type { Assignment, Event, Participant } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { dateLabel } from "@/lib/format";
import { RevealCard } from "./reveal-card";

export function MatchSection({
  event,
  me,
  assignment,
  giftee,
}: {
  event: Event;
  me: Participant;
  assignment: Assignment | null;
  giftee: { name: string; image: string | null } | null;
}) {
  if (!me.inDraw) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">
          {me.role === "organizer"
            ? "You're organizing this one without taking part in the draw."
            : event.status === "open"
              ? "The organizer has you sitting out of the draw this time."
              : "You joined after the draw and couldn't be slotted in automatically. The organizer can redraw to include you — we'll email you."}
        </CardContent>
      </Card>
    );
  }

  if (event.status === "open" || !assignment || !giftee) {
    const scheduled = event.drawMode === "scheduled" && event.drawDate;
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold">
            {scheduled ? <CalendarClockIcon className="size-6" /> : <HourglassIcon className="size-6" />}
          </span>
          <div>
            <p className="font-medium">Names haven&apos;t been drawn yet</p>
            <p className="text-sm text-muted-foreground">
              {scheduled
                ? `Giftr will draw names on ${dateLabel(event.drawDate)}. We'll email you.`
                : "We'll email you as soon as the organizer draws names."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <RevealCard
      eventId={event.id}
      giftee={giftee}
      alreadyViewed={!!me.matchViewedAt}
      changed={!!assignment.changedAt && !me.matchViewedAt}
    />
  );
}
