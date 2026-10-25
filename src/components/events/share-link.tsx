"use client";

import { useState, useSyncExternalStore } from "react";
import { CheckIcon, CopyIcon, Share2Icon } from "lucide-react";
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
      toast.error("Couldn't copy — select the link and copy it manually.");
    }
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center", className)}>
      <div className="flex min-w-0 flex-1 items-center rounded-xl border bg-background px-3.5 py-2.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-muted-foreground" data-testid="invite-url">
          {url}
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1 sm:flex-none"
          onClick={copy}
          aria-label="Copy invite link"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Copied" : "Copy"}
        </Button>
        {canShare ? (
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => navigator.share({ title, text: `Join ${title} on Giftr`, url }).catch(() => {})}
            aria-label="Share invite link"
          >
            <Share2Icon /> Share
          </Button>
        ) : null}
      </div>
    </div>
  );
}
