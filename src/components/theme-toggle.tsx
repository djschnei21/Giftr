"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", icon: SunIcon },
  { value: "system", icon: MonitorIcon },
  { value: "dark", icon: MoonIcon },
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
    <div role="group" aria-label="Theme" className={cn("inline-flex rounded-full border bg-card p-0.5", className)}>
      {options.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={`${value} theme`}
          aria-pressed={mounted && theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-muted-foreground transition outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
            mounted && theme === value && "bg-secondary text-foreground",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
