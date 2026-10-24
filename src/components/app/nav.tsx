"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiftIcon, ListChecksIcon, UserRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/events", label: "Exchanges", icon: GiftIcon },
  { href: "/wishlists", label: "Wishlists", icon: ListChecksIcon },
  { href: "/profile", label: "Profile", icon: UserRoundIcon },
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
              "rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              active && "bg-secondary text-foreground",
            )}
          >
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
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-lg sm:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-3">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 pt-2.5 pb-1 text-[11px] font-medium text-muted-foreground transition-colors",
                active && "text-primary",
              )}
            >
              <item.icon className={cn("size-[22px]", active && "stroke-[2.25]")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
