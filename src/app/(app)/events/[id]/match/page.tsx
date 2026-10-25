import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  CalendarIcon,
  GiftIcon,
  HeartIcon,
  MapPinIcon,
  PaletteIcon,
  RulerIcon,
  ThumbsDownIcon,
  UserRoundIcon,
  WalletIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { EventHeader } from "@/components/events/event-header";
import { EmptyState } from "@/components/app/empty-state";
import { AnonymousChat } from "@/components/match/anonymous-chat";
import { BoughtChecklist, GiftStatusPicker, GiverNotes } from "@/components/match/gift-tracker";
import { requireEventAccess } from "@/lib/authz";
import { budgetLabel, daysUntil, longDateLabel } from "@/lib/format";
import { firstName } from "@/lib/utils";
import type { Address, Sizes } from "@/db/schema";
import { countUnread, getMatchDetails, getThread, markViewedOnOpen } from "@/server/queries/match";

export const metadata: Metadata = { title: "Your match", robots: { index: false } };

const sizeLabels: Record<keyof Sizes, string> = { top: "Tops", bottom: "Bottoms", shoe: "Shoes", ring: "Ring", other: "Other" };

export default async function MatchPage({ params }: PageProps<"/events/[id]/match">) {
  const { id } = await params;
  const { event, me, isOrganizer } = await requireEventAccess(id);
  if (!me || event.status === "open" || event.status === "cancelled") redirect(`/events/${id}`);
  const wildcard = event.drawFormat === "wildcard";

  const [match, wildcardMatch] = await Promise.all([
    getMatchDetails(event, me.id, "main"),
    wildcard ? getMatchDetails(event, me.id, "wildcard") : null,
  ]);
  if (!match) redirect(`/events/${id}`);

  const [thread, unread] = await Promise.all([
    getThread(match.assignment.id, "santa"),
    countUnread(match.assignment.id, "santa"),
    me.matchViewedAt ? null : markViewedOnOpen(me.id),
  ]);

  const first = firstName(match.giftee.name);
  const budget = budgetLabel(event.budgetMin, event.budgetMax, event.currency);
  const days = daysUntil(event.exchangeDate);
  const bought = match.assignment.boughtItemIds.filter((b) => match.items.some((i) => i.id === b));
  const prefs = match.preferences;
  const sizes = prefs ? (Object.entries(prefs.sizes) as [keyof Sizes, string | undefined][]).filter(([, v]) => v?.trim()) : [];
  const hasPrefs = !!prefs && (prefs.aboutMe || prefs.likes || prefs.dislikes || prefs.favoriteColors || sizes.length > 0);
  const drawn = event.status === "drawn";

  return (
    <div className="grid gap-8">
      <EventHeader event={event} isOrganizer={isOrganizer} back={{ href: `/events/${id}`, label: "Back to exchange" }} showManage={false} />

      {wildcard ? <SectionLabel icon={<GiftIcon />} label="Main gift" /> : null}

      <MatchHero giftee={match.giftee} subtitle="You're Secret Santa for" budget={budget ?? "No set budget"} days={days} event={event} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your progress</CardTitle>
              <CardDescription>Just for you — {first} never sees this.</CardDescription>
            </CardHeader>
            <CardContent>
              <GiftStatusPicker eventId={id} slot="main" status={match.assignment.giftStatus} shipped={match.shipTo} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{match.wishlistName ? `${first}'s wishlist` : "Wishlist"}</CardTitle>
              <CardDescription>
                {match.items.length
                  ? `Tick off what you've bought. ${first} won't know.`
                  : `${first} hasn't added ideas yet. Ask them anonymously below.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {match.items.length ? (
                <BoughtChecklist eventId={id} items={match.items} bought={bought} currency={event.currency} />
              ) : (
                <EmptyState
                  icon={<HeartIcon />}
                  title="No wishlist ideas yet"
                  description={`We'll show ${first}'s ideas here as soon as they add some.`}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About {first}</CardTitle>
            </CardHeader>
            <CardContent>
              {hasPrefs && prefs ? (
                <dl className="grid gap-4 text-sm">
                  {prefs.aboutMe ? <Pref icon={<UserRoundIcon />} label="About" value={prefs.aboutMe} /> : null}
                  {prefs.likes ? <Pref icon={<HeartIcon />} label="Loves" value={prefs.likes} /> : null}
                  {prefs.dislikes ? <Pref icon={<ThumbsDownIcon />} label="Please avoid" value={prefs.dislikes} /> : null}
                  {prefs.favoriteColors ? <Pref icon={<PaletteIcon />} label="Favorite colors" value={prefs.favoriteColors} /> : null}
                  {sizes.length ? (
                    <Pref
                      icon={<RulerIcon />}
                      label="Sizes"
                      value={sizes.map(([k, v]) => `${sizeLabels[k]}: ${v}`).join(" · ")}
                    />
                  ) : null}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">{first} hasn&apos;t filled in their gift preferences yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="grid content-start gap-6">
          <Card id="chat" className="scroll-mt-24">
            <CardHeader>
              <CardTitle>Ask {first} anonymously</CardTitle>
              <CardDescription>They&apos;ll see your messages from &ldquo;Your Secret Santa&rdquo; — never your name.</CardDescription>
            </CardHeader>
            <CardContent>
              {drawn ? (
                <AnonymousChat
                  eventId={id}
                  as="santa"
                  initialMessages={thread}
                  hasUnread={unread > 0}
                  otherName={first}
                  emptyHint={`Not sure about sizes or style? Ask ${first} here — they won't know it's you.`}
                  placeholder={`Message ${first}…`}
                />
              ) : (
                <p className="text-sm text-muted-foreground">This exchange has wrapped up, so messages are closed.</p>
              )}
            </CardContent>
          </Card>

          {match.shipTo ? (
            <Card>
              <CardHeader>
                <CardTitle>Ship to</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressBlock address={match.address} name={match.giftee.name} />
              </CardContent>
            </Card>
          ) : event.location ? (
            <Card>
              <CardContent className="flex items-start gap-3 text-sm">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>Bring your gift to {event.location}.</span>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Private notes</CardTitle>
            </CardHeader>
            <CardContent>
              <GiverNotes eventId={id} slot="main" initial={match.assignment.giverNotes ?? ""} />
            </CardContent>
          </Card>
        </aside>
      </div>

      {wildcardMatch ? (
        <WildcardSection
          eventId={id}
          event={event}
          match={wildcardMatch}
          days={days}
          shippingLocation={event.location}
        />
      ) : null}
    </div>
  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="-mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <span className="[&_svg]:size-4">{icon}</span>
      {label}
    </div>
  );
}

function MatchHero({
  giftee,
  subtitle,
  budget,
  days,
  event,
}: {
  giftee: { name: string; image: string | null };
  subtitle: string;
  budget: string;
  days: number;
  event: { exchangeDate: string };
}) {
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-3xl border bg-gradient-to-br from-accent/60 via-card to-gold/10 p-5 sm:p-6">
      <UserAvatar name={giftee.name} image={giftee.image} className="size-16 text-xl ring-4" />
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <h2 className="font-display text-2xl font-semibold break-words sm:text-3xl" data-testid="match-name">
          {giftee.name}
        </h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <WalletIcon className="size-4" /> {budget}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="size-4" />
            {days > 1 ? `${days} days to go` : days === 1 ? "Tomorrow!" : days === 0 ? "Today!" : longDateLabel(event.exchangeDate)}
          </span>
        </div>
      </div>
    </section>
  );
}

type WildcardMatch = NonNullable<Awaited<ReturnType<typeof getMatchDetails>>>;

/** The wildcard gift has no wishlist — just a name, a budget, progress, notes, and (when shipping applies) an address. */
function WildcardSection({
  eventId,
  event,
  match,
  days,
  shippingLocation,
}: {
  eventId: string;
  event: { exchangeDate: string; wildcardBudgetMin: number | null; wildcardBudgetMax: number | null; currency: string };
  match: WildcardMatch;
  days: number;
  shippingLocation: string | null;
}) {
  const budget = budgetLabel(event.wildcardBudgetMin, event.wildcardBudgetMax, event.currency);
  return (
    <>
      <SectionLabel icon={<GiftIcon />} label="Wildcard gift" />
      <MatchHero giftee={match.giftee} subtitle="Your wildcard is for" budget={budget ?? "No set budget"} days={days} event={event} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Your progress</CardTitle>
            <CardDescription>No wishlist for this one — it&apos;s the surprise.</CardDescription>
          </CardHeader>
          <CardContent>
            <GiftStatusPicker eventId={eventId} slot="wildcard" status={match.assignment.giftStatus} shipped={match.shipTo} />
          </CardContent>
        </Card>

        <aside className="grid content-start gap-6">
          {match.shipTo ? (
            <Card>
              <CardHeader>
                <CardTitle>Ship to</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressBlock address={match.address} name={match.giftee.name} canNudge={false} />
              </CardContent>
            </Card>
          ) : shippingLocation ? (
            <Card>
              <CardContent className="flex items-start gap-3 text-sm">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>Bring your gift to {shippingLocation}.</span>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Private notes</CardTitle>
            </CardHeader>
            <CardContent>
              <GiverNotes eventId={eventId} slot="wildcard" initial={match.assignment.giverNotes ?? ""} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Pref({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary [&_svg]:size-4">{icon}</span>
      <div className="grid min-w-0 gap-0.5">
        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
        <dd className="leading-relaxed whitespace-pre-line break-words">{value}</dd>
      </div>
    </div>
  );
}

function AddressBlock({ address, name, canNudge = true }: { address: Address | null; name: string; canNudge?: boolean }) {
  const lines = address
    ? [
        address.name || name,
        address.line1,
        address.line2,
        [address.city, address.region, address.postalCode].filter(Boolean).join(", "),
        address.country,
      ].filter((l): l is string => !!l?.trim())
    : [];
  if (!address?.line1)
    return (
      <p className="text-sm text-muted-foreground">
        {firstName(name)} hasn&apos;t added a shipping address yet.
        {canNudge ? " Send them a quick anonymous nudge." : ""}
      </p>
    );
  return (
    <address className="text-sm leading-relaxed not-italic" data-testid="ship-to">
      {lines.map((l, i) => (
        <span key={i} className="block">
          {l}
        </span>
      ))}
    </address>
  );
}
