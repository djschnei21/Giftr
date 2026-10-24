"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ShareLink({ url, title, className }: { url: string; title: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

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
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center gap-2 rounded-xl border bg-background p-1.5 pl-3.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-muted-foreground" data-testid="invite-url">
          {url}
        </span>
        <Button size="sm" variant="secondary" onClick={copy} aria-label="Copy invite link">
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Copied" : "Copy"}
        </Button>
        {canShare ? (
          <Button
            size="sm"
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
