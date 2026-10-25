"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { CircleNotchIcon, DetectiveIcon, PaperPlaneRightIcon } from "@/components/icons";
import { toast } from "sonner";
import { loadThread, markThreadRead, sendMessage } from "@/server/actions/match";
import type { ThreadMessage, ThreadRole } from "@/server/queries/match";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const POLL_MS = 15_000;

function relativeTime(iso: string) {
  const date = new Date(iso);
  return Date.now() - date.getTime() < 45_000 ? "just now" : formatDistanceToNowStrict(date, { addSuffix: true });
}

export function AnonymousChat({
  eventId,
  as,
  initialMessages,
  hasUnread,
  otherName,
  emptyHint,
  placeholder,
}: {
  eventId: string;
  as: ThreadRole;
  initialMessages: ThreadMessage[];
  hasUnread: boolean;
  /** How the other side is labelled on their bubbles. */
  otherName: string;
  emptyHint: string;
  placeholder: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, startSending] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const unreadRef = useRef(hasUnread);
  const incomingRef = useRef(initialMessages.filter((m) => !m.mine).length);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    let cancelled = false;
    const markRead = () => {
      if (!unreadRef.current) return;
      unreadRef.current = false;
      void markThreadRead(eventId, as).then(() => router.refresh());
    };
    markRead();

    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await loadThread(eventId, as);
      if (cancelled || !res.ok) return;
      const incoming = res.data.filter((m) => !m.mine).length;
      if (incoming > incomingRef.current) {
        incomingRef.current = incoming;
        unreadRef.current = true;
        markRead();
      }
      setMessages((current) => [...res.data, ...current.filter((m) => m.id.startsWith("pending:"))]);
    };
    const timer = setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [eventId, as, router]);

  function send() {
    const body = draft.trim();
    if (!body || sending) return;
    const tempId = `pending:${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, mine: true, body, createdAt: new Date().toISOString() }]);
    setDraft("");
    startSending(async () => {
      const res = await sendMessage(eventId, { as, body });
      if (!res.ok) {
        setMessages((m) => m.filter((x) => x.id !== tempId));
        setDraft(body);
        toast.error(res.error);
        return;
      }
      setMessages((m) => m.map((x) => (x.id === tempId ? res.data : x)));
    });
  }

  return (
    <div className="grid gap-3">
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Messages"
        className="grid max-h-96 min-h-32 content-end-safe gap-2 overflow-y-auto rounded-2xl bg-secondary p-3"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
            <DetectiveIcon className="size-8 text-primary" />
            <p className="max-w-xs">{emptyHint}</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex flex-col gap-0.5", m.mine ? "items-end" : "items-start")}>
              <p
                data-testid={m.mine ? "message-mine" : "message-theirs"}
                className={cn(
                  "max-w-4/5 rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
                  m.mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card shadow-xs",
                  m.id.startsWith("pending:") && "opacity-70",
                )}
              >
                {m.body}
              </p>
              <span className="px-1 text-xs text-muted-foreground">
                {m.mine ? "You" : otherName} ·{" "}
                {m.id.startsWith("pending:") ? (
                  "sending…"
                ) : (
                  <time dateTime={m.createdAt} suppressHydrationWarning>
                    {relativeTime(m.createdAt)}
                  </time>
                )}
              </span>
            </div>
          ))
        )}
      </div>
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          aria-label="Message"
          maxLength={1000}
          rows={1}
          className="max-h-40 min-h-10 resize-none py-2"
        />
        <Button type="submit" size="icon" aria-label="Send message" disabled={!draft.trim() || sending}>
          {sending ? <CircleNotchIcon className="animate-spin" /> : <PaperPlaneRightIcon />}
        </Button>
      </form>
    </div>
  );
}
