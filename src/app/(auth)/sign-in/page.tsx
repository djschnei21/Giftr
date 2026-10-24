import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { SignInCard } from "@/components/auth/sign-in-card";
import { enabledSocialProviders } from "@/lib/auth";
import { getCurrentUser } from "@/lib/authz";
import { devOutboxEnabled } from "@/lib/email";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getCurrentUser()) redirect(next);

  return (
    <main id="main" className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-accent/60 to-transparent" />
      <div className="relative w-full max-w-sm">
        <Logo className="mb-10 justify-center" />
        <SignInCard
          next={next}
          providers={enabledSocialProviders}
          devOutbox={devOutboxEnabled()}
          error={typeof params.error === "string" ? params.error : undefined}
        />
      </div>
    </main>
  );
}
