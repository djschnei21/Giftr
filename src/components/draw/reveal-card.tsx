"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRightIcon, GiftIcon, MessageCircleIcon } from "lucide-react";
import { markMatchViewed } from "@/server/actions/draw";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { firstName } from "@/lib/utils";

const confettiColors = ["var(--primary)", "var(--berry)", "var(--gold)", "oklch(0.8 0.1 160)", "oklch(0.85 0.1 80)"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const angle = (i / 36) * Math.PI * 2 + (i % 3) * 0.2;
        const distance = 90 + ((i * 37) % 80);
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 40,
          rotate: (i * 47) % 360,
          color: confettiColors[i % confettiColors.length],
          delay: (i % 6) * 0.015,
          round: i % 4 === 0,
        };
      }),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className={p.round ? "absolute size-2 rounded-full" : "absolute h-3 w-1.5 rounded-sm"}
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 90], opacity: [1, 1, 0], rotate: p.rotate + 180, scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut", delay: p.delay }}
        />
      ))}
    </div>
  );
}

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
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/70 via-transparent to-gold/10" />
      <CardContent className="relative grid min-h-64 place-items-center py-10 text-center">
        <AnimatePresence mode="wait" initial={false}>
          {!revealed ? (
            <motion.div
              key="wrapped"
              className="grid justify-items-center gap-5"
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.15, rotate: -4 }}
              transition={{ duration: 0.35 }}
            >
              {changed ? (
                <p className="rounded-full bg-gold/15 px-3 py-1 text-xs font-medium">The group changed — you have a new match</p>
              ) : null}
              <motion.button
                type="button"
                onClick={unwrap}
                aria-label="Unwrap your match"
                className="group relative cursor-pointer rounded-3xl focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none"
                whileHover={reduceMotion ? undefined : { rotate: [0, -3, 3, -2, 0], transition: { duration: 0.5 } }}
                whileTap={{ scale: 0.96 }}
              >
                <span className="relative block size-32">
                  <span className="absolute inset-x-2 top-9 bottom-0 rounded-2xl bg-berry shadow-lg" />
                  <span className="absolute inset-x-0 top-5 h-8 rounded-xl bg-berry shadow-md brightness-110 transition-transform group-hover:-translate-y-1" />
                  <span className="absolute inset-y-5 left-1/2 w-5 -translate-x-1/2 rounded-sm bg-gold" />
                  <span className="absolute top-0 left-1/2 flex -translate-x-1/2 gap-0.5">
                    <span className="size-6 rotate-[-30deg] rounded-full border-[5px] border-gold" />
                    <span className="size-6 rotate-[30deg] rounded-full border-[5px] border-gold" />
                  </span>
                </span>
              </motion.button>
              <div className="grid gap-1">
                <p className="font-display text-2xl font-semibold">Your match is ready</p>
                <p className="text-sm text-muted-foreground">Tap the present to see who you&apos;re shopping for.</p>
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
              <UserAvatar name={giftee.name} image={giftee.image} className="size-20 text-2xl ring-4" />
              <div className="grid gap-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-display text-3xl font-semibold" data-testid="giftee-name">
                  {giftee.name}
                </p>
                <p className="text-xs text-muted-foreground">Shh — only you can see this.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link href={`/events/${eventId}/match`}>
                    <GiftIcon /> {cta === "wishlist" ? `See ${first}'s wishlist` : "See the details"} <ArrowRightIcon />
                  </Link>
                </Button>
                {cta === "wishlist" ? (
                  <Button asChild variant="outline">
                    <Link href={`/events/${eventId}/match#chat`}>
                      <MessageCircleIcon /> Ask anonymously
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
