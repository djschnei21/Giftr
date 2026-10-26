import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  CoffeeIcon,
  DetectiveIcon,
  LinkIcon,
  SealCheckIcon,
} from "@/components/icons";
import { InView } from "@/components/marketing/in-view";
import { UserAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

function BentoCard({
  title,
  body,
  visual,
  wide,
  index,
  className,
}: {
  title: string;
  body: string;
  visual: ReactNode;
  wide?: boolean;
  index: number;
  className?: string;
}) {
  return (
    <InView
      as="li"
      live
      className={cn("card-in grid gap-2 rounded-3xl border bg-card p-2 shadow-sm", wide && "md:grid-cols-[2fr_3fr]", className)}
      style={{ "--d": `${(index % 2) * 85}ms` } as CSSProperties}
    >
      <div
        aria-hidden
        className={cn(
          "relative flex min-h-56 items-center justify-center overflow-hidden rounded-2xl bg-secondary p-4",
          wide && "md:h-full md:min-h-64",
        )}
      >
        {visual}
      </div>
      <div className={cn("grid content-end gap-2 p-4", wide && "md:order-first")}>
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        <p className="text-muted-foreground">{body}</p>
      </div>
    </InView>
  );
}

const joins = [
  { name: "Jim Porter", detail: "Added four wishlist ideas" },
  { name: "Dan Walsh", detail: "Signed in with Google" },
  { name: "Mel Ridley", detail: "Tapped the group chat link" },
  { name: "Dylan Hart", detail: "Signed in with his email" },
];

function JoinStack() {
  return (
    <div className="relative h-46 w-full max-w-72 overflow-hidden">
      {joins.map((j, slot) => (
        <div
          key={j.name}
          className="join-row story absolute inset-x-0 top-0 flex h-14 items-center gap-3 rounded-xl bg-card px-3 shadow-sm"
          style={{ "--slot": slot } as CSSProperties}
        >
          <UserAvatar name={j.name} className="size-8 rounded-lg text-xs ring-0" />
          <span className="grid min-w-0 flex-1">
            <span className="truncate text-sm font-semibold">{j.name.split(" ")[0]} joined</span>
            <span className="truncate text-xs text-muted-foreground">{j.detail}</span>
          </span>
          <CheckIcon className="size-4 text-success" />
        </div>
      ))}
    </div>
  );
}

const rules = ["Keep couples apart", "Block specific pairs", "No pair swaps"];

function RuleCheck() {
  return (
    <div className="grid w-full max-w-64 gap-2">
      {rules.map((rule, i) => (
        <div key={rule} className="flex h-10 items-center gap-3 rounded-xl bg-card px-3 text-sm font-semibold shadow-sm">
          <span className="relative size-5 shrink-0 rounded-full border-2">
            <span
              className="rule-check story absolute -inset-0.5 flex items-center justify-center rounded-full bg-success text-white"
              style={delay(i * 0.45)}
            >
              <CheckIcon className="size-3" />
            </span>
          </span>
          {rule}
        </div>
      ))}
      <p className="rule-ok story mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-success">
        <SealCheckIcon className="size-4" /> Works for all 6 people
      </p>
    </div>
  );
}

function Unwrap() {
  return (
    <div className="gift-box story relative h-44 w-36">
      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <div className="gift-tag story flex items-center gap-2 rounded-xl bg-card py-2 pr-3 pl-2 shadow-lg">
          <UserAvatar name="Chris Dean" className="size-6 rounded-md text-xs ring-0" />
          <span className="text-sm font-bold">Chris</span>
        </div>
      </div>
      <div className="absolute inset-x-3 bottom-0 z-10 h-20 rounded-lg bg-primary shadow-md">
        <span className="absolute inset-y-0 left-1/2 -ml-1.5 w-3 bg-gold" />
      </div>
      <div className="absolute inset-x-1 bottom-19 z-20">
        <div className="gift-lid story relative h-7 origin-bottom-left rounded-md bg-primary shadow-sm">
          <span className="absolute inset-y-0 left-1/2 -ml-1.5 w-3 bg-gold" />
          <svg viewBox="0 0 40 16" className="absolute bottom-full left-1/2 -mb-px w-10 -translate-x-1/2">
            <path d="M20 16c-3-8-12-12-15-7-2 4 4 8 15 7Zm0 0c3-8 12-12 15-7 2 4-4 8-15 7Z" className="fill-gold" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function AnonymousChat() {
  const santa = "max-w-4/5 justify-self-end rounded-2xl rounded-br-md bg-primary px-3 py-2 text-primary-foreground";
  return (
    <div className="grid w-full max-w-80 gap-2 text-sm">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <DetectiveIcon className="size-4" /> Chris sees you as Your Secret Santa
      </p>
      <p className={cn("chat-1 story", santa)}>Is your morning more coffee or tea?</p>
      <div className="relative grid">
        <p className="chat-2 story max-w-4/5 justify-self-start rounded-2xl rounded-bl-md bg-card px-3 py-2 shadow-sm">
          Tea, always. Green if you can find it
        </p>
        <span className="chat-typing story absolute top-0 left-0 flex h-9 items-center gap-1 rounded-2xl rounded-bl-md bg-card px-3 shadow-sm">
          {[0, 1, 2].map((i) => (
            <span key={i} className="typing-dot story size-1.5 rounded-full bg-muted-foreground" style={delay(i * 0.15)} />
          ))}
        </span>
      </div>
      <p className={cn("chat-3 story", santa)}>Noted. No more questions, promise.</p>
    </div>
  );
}

function LinkPreview() {
  return (
    <div className="grid w-full max-w-80 gap-3">
      <div className="flex h-10 items-center gap-2 rounded-xl border bg-card px-3 shadow-sm">
        <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="relative font-mono text-xs">
          <span className="url-text story block whitespace-nowrap">amazon.com/dp/B0CK7TLX4Q</span>
          <span className="url-caret story absolute inset-y-0 left-0 flex items-center">
            <span className="caret-blink block h-4 w-px bg-primary" />
          </span>
        </span>
      </div>
      <div className="product story flex items-center gap-3 rounded-xl bg-card p-2 shadow-sm">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold-foreground">
          <CoffeeIcon className="size-6" />
        </span>
        <span className="grid min-w-0 flex-1 gap-1">
          <span className="truncate text-sm font-semibold">Pour over kettle</span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">$34.99</span> from the link
          </span>
        </span>
      </div>
    </div>
  );
}

function Person({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex w-9 flex-col items-center gap-1", className)}>
      <UserAvatar name={name} className="size-9 text-xs ring-0" />
      <span className="text-xs font-semibold whitespace-nowrap">{name.split(" ")[0]}</span>
    </span>
  );
}

function Arrow({ className }: { className?: string }) {
  return <ArrowRightIcon className={cn("mb-5 size-6 shrink-0 text-muted-foreground", className)} />;
}

function ChainPatch() {
  return (
    <div className="grid justify-items-center gap-6">
      <div className="relative pt-10">
        <svg viewBox="0 0 264 40" width="264" height="40" fill="none" className="absolute top-0 left-0">
          <path
            d="M18 38C18 6 170 6 170 38"
            pathLength={1}
            strokeWidth={2}
            className="chain-arc story stroke-primary"
          />
          <path
            d="M164 32l6 6 6-6"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="chain-note story stroke-primary"
          />
        </svg>
        <div className="flex items-center gap-2">
          <Person name="Shannon Ross" />
          <Arrow className="chain-fade story" />
          <Person name="Mel Ridley" className="chain-leave story" />
          <Arrow className="chain-fade story" />
          <Person name="Chris Dean" />
          <Arrow />
          <Person name="Dylan Hart" />
        </div>
      </div>
      <p className="chain-note story rounded-md bg-card px-2 py-1 text-xs font-semibold shadow-sm">
        Mel left. Only Shannon gets a new match.
      </p>
    </div>
  );
}

export function Bento() {
  return (
    <ul className="grid gap-4 md:grid-cols-6">
      <BentoCard
        index={0}
        wide
        className="md:col-span-4"
        title="Everyone joins from one link"
        body="Drop it in the group chat. It unfurls into a proper invite, and people join with Google, Facebook or their email. No passwords, no app to install."
        visual={<JoinStack />}
      />
      <BentoCard
        index={1}
        className="md:col-span-2"
        title="A draw that follows your rules"
        body="Keep couples apart, block pairs, or skip two person swaps. If the rules can't work, Giftr says why."
        visual={<RuleCheck />}
      />
      <BentoCard
        index={0}
        className="md:col-span-2"
        title="Unwrap it on your own phone"
        body="Everyone opens their match privately. The organizer can't peek unless they say so up front."
        visual={<Unwrap />}
      />
      <BentoCard
        index={1}
        wide
        className="md:col-span-4"
        title="Ask without giving yourself away"
        body="Not sure about sizes or tastes? Message your giftee anonymously. They can reply, and your name never shows."
        visual={<AnonymousChat />}
      />
      <BentoCard
        index={0}
        className="md:col-span-3"
        title="Wishlists that fill themselves in"
        body="Paste a store link and Giftr adds the name, photo and price. Santas quietly tick off what they've bought."
        visual={<LinkPreview />}
      />
      <BentoCard
        index={1}
        className="md:col-span-3"
        title="Changes without a full redraw"
        body="Someone drops out or joins late? Giftr patches the chain so only one person's match changes."
        visual={<ChainPatch />}
      />
    </ul>
  );
}
