"use client";

import { useSyncExternalStore } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";

function subscribe(cb: () => void) {
  const t = setInterval(cb, 60_000);
  return () => clearInterval(t);
}

export function Countdown({ date }: { date: string }) {
  const days = useSyncExternalStore(
    subscribe,
    () => differenceInCalendarDays(parseISO(date), new Date()),
    () => null,
  );

  if (days === null) return <div className="h-[72px]" aria-hidden />;
  if (days < 0) return null;

  return (
    <div className="flex items-baseline gap-2" aria-live="polite">
      {days === 0 ? (
        <span className="font-display text-5xl font-semibold text-berry">Today!</span>
      ) : (
        <>
          <span className="font-display text-6xl leading-none font-semibold tabular-nums">{days}</span>
          <span className="text-sm text-muted-foreground">{days === 1 ? "day to go" : "days to go"}</span>
        </>
      )}
    </div>
  );
}
