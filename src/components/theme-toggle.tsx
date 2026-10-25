"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
] as const;

const noopSubscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  return (
    <div role="group" aria-label="Theme" className={cn("inline-grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1", className)}>
      {options.map(({ value, label }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              "h-7 cursor-pointer rounded-md px-3 text-xs font-semibold text-muted-foreground transition outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.98]",
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
