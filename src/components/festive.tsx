import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Deterministic scatter so server and client render the same flakes. */
function scatter(count: number, seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: count }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    size: 2 + rand() * 4,
    duration: 9 + rand() * 12,
    delay: rand() * 20,
    drift: (rand() - 0.5) * 80,
  }));
}

export function Snowfall({ count = 36, seed = 7, className }: { count?: number; seed?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("snowfall", className)}>
      {scatter(count, seed).map((f, i) => (
        <span
          key={i}
          className="flake"
          style={
            {
              left: `${f.x}%`,
              width: f.size,
              height: f.size,
              opacity: 0.4 + f.size / 10,
              animationDuration: `${f.duration}s`,
              animationDelay: `-${f.delay}s`,
              "--drift": `${f.drift}px`,
              "--y": `${f.y}cqh`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function GiftStack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 168 112" aria-hidden className={cn("h-28 w-auto", className)}>
      <ellipse cx="84" cy="106" rx="72" ry="5" className="fill-foreground/5" />
      <rect x="14" y="46" width="70" height="58" rx="8" className="fill-primary" />
      <rect x="8" y="34" width="82" height="18" rx="6" className="fill-primary" />
      <rect x="8" y="48" width="82" height="4" className="fill-black/10" />
      <rect x="44" y="34" width="10" height="70" className="fill-gold" />
      <path
        d="M49 34c-4-10-17-15-21-8-3 6 6 10 21 8Zm0 0c4-10 17-15 21-8 3 6-6 10-21 8Z"
        className="fill-gold"
      />
      <rect x="92" y="66" width="60" height="38" rx="7" className="fill-gold" />
      <rect x="88" y="58" width="68" height="13" rx="5" className="fill-gold" />
      <rect x="88" y="68" width="68" height="3" className="fill-black/10" />
      <rect x="117" y="58" width="9" height="46" className="fill-primary" />
      <rect x="104" y="30" width="38" height="28" rx="6" className="fill-border" />
      <rect x="119" y="30" width="7" height="28" className="fill-primary/70" />
      <circle cx="152" cy="22" r="3" className="fill-gold/60" />
      <circle cx="20" cy="18" r="2" className="fill-primary/40" />
      <circle cx="96" cy="12" r="2.5" className="fill-gold/50" />
    </svg>
  );
}

/** Repeating star and dot motif for flat brand panels. Inherits color from `currentColor`. */
export function StarPattern({ className, id = "giftr-stars" }: { className?: string; id?: string }) {
  return (
    <svg aria-hidden className={cn("pointer-events-none absolute inset-0 size-full", className)}>
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M14 8l1.6 4.4L20 14l-4.4 1.6L14 20l-1.6-4.4L8 14l4.4-1.6Z" fill="currentColor" />
          <circle cx="42" cy="42" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function Ornament({
  className,
  tone = "primary",
  length = 48,
  style,
}: {
  className?: string;
  tone?: "primary" | "gold";
  length?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute top-0 flex origin-top flex-col items-center", className)}
      style={{ animation: "bob 5s var(--ease-fluid) infinite", ...style }}
    >
      <span className="w-px bg-border" style={{ height: length }} />
      <span className="h-1 w-2 rounded-sm bg-gold" />
      <span
        className={cn(
          "relative size-7 rounded-full shadow-md",
          tone === "primary" ? "bg-primary" : "bg-gold",
        )}
      >
        <span className="absolute top-1 left-1 size-2 rounded-full bg-white/40" />
      </span>
    </span>
  );
}
