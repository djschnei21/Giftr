"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn, initials } from "@/lib/utils";

const palette = [
  "bg-[oklch(0.9_0.05_160)] text-[oklch(0.35_0.08_160)]",
  "bg-[oklch(0.9_0.05_15)] text-[oklch(0.4_0.12_15)]",
  "bg-[oklch(0.92_0.06_80)] text-[oklch(0.42_0.09_70)]",
  "bg-[oklch(0.9_0.04_250)] text-[oklch(0.4_0.09_250)]",
  "bg-[oklch(0.9_0.05_300)] text-[oklch(0.4_0.1_300)]",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function UserAvatar({
  name,
  image,
  className,
}: {
  name: string | null | undefined;
  image?: string | null;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn("relative flex size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-background", className)}
    >
      {image ? <AvatarPrimitive.Image src={image} alt="" className="aspect-square size-full object-cover" /> : null}
      <AvatarPrimitive.Fallback
        className={cn(
          "flex size-full items-center justify-center text-[0.8em] font-semibold",
          palette[hash(name ?? "") % palette.length],
        )}
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

function AvatarStack({
  people,
  max = 5,
  className,
}: {
  people: { id: string; name: string | null; image?: string | null }[];
  max?: number;
  className?: string;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {shown.map((p) => (
        <UserAvatar key={p.id} name={p.name} image={p.image} className="size-8 text-xs" />
      ))}
      {extra > 0 ? (
        <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-medium ring-2 ring-background">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

export { UserAvatar, AvatarStack };
