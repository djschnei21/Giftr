import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { WelcomeForm } from "@/components/auth/welcome-form";
import { requireUser } from "@/lib/authz";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage({ searchParams }: PageProps<"/welcome">) {
  const next = safeNext((await searchParams).next);
  const user = await requireUser(`/welcome?next=${encodeURIComponent(next)}`);
  if (user.name.trim()) redirect(next);

  return (
    <main id="main" className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Logo className="mb-10 justify-center" />
        <div className="rounded-3xl border bg-card p-6 shadow-[0_8px_30px_rgb(0_0_0/0.06)] sm:p-8">
          <div className="mb-6 grid gap-1.5 text-center">
            <h1 className="font-display text-2xl font-semibold">What should we call you?</h1>
            <p className="text-sm text-muted-foreground">This is how you&apos;ll appear to others in your exchanges.</p>
          </div>
          <WelcomeForm next={next} />
        </div>
      </div>
    </main>
  );
}
