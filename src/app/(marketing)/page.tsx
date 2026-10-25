import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  DeviceMobileIcon,
  GiftIcon,
  LinkSimpleIcon,
  LockIcon,
  ShuffleIcon,
  SlidersHorizontalIcon,
  SparkleIcon,
} from "@/components/icons";
import { Ornament, Snowfall, StarPattern } from "@/components/festive";
import { Bento } from "@/components/marketing/bento";
import { HeroMockup } from "@/components/marketing/hero-mockup";
import { InView } from "@/components/marketing/in-view";
import { TaglineReveal } from "@/components/marketing/tagline-reveal";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/authz";
import "./landing.css";

export const metadata: Metadata = {
  title: { absolute: "Giftr · Secret Santa, sorted in one link" },
  description:
    "Run your family, friends or office Secret Santa from one link. Giftr draws names around your rules, shares wishlists and keeps every match secret. Free, with no ads.",
  alternates: { canonical: "/" },
};

const steps = [
  {
    icon: SlidersHorizontalIcon,
    title: "Create the exchange",
    body: "Pick a date, a budget and any rules. It takes about a minute.",
  },
  {
    icon: LinkSimpleIcon,
    title: "Share one link",
    body: "Drop it in the group chat. People join, add a wishlist, and you see who's in at a glance.",
  },
  {
    icon: ShuffleIcon,
    title: "Draw names",
    body: "Draw now or pick a date. Everyone unwraps their match on their own phone.",
  },
];

