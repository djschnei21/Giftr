import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteNav } from "@/components/marketing/site-nav";
import { getCurrentUser } from "@/lib/authz";

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-dvh min-w-0 flex-col">
      <SiteNav signedIn={Boolean(user)} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 pt-16 pb-12 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
          <Logo />
          <span className="text-balance">Made for families, friends and offices that love the holidays.</span>
          <nav aria-label="Legal" className="flex items-center gap-6 sm:ml-auto">
            <Link href="/privacy" className="transition hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-foreground">
              Terms
            </Link>
          </nav>
          <ThemeToggle />
        </div>
        <p className="mt-8 text-xs text-muted-foreground">© {new Date().getFullYear()} Giftr</p>
      </footer>
    </div>
  );
}
