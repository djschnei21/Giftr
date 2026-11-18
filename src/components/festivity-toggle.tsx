"use client";

import { useSyncExternalStore } from "react";
import {
  FESTIVITY_LEVELS,
  readFestivity,
  setFestivity,
  subscribeFestivity,
  type FestivityLevel,
} from "@/components/festivity";
import { cn } from "@/lib/utils";

const options: { value: FestivityLevel; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const noopSubscribe = () => () => {};

export function FestivityToggle({ className }: { className?: string }) {
  const level = useSyncExternalStore(subscribeFestivity, readFestivity, () => "high" as const);
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const key = event.key;
    if (
      key !== "ArrowRight" &&
      key !== "ArrowLeft" &&
      key !== "ArrowUp" &&
      key !== "ArrowDown" &&
      key !== "Home" &&
      key !== "End"
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const current = Math.max(0, FESTIVITY_LEVELS.indexOf(level));
    const next =
      key === "Home"
        ? 0
        : key === "End"
          ? FESTIVITY_LEVELS.length - 1
          : key === "ArrowRight" || key === "ArrowDown"
            ? (current + 1) % FESTIVITY_LEVELS.length
            : (current - 1 + FESTIVITY_LEVELS.length) % FESTIVITY_LEVELS.length;
    setFestivity(FESTIVITY_LEVELS[next]);
    event.currentTarget.querySelectorAll("button")[next]?.focus();
  }

  return (
    <div
      role="group"
      aria-label="Festivities"
      onKeyDown={onKeyDown}
      className={cn("inline-grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1", className)}
    >
      {options.map(({ value, label }) => {
        const active = mounted && level === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => setFestivity(value)}
            className={cn(
              "h-7 cursor-pointer rounded-md px-2 text-xs font-semibold whitespace-nowrap text-muted-foreground transition outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.98]",
              active && "bg-card text-foreground shadow-sm",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
