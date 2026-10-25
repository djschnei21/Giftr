import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Ornament, Snowfall } from "@/components/festive";
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
    <main id="main" className="relative isolate flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Snowfall count={40} seed={23} className="-z-10" />
      <Ornament className="left-[12%] hidden sm:flex" length={64} />
      <Ornament className="left-[22%] hidden sm:flex" tone="gold" length={112} style={{ animationDelay: "-2s" }} />
      <Ornament className="right-[16%] hidden sm:flex" length={88} style={{ animationDelay: "-1s" }} />
      <div className="page-enter w-full max-w-sm">
        <div>
        <Logo className="mb-12 justify-center" />
        <SignInCard
          next={next}
          providers={enabledSocialProviders}
          devOutbox={devOutboxEnabled()}
          error={typeof params.error === "string" ? params.error : undefined}
        />
        </div>
      </div>
    </main>
  );
}
