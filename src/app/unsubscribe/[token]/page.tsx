import type { Metadata } from "next";
import Link from "next/link";
import { BellSlashIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { Snowfall } from "@/components/festive";
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
    <main id="main" className="relative isolate flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Snowfall count={28} seed={37} className="-z-10" />
      <div className="grid w-full max-w-md gap-6">
        <Logo className="justify-center" />
        {found ? (
          <>
            <Card>
              <CardHeader>
                <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <BellSlashIcon className="size-6" />
                </div>
                <CardTitle>Stop {typeCopy[type]}?</CardTitle>
                <CardDescription>
                  For <span className="font-semibold text-foreground">{found.email}</span>. You can turn them back on any
                  time.
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
                <Link
                  href="/profile#notifications"
                  className="font-semibold text-foreground underline decoration-current/30 underline-offset-4 hover:decoration-current"
                >
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
