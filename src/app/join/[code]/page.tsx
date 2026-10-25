import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { LockIcon } from "@/components/icons";
import { db } from "@/db";
import { participant, user } from "@/db/schema";
import { Logo } from "@/components/logo";
import { Snowfall } from "@/components/festive";
import { Button } from "@/components/ui/button";
import { InviteCard } from "@/components/events/invite-card";
import { SignInCard } from "@/components/auth/sign-in-card";
import { JoinActions } from "@/components/events/join-actions";
import { enabledSocialProviders } from "@/lib/auth";
import { getCurrentUser } from "@/lib/authz";
import { devOutboxEnabled } from "@/lib/email";
import { budgetLabel, longDateLabel } from "@/lib/format";
import { findInvitationByToken, getEventByInviteCode } from "@/server/invites";

export async function generateMetadata({ params }: PageProps<"/join/[code]">): Promise<Metadata> {
  const ev = await getEventByInviteCode((await params).code);
  if (!ev) return { title: "Invite not found" };
  const budget = budgetLabel(ev.budgetMin, ev.budgetMax, ev.currency);
  const description = `Secret Santa on ${longDateLabel(ev.exchangeDate)}${budget ? ` · ${budget}` : ""}. Join in one tap on Giftr.`;
  return {
    title: `Join ${ev.name}`,
    description,
    openGraph: { title: `You're invited to ${ev.name}`, description },
    twitter: { card: "summary_large_image", title: `You're invited to ${ev.name}`, description },
    robots: { index: false },
  };
}

export default async function JoinPage({ params, searchParams }: PageProps<"/join/[code]">) {
  const { code } = await params;
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : undefined;
  const ev = await getEventByInviteCode(code);
  if (!ev) notFound();

  const [current, invite, [organizer], [{ n: joinedCount }]] = await Promise.all([
    getCurrentUser(),
    findInvitationByToken(ev.id, token),
    db.select({ name: user.name }).from(user).where(eq(user.id, ev.organizerId)),
    db
      .select({ n: count() })
      .from(participant)
      .where(and(eq(participant.eventId, ev.id), eq(participant.status, "joined"))),
  ]);

  const selfPath = `/join/${code}${token ? `?t=${encodeURIComponent(token)}` : ""}`;
  if (current && !current.name.trim()) redirect(`/welcome?next=${encodeURIComponent(selfPath)}`);

  const mine = current
    ? (
        await db
          .select()
          .from(participant)
          .where(and(eq(participant.eventId, ev.id), eq(participant.userId, current.id)))
          .limit(1)
      )[0]
    : undefined;
  if (mine?.status === "joined" || (current && ev.organizerId === current.id)) redirect(`/events/${ev.id}`);

  const validInvite = invite && invite.status !== "revoked" ? invite : null;
  const closedReason =
    ev.status === "cancelled"
      ? "This exchange was cancelled."
      : ev.status === "completed"
        ? "This exchange has already wrapped up."
        : mine?.status === "removed"
          ? "The organizer removed you from this exchange."
          : ev.status === "drawn" && !validInvite
            ? "Names have already been drawn, so joining is closed. Ask the organizer to send you an email invite."
            : !ev.inviteLinkEnabled && !validInvite
              ? "The organizer turned off this invite link. Ask them for a new one."
              : null;

  const card = (
    <InviteCard
      data={{
        name: ev.name,
        organizerName: organizer?.name ?? "Someone",
        exchangeDate: ev.exchangeDate,
        exchangeType: ev.exchangeType,
        location: ev.location,
        drawFormat: ev.drawFormat,
        budgetMin: ev.budgetMin,
        budgetMax: ev.budgetMax,
        wildcardBudgetMin: ev.wildcardBudgetMin,
        wildcardBudgetMax: ev.wildcardBudgetMax,
        currency: ev.currency,
        description: ev.description,
        participantCount: ev.showParticipants ? joinedCount : undefined,
      }}
    />
  );

  return (
    <main id="main" className="relative isolate flex flex-1 flex-col items-center px-4 py-12 sm:py-16">
      <Snowfall count={44} seed={19} className="-z-10" />
      <Logo className="mb-12" />
      <div className="page-enter w-full max-w-4xl">
      <div className="grid items-start gap-8 md:grid-cols-2">
        {card}
        {closedReason ? (
          <div className="grid gap-4 rounded-3xl bg-card p-6 text-center shadow-lg sm:p-8">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-secondary">
              <LockIcon className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{closedReason}</p>
            <Button asChild variant="outline">
              <Link href={current ? "/events" : "/"}>{current ? "Go to my exchanges" : "Learn about Giftr"}</Link>
            </Button>
          </div>
        ) : current ? (
          <div className="grid gap-6 rounded-3xl bg-card p-6 shadow-lg sm:p-8">
            <div className="grid gap-2">
              <h1 className="font-display text-3xl">Join {ev.name}?</h1>
              <p className="text-sm text-muted-foreground">
                You&apos;ll join as <span className="font-semibold text-foreground">{current.name}</span> ({current.email}
                ).
                {ev.status === "drawn"
                  ? " Names are already drawn. You'll be slotted in without spoiling anyone else's match."
                  : null}
              </p>
            </div>
            <JoinActions code={code} token={token} />
          </div>
        ) : (
          <SignInCard
            next={selfPath}
            providers={enabledSocialProviders}
            devOutbox={devOutboxEnabled()}
            heading={`Join ${ev.name}`}
            subheading="Sign in to join. It takes one tap."
          />
        )}
      </div>
      </div>
    </main>
  );
}
