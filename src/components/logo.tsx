import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <rect x="5" y="13" width="22" height="15" rx="3" className="fill-primary" />
      <rect x="3" y="9" width="26" height="6" rx="2" className="fill-primary" />
      <rect x="14.5" y="9" width="3" height="19" className="fill-gold" />
      <path
        d="M16 9c-1.5-3.6-6.2-5-7.4-2.6-1 2 1.8 3.4 7.4 2.6Zm0 0c1.5-3.6 6.2-5 7.4-2.6 1 2-1.8 3.4-7.4 2.6Z"
        className="fill-gold"
      />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      <LogoMark />
      <span className="font-display text-xl">Giftr</span>
    </Link>
  );
}
