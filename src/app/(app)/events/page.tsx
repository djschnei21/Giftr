import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CalendarDaysIcon, MailOpenIcon, PlusIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarStack } from "@/components/ui/avatar";
import { EmptyState } from "@/components/app/empty-state";
import { countdownLabel, eventPhase, statusBadge } from "@/components/events/status";
import { requireUser } from "@/lib/authz";
import { budgetLabel, dateLabel } from "@/lib/format";
import { firstName } from "@/lib/utils";
import { listMyEvents, listMyPendingInvites } from "@/server/queries/events";

export const metadata: Metadata = { title: "Your exchanges" };

export default async function EventsPage() {
  const user = await requireUser();
  const [events, invites] = await Promise.all([listMyEvents(user.id), listMyPendingInvites(user.email, user.id)]);
  const active = events.filter((e) => !["done", "cancelled"].includes(eventPhase(e.event)));
  const past = events.filter((e) => ["done", "cancelled"].includes(eventPhase(e.event))).reverse();

  return (
    <div className="grid gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Hi {firstName(user.name)} 👋</p>
          <h1 className="font-display text-3xl font-semibold break-words sm:text-4xl">Your exchanges</h1>
        </div>
        {events.length ? (
          <Button asChild>
            <Link href="/events/new">
              <PlusIcon /> New exchange
            </Link>
          </Button>
        ) : null}
      </header>

      {invites.length ? (
        <section aria-labelledby="invites-heading" className="grid gap-3">
          <h2 id="invites-heading" className="text-sm font-medium text-muted-foreground">
            Waiting for you
          </h2>
          {invites.map(({ invitation, event, organizerName }) => (
            <Link
              key={invitation.id}
              href={`/join/${event.inviteCode}`}
              className="group flex min-w-0 items-center gap-4 rounded-2xl border border-gold/40 bg-gold/10 p-4 transition hover:bg-gold/15"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-card">
                <MailOpenIcon className="size-5 text-gold" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{event.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {organizerName} invited you · {dateLabel(event.exchangeDate)}
                </span>
              </span>
              <ArrowRightIcon className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
            </Link>
          ))}
        </section>
      ) : null}

      {events.length === 0 ? (
        <EmptyState
          icon={<SparklesIcon />}
          title="Start your first gift exchange"
          description="Set a date and budget, invite people with a link, and Giftr handles the draw. It takes about a minute."
          action={
            <Button asChild size="lg">
              <Link href="/events/new">
                <PlusIcon /> Create an exchange
              </Link>
            </Button>
          }
        />
      ) : null}

      {active.length ? (
        <section aria-label="Upcoming exchanges" className="grid gap-4 sm:grid-cols-2">
          {active.map((e) => (
            <EventCard key={e.event.id} {...e} />
          ))}
        </section>
      ) : null}

      {past.length ? (
        <section aria-labelledby="past-heading" className="grid gap-4">
          <h2 id="past-heading" className="text-sm font-medium text-muted-foreground">
            Past exchanges
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {past.map((e) => (
              <EventCard key={e.event.id} {...e} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function EventCard({ event, me, isOrganizer, people }: Awaited<ReturnType<typeof listMyEvents>>[number]) {
  const badge = statusBadge(event);
  const countdown = countdownLabel(event.exchangeDate);
  const budget = budgetLabel(event.budgetMin, event.budgetMax, event.currency);
  const needsReveal = event.status === "drawn" && me?.inDraw && !me.matchViewedAt;
  return (
    <Link
      href={`/events/${event.id}`}
      className="group relative flex min-w-0 flex-col gap-5 rounded-3xl border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgb(0_0_0/0.07)] focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          {isOrganizer ? <Badge variant="outline">Organizer</Badge> : null}
        </div>
        {countdown && event.status !== "cancelled" ? (
          <span className="text-xs font-medium text-muted-foreground">{countdown}</span>
        ) : null}
      </div>
      <div className="grid gap-1">
        <h3 className="font-display text-xl leading-snug font-semibold break-words">
          {event.name.replaceAll("/", "/\u200b")}
        </h3>
        <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground">
          <CalendarDaysIcon className="size-3.5 shrink-0" />
          <span>{dateLabel(event.exchangeDate)}</span>
          {budget ? <span>· {budget}</span> : null}
        </p>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <AvatarStack people={people} />
        {needsReveal ? (
          <span className="shrink-0 rounded-full bg-berry px-3 py-1 text-xs font-semibold whitespace-nowrap text-berry-foreground">
            Reveal your match
          </span>
        ) : (
          <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">{people.length} joined</span>
        )}
      </div>
    </Link>
  );
}
