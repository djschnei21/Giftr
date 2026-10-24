"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Result<T> = { ok: true; data?: T } | { ok: false; error: string };

/** Runs a Server Action in a transition, toasts errors, and refreshes on success. */
export function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function run<T>(fn: () => Promise<Result<T>>, opts: { success?: string; onSuccess?: (data: T) => void } = {}) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error);
      if (opts.success) toast.success(opts.success);
      opts.onSuccess?.(res.data as T);
      router.refresh();
    });
  }
  return [pending, run] as const;
}
