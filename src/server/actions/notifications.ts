"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { runAction, UserError } from "@/lib/action";
import { assertUser } from "@/lib/authz";
import { applyUnsubscribe, setPreferencesByToken } from "@/server/unsubscribe";
import { parseUnsubscribeType } from "@/lib/unsubscribe";

const prefsSchema = z.object({ notifyReminders: z.boolean(), notifyMessages: z.boolean() });
export type NotificationPrefs = z.infer<typeof prefsSchema>;

export async function updateNotificationPrefs(input: NotificationPrefs) {
  return runAction(async () => {
    const user = await assertUser();
    const prefs = prefsSchema.parse(input);
    await db
      .insert(profile)
      .values({ userId: user.id, ...prefs })
      .onConflictDoUpdate({ target: profile.userId, set: prefs });
    revalidatePath("/profile");
  });
}

/** Unsubscribe links work without signing in: the token alone identifies the inbox. */
export async function updateNotificationPrefsByToken(token: string, input: NotificationPrefs) {
  return runAction(async () => {
    const prefs = prefsSchema.parse(input);
    if (!(await setPreferencesByToken(z.string().parse(token), prefs))) throw new UserError("That link has expired.");
  });
}

export async function unsubscribeByToken(token: string, type: string) {
  return runAction(async () => {
    if (!(await applyUnsubscribe(z.string().parse(token), parseUnsubscribeType(type))))
      throw new UserError("That link has expired.");
  });
}
