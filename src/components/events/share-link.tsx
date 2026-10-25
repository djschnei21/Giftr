"use client";

import { useState, useSyncExternalStore } from "react";
import { CheckIcon, CopyIcon, ShareNetworkIcon } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ShareLink({ url, title, className }: { url: string; title: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the link and copy it by hand.");
    }
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center", className)}>
      <div className="flex h-10 min-w-0 flex-1 items-center rounded-xl bg-secondary px-3">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground" data-testid="invite-url">
          {url}
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 sm:flex-none"
          onClick={copy}
          aria-label="Copy invite link"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Copied" : "Copy"}
        </Button>
        {canShare ? (
          <Button
            className="flex-1 sm:flex-none"
            onClick={() => navigator.share({ title, text: `Join ${title} on Giftr`, url }).catch(() => {})}
            aria-label="Share invite link"
          >
            <ShareNetworkIcon /> Share
          </Button>
        ) : null}
      </div>
    </div>
  );
}
