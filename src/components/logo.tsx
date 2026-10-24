import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <rect x="4" y="12" width="24" height="16" rx="4" className="fill-primary" />
      <rect x="2.5" y="8.5" width="27" height="6" rx="3" className="fill-primary" />
      <rect x="14.5" y="8.5" width="3" height="19.5" className="fill-berry" />
      <path
        d="M16 8.5c-1.6-3.4-5.8-4.6-7-2.4-1 1.9 1.6 3.2 7 2.4Zm0 0c1.6-3.4 5.8-4.6 7-2.4 1 1.9-1.6 3.2-7 2.4Z"
        className="fill-berry"
      />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50", className)}>
      <LogoMark />
      <span className="font-display text-xl font-semibold tracking-tight">Giftr</span>
    </Link>
  );
}
