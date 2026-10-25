"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Option<T extends string> = {
  value: T;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
};

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  name,
  disabled,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  name: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div role="radiogroup" className={cn("grid gap-2", options.length === 2 && "grid-cols-2", className)}>
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <label
            key={o.value}
            className={cn(
              "relative flex cursor-pointer flex-col gap-1 rounded-xl border bg-card px-4 py-3 text-left transition outline-none active:scale-[0.98] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring/30",
              checked ? "border-primary bg-accent shadow-[inset_0_0_0_1px_var(--primary)]" : "hover:border-muted-foreground/40 hover:bg-secondary/60",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-primary">
              {o.icon}
              <span className="min-w-0 break-words">{o.label}</span>
            </span>
            {o.description ? (
              <span className="text-xs break-words text-muted-foreground">{o.description}</span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}
