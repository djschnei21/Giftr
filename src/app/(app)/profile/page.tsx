import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { ProfileForm } from "@/components/profile/profile-form";
import { toProfileFormValue } from "@/components/profile/profile-value";
import { NotificationPrefsForm } from "@/components/profile/notification-prefs";
import { DeleteAccount } from "@/components/profile/delete-account";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { requireUser } from "@/lib/authz";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const [row] = await db.select().from(profile).where(eq(profile.userId, user.id)).limit(1);

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-8">
      <header className="flex min-w-0 items-center gap-4 sm:gap-6">
        <UserAvatar
          name={user.name}
          image={user.image}
          className="size-16 shrink-0 rounded-2xl text-xl ring-4 ring-gold/40 sm:size-20 sm:text-2xl"
        />
        <div className="grid min-w-0 gap-2">
          <h1 className="font-display text-4xl sm:text-5xl">Your profile</h1>
          <p className="text-muted-foreground">
            Signed in as <span className="font-semibold break-all text-foreground">{user.email}</span>. Help your Santa
            pick something you&apos;ll actually love.
          </p>
        </div>
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
      <Card id="delete-account" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>Permanently remove your account and everything in it.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccount email={user.email} />
        </CardContent>
      </Card>
    </div>
  );
}
