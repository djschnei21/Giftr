import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventHeader } from "@/components/events/event-header";
import { InvitesPanel } from "@/components/manage/invites-panel";
import { ManageTabs, type ManageTab } from "@/components/manage/manage-tabs";
import { DrawPanel } from "@/components/manage/draw-panel";
import { PeoplePanel } from "@/components/manage/people-panel";
import { RulesPanel } from "@/components/manage/rules-panel";
import { SettingsForm } from "@/components/manage/settings-form";
import { requireEventAccess } from "@/lib/authz";
import { getEventCounts, getEventPeople, getHouseholds } from "@/server/queries/events";
import { getAllMatches, getExclusions, getPreDrawChecks } from "@/server/queries/draw";
import { listInvitations, listPastPeople } from "@/server/queries/people";
import { joinUrl } from "@/server/invites";

export const metadata: Metadata = { title: "Manage exchange" };

const tabs: ManageTab[] = ["people", "invites", "rules", "draw", "settings"];

export default async function ManagePage({ params, searchParams }: PageProps<"/events/[id]/manage">) {
  const { id } = await params;
  const { tab } = await searchParams;
  const { event, me, isOrganizer, user } = await requireEventAccess(id);
  if (!isOrganizer) notFound();
  const initial = tabs.includes(tab as ManageTab) ? (tab as ManageTab) : "people";

  const [people, households, counts, invitations, pastPeople, exclusions, preDraw, matches] = await Promise.all([
    getEventPeople(id),
    getHouseholds(id),
    getEventCounts(id),
    listInvitations(id),
    listPastPeople(user.id, id),
    getExclusions(id),
    event.status === "open" ? getPreDrawChecks(event) : null,
    event.status === "drawn" && event.organizerCanViewMatches ? getAllMatches(id) : null,
  ]);
  const drawPeople = people
    .filter((p) => p.status === "joined" && p.inDraw)
    .map((p) => ({ id: p.id, name: p.name, householdId: p.householdId }));
  const householdNames = Object.fromEntries(households.map((h) => [h.id, h.name]));
  const pendingInvites = invitations.filter((i) => i.status === "pending").length;

  return (
    <div className="grid gap-8">
      <EventHeader event={event} isOrganizer showManage={false} back={{ href: `/events/${id}`, label: "Back to exchange" }} />
      <ManageTabs
        initial={initial}
        badges={{ people: counts.joined, invites: pendingInvites || undefined }}
        panels={{
          people: (
            <PeoplePanel
              eventId={id}
              status={event.status}
              people={people}
              householdNames={householdNames}
              viewed={{ viewed: counts.viewed, assigned: counts.assigned }}
            />
          ),
          invites: (
            <InvitesPanel
              eventId={id}
              eventName={event.name}
              status={event.status}
              inviteUrl={joinUrl(event)}
              inviteLinkEnabled={event.inviteLinkEnabled}
              invitations={invitations}
              pastPeople={pastPeople}
            />
          ),
          rules: (
            <RulesPanel
              eventId={id}
              locked={event.status !== "open"}
              people={drawPeople}
              households={households}
              exclusions={exclusions}
              blockers={preDraw?.checks.filter((c) => c.level === "block") ?? []}
            />
          ),
          draw: (
            <DrawPanel
              eventId={id}
              status={event.status}
              format={event.drawFormat}
              scheduledFor={event.drawMode === "scheduled" ? event.drawDate : null}
              checks={preDraw?.checks ?? []}
              canDraw={preDraw?.canDraw ?? false}
              inDraw={preDraw?.inDraw ?? 0}
              viewed={{ viewed: counts.viewed, assigned: counts.assigned }}
              matches={matches}
            />
          ),
          settings: <SettingsForm event={event} organizerInDraw={me ? me.inDraw : null} />,
        }}
      />
    </div>
  );
}
