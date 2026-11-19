import Link from "next/link";
import { AppHeader } from "@/components/app/app-header";
import { MobileNav } from "@/components/app/nav";
import { HolidaySprig } from "@/components/festive";
import { HolidayToggle } from "@/components/holiday-toggle";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteNav } from "@/components/marketing/site-nav";
import { getCurrentUser } from "@/lib/authz";
import { holidayCopy } from "@/lib/holiday";
import { getHoliday } from "@/lib/holiday-server";
import { cn } from "@/lib/utils";

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const [user, holiday] = await Promise.all([getCurrentUser(), getHoliday()]);
  return (
    <div className="flex min-h-dvh min-w-0 flex-col">
      {user ? <AppHeader user={user} /> : <SiteNav />}
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className={cn("mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6", user ? "pb-nav sm:pb-12" : "pb-12")}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
          <Logo />
          <span className="flex items-center gap-2 text-balance">
            <HolidaySprig className="h-6 shrink-0" />
            Made for families, friends and offices that love the holidays.
          </span>
          <nav aria-label="Legal" className="flex items-center gap-6 sm:ml-auto">
            <Link href="/privacy" className="transition hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-foreground">
              Terms
            </Link>
          </nav>
          <ThemeToggle />
          <HolidayToggle />
        </div>
        <div aria-hidden className="mt-8 h-px w-full tinsel" />
        <p className="mt-6 flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Giftr</span>
          <span className="font-script text-xl text-primary dark:text-accent-foreground">
            {holidayCopy[holiday].footerScript}
          </span>
        </p>
      </footer>
      {user ? <MobileNav /> : null}
    </div>
  );
}
