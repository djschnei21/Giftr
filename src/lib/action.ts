import "server-only";
import { z } from "zod";
import { AuthError } from "@/lib/authz";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export class UserError extends Error {}

/**
 * Wraps a Server Action body: validation, auth, and expected errors become a
 * friendly `{ ok: false }` result; anything unexpected is logged and hidden.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data } as ActionResult<T>;
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of err.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return { ok: false, error: err.issues[0]?.message ?? "Please check the form.", fieldErrors };
    }
    if (err instanceof UserError || err instanceof AuthError) return { ok: false, error: err.message };
    if (isNextControlFlow(err)) throw err;
    console.error("[action]", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

function isNextControlFlow(err: unknown) {
  const digest = (err as { digest?: unknown })?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR"));
}
