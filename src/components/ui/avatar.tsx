"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn, initials } from "@/lib/utils";

const palette = [
  "bg-[oklch(0.92_0.045_20)] text-[oklch(0.42_0.14_22)] dark:bg-[oklch(0.34_0.07_20)] dark:text-[oklch(0.88_0.06_20)]",
  "bg-[oklch(0.92_0.04_160)] text-[oklch(0.38_0.08_160)] dark:bg-[oklch(0.33_0.05_160)] dark:text-[oklch(0.88_0.05_160)]",
  "bg-[oklch(0.93_0.06_85)] text-[oklch(0.45_0.1_70)] dark:bg-[oklch(0.36_0.06_80)] dark:text-[oklch(0.9_0.07_85)]",
  "bg-[oklch(0.92_0.04_330)] text-[oklch(0.42_0.1_330)] dark:bg-[oklch(0.33_0.06_330)] dark:text-[oklch(0.88_0.05_330)]",
  "bg-[oklch(0.92_0.03_240)] text-[oklch(0.4_0.08_245)] dark:bg-[oklch(0.33_0.05_245)] dark:text-[oklch(0.88_0.04_245)]",
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
      className={cn(
        "relative flex size-9 shrink-0 overflow-hidden rounded-xl text-sm ring-2 ring-background",
        className,
      )}
    >
      {image ? <AvatarPrimitive.Image src={image} alt="" className="aspect-square size-full object-cover" /> : null}
      <AvatarPrimitive.Fallback
        className={cn("flex size-full items-center justify-center font-bold", palette[hash(name ?? "") % palette.length])}
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
    <div className={cn("flex items-center -space-x-1", className)}>
      {shown.map((p) => (
        <UserAvatar key={p.id} name={p.name} image={p.image} className="size-8 rounded-lg text-xs ring-card" />
      ))}
      {extra > 0 ? (
        <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-xs font-semibold ring-2 ring-card">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

export { UserAvatar, AvatarStack };
