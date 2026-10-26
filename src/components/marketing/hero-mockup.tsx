import type { CSSProperties, ReactNode } from "react";
import {
  CalendarBlankIcon,
  CheckCircleIcon,
  DetectiveIcon,
  GiftIcon,
  MapPinIcon,
  PaperPlaneRightIcon,
  ShoppingBagIcon,
  WalletIcon,
} from "@/components/icons";
import { LogoMark } from "@/components/logo";
import { Snowfall, StarPattern } from "@/components/festive";
import { AvatarStack, UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const people = ["Shannon Ross", "Chris Dean", "Mel Ridley", "Dan Walsh", "Jim Porter", "Dylan Hart"];

const roster = [
  { name: "Shannon Ross", note: "Organizer", done: true },
  { name: "Mel Ridley", note: "Wishlist ready", done: true },
  { name: "Dan Walsh", note: "Gift bought", done: true },
  { name: "Jim Porter", note: "Still deciding", done: false },
];

const wishes = [
  { title: "Chunky knit sweater", note: "Size L, not orange" },
  { title: "Pour over kettle", note: "Matte black" },
  { title: "A mystery novel", note: "Surprise me" },
];

/** Staggers a mockup element's load by `ms`. */
const at = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function Fact({ icon, children, delay }: { icon: ReactNode; children: ReactNode; delay: number }) {
  return (
    <li className="m-left flex items-center gap-2 text-sm [&_svg]:size-4 [&_svg]:text-muted-foreground" style={at(delay)}>
      {icon}
      {children}
    </li>
  );
}

/** A still of a drawn exchange: the organizer's roster, your match, and the anonymous chat. */
export function HeroMockup({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Preview of a Giftr exchange called Friendsmas 2026: six people have joined, your match is Chris, and you are chatting with Chris anonymously."
      className={cn("rounded-3xl border bg-card/70 p-2 shadow-2xl backdrop-blur-sm", className)}
    >
      <div className="grid gap-4 rounded-2xl border bg-background p-4">
        <div className="flex items-center gap-3">
          <span className="m-pop flex" style={at(500)}>
            <LogoMark className="size-6" />
          </span>
          <span className="m-up min-w-0 truncate text-sm font-bold" style={at(560)}>
            Friendsmas 2026
          </span>
          <Badge variant="secondary" className="m-pop hidden text-success sm:inline-flex" style={at(620)}>
            <CheckCircleIcon /> Names drawn
          </Badge>
          <span className="m-pop ml-auto hidden sm:flex" style={at(680)}>
            <AvatarStack people={people.map((name) => ({ id: name, name }))} max={4} />
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1.15fr_1fr]">
          <div className="hidden content-start gap-4 rounded-xl border bg-card p-4 md:grid">
            <ul className="grid gap-2">
              <Fact icon={<CalendarBlankIcon />} delay={760}>
                Saturday, Dec 19
              </Fact>
              <Fact icon={<MapPinIcon />} delay={800}>
                Shannon&apos;s place
              </Fact>
              <Fact icon={<WalletIcon />} delay={840}>
                $25 to $40
              </Fact>
            </ul>
            <div className="h-px bg-border" />
            <p className="m-up text-xs font-semibold text-muted-foreground" style={at(900)}>
              6 people joined
            </p>
            <ul className="grid gap-3">
              {roster.map((p, i) => (
                <li key={p.name} className="m-left flex items-center gap-3" style={at(960 + i * 60)}>
                  <UserAvatar name={p.name} className="size-8 rounded-lg text-xs" />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-sm font-semibold">{p.name.split(" ")[0]}</span>
                    <span className="truncate text-xs text-muted-foreground">{p.note}</span>
                  </span>
                  <CheckCircleIcon
                    weight={p.done ? "fill" : "bold"}
                    className={cn("size-4", p.done ? "text-success" : "text-border")}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className="relative isolate grid content-start gap-4 overflow-hidden rounded-xl bg-primary p-4 text-primary-foreground sm:p-6">
            <StarPattern id="hero-mockup-stars" className="-z-10 text-gold opacity-25" />
            <Snowfall count={14} seed={23} className="-z-10 [--flake:rgb(255_255_255/0.75)]" />
            <div className="m-up grid justify-items-center gap-2 text-center" style={at(1000)}>
              <span className="text-sm opacity-80">You&apos;re Secret Santa for</span>
              <UserAvatar name="Chris Dean" className="size-14 rounded-2xl text-lg ring-4 ring-gold/60" />
              <span className="text-3xl font-bold tracking-tight">Chris</span>
              <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold">$25 to $40</span>
            </div>
            <ul className="grid gap-2">
              {wishes.map((w, i) => (
                <li
                  key={w.title}
                  className="m-up flex items-center gap-3 rounded-lg bg-white/10 p-2"
                  style={at(1240 + i * 70)}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/15">
                    {i === 1 ? <ShoppingBagIcon className="size-4" /> : <GiftIcon className="size-4" />}
                  </span>
                  <span className="grid min-w-0">
                    <span className="truncate text-sm font-semibold">{w.title}</span>
                    <span className="truncate text-xs opacity-75">{w.note}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-rows-[auto_1fr_auto] gap-4 rounded-xl border bg-card p-4">
            <div className="m-up flex items-center gap-3" style={at(1180)}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <DetectiveIcon className="size-4" />
              </span>
              <span className="grid min-w-0">
                <span className="truncate text-sm font-semibold">Ask Chris</span>
                <span className="truncate text-xs text-muted-foreground">Your name stays hidden</span>
              </span>
            </div>
            <div className="grid content-end gap-2 text-sm">
              <p
                className="m-up max-w-4/5 justify-self-end rounded-2xl rounded-br-md bg-primary px-3 py-2 text-primary-foreground"
                style={at(1460)}
              >
                Medium or large for the sweater?
              </p>
              <p className="m-up max-w-4/5 rounded-2xl rounded-bl-md bg-secondary px-3 py-2" style={at(1640)}>
                Large please, and anything but orange
              </p>
              <p
                className="m-up max-w-4/5 justify-self-end rounded-2xl rounded-br-md bg-primary px-3 py-2 text-primary-foreground"
                style={at(1820)}
              >
                Noted. No orange.
              </p>
            </div>
            <div className="m-up flex items-center gap-2" style={at(1960)}>
              <span className="flex h-9 flex-1 items-center rounded-lg bg-secondary px-3 text-sm text-muted-foreground">
                Write a message
              </span>
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <PaperPlaneRightIcon className="size-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