const faqs = [
  {
    q: "Is Giftr free?",
    a: "Yes. Every exchange is free, with no ads and nothing to install.",
  },
  {
    q: "Does everyone need an account?",
    a: "Each person signs in once with Google, Facebook or a link sent to their email, so their match and wishlist stay private. There is no password to remember.",
  },
  {
    q: "Can the organizer see who drew whom?",
    a: "Not unless they turn that on in settings, and if they do, everyone in the exchange can see that it's on. The organizer still gets a secret match of their own.",
  },
  {
    q: "What if someone drops out after the draw?",
    a: "Take them off the list and Giftr patches the chain around them. Usually one other person gets a new match, and only the people whose match changed get an email.",
  },
  {
    q: "Can we keep couples or housemates apart?",
    a: "Yes. Group people into households and they will never draw each other. You can also block specific pairs, skip two person swaps, or make one big loop.",
  },
  {
    q: "Can we exchange with family in other cities?",
    a: "Choose shipped gifts when you set up the exchange. Each person adds a mailing address that only their Secret Santa can see.",
  },
  {
    q: "How do I know what to buy?",
    a: "Your giftee's wishlist sits right on your match page. If you still aren't sure, ask them anonymously and they can reply without ever learning it's you.",
  },
  {
    q: "Can everyone give two gifts?",
    a: "Pick the wild card format. Everyone gets a main match with a wishlist, plus a surprise match with its own smaller budget.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const at = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function StartButton({ href, className }: { href: string; className?: string }) {
  return (
    <Button asChild size="lg" className={className}>
      <Link href={href}>
        Start your exchange <ArrowRightIcon />
      </Link>
    </Button>
  );
}

export default async function LandingPage({ searchParams }: PageProps<"/">) {
  const user = await getCurrentUser();
  const start = user ? "/events/new" : "/sign-in?next=/events/new";
  const deleted = (await searchParams).deleted === "1";

  return (
    <div className="landing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {deleted ? (
        <div role="status" className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6">
          <p className="rounded-2xl border bg-card px-4 py-3 text-sm">
            Your account has been deleted. Thanks for using Giftr, and happy holidays.
          </p>
        </div>
      ) : null}

      <section className="relative isolate overflow-hidden">
        <Snowfall count={60} className="-z-10" />
        <Ornament className="left-[4%] sm:left-[8%]" length={24} />
        <Ornament className="left-[18%] hidden lg:flex" tone="gold" length={88} style={{ animationDelay: "-2s" }} />
        <Ornament className="right-[18%] hidden lg:flex" length={56} style={{ animationDelay: "-3s" }} />
        <Ornament className="right-[4%] sm:right-[8%]" tone="gold" length={40} style={{ animationDelay: "-1s" }} />

        <div className="mx-auto grid w-full max-w-6xl justify-items-center gap-6 px-4 pt-16 text-center sm:px-6 sm:pt-24">
          <p
            className="rise inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-semibold shadow-xs"
            style={at(0)}
          >
            <SparkleIcon className="size-4 text-gold" /> Free for every group, every year
          </p>
          <h1
            className="rise max-w-[680px] text-5xl font-bold tracking-tight text-hero sm:text-6xl"
            style={at(80)}
          >
            <span className="block">Secret Santa,</span>
            <span className="block">sorted in one link</span>
          </h1>
          <p className="rise max-w-[680px] text-lg text-muted-foreground" style={at(160)}>
            Send one link to your family, friends or team. Giftr draws names around your rules, shares wishlists, and
            keeps every match a secret, even from you.
          </p>
          <div className="rise grid justify-items-center gap-4" style={at(240)}>
            <StartButton href={start} />
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground [&_svg]:size-4 [&_svg]:text-success">
              <li className="flex items-center gap-2">
                <GiftIcon /> No ads, no fees
              </li>
              <li className="flex items-center gap-2">
                <DeviceMobileIcon /> Nothing to install
              </li>
              <li className="flex items-center gap-2">
                <LockIcon /> Matches stay private
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl px-4 pt-16 pb-24 sm:px-6">
          <HeroMockup />
        </div>
      </section>

      <section aria-labelledby="features" className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-24 sm:px-6">
        <InView className="reveal grid max-w-[680px] gap-4">
          <h2 id="features" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything a gift exchange needs,
            <br className="hidden sm:block" /> and nothing it doesn&apos;t
          </h2>
          <p className="text-lg text-muted-foreground">
            For families, friend groups and teams who want the fun part of Secret Santa without the admin.
          </p>
        </InView>
        <Bento />
      </section>

      <section aria-label="Why Giftr" className="mx-auto grid w-full max-w-6xl px-4 py-24 sm:px-6">
        <TaglineReveal
          lines={[
            "Send one link.",
            "Giftr draws the names",
            "and follows your rules.",
            "Every match stays secret",
            "until the paper comes off.",
          ]}
        />
      </section>

      <section id="how" aria-labelledby="how-title" className="scroll-mt-24">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-24 sm:px-6">
          <InView className="reveal grid max-w-[680px] gap-4">
            <h2 id="how-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
              Up and running in three steps
            </h2>
            <p className="text-lg text-muted-foreground">
              You set it up once. Giftr sends the reminders and keeps the secrets from there.
            </p>
          </InView>
          <InView as="ol" className="grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="reveal grid content-start gap-4 rounded-3xl border bg-card p-6 shadow-sm"
                style={at(i * 90)}
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                    <s.icon className="size-6" />
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-secondary font-mono text-sm font-semibold">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight">{s.title}</h3>
                <p className="text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </InView>
        </div>
      </section>

      <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_2fr]">
          <InView className="reveal grid content-start gap-4 lg:sticky lg:top-32 lg:self-start">
            <h2 id="faq-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
              Questions, answered
            </h2>
            <p className="text-lg text-muted-foreground">
              The things organizers ask before they send the link.
            </p>
          </InView>
          <InView as="dl" className="grid gap-4 sm:grid-cols-2">
            {faqs.map((f, i) => (
              <div
                key={f.q}
                className="reveal grid content-start gap-2 rounded-3xl border bg-card p-6"
                style={at((i % 2) * 90)}
              >
                <dt className="font-bold">{f.q}</dt>
                <dd className="text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </InView>
        </div>
      </section>

      <section aria-labelledby="cta-title" className="px-4 pt-12 pb-24 sm:px-6">
        <InView className="reveal relative isolate mx-auto grid w-full max-w-6xl justify-items-center gap-6 overflow-hidden rounded-3xl bg-primary px-6 py-24 text-center text-primary-foreground shadow-xl">
          <StarPattern id="cta-stars" className="-z-10 text-gold opacity-25" />
          <Snowfall count={28} seed={19} className="-z-10 [--flake:rgb(255_255_255/0.75)]" />
          <Ornament className="left-[10%] hidden sm:flex" tone="gold" length={48} />
          <Ornament className="right-[12%] hidden sm:flex" tone="gold" length={72} style={{ animationDelay: "-2s" }} />
          <h2 id="cta-title" className="max-w-[680px] text-3xl font-bold tracking-tight sm:text-5xl">
            This year, skip the hat
            <br className="hidden sm:block" /> full of paper scraps
          </h2>
          <p className="max-w-lg text-lg opacity-85">
            Set up your exchange in about a minute. It&apos;s free for every group, with no ads and nothing to install.
          </p>
          <StartButton
            href={start}
            className="bg-primary-foreground text-primary shadow-lg hover:bg-primary-foreground/90 hover:shadow-xl"
          />
        </InView>
      </section>
    </div>
  );
}
