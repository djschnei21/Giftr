"use client";

import { useTransition } from "react";
import { setHoliday } from "@/server/actions/holiday";
import type { Holiday } from "@/lib/holiday";
import { cn } from "@/lib/utils";
import { useHoliday } from "./holiday-provider";

const options = [
  { value: "christmas", label: "Christmas" },
  { value: "hanukkah", label: "Hanukkah" },
] as const satisfies readonly { value: Holiday; label: string }[];

export function HolidayToggle({ className }: { className?: string }) {
  const holiday = useHoliday();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label="Holiday"
      className={cn("inline-grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1", className)}
    >
      {options.map(({ value, label }) => {
        const active = holiday === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            disabled={pending}
            onClick={() => {
              if (active) return;
              startTransition(async () => {
                await setHoliday(value);
              });
            }}
            className={cn(
              "h-7 cursor-pointer rounded-md px-3 text-xs font-semibold text-muted-foreground transition outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.98] disabled:opacity-70",
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
