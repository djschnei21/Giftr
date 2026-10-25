import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Snowfall } from "@/components/festive";
import { WelcomeForm } from "@/components/auth/welcome-form";
import { requireUser } from "@/lib/authz";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage({ searchParams }: PageProps<"/welcome">) {
  const next = safeNext((await searchParams).next);
  const user = await requireUser(`/welcome?next=${encodeURIComponent(next)}`);
  if (user.name.trim()) redirect(next);

  return (
    <main id="main" className="relative isolate flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Snowfall count={32} seed={29} className="-z-10" />
      <div className="page-enter w-full max-w-sm">
        <div>
          <Logo className="mb-12 justify-center" />
          <div className="rounded-3xl bg-card p-6 shadow-xl sm:p-8">
            <div className="mb-6 grid gap-2 text-center">
              <h1 className="font-display text-3xl">What should we call you?</h1>
              <p className="text-sm text-muted-foreground">This is how you&apos;ll appear to others in your exchanges.</p>
            </div>
            <WelcomeForm next={next} />
          </div>
        </div>
      </div>
    </main>
  );
}
