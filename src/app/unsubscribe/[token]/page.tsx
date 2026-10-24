import type { Metadata } from "next";
import Link from "next/link";
import { MailXIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationPrefsForm } from "@/components/profile/notification-prefs";
import { UnsubscribeButton } from "@/components/profile/unsubscribe-button";
import { parseUnsubscribeType } from "@/lib/unsubscribe";
import { findByUnsubscribeToken } from "@/server/unsubscribe";

export const metadata: Metadata = { title: "Email preferences", robots: { index: false } };

const typeCopy = {
  reminders: "reminder emails",
  messages: "anonymous message emails",
  all: "reminder and message emails",
} as const;

export default async function UnsubscribePage({ params, searchParams }: PageProps<"/unsubscribe/[token]">) {
  const { token } = await params;
  const type = parseUnsubscribeType((await searchParams).type);
  const found = await findByUnsubscribeToken(token);

  return (
    <main id="main" className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-accent/60 to-transparent" />
      <div className="relative grid w-full max-w-md gap-6">
        <Logo className="justify-center" />
        {found ? (
          <>
            <Card>
              <CardHeader>
                <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <MailXIcon className="size-5" />
                </div>
                <CardTitle>Stop {typeCopy[type]}?</CardTitle>
                <CardDescription>
                  For <span className="font-medium text-foreground">{found.email}</span>. You can turn them back on any time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UnsubscribeButton token={token} type={type} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Or fine-tune what you get</CardTitle>
              </CardHeader>
              <CardContent>
                <NotificationPrefsForm
                  key={`${found.notifyReminders}-${found.notifyMessages}`}
                  token={token}
                  initial={{ notifyReminders: found.notifyReminders, notifyMessages: found.notifyMessages }}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>This link doesn&apos;t work anymore</CardTitle>
              <CardDescription>
                You can still change which emails you get from your{" "}
                <Link href="/profile#notifications" className="font-medium text-foreground underline underline-offset-2">
                  profile
                </Link>
                .
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </main>
  );
}
