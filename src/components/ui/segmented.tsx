"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: React.ReactNode; description?: React.ReactNode; icon?: React.ReactNode };

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
              "relative flex cursor-pointer flex-col gap-0.5 rounded-xl border bg-card px-3.5 py-3 text-left transition outline-none has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40",
              checked ? "border-primary bg-accent/50 shadow-[inset_0_0_0_1px_var(--primary)]" : "hover:bg-secondary/60",
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
            <span className="flex items-center gap-2 text-sm font-medium [&_svg]:size-4 [&_svg]:text-primary">
              {o.icon}
              {o.label}
            </span>
            {o.description ? <span className="text-[13px] text-muted-foreground">{o.description}</span> : null}
          </label>
        );
      })}
    </div>
  );
}
