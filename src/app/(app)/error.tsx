"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcwIcon, SnowflakeIcon } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={<SnowflakeIcon />}
      title="Something went wrong"
      description="That's on us, not you. Try again — and if it keeps happening, give it a minute."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>
            <RotateCcwIcon /> Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/events">Back to my exchanges</Link>
          </Button>
        </div>
      }
    />
  );
}
