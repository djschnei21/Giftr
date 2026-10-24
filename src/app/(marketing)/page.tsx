import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  EyeOffIcon,
  HeartIcon,
  LinkIcon,
  MessageCircleIcon,
  SparklesIcon,
  WandSparklesIcon,
  ShuffleIcon,
  VenetianMaskIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteCard } from "@/components/events/invite-card";
import { getCurrentUser } from "@/lib/authz";

export const metadata: Metadata = {
  title: { absolute: "Giftr — Secret Santa, beautifully simple" },
  alternates: { canonical: "/" },
};

const features = [
  {
    icon: LinkIcon,
    title: "Join in one tap",
    body: "Drop one link in the group chat. It shows a proper preview card, and people join with Google, Facebook, or their email — no new password.",
  },
  {
    icon: ShuffleIcon,
    title: "A smarter draw",
    body: "Keep couples and housemates apart, block specific pairs, skip two-person swaps, or make one big loop. If it can't work, Giftr tells you exactly why.",
  },
  {
    icon: WandSparklesIcon,
    title: "Painless changes",
    body: "Someone drops out or joins late? Giftr patches the chain so only one person's match changes — no awkward full redraw.",
  },
  {
    icon: EyeOffIcon,
    title: "Real secrecy",
    body: "Organizers can't peek at matches unless they turn that on, and if they do, everyone can see it's on.",
  },
  {
    icon: VenetianMaskIcon,
    title: "Ask anonymously",
    body: "Not sure about sizes? Message your giftee without giving yourself away. They can reply, and your name never shows.",
  },
  {
    icon: HeartIcon,
    title: "Wishlists that help",
    body: "Paste a link and Giftr fills in the title, picture and price. Add sizes, likes and no-gos, and quietly tick off what you've bought.",
  },
];

const steps = [
  { title: "Create your exchange", body: "Pick a date and budget, and set any rules. It takes about a minute." },
  { title: "Share the link", body: "Everyone joins and adds a wishlist. You'll see who's in at a glance." },
  { title: "Draw names", body: "Tap Draw now (or schedule it). Everyone unwraps their match on their own phone." },
];

export default async function LandingPage({ searchParams }: PageProps<"/">) {
  const user = await getCurrentUser();
  const start = user ? "/events/new" : "/sign-in?next=/events/new";
  const deleted = (await searchParams).deleted === "1";

  return (
    <>
      {deleted ? (
        <div role="status" className="mx-auto mt-2 w-full max-w-6xl px-4 sm:px-6">
          <p className="rounded-2xl border bg-card px-4 py-3 text-sm">
            Your account has been deleted. Thanks for using Giftr — happy holidays.
          </p>
        </div>
      ) : null}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_70%_-10%,var(--accent),transparent)]" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20 lg:pb-28">
          <div className="grid gap-6">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <SparklesIcon className="size-3.5 text-gold" /> Free, no ads, no spreadsheets
            </p>
            <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              Secret Santa, <span className="text-primary">beautifully simple.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Invite everyone with one link, share wishlists, set the rules, and let Giftr draw names. Everyone finds out
              who they&apos;re shopping for — and nobody else does.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={start}>
                  Start an exchange <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#how-it-works">How it works</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto mb-20 w-full max-w-sm lg:max-w-md" aria-hidden>
            <InviteCard
              className="rotate-[-2deg]"
              data={{
                name: "Friendsmas 2026",
                organizerName: "Maya",
                exchangeDate: "2026-12-19",
                exchangeType: "in_person",
                location: "Maya's place",
                budgetMin: 25,
                budgetMax: 40,
                currency: "USD",
                participantCount: 8,
              }}
            />
            <div className="absolute -bottom-20 -left-4 w-56 rotate-[3deg] rounded-2xl border bg-card p-4 shadow-[0_12px_40px_rgb(0_0_0/0.12)] sm:-left-10">
              <p className="text-xs text-muted-foreground">You&apos;re Secret Santa for</p>
              <p className="font-display text-2xl font-semibold">Jordan</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <HeartIcon className="size-3.5 text-berry" /> 6 wishlist ideas
              </p>
            </div>
            <div className="absolute -right-2 -bottom-24 max-w-52 rotate-[-1deg] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-lg sm:-right-6">
              <span className="mb-0.5 flex items-center gap-1 text-[11px] opacity-80">
                <MessageCircleIcon className="size-3" /> Your Secret Santa
              </span>
              Medium or large for the sweater?
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-card/50">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 sm:px-6">
          <div className="grid max-w-2xl gap-3">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Everything a gift exchange needs</h2>
            <p className="text-muted-foreground">And nothing it doesn&apos;t.</p>
          </div>
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li key={f.title} className="grid content-start gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 sm:px-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Up and running in three steps</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="grid content-start gap-3 rounded-3xl border bg-card p-6">
                <span className="font-display text-4xl font-semibold text-primary">{i + 1}</span>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto grid w-full max-w-6xl justify-items-center gap-5 overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_50%_120%,color-mix(in_oklch,var(--gold),transparent_70%),transparent)]" />
          <h2 className="relative font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            This year, skip the hat full of paper scraps.
          </h2>
          <p className="relative max-w-lg opacity-85">Set up your exchange in a minute. It&apos;s free.</p>
          <Button asChild size="lg" variant="secondary" className="relative">
            <Link href={start}>
              Start an exchange <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
