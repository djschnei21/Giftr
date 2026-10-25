import { DetectiveIcon } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { countUnread, findThreadAssignment, getThread } from "@/server/queries/match";
import { AnonymousChat } from "./anonymous-chat";

/** The giftee's side of the anonymous thread: they only ever see "Your Secret Santa". */
export async function SantaThread({
  eventId,
  participantId,
  open,
}: {
  eventId: string;
  participantId: string;
  open: boolean;
}) {
  const a = await findThreadAssignment(participantId, "giftee");
  if (!a) return null;
  const [thread, unread] = await Promise.all([getThread(a.id, "giftee"), countUnread(a.id, "giftee")]);
  if (!open && thread.length === 0) return null;

  return (
    <Card id="santa" className="scroll-mt-24">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-berry/10 text-berry">
            <DetectiveIcon className="size-5" />
          </span>
          <div className="grid gap-0.5">
            <CardTitle>
              Your Secret Santa
              {unread > 0 ? (
                <span className="ml-2 rounded-full bg-berry px-2 py-0.5 align-middle text-[11px] font-medium text-white">
                  {unread} new
                </span>
              ) : null}
            </CardTitle>
            <CardDescription>
              Someone is shopping for you. Answer their questions here — they stay anonymous.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {open ? (
          <AnonymousChat
            eventId={eventId}
            as="giftee"
            initialMessages={thread}
            hasUnread={unread > 0}
            otherName="Your Santa"
            emptyHint="No messages yet. You can drop your Santa a hint — they'll get it without knowing you know."
            placeholder="Message your Santa…"
          />
        ) : (
          <p className="text-sm text-muted-foreground">This exchange has wrapped up, so messages are closed.</p>
        )}
      </CardContent>
    </Card>
  );
}
