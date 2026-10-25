"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, CircleNotchIcon } from "@/components/icons";
import { toast } from "sonner";
import { unsubscribeByToken } from "@/server/actions/notifications";
import { Button } from "@/components/ui/button";

export function UnsubscribeButton({ token, type }: { token: string; type: string }) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (done)
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-primary" role="status">
        <CheckCircleIcon className="size-4" /> Done — you won&apos;t get those emails anymore.
      </p>
    );

  return (
    <Button
      className="w-full"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await unsubscribeByToken(token, type);
          if (!res.ok) return void toast.error(res.error);
          setDone(true);
          router.refresh();
        })
      }
    >
      {pending ? <CircleNotchIcon className="animate-spin" /> : null} Unsubscribe
    </Button>
  );
}
