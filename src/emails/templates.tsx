import { EmailLayout, Muted, P, Unsubscribe } from "./layout";

export type EmailContent = { subject: string; react: React.ReactElement };

export function magicLinkEmail(url: string): EmailContent {
  return {
    subject: "Your Giftr sign-in link",
    react: (
      <EmailLayout
        preview="Tap to sign in to Giftr"
        heading="Sign in to Giftr"
        cta={{ label: "Sign in", href: url }}
        footer="If you didn't request this, you can safely ignore this email."
      >
        <P>Tap the button below to sign in. The link expires in 15 minutes and can only be used once.</P>
      </EmailLayout>
    ),
  };
}

export function inviteEmail(p: {
  inviterName: string;
  eventName: string;
  dateLabel: string;
  budgetLabel: string | null;
  url: string;
}): EmailContent {
  return {
    subject: `${p.inviterName} invited you to ${p.eventName}`,
    react: (
      <EmailLayout
        preview={`Join ${p.eventName} on Giftr — exchange on ${p.dateLabel}`}
        heading={`You're invited to ${p.eventName}`}
        cta={{ label: "Join the exchange", href: p.url }}
      >
        <P>
          {p.inviterName} is organizing a Secret Santa and would love for you to join. Gift exchange on{" "}
          <strong>{p.dateLabel}</strong>
          {p.budgetLabel ? (
            <>
              , with a budget of <strong>{p.budgetLabel}</strong>
            </>
          ) : null}
          .
        </P>
        <Muted>Joining takes one tap with Google, Facebook, or your email.</Muted>
      </EmailLayout>
    ),
  };
}

export function namesDrawnEmail(p: {
  eventName: string;
  url: string;
  organizerCanView: boolean;
}): EmailContent {
  return {
    subject: `Names are drawn for ${p.eventName}`,
    react: (
      <EmailLayout
        preview="Find out who you're shopping for"
        heading="Names have been drawn"
        cta={{ label: "Reveal my match", href: p.url }}
      >
        <P>
          The draw for <strong>{p.eventName}</strong> is done. Your match is waiting for you — along with their wishlist
          and gift preferences.
        </P>
        <Muted>
          {p.organizerCanView
            ? "Heads up: the organizer of this exchange has chosen to be able to see matches."
            : "Only you can see who you drew. Not even the organizer can peek."}
        </Muted>
      </EmailLayout>
    ),
  };
}

export function matchChangedEmail(p: { eventName: string; url: string }): EmailContent {
  return {
    subject: `Your match changed in ${p.eventName}`,
    react: (
      <EmailLayout
        preview="The group changed, so you have a new person to shop for"
        heading="You have a new match"
        cta={{ label: "See my new match", href: p.url }}
      >
        <P>
          Someone joined or left <strong>{p.eventName}</strong>, so Giftr adjusted the draw. You&apos;re now shopping
          for someone new. Everyone else&apos;s match stayed the same.
        </P>
      </EmailLayout>
    ),
  };
}

export function redrawEmail(p: { eventName: string; url: string }): EmailContent {
  return {
    subject: `Names were redrawn for ${p.eventName}`,
    react: (
      <EmailLayout preview="The organizer redrew names" heading="Names were redrawn" cta={{ label: "See my match", href: p.url }}>
        <P>
          The organizer of <strong>{p.eventName}</strong> redrew names for everyone. Please check your new match.
        </P>
      </EmailLayout>
    ),
  };
}

export function newMessageEmail(p: {
  eventName: string;
  fromSanta: boolean;
  senderName?: string;
  url: string;
  unsubscribeUrl?: string;
}): EmailContent {
  const who = p.fromSanta ? "Your Secret Santa" : (p.senderName ?? "Your giftee");
  return {
    subject: `${who} sent you a message`,
    react: (
      <EmailLayout
        preview={`New message in ${p.eventName}`}
        heading={`${who} sent you a message`}
        cta={{ label: "Read and reply", href: p.url }}
        footer={p.unsubscribeUrl ? <Unsubscribe href={p.unsubscribeUrl} /> : undefined}
      >
        <P>
          You have a new message in <strong>{p.eventName}</strong>.
          {p.fromSanta ? " Your Santa stays anonymous — reply to help them pick the perfect gift." : null}
        </P>
      </EmailLayout>
    ),
  };
}

export function reminderEmail(p: {
  subject: string;
  heading: string;
  body: string;
  cta: { label: string; href: string };
  unsubscribeUrl?: string;
}): EmailContent {
  return {
    subject: p.subject,
    react: (
      <EmailLayout
        preview={p.body}
        heading={p.heading}
        cta={p.cta}
        footer={p.unsubscribeUrl ? <Unsubscribe href={p.unsubscribeUrl} /> : undefined}
      >
        <P>{p.body}</P>
      </EmailLayout>
    ),
  };
}

export function eventCancelledEmail(p: { eventName: string; organizerName: string }): EmailContent {
  return {
    subject: `${p.eventName} was cancelled`,
    react: (
      <EmailLayout preview={`${p.organizerName} cancelled ${p.eventName}`} heading="This exchange was cancelled">
        <P>
          {p.organizerName} cancelled <strong>{p.eventName}</strong>. No action is needed on your part.
        </P>
      </EmailLayout>
    ),
  };
}
