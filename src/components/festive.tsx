import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** High-only atmosphere. CSS hides it from Medium down. */
const flourish = "festive-flourish";
/** Holiday motif that stays at Medium and drops at Low. */
const motif = "festive-motif";

/** Deterministic scatter so server and client render the same flakes. */
function scatter(count: number, seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: count }, (_, i) => {
    const crystal = i % 4 === 3;
    return {
      crystal,
      x: rand() * 100,
      y: rand() * 100,
      size: crystal ? 14 + rand() * 8 : 3 + rand() * 5,
      duration: 9 + rand() * 12,
      delay: rand() * 20,
      drift: (rand() - 0.5) * 80,
      twirl: 6 + rand() * 8,
    };
  });
}

const arms = [0, 60, 120, 180, 240, 300];

export function Snowfall({ count = 36, seed = 7, className }: { count?: number; seed?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("snowfall", flourish, className)}>
      {scatter(count, seed).map((f, i) => {
        const style = {
          left: `${f.x}%`,
          width: f.size,
          height: f.size,
          animationDelay: `-${f.delay}s`,
          "--drift": `${f.drift}px`,
          "--y": `${f.y}cqh`,
        } as CSSProperties;
        return f.crystal ? (
          <svg
            key={i}
            viewBox="-12 -12 24 24"
            className="flake"
            style={{ ...style, animationDuration: `${f.duration}s, ${f.twirl}s` }}
          >
            {arms.map((r) => (
              <path key={r} d="M0 0V-10M-3.5 -7.5L0 -4.5L3.5 -7.5" transform={`rotate(${r})`} />
            ))}
          </svg>
        ) : (
          <span
            key={i}
            className="flake"
            style={{ ...style, animationDuration: `${f.duration}s`, opacity: 0.55 + f.size / 20 }}
          />
        );
      })}
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
      <path d="M49 34c-4-10-17-15-21-8-3 6 6 10 21 8Zm0 0c4-10 17-15 21-8 3 6-6 10-21 8Z" className="fill-gold" />
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
    <svg aria-hidden className={cn("pointer-events-none absolute inset-0 size-full", flourish, className)}>
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

const ornamentTones = {
  primary: "bg-primary",
  gold: "bg-gold",
  pine: "bg-pine",
};

export function Ornament({
  className,
  tone = "primary",
  length = 48,
  size = "md",
  style,
}: {
  className?: string;
  tone?: keyof typeof ornamentTones;
  length?: number;
  size?: "md" | "lg";
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute top-0 flex origin-top flex-col items-center", flourish, className)}
      style={{ animation: "bob 5s var(--ease-fluid) infinite", ...style }}
    >
      <span className="w-px bg-gold/60" style={{ height: length }} />
      <span className="h-1.5 w-3 rounded-t-sm bg-gradient-to-b from-gold to-gold-foreground" />
      <span
        className={cn(
          "relative overflow-hidden rounded-full shadow-lg",
          size === "lg" ? "size-11" : "size-8",
          ornamentTones[tone],
        )}
      >
        <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 bg-white/25" />
        <span className="absolute inset-x-0 top-1/2 mt-1.5 h-px bg-white/30" />
        <span className="absolute top-1 left-1.5 size-2.5 rounded-full bg-white/50 blur-[1px]" />
      </span>
    </span>
  );
}

const bulbColors = ["#e0303f", "#f2b632", "#2fa86a", "#4aa3e8", "#fff1c9"];

/** A string of fairy lights draped along the top of the page. Purely decorative. */
export function StringLights({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-30 flex h-12 justify-center overflow-hidden",
        flourish,
        className,
      )}
    >
      {Array.from({ length: 32 }, (_, i) => {
        const color = bulbColors[i % bulbColors.length];
        return (
          <svg key={i} viewBox="0 0 80 48" className="h-12 w-20 flex-none">
            <path d="M0 4Q40 26 80 4" fill="none" className="stroke-holly" strokeWidth="1.5" />
            <g transform="translate(40 15) rotate(8)">
              <rect x="-3" y="0" width="6" height="6" rx="1" className="fill-holly" />
              <path
                d="M0 5c-6 0-8 7-8 12 0 6 4 10 8 10s8-4 8-10c0-5-2-12-8-12Z"
                fill={color}
                className="twinkle"
                style={{ "--bulb": color, "--tw": `${-((i * 0.37) % 2.4)}s` } as CSSProperties}
              />
              <ellipse cx="-3" cy="12" rx="1.6" ry="3" fill="white" opacity="0.55" />
            </g>
          </svg>
        );
      })}
    </div>
  );
}

