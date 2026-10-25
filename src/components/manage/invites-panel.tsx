"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowsClockwiseIcon,
  CheckIcon,
  CircleNotchIcon,
  ClockCounterClockwiseIcon,
  EnvelopeSimpleIcon,
  PaperPlaneTiltIcon,
  XIcon,
} from "@/components/icons";
import { toast } from "sonner";
import type { Invitation } from "@/db/schema";
import {
  quickAddPeople,
  regenerateInviteLink,
  resendInvite,
  revokeInvite,
  sendInvites,
  setInviteLinkEnabled,
} from "@/server/actions/invites";
import { ShareLink } from "@/components/events/share-link";
import { useAction } from "@/components/use-action";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { SwitchRow } from "@/components/ui/misc";
import { pluralize } from "@/lib/format";
import { parseEmailList } from "@/lib/validation";
import { cn } from "@/lib/utils";

type PastPerson = { userId: string; name: string; email: string; image: string | null; eventName: string };

type Props = {
  eventId: string;
  eventName: string;
  status: "open" | "drawn" | "completed" | "cancelled";
  inviteUrl: string;
  inviteLinkEnabled: boolean;
  invitations: Invitation[];
  pastPeople: PastPerson[];
};

const statusBadge = {
  pending: <Badge variant="secondary">Invited</Badge>,
  declined: <Badge variant="outline">Declined</Badge>,
  revoked: <Badge variant="destructive">Revoked</Badge>,
  accepted: <Badge>Joined</Badge>,
} as const;

export function InvitesPanel({
  eventId,
  eventName,
  status,
  inviteUrl,
  inviteLinkEnabled,
  invitations,
  pastPeople,
}: Props) {
  const [pending, run] = useAction();
  const [emails, setEmails] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const closed = status === "completed" || status === "cancelled";
  const drawn = status === "drawn";
  const count = parseEmailList(emails).length;

  if (closed) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">
          This exchange is closed, so invites are off.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite link</CardTitle>
          <CardDescription>
            {drawn
              ? "Names are drawn, so the link no longer lets new people in. Email invites still work — newcomers get slotted into the draw."
              : "Anyone with this link can join. It shows a preview card in iMessage, WhatsApp and Slack."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {inviteLinkEnabled ? (
            <ShareLink url={inviteUrl} title={eventName} />
          ) : (
            <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
              The link is off. People who open it are told to ask you for an invite.
            </p>
          )}
          <SwitchRow
            id="invite-link-enabled"
            label="Link is on"
            description="Turn it off to stop new people joining by link."
            checked={inviteLinkEnabled}
            disabled={pending}
            onCheckedChange={(v) =>
              run(() => setInviteLinkEnabled(eventId, v), { success: v ? "Invite link is on" : "Invite link is off" })
            }
          />
          <div>
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm" disabled={pending}>
                  <ArrowsClockwiseIcon /> Get a new link
                </Button>
              }
              title="Replace the invite link?"
              description="The current link will stop working right away. Anyone who already joined stays in."
              confirmLabel="Replace link"
              onConfirm={() => run(() => regenerateInviteLink(eventId), { success: "New invite link ready" })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite by email</CardTitle>
          <CardDescription>Paste as many addresses as you like, separated by commas or new lines.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => sendInvites(eventId, emails), {
                onSuccess: (data) => {
                  setEmails("");
                  toast.success(
                    data.invited
                      ? `Sent ${pluralize(data.invited, "invite")}${data.skipped ? ` · ${data.skipped} already joined` : ""}`
                      : "Everyone on that list has already joined",
                  );
                },
              });
            }}
          >
            <Textarea
              aria-label="Email addresses"
              name="emails"
              placeholder="aunt.jo@example.com, sam@example.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              rows={3}
            />
            <div className="flex items-center justify-end gap-3">
              {count ? (
                <span className="text-sm text-muted-foreground">{pluralize(count, "address", "addresses")}</span>
              ) : null}
              <Button type="submit" disabled={pending || count === 0}>
                {pending ? <CircleNotchIcon className="animate-spin" /> : <PaperPlaneTiltIcon />}
                Send invites
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {pastPeople.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockCounterClockwiseIcon className="size-4 text-muted-foreground" /> From your past exchanges
            </CardTitle>
            <CardDescription>Tap people to invite them again.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ul className="grid gap-2 sm:grid-cols-2">
              {pastPeople.map((p) => {
                const on = picked.has(p.userId);
                return (
                  <li key={p.userId}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setPicked((s) => {
                          const next = new Set(s);
                          if (on) next.delete(p.userId);
                          else next.add(p.userId);
                          return next;
                        })
                      }
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-left transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        on && "border-primary bg-accent/60",
                      )}
                    >
                      <UserAvatar name={p.name} image={p.image} className="size-8" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{p.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{p.eventName}</span>
                      </span>
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full border",
                          on && "border-primary bg-primary text-primary-foreground",
                        )}
                      >
                        {on ? <CheckIcon className="size-3" /> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-end">
              <Button
                disabled={pending || picked.size === 0}
                onClick={() =>
                  run(() => quickAddPeople(eventId, [...picked]), {
                    success: `Invited ${pluralize(picked.size, "person", "people")}`,
                    onSuccess: () => setPicked(new Set()),
                  })
                }
              >
                <EnvelopeSimpleIcon /> Invite {picked.size || ""}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {invitations.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Sent invites</CardTitle>
            <CardDescription>People who joined move to the People tab.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <ul className="divide-y" data-testid="invite-list">
              {invitations.map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Sent {formatDistanceToNow(new Date(inv.lastSentAt), { addSuffix: true })}
                    </p>
                  </div>
                  {statusBadge[inv.status]}
                  {inv.status !== "accepted" ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          run(() => resendInvite(eventId, inv.id), { success: `Invite resent to ${inv.email}` })
                        }
                      >
                        <ArrowsClockwiseIcon /> Resend
                      </Button>
                      {inv.status === "pending" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          aria-label={`Revoke invite for ${inv.email}`}
                          onClick={() => run(() => revokeInvite(eventId, inv.id), { success: "Invite revoked" })}
                        >
                          <XIcon /> Revoke
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
