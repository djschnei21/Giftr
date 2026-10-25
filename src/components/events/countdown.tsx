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

  if (days === null) return <div className="h-16" aria-hidden />;
  if (days < 0) return null;

  return (
    <div className="flex items-baseline gap-2" aria-live="polite">
      {days === 0 ? (
        <span className="font-display text-5xl text-primary">Today</span>
      ) : (
        <>
          <span className="font-display text-6xl tabular-nums">{days}</span>
          <span className="text-sm font-medium text-muted-foreground">{days === 1 ? "day to go" : "days to go"}</span>
        </>
      )}
    </div>
  );
}
