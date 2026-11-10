import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7 overflow-visible", className)}>
      <rect x="5" y="13" width="22" height="15" rx="3" className="fill-primary" />
      <rect x="3" y="9" width="26" height="6" rx="2" className="fill-primary" />
      <rect x="14.5" y="9" width="3" height="19" className="fill-gold" />
      <path
        d="M16 9c-1.5-3.6-6.2-5-7.4-2.6-1 2 1.8 3.4 7.4 2.6Zm0 0c1.5-3.6 6.2-5 7.4-2.6 1 2-1.8 3.4-7.4 2.6Z"
        className="fill-gold"
      />
      <g transform="translate(1 -1) rotate(-18 6 8)">
        <path d="M1 10c1-6 5-9 10-8l-1 8Z" className="fill-primary" />
        <path d="M11 2c2 1 3 3 3 5" fill="none" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
        <circle cx="14" cy="7.5" r="1.8" fill="#fffaf2" />
        <rect x="0" y="9" width="12" height="3" rx="1.5" fill="#fffaf2" />
      </g>
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      <LogoMark className="transition duration-500 group-hover:-rotate-6" />
      <span className="logo-wordmark font-script text-2xl leading-none text-primary dark:text-foreground">Giftr</span>
    </Link>
  );
}
