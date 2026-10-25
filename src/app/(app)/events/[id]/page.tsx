import type { Metadata } from "next";
import {
  EyeIcon,
  LockIcon,
  MapPinIcon,
  PackageIcon,
  RepeatIcon,
  ShuffleIcon,
  SparkleIcon,
  WalletIcon,
} from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EventHeader } from "@/components/events/event-header";
import { Timeline } from "@/components/events/timeline";
import { Countdown } from "@/components/events/countdown";
import { ShareLink } from "@/components/events/share-link";
import { MatchSection } from "@/components/draw/match-section";
import { SantaThread } from "@/components/match/santa-thread";
import { WishlistPicker } from "@/components/wishlists/wishlist-picker";
import { ShippingToggle } from "@/components/events/shipping-toggle";
import { LeaveEventButton } from "@/components/events/leave-event-button";
import { requireEventAccess } from "@/lib/authz";
import { budgetLabel } from "@/lib/format";
import { getEventCounts, getEventPeople, getMyAssignments, hasShippingAddress } from "@/server/queries/events";
import { listMyWishlists } from "@/server/queries/wishlists";
import { joinUrl } from "@/server/invites";

export async function generateMetadata({ params }: PageProps<"/events/[id]">): Promise<Metadata> {
  const { event } = await requireEventAccess((await params).id);
  return { title: event.name };
}

export default async function EventPage({ params, searchParams }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const { created } = await searchParams;
  const { event, me, isOrganizer, user } = await requireEventAccess(id);
  const [people, counts, myAssignments, wishlists, hasAddress] = await Promise.all([
    getEventPeople(id),
    getEventCounts(id),
    me ? getMyAssignments(me.id) : [],
    listMyWishlists(user.id),
    me && event.exchangeType === "in_person" ? hasShippingAddress(user.id) : false,
  ]);
  const joinedPeople = people.filter((p) => p.status === "joined");
  const mainAssignment = myAssignments.find((a) => a.slot === "main") ?? null;
  const wildcardAssignment = myAssignments.find((a) => a.slot === "wildcard") ?? null;
  const toGiftee = (a: typeof mainAssignment) => {
    const row = a ? people.find((p) => p.id === a.recipientId) : null;
    return row ? { name: row.name, image: row.image } : null;
  };
  const budget = budgetLabel(event.budgetMin, event.budgetMax, event.currency);
  const wildcardBudget = budgetLabel(event.wildcardBudgetMin, event.wildcardBudgetMax, event.currency);
  const canSeePeople = isOrganizer || event.showParticipants;
  const open = event.status === "open";

  return (
    <div className="grid min-w-0 gap-8">
      <EventHeader event={event} isOrganizer={isOrganizer} />

      {event.status === "cancelled" ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
          This exchange was cancelled by the organizer.
        </div>
      ) : null}

      {isOrganizer && open && event.inviteLinkEnabled ? (
        <Card className={created ? "border-primary/40 bg-accent/30" : undefined}>
          <CardHeader>
            <CardTitle>{created ? "Your exchange is ready — invite people" : "Invite link"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Drop this in your group chat. Anyone with the link can join until names are drawn.
            </p>
          </CardHeader>
          <CardContent>
            <ShareLink url={joinUrl(event)} title={event.name} />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid content-start gap-6">
          {me && event.status !== "cancelled" ? (
            <MatchSection
              event={event}
              me={me}
              assignments={{ main: mainAssignment, wildcard: wildcardAssignment }}
              giftees={{ main: toGiftee(mainAssignment), wildcard: toGiftee(wildcardAssignment) }}
            />
          ) : null}

          {me && (event.status === "drawn" || event.status === "completed") ? (
            <SantaThread eventId={event.id} participantId={me.id} open={event.status === "drawn"} />
          ) : null}

          {me && event.status !== "cancelled" ? (
            <WishlistPicker
              eventId={event.id}
              wishlists={wishlists.map((w) => ({ id: w.id, name: w.name, itemCount: w.itemCount }))}
              selectedId={me.wishlistId}
              wildcard={event.drawFormat === "wildcard"}
            />
          ) : null}

          {me && event.status !== "cancelled" && event.exchangeType === "in_person" ? (
            <ShippingToggle eventId={event.id} initial={me.needsShipping} hasAddress={hasAddress} />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>The details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <ul className="grid gap-3 text-sm">
                <li className="flex items-start gap-3">
                  {event.exchangeType === "shipped" ? (
                    <>
                      <PackageIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="min-w-0">
                        Gifts are shipped. Your Santa will see the address on your profile.
                      </span>
                    </>
                  ) : (
                    <>
                      <MapPinIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="min-w-0">{event.location || "In person — location to be announced"}</span>
                    </>
                  )}
                </li>
                <li className="flex items-start gap-3">
                  <WalletIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    {budget
                      ? event.drawFormat === "wildcard"
                        ? `Main budget: ${budget}`
                        : `Budget: ${budget}`
                      : "No set budget"}
                  </span>
                </li>
                {event.drawFormat === "wildcard" ? (
                  <li className="flex items-start gap-3">
                    <SparkleIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      {wildcardBudget ? `Wildcard budget: ${wildcardBudget}` : "Wildcard budget not set"}
                    </span>
                  </li>
                ) : null}
              </ul>
              {event.description ? (
                <p className="text-sm leading-relaxed break-words whitespace-pre-line">{event.description}</p>
              ) : null}
              {event.rules ? (
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">House rules</p>
                  <p className="text-sm leading-relaxed break-words whitespace-pre-line">{event.rules}</p>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {event.drawFormat === "wildcard" ? (
                  <Badge variant="gold">
                    <SparkleIcon /> Wild Card exchange
                  </Badge>
                ) : null}
                {event.noReciprocal ? (
                  <Badge variant="secondary">
                    <RepeatIcon /> No two-person swaps
                  </Badge>
                ) : null}
                {event.singleLoop ? (
                  <Badge variant="secondary">
                    <ShuffleIcon /> One big loop
                  </Badge>
                ) : null}
                {event.organizerCanViewMatches ? (
                  <Badge variant="gold">
                    <EyeIcon /> Organizer can see matches
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <LockIcon /> Matches are private
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="grid content-start gap-6">
          {event.status !== "cancelled" ? (
            <Card>
              <CardContent className="grid gap-6">
                <Countdown date={event.exchangeDate} />
                <Timeline event={event} joined={counts.joined} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{counts.joined} people</CardTitle>
            </CardHeader>
            <CardContent>
              {canSeePeople ? (
                <ul className="grid gap-3" aria-label="Participants">
                  {joinedPeople.map((p) => (
                    <li key={p.id} className="flex min-w-0 items-center gap-3">
                      <UserAvatar name={p.name} image={p.image} className="size-8 text-xs" />
                      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="min-w-0 break-words">
                          {p.name}
                          {p.userId === user.id ? <span className="text-muted-foreground"> (you)</span> : null}
                        </span>
                        {p.role === "organizer" ? <Badge variant="outline">Organizer</Badge> : null}
                        {!p.inDraw ? <Badge variant="secondary">Not in draw</Badge> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">The organizer is keeping the guest list a surprise.</p>
              )}
            </CardContent>
          </Card>

          {me && !isOrganizer && open ? <LeaveEventButton eventId={event.id} /> : null}
        </aside>
      </div>
    </div>
  );
}
