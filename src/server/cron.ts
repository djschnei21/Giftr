import "server-only";
import { addDays, format } from "date-fns";
import { and, between, count, eq, isNotNull, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { assignment, event, participant, profile, user, wishlistItem, type Event } from "@/db/schema";
import { reminderEmail } from "@/emails/templates";
import { sendEmails } from "@/lib/email";
import { todayISO } from "@/lib/format";
import { unsubscribePageUrl } from "@/lib/unsubscribe";
import { appUrl, firstName } from "@/lib/utils";
import { performDraw } from "@/server/draw";

type Recipient = { participantId: string; email: string; name: string; token: string | null; notify: boolean | null };

type Reminder = { key: string; subject: string; heading: string; body: string; cta: { label: string; href: string } };

const isoPlus = (today: string, days: number) => format(addDays(new Date(`${today}T12:00:00Z`), days), "yyyy-MM-dd");

function recipientColumns() {
  return {
    participantId: participant.id,
    email: user.email,
    name: participant.displayName,
    token: profile.unsubscribeToken,
    notify: profile.notifyReminders,
  };
}

/** Reminders respect the "reminders" preference and are sent at most once per dedupe key. */
async function remind(recipients: Recipient[], build: (r: Recipient) => Reminder) {
  const wanted = recipients.filter((r) => r.notify !== false);
  return sendEmails(
    wanted.map((r) => {
      const m = build(r);
      return {
        to: r.email,
        kind: "reminder",
        dedupeKey: m.key,
        unsubscribe: r.token ? { token: r.token, type: "reminders" as const } : undefined,
        content: reminderEmail({
          ...m,
          unsubscribeUrl: r.token ? unsubscribePageUrl(r.token, "reminders") : undefined,
        }),
      };
    }),
  );
}

async function runScheduledDraws(today: string) {
  const due = await db
    .select({ event, organizerEmail: user.email, token: profile.unsubscribeToken })
    .from(event)
    .innerJoin(user, eq(user.id, event.organizerId))
    .leftJoin(profile, eq(profile.userId, user.id))
    .where(and(eq(event.status, "open"), eq(event.drawMode, "scheduled"), lte(event.drawDate, today)));

  let drawn = 0;
  const failed: string[] = [];
  for (const row of due) {
    const outcome = await performDraw(row.event.id, { expectStatus: "open" });
    if (outcome.ok) {
      drawn++;
      continue;
    }
    failed.push(row.event.id);
    // Organizers always hear about a failed draw, whatever their reminder settings.
    await sendEmails([
      {
        to: row.organizerEmail,
        kind: "draw_failed",
        dedupeKey: `draw_failed:${row.event.id}:${today}`,
        content: reminderEmail({
          subject: `We couldn't draw names for ${row.event.name}`,
          heading: "The scheduled draw needs your help",
          body: `${outcome.blockers.map((b) => b.message).join(" ")} Fix this on the Draw tab and draw names when you're ready. We'll try again tomorrow.`,
          cta: { label: "Open the Draw tab", href: appUrl(`/events/${row.event.id}/manage?tab=draw`) },
        }),
      },
    ]);
  }
  return { drawn, failed };
}

async function completePastExchanges(today: string) {
  const done = await db
    .update(event)
    .set({ status: "completed" })
    .where(and(eq(event.status, "drawn"), lt(event.exchangeDate, today)))
    .returning({ id: event.id });
  return done.length;
}

async function eventRecipients(eventId: string, extra = sql`true`) {
  return db
    .select(recipientColumns())
    .from(participant)
    .innerJoin(user, eq(user.id, participant.userId))
    .leftJoin(profile, eq(profile.userId, user.id))
    .where(and(eq(participant.eventId, eventId), eq(participant.status, "joined"), extra));
}

async function wishlistNudges(today: string) {
  const soon = isoPlus(today, 3);
  const events = await db
    .select()
    .from(event)
    .where(
      and(
        eq(event.status, "open"),
        or(
          and(eq(event.drawMode, "scheduled"), between(event.drawDate, today, soon)),
          between(event.joinDeadline, today, soon),
        ),
      ),
    );
  let sent = 0;
  for (const ev of events) {
    const itemCount = db
      .select({ n: count() })
      .from(wishlistItem)
      .where(eq(wishlistItem.wishlistId, participant.wishlistId));
    const people = await eventRecipients(ev.id, and(eq(participant.inDraw, true), sql`(${itemCount}) = 0`));
    sent += await remind(people, (r) => ({
      key: `wishlist_nudge:${ev.id}:${r.participantId}`,
      subject: `Add a few gift ideas for ${ev.name}`,
      heading: `${firstName(r.name)}, help your Santa out`,
      body: `Names for ${ev.name} are drawn soon and your wishlist is still empty. A few ideas (or even just your sizes and favorite things) make your Santa's job a lot easier.`,
      cta: { label: "Add gift ideas", href: appUrl(`/events/${ev.id}`) },
    }));
  }
  return sent;
}

async function unopenedMatches(now: Date) {
  const events = await db
    .select()
    .from(event)
    .where(and(eq(event.status, "drawn"), lte(event.drawnAt, addDays(now, -2))));
  let sent = 0;
  for (const ev of events) {
    const people = await eventRecipients(
      ev.id,
      and(
        isNull(participant.matchViewedAt),
        sql`exists (select 1 from ${assignment} where ${assignment.giverId} = ${participant.id})`,
      ),
    );
    sent += await remind(people, (r) => ({
      key: `unopened:${ev.id}:${r.participantId}:${ev.drawnAt?.getTime() ?? 0}`,
      subject: `Your match for ${ev.name} is waiting`,
      heading: "You haven't opened your match yet",
      body: `Names were drawn for ${ev.name}. Tap below to see who you're shopping for.`,
      cta: { label: "Reveal my match", href: appUrl(`/events/${ev.id}`) },
    }));
  }
  return sent;
}

async function countdownReminders(today: string) {
  const events = await db
    .select()
    .from(event)
    .where(and(eq(event.status, "drawn"), between(event.exchangeDate, today, isoPlus(today, 7))));
  let sent = 0;
  for (const ev of events) {
    const match = appUrl(`/events/${ev.id}/match`);
    const stillLooking = await eventRecipients(
      ev.id,
      sql`exists (select 1 from ${assignment} where ${assignment.giverId} = ${participant.id} and ${assignment.giftStatus} = 'not_started')`,
    );
    sent += await remind(stillLooking, (r) => ({
      key: `week_left:${ev.id}:${r.participantId}`,
      subject: `${ev.name} is coming up`,
      heading: "Time to find that gift",
      body: weekBody(ev, today),
      cta: { label: "See their wishlist", href: match },
    }));

    if (ev.exchangeType === "in_person" && ev.exchangeDate <= isoPlus(today, 1)) {
      const givers = await eventRecipients(
        ev.id,
        sql`exists (select 1 from ${assignment} where ${assignment.giverId} = ${participant.id})`,
      );
      sent += await remind(givers, (r) => ({
        key: `day_before:${ev.id}:${r.participantId}`,
        subject: ev.exchangeDate === today ? `${ev.name} is today!` : `${ev.name} is tomorrow!`,
        heading: ev.exchangeDate === today ? "It's gift day" : "Don't forget your gift",
        body: `${ev.name} is ${ev.exchangeDate === today ? "today" : "tomorrow"}${ev.location ? ` at ${ev.location}` : ""}. Wrap it up and bring it along!`,
        cta: { label: "Open the exchange", href: appUrl(`/events/${ev.id}`) },
      }));
    }
  }
  return sent;
}

function weekBody(ev: Event, today: string) {
  const days = Math.round((Date.parse(ev.exchangeDate) - Date.parse(today)) / 86_400_000);
  const when = days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  return ev.exchangeType === "shipped"
    ? `${ev.name} is ${when}, and gifts need time to ship. Pick something from your giftee's wishlist and mark it bought so you don't forget.`
    : `${ev.name} is ${when}. Pick something from your giftee's wishlist and mark it bought so you don't forget.`;
}

async function organizerDrawNudges(today: string) {
  const rows = await db
    .select({ event, ...recipientColumns() })
    .from(event)
    .innerJoin(participant, and(eq(participant.eventId, event.id), eq(participant.userId, event.organizerId)))
    .innerJoin(user, eq(user.id, event.organizerId))
    .leftJoin(profile, eq(profile.userId, user.id))
    .where(
      and(
        eq(event.status, "open"),
        eq(event.drawMode, "manual"),
        isNotNull(event.joinDeadline),
        lte(event.joinDeadline, today),
        ne(participant.status, "removed"),
      ),
    );
  let sent = 0;
  for (const row of rows) {
    sent += await remind([row], () => ({
      key: `organizer_draw:${row.event.id}`,
      subject: `Ready to draw names for ${row.event.name}?`,
      heading: "The join deadline has passed",
      body: `Everyone who's coming to ${row.event.name} should be in by now. Check the pre-draw list and draw names when you're ready.`,
      cta: { label: "Draw names", href: appUrl(`/events/${row.event.id}/manage?tab=draw`) },
    }));
  }
  return sent;
}

/** The once-a-day job: scheduled draws, wrap-ups and reminders. Safe to run more than once a day. */
export async function runDaily(now = new Date()) {
  const today = todayISO(now);
  const draws = await runScheduledDraws(today);
  const completed = await completePastExchanges(today);
  const reminders = {
    wishlist: await wishlistNudges(today),
    unopened: await unopenedMatches(now),
    countdown: await countdownReminders(today),
    organizer: await organizerDrawNudges(today),
  };
  return { today, draws, completed, reminders };
}
