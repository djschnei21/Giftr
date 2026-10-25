import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, EnvelopeSimpleOpenIcon, PlusIcon, SparkleIcon } from "@/components/icons";
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
    <div className="grid gap-12">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="grid min-w-0 gap-2">
          <p className="text-sm font-semibold text-accent-foreground">Hi {firstName(user.name)}</p>
          <h1 className="font-display text-4xl break-words sm:text-5xl">Your exchanges</h1>
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
          <h2 id="invites-heading" className="text-sm font-semibold text-muted-foreground">
            Waiting for you
          </h2>
          {invites.map(({ invitation, event, organizerName }) => (
            <Link
              key={invitation.id}
              href={`/join/${event.inviteCode}`}
              className="group flex min-w-0 items-center gap-4 rounded-2xl bg-card p-4 shadow-sm transition outline-none hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-ring/30 active:scale-[0.98]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-foreground">
                <EnvelopeSimpleOpenIcon weight="fill" className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{event.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {organizerName} invited you · {dateLabel(event.exchangeDate)}
                </span>
              </span>
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
            </Link>
          ))}
        </section>
      ) : null}

      {events.length === 0 ? (
        <EmptyState
          title="Start your first gift exchange"
          description="Pick a date and budget, share one link, and Giftr draws the names. It takes about a minute."
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
        <section aria-label="Upcoming exchanges" className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {active.map((e) => (
            <EventCard key={e.event.id} {...e} />
          ))}
        </section>
      ) : null}

      {past.length ? (
        <section aria-labelledby="past-heading" className="grid gap-4">
          <h2 id="past-heading" className="text-sm font-semibold text-muted-foreground">
            Past exchanges
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
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
  const finished = ["done", "cancelled"].includes(eventPhase(event));
  return (
    <Link
      href={`/events/${event.id}`}
      className="group relative flex min-w-0 flex-col gap-6 rounded-3xl bg-card p-4 shadow-sm transition outline-none hover:-translate-y-1 hover:shadow-xl focus-visible:ring-4 focus-visible:ring-ring/30 active:scale-[0.98] sm:p-6"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={
            finished
              ? "flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-secondary text-muted-foreground"
              : "flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-accent text-accent-foreground transition group-hover:-rotate-3"
          }
        >
          <span className="text-xs font-semibold">{dateLabel(event.exchangeDate, "MMM")}</span>
          <span className="font-display text-2xl tabular-nums">{dateLabel(event.exchangeDate, "d")}</span>
        </span>
        <div className="grid min-w-0 flex-1 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {isOrganizer ? <Badge variant="outline">Organizer</Badge> : null}
          </div>
          <h3 className="text-xl font-bold tracking-tight break-words">{event.name.replaceAll("/", "/\u200b")}</h3>
          <p className="flex min-w-0 flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span>{dateLabel(event.exchangeDate)}</span>
            {budget ? <span>· {budget}</span> : null}
            {countdown && event.status !== "cancelled" ? <span>· {countdown}</span> : null}
          </p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <AvatarStack people={people} />
        {needsReveal ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-semibold whitespace-nowrap text-primary-foreground shadow-sm">
            <SparkleIcon weight="fill" className="size-3" /> Reveal your match
          </span>
        ) : (
          <span className="shrink-0 text-xs font-medium whitespace-nowrap text-muted-foreground">
            {people.length} joined
          </span>
        )}
      </div>
    </Link>
  );
}
