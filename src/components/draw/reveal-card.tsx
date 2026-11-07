"use client";

import { useMemo, useState, useTransition, type CSSProperties } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRightIcon, ChatCircleIcon, GiftIcon } from "@/components/icons";
import { markMatchViewed } from "@/server/actions/draw";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Snowfall, StringLights, TwinkleStar } from "@/components/festive";
import { firstName } from "@/lib/utils";

const confettiColors = ["#e0303f", "#f2b632", "#2fa86a", "#fff1c9", "#ffffff"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => {
        const angle = (i / 48) * Math.PI * 2 + (i % 3) * 0.2;
        const distance = 100 + ((i * 37) % 90);
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 40,
          rotate: (i * 47) % 360,
          color: confettiColors[i % confettiColors.length],
          delay: (i % 6) * 0.015,
          shape: (["star", "dot", "ribbon", "ribbon"] as const)[i % 4],
        };
      }),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className={
            p.shape === "dot"
              ? "absolute size-2 rounded-full"
              : p.shape === "ribbon"
                ? "absolute h-3 w-1.5 rounded-sm"
                : "absolute size-3.5 [clip-path:polygon(50%_0,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]"
          }
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 90], opacity: [1, 1, 0], rotate: p.rotate + 180, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.32, 0.72, 0, 1], delay: p.delay }}
        />
      ))}
    </div>
  );
}

const sparkles = [
  { className: "top-6 left-[12%] size-4", tw: "0s" },
  { className: "top-12 right-[14%] size-3", tw: "-0.7s" },
  { className: "bottom-10 left-[18%] size-3", tw: "-1.3s" },
  { className: "right-[20%] bottom-16 size-5", tw: "-1.9s" },
];

export function RevealCard({
  eventId,
  giftee,
  alreadyViewed,
  changed,
  label = "You're Secret Santa for",
  cta = "wishlist",
}: {
  eventId: string;
  giftee: { name: string; image: string | null };
  alreadyViewed: boolean;
  changed: boolean;
  /** What to call this gift once it's unwrapped. */
  label?: string;
  /** Wildcard gifts have no wishlist to link to, just the match page. */
  cta?: "wishlist" | "match";
}) {
  const reduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(alreadyViewed);
  const [celebrate, setCelebrate] = useState(false);
  const [, startTransition] = useTransition();
  const first = firstName(giftee.name);

  function unwrap() {
    setRevealed(true);
    if (!reduceMotion) setCelebrate(true);
    startTransition(async () => {
      await markMatchViewed(eventId);
    });
  }

  return (
    <Card className="relative overflow-hidden bg-night bg-linear-to-b from-[#0e2a20] via-[#123528] to-[#1d1230] text-[#f6f0e4] shadow-lg ring-1 ring-gold/30">
      <StringLights className="-top-3 z-0" />
      <Snowfall count={28} seed={11} className="[--flake:rgb(255_255_255/0.85)]" />
      {sparkles.map((s) => (
        <TwinkleStar
          key={s.className}
          className={`absolute ${s.className}`}
          style={{ "--tw": s.tw } as CSSProperties}
        />
      ))}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-10 rounded-[50%_50%_0_0/100%_100%_0_0] bg-white/10" />
      <CardContent className="relative grid min-h-96 place-items-center py-12 text-center">
        <AnimatePresence mode="wait" initial={false}>
          {!revealed ? (
            <motion.div
              key="wrapped"
              className="grid justify-items-center gap-6"
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.15, rotate: -4, filter: "blur(8px)" }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              {changed ? (
                <p className="rounded-md bg-gold/20 px-2 py-1 text-xs font-semibold text-[#ffe2a8]">
                  The group changed, so you have a new match
                </p>
              ) : null}
              <motion.button
                type="button"
                onClick={unwrap}
                aria-label="Unwrap your match"
                className="group relative cursor-pointer rounded-3xl focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none"
                whileHover={reduceMotion ? undefined : { rotate: [0, -3, 3, -2, 0], transition: { duration: 0.5 } }}
                whileTap={{ scale: 0.96 }}
              >
                <span className="jingle relative block size-40">
                  <span className="absolute inset-x-4 bottom-0 h-3 translate-y-2 rounded-[50%] bg-black/30 blur-sm" />
                  <span className="wrapping-paper absolute inset-x-3 top-14 bottom-0 rounded-2xl shadow-xl" />
                  <span className="wrapping-paper absolute inset-x-0 top-9 h-9 rounded-xl shadow-lg brightness-110 transition-transform duration-500 group-hover:-translate-y-3 group-hover:-rotate-3" />
                  <span className="absolute top-14 bottom-0 left-1/2 w-6 -translate-x-1/2 bg-linear-to-r from-gold-foreground via-gold to-gold-foreground" />
                  <span className="absolute top-9 left-1/2 h-9 w-6 -translate-x-1/2 bg-linear-to-r from-gold-foreground via-gold to-gold-foreground transition-transform duration-500 group-hover:-translate-y-3" />
                  <span className="absolute top-0 left-1/2 flex -translate-x-1/2 gap-0.5 transition-transform duration-500 group-hover:-translate-y-4">
                    <span className="size-9 -rotate-45 rounded-full border-[5px] border-gold shadow-sm" />
                    <span className="size-9 rotate-45 rounded-full border-[5px] border-gold shadow-sm" />
                  </span>
                  <span className="sway absolute top-20 -right-6 flex origin-top-left flex-col items-start">
                    <span className="ml-1 h-4 w-px bg-[#ffe2a8]/70" />
                    <span className="rounded-md bg-[#fffaf2] px-2 py-1 font-script text-sm leading-none text-primary shadow-md">
                      To: You
                    </span>
                  </span>
                </span>
              </motion.button>
              <div className="grid gap-1">
                <p aria-hidden className="font-script text-2xl text-[#ffe2a8]">
                  Santa left something under the tree…
                </p>
                <p className="font-display text-4xl">Your match is ready</p>
                <p className="text-sm text-white/75">Tap the present to see who you&apos;re shopping for.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              className="grid justify-items-center gap-4"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: alreadyViewed ? 0 : 0.1 }}
            >
              {celebrate ? <Confetti /> : null}
              <span className="relative">
                <UserAvatar
                  name={giftee.name}
                  image={giftee.image}
                  className="size-24 rounded-full text-3xl ring-4 ring-gold shadow-[0_0_40px_-4px_var(--gold)]"
                />
                <span aria-hidden className="absolute -top-5 -left-4 -rotate-[24deg]">
                  <svg viewBox="0 0 48 32" className="h-9 w-auto">
                    <path d="M4 26C8 10 22 2 38 8l-4 18Z" fill="#d22f3b" />
                    <rect x="0" y="22" width="40" height="8" rx="4" fill="#fffaf2" />
                    <circle cx="40" cy="8" r="5" fill="#fffaf2" />
                  </svg>
                </span>
              </span>
              <div className="grid gap-1">
                <p className="font-script text-2xl text-[#ffe2a8]">{label}</p>
                <p className="font-display text-5xl" data-testid="giftee-name">
                  {giftee.name}
                </p>
                <p className="text-xs text-white/75">Shh. Only you can see this.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link href={`/events/${eventId}/match`}>
                    <GiftIcon /> {cta === "wishlist" ? `See ${first}'s wishlist` : "See the details"} <ArrowRightIcon />
                  </Link>
                </Button>
                {cta === "wishlist" ? (
                  <Button asChild variant="outline" className="text-foreground">
                    <Link href={`/events/${eventId}/match#chat`}>
                      <ChatCircleIcon /> Ask anonymously
                    </Link>
                  </Button>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