export function HollySprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" aria-hidden className={cn("h-8 w-auto", motif, className)}>
      <path d="M30 22C22 10 10 8 2 12c5 1 6 5 4 8 4-1 7 2 6 6 4-2 8 0 9 3 1-4 5-6 9-7Z" className="fill-holly" />
      <path d="M34 22c8-12 20-14 28-10-5 1-6 5-4 8-4-1-7 2-6 6-4-2-8 0-9 3-1-4-5-6-9-7Z" className="fill-pine" />
      <path d="M30 22C22 14 14 13 8 14M34 22c8-8 16-9 22-8" fill="none" stroke="white" strokeOpacity="0.25" />
      <circle cx="28" cy="25" r="5" className="fill-primary" />
      <circle cx="36" cy="25" r="5" className="fill-primary" />
      <circle cx="32" cy="31" r="5" className="fill-primary" />
      <circle cx="26.5" cy="23.5" r="1.4" fill="white" opacity="0.6" />
      <circle cx="34.5" cy="23.5" r="1.4" fill="white" opacity="0.6" />
      <circle cx="30.5" cy="29.5" r="1.4" fill="white" opacity="0.6" />
    </svg>
  );
}

/** Heading flourish: holly flanked by tinsel. */
export function HollyDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex w-full max-w-xs items-center gap-3", motif, className)}>
      <span className="h-px flex-1 tinsel" />
      <HollySprig className="h-7" />
      <span className="h-px flex-1 tinsel" />
    </div>
  );
}

export function TwinkleStar({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4 twinkle fill-gold", flourish, className)} style={style}>
      <path d="M12 1.5l2.2 7.3 7.3 2.2-7.3 2.2L12 20.5l-2.2-7.3L2.5 11l7.3-2.2Z" />
    </svg>
  );
}

export function ChristmasTree({ className, lit = true }: { className?: string; lit?: boolean }) {
  return (
    <svg viewBox="0 0 80 110" aria-hidden className={cn("h-28 w-auto", flourish, className)}>
      <rect x="34" y="92" width="12" height="14" rx="2" className="fill-gold-foreground" />
      <path d="M40 14 8 60h14L4 92h72L58 60h14Z" className="fill-pine" />
      <path d="M40 14 20 44h10L14 70h52L50 44h10Z" className="fill-holly" opacity="0.55" />
      <path d="M18 74c14 6 30 6 46-4M24 52c10 5 22 4 32-3" fill="none" className="stroke-gold" strokeWidth="2" />
      {lit
        ? (
            [
              [28, 58, "#e0303f"],
              [52, 52, "#f2b632"],
              [40, 40, "#4aa3e8"],
              [22, 82, "#f2b632"],
              [58, 80, "#e0303f"],
              [40, 76, "#fff1c9"],
            ] as const
          ).map(([cx, cy, c], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="3"
              fill={c}
              className="twinkle"
              style={{ "--bulb": c, "--tw": `${-i * 0.4}s` } as CSSProperties}
            />
          ))
        : null}
      <path d="M40 2l3 7 7 .6-5.4 4.6 1.7 7L40 17.4 33.7 21l1.7-7L30 9.6l7-.6Z" className="twinkle fill-gold" />
    </svg>
  );
}

/** Snowy hills with a little pine forest. Sits along the bottom edge of a section. */
export function SnowyTreeline({ className }: { className?: string }) {
  const trees = [6, 12, 17, 31, 36, 58, 64, 70, 83, 89, 95];
  return (
    <svg
      viewBox="0 0 100 14"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full sm:h-28", flourish, className)}
    >
      {trees.map((x, i) => {
        const h = 5 + ((i * 7) % 5);
        return (
          <path key={x} d={`M${x} ${12 - h}l2.2 ${h}h-4.4Z`} className="fill-pine" opacity={0.35 + (i % 3) * 0.15} />
        );
      })}
      <path d="M0 11C14 8 26 12 40 10s30-3 44 0 12 1 16 0V14H0Z" fill="var(--card)" />
      <path d="M0 12.5c18-2 34 1 52-1s32-1 48 0V14H0Z" fill="var(--background)" />
    </svg>
  );
}

export function CandyCane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 64" aria-hidden className={cn("h-14 w-auto", flourish, className)}>
      <defs>
        <pattern id="cane-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#fffaf2" />
          <rect width="4" height="8" className="fill-primary" />
        </pattern>
      </defs>
      <path
        d="M22 62V18a8 8 0 0 0-16 0"
        fill="none"
        stroke="url(#cane-stripes)"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function daysUntilChristmas(now = new Date()) {
  const year = now.getMonth() === 11 && now.getDate() > 25 ? now.getFullYear() + 1 : now.getFullYear();
  const christmas = Date.UTC(year, 11, 25);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((christmas - today) / 86_400_000);
}

/** "N sleeps until Christmas" chip. Server-rendered so it matches on hydration. */
export function ChristmasCountdown({ className }: { className?: string }) {
  const days = daysUntilChristmas();
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/80 px-3 py-1 text-sm font-semibold text-foreground shadow-xs",
        motif,
        className,
      )}
    >
      <TwinkleStar className="size-3.5" />
      {days === 0 ? (
        "Merry Christmas!"
      ) : (
        <span>
          <span className="tabular-nums">{days}</span> {days === 1 ? "sleep" : "sleeps"} until Christmas
        </span>
      )}
    </p>
  );
}
