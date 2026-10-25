"use client";

import { useState } from "react";
import {
  CrownIcon,
  DotsThreeIcon,
  EyeIcon,
  UserCheckIcon,
  UserCircleMinusIcon,
  UserMinusIcon,
  UsersIcon,
} from "@/components/icons";
import { toast } from "sonner";
import type { EventPerson } from "@/server/queries/events";
import { removeParticipant, setParticipantInDraw } from "@/server/actions/participants";
import { EmptyState } from "@/components/app/empty-state";
import { useAction } from "@/components/use-action";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveDialog } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/misc";
import { pluralize } from "@/lib/format";

type Props = {
  eventId: string;
  status: "open" | "drawn" | "completed" | "cancelled";
  people: EventPerson[];
  householdNames: Record<string, string>;
  viewed: { viewed: number; assigned: number };
};

export function PeoplePanel({ eventId, status, people, householdNames, viewed }: Props) {
  const [pending, run] = useAction();
  const [removing, setRemoving] = useState<EventPerson | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const joined = people.filter((p) => p.status === "joined");
  const declined = people.filter((p) => p.status === "declined");
  const inDraw = joined.filter((p) => p.inDraw).length;
  const editable = status === "open" || status === "drawn";

  function remove(person: EventPerson, redraw = false) {
    run(() => removeParticipant(eventId, person.id, { redraw }), {
      onSuccess: (data) => {
        if (data.blocked) return setBlocked(data.blocked);
        setRemoving(null);
        setBlocked(null);
        toast.success(
          data.redrawn
            ? `${person.name} was removed and names were redrawn.`
            : data.changed
              ? `${person.name} was removed. Their Santa got a new match.`
              : `${person.name} was removed.`,
        );
      },
    });
  }

  if (joined.length <= 1 && declined.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon />}
        title="It's just you so far"
        description="Share the invite link or send email invites from the Invite tab. People show up here as soon as they join."
      />
    );
  }

  return (
    <div className="grid gap-6">
      {status === "drawn" ? (
        <Card>
          <CardContent className="flex items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <EyeIcon className="size-5" />
            </span>
            <div className="grid gap-0.5">
              <p className="font-medium" data-testid="viewed-total">
                {viewed.viewed} of {viewed.assigned} have opened their match
              </p>
              <p className="text-sm text-muted-foreground">
                You only see totals, so nobody&apos;s match is given away.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{pluralize(joined.length, "person", "people")} joined</CardTitle>
          <CardDescription>
            {inDraw} in the draw{joined.length - inDraw > 0 ? ` · ${joined.length - inDraw} sitting out` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <ul className="divide-y" data-testid="people-list">
            {joined.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                <UserAvatar name={p.name} image={p.image} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    <span className="truncate">{p.name}</span>
                    {p.role === "organizer" ? (
                      <Badge variant="gold">
                        <CrownIcon /> Organizer
                      </Badge>
                    ) : null}
                    {!p.inDraw ? <Badge variant="outline">Not in draw</Badge> : null}
                    {p.householdId && householdNames[p.householdId] ? (
                      <Badge variant="secondary">{householdNames[p.householdId]}</Badge>
                    ) : null}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{p.email}</p>
                </div>
                {editable && p.role !== "organizer" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Options for ${p.name}`} disabled={pending}>
                        <DotsThreeIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {status === "open" ? (
                        <DropdownMenuItem
                          onSelect={() =>
                            run(() => setParticipantInDraw(eventId, p.id, !p.inDraw), {
                              success: p.inDraw ? `${p.name} will sit out the draw` : `${p.name} is back in the draw`,
                            })
                          }
                        >
                          {p.inDraw ? <UserCircleMinusIcon /> : <UserCheckIcon />}
                          {p.inDraw ? "Leave out of the draw" : "Include in the draw"}
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem destructive onSelect={() => setRemoving(p)}>
                        <UserMinusIcon /> Remove from exchange
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {declined.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Can&apos;t make it</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {declined.map((p) => (
              <Badge key={p.id} variant="outline" className="py-1">
                {p.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <ResponsiveDialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open) {
            setRemoving(null);
            setBlocked(null);
          }
        }}
        title={removing ? `Remove ${removing.name}?` : "Remove"}
        description={
          blocked
            ? blocked
            : status === "drawn"
              ? "Names are already drawn. Their Santa will take over their giftee, so only one person's match changes, and we'll email them."
              : "They'll be taken off the list. You can invite them again later."
        }
      >
        <div className="flex flex-col-reverse gap-2 pb-4 sm:flex-row sm:justify-end sm:pb-0">
          <Button variant="outline" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
          {blocked ? (
            <Button variant="destructive" disabled={pending} onClick={() => removing && remove(removing, true)}>
              Remove and redraw everyone
            </Button>
          ) : (
            <Button variant="destructive" disabled={pending} onClick={() => removing && remove(removing)}>
              Remove
            </Button>
          )}
        </div>
      </ResponsiveDialog>
    </div>
  );
}
