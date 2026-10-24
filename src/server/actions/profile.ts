"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { participant, profile } from "@/db/schema";
import { auth } from "@/lib/auth";
import { runAction, UserError, type ActionResult } from "@/lib/action";
import { deleteUserAccount } from "@/server/account";
import { assertUser } from "@/lib/authz";
import { safeNext } from "@/lib/safe-redirect";
import { profileSchema, type ProfileInput } from "@/lib/validation";

const nameSchema = z.string().trim().min(1, "Please enter your name.").max(60, "That's a bit long.");

export async function setDisplayName(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await auth.api.updateUser({ body: { name: parsed.data }, headers: await headers() });
  redirect(safeNext(formData.get("next") as string | null));
}

export async function updateProfile(input: ProfileInput) {
  return runAction(async () => {
    const user = await assertUser();
    const { name, address, sizes, ...rest } = profileSchema.parse(input);
    const compact = <T extends Record<string, string | null>>(o: T) =>
      Object.fromEntries(Object.entries(o).filter(([, v]) => v)) as { [K in keyof T]?: string };
    const addr = compact(address);
    const values = { ...rest, sizes: compact(sizes), address: Object.keys(addr).length ? addr : null };
    await db
      .insert(profile)
      .values({ userId: user.id, ...values })
      .onConflictDoUpdate({ target: profile.userId, set: values });
    if (name !== user.name) {
      await auth.api.updateUser({ body: { name }, headers: await headers() });
      await db.update(participant).set({ displayName: name }).where(eq(participant.userId, user.id));
    }
    revalidatePath("/", "layout");
  });
}

export async function deleteAccount(confirmation: string) {
  const result = await runAction(async () => {
    const user = await assertUser();
    if (z.string().trim().toLowerCase().parse(confirmation) !== user.email.toLowerCase())
      throw new UserError("Type your email address exactly to confirm.");
    const requestHeaders = await headers();
    await auth.api.signOut({ headers: requestHeaders });
    await deleteUserAccount(user.id);
  });
  if (!result.ok) return result;
  redirect("/?deleted=1");
}
