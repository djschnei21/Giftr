"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiftIcon, ListChecksIcon, UserIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const items = [
  { href: "/events", label: "Exchanges", icon: GiftIcon },
  { href: "/wishlists", label: "Wishlists", icon: ListChecksIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
      {items.slice(0, 2).map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold text-muted-foreground transition outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.98]",
              active && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <item.icon weight={active ? "fill" : "bold"} className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-safe sm:hidden"
    >
      <div className="glass pointer-events-auto mb-2 grid w-full max-w-xs grid-cols-3 gap-1 rounded-full p-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center gap-0.5 rounded-full py-2 text-xs font-semibold text-muted-foreground transition outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.98]",
                active && "bg-accent text-accent-foreground",
              )}
            >
              <item.icon weight={active ? "fill" : "bold"} className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
