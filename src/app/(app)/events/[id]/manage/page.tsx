import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventHeader } from "@/components/events/event-header";
import { InvitesPanel } from "@/components/manage/invites-panel";
import { ManageTabs, type ManageTab } from "@/components/manage/manage-tabs";
import { PeoplePanel } from "@/components/manage/people-panel";
import { SettingsForm } from "@/components/manage/settings-form";
import { requireEventAccess } from "@/lib/authz";
import { getEventCounts, getEventPeople, getHouseholds } from "@/server/queries/events";
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

  const [people, households, counts, invitations, pastPeople] = await Promise.all([
    getEventPeople(id),
    getHouseholds(id),
    getEventCounts(id),
    listInvitations(id),
    listPastPeople(user.id, id),
  ]);
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
          rules: null,
          draw: null,
          settings: <SettingsForm event={event} organizerInDraw={me ? me.inDraw : null} />,
        }}
      />
    </div>
  );
}
