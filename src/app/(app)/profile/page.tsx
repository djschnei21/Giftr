import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { ProfileForm } from "@/components/profile/profile-form";
import { toProfileFormValue } from "@/components/profile/profile-value";
import { NotificationPrefsForm } from "@/components/profile/notification-prefs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/authz";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const [row] = await db.select().from(profile).where(eq(profile.userId, user.id)).limit(1);

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-8">
      <header>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {user.email}. Help your Santa pick something you&apos;ll actually love.
        </p>
      </header>
      <ProfileForm initial={toProfileFormValue(user.name, row ?? null)} />
      <Card id="notifications" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Email notifications</CardTitle>
          <CardDescription>Changes save right away.</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPrefsForm
            initial={{ notifyReminders: row?.notifyReminders ?? true, notifyMessages: row?.notifyMessages ?? true }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
