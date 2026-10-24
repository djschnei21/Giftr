"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { safeNext } from "@/lib/safe-redirect";
import type { ActionResult } from "@/lib/action";

const nameSchema = z.string().trim().min(1, "Please enter your name.").max(60, "That's a bit long.");

export async function setDisplayName(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await auth.api.updateUser({ body: { name: parsed.data }, headers: await headers() });
  redirect(safeNext(formData.get("next") as string | null));
}
