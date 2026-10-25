"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/#faq", label: "Questions" },
  { href: "/sign-in", label: "Sign in" },
];
const cta = { href: "/sign-in?next=/events/new", label: "Start your exchange" };

const stagger = ["delay-100", "delay-150", "delay-200", "delay-300"];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="pointer-events-none sticky top-0 z-50 px-4 pt-4 sm:pt-6">
      <div className="glass pointer-events-auto relative z-10 mx-auto flex w-max max-w-full items-center gap-2 rounded-full p-1 pl-4">
        <Logo className="mr-2" />
        <nav aria-label="Main" className="hidden items-center md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex h-9 items-center rounded-full px-4 text-sm font-semibold text-muted-foreground transition outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm" className="hidden h-9 rounded-full px-4 md:inline-flex">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
          className="relative size-10 cursor-pointer rounded-full transition outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.98] md:hidden"
        >
          <span
            className={cn(
              "absolute inset-x-0 top-1/2 mx-auto -mt-px h-0.5 w-5 rounded-full bg-foreground transition duration-500 ease-fluid",
              open ? "rotate-45" : "-translate-y-1",
            )}
          />
          <span
            className={cn(
              "absolute inset-x-0 top-1/2 mx-auto -mt-px h-0.5 w-5 rounded-full bg-foreground transition duration-500 ease-fluid",
              open ? "-rotate-45" : "translate-y-1",
            )}
          />
        </button>
      </div>

      <div
        id="site-menu"
        inert={!open}
        className={cn(
          "fixed inset-0 bg-white/80 backdrop-blur-3xl transition duration-500 ease-fluid md:hidden dark:bg-black/80",
          open ? "pointer-events-auto opacity-100" : "opacity-0",
        )}
      >
        <nav aria-label="Menu" className="flex h-full flex-col justify-center gap-6 px-8">
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              className={cn(
                "w-fit font-display text-4xl transition duration-700 ease-fluid",
                open ? cn("translate-y-0 opacity-100", stagger[i]) : "translate-y-12 opacity-0",
              )}
            >
              {l.label}
            </Link>
          ))}
          <div
            className={cn(
              "mt-4 transition duration-700 ease-fluid",
              open ? cn("translate-y-0 opacity-100", stagger[links.length]) : "translate-y-12 opacity-0",
            )}
          >
            <Button asChild size="lg">
              <Link href={cta.href} onClick={close}>
                {cta.label}
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
