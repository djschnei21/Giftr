import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profile, user } from "@/db/schema";
import { unsubscribePatch, type UnsubscribeType } from "@/lib/unsubscribe";

export async function findByUnsubscribeToken(token: string) {
  if (!token || token.length > 64) return null;
  const [row] = await db
    .select({
      email: user.email,
      notifyReminders: profile.notifyReminders,
      notifyMessages: profile.notifyMessages,
    })
    .from(profile)
    .innerJoin(user, eq(user.id, profile.userId))
    .where(eq(profile.unsubscribeToken, token))
    .limit(1);
  return row ?? null;
}

export async function applyUnsubscribe(token: string, type: UnsubscribeType) {
  if (!token || token.length > 64) return false;
  const rows = await db
    .update(profile)
    .set(unsubscribePatch(type))
    .where(eq(profile.unsubscribeToken, token))
    .returning({ id: profile.userId });
  return rows.length > 0;
}

export async function setPreferencesByToken(token: string, prefs: { notifyReminders: boolean; notifyMessages: boolean }) {
  if (!token || token.length > 64) return false;
  const rows = await db.update(profile).set(prefs).where(eq(profile.unsubscribeToken, token)).returning({ id: profile.userId });
  return rows.length > 0;
}
