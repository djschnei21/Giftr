"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CircleNotchIcon, EnvelopeSimpleIcon } from "@/components/icons";
import { motion, AnimatePresence } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  next: string;
  providers: { google: boolean; facebook: boolean };
  devOutbox: boolean;
  error?: string;
  heading?: string;
  subheading?: string;
};

export function SignInCard({ next, providers, devOutbox, error, heading, subheading }: Props) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<null | "google" | "facebook" | "email">(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    error ? "That sign-in link didn't work. Please try again." : null,
  );

  const welcomeUrl = `/welcome?next=${encodeURIComponent(next)}`;

  async function social(provider: "google" | "facebook") {
    setPending(provider);
    setMessage(null);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: next,
      newUserCallbackURL: welcomeUrl,
      errorCallbackURL: "/sign-in?error=oauth",
    });
    if (error) {
      setMessage(error.message ?? "Couldn't start sign-in.");
      setPending(null);
    }
  }

  async function emailLink(e: React.FormEvent) {
    e.preventDefault();
    setPending("email");
    setMessage(null);
    const { error } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL: next,
      newUserCallbackURL: welcomeUrl,
      errorCallbackURL: `/sign-in?error=link&next=${encodeURIComponent(next)}`,
    });
    setPending(null);
    if (error) setMessage(error.message ?? "Couldn't send the link.");
    else setSentTo(email.trim());
  }

  const hasSocial = providers.google || providers.facebook;

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-[0_8px_30px_rgb(0_0_0/0.06)] sm:p-8">
      <AnimatePresence mode="wait" initial={false}>
        {sentTo ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-4 text-center"
          >
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <EnvelopeSimpleIcon className="size-6" />
            </div>
            <div className="grid gap-2">
              <h1 className="font-display text-2xl font-semibold">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                We sent a sign-in link to <span className="font-medium text-foreground">{sentTo}</span>. It expires in
                15 minutes.
              </p>
            </div>
            {devOutbox ? (
              <Button asChild variant="secondary">
                <Link href="/dev/outbox" target="_blank">
                  Open dev outbox
                </Link>
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => setSentTo(null)}>
              <ArrowLeftIcon /> Use a different method
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-6"
          >
            <div className="grid gap-2 text-center">
              <h1 className="font-display text-2xl font-semibold">{heading ?? "Welcome to Giftr"}</h1>
              <p className="text-sm text-muted-foreground">
                {subheading ?? "Sign in or create an account in one tap."}
              </p>
            </div>

            {hasSocial ? (
              <div className="grid gap-2">
                {providers.google ? (
                  <Button variant="outline" size="lg" disabled={pending !== null} onClick={() => social("google")}>
                    {pending === "google" ? <CircleNotchIcon className="animate-spin" /> : <GoogleIcon />}
                    Continue with Google
                  </Button>
                ) : null}
                {providers.facebook ? (
                  <Button variant="outline" size="lg" disabled={pending !== null} onClick={() => social("facebook")}>
                    {pending === "facebook" ? <CircleNotchIcon className="animate-spin" /> : <FacebookIcon />}
                    Continue with Facebook
                  </Button>
                ) : null}
              </div>
            ) : null}

            {hasSocial ? (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or use your email
                <span className="h-px flex-1 bg-border" />
              </div>
            ) : null}

            <form onSubmit={emailLink} className="grid gap-3">
              <Label htmlFor="email" className="sr-only">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" size="lg" variant={hasSocial ? "secondary" : "default"} disabled={pending !== null}>
                {pending === "email" ? <CircleNotchIcon className="animate-spin" /> : <EnvelopeSimpleIcon />}
                Email me a sign-in link
              </Button>
            </form>

            {message ? (
              <p role="alert" className="text-center text-sm text-destructive">
                {message}
              </p>
            ) : null}

            <p className="text-center text-xs text-muted-foreground">
              By continuing you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-2">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.97 10.97 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.8-4.67 4.54-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.5c-1.5 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12Z"
      />
    </svg>
  );
}
