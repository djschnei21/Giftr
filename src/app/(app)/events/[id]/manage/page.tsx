import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventHeader } from "@/components/events/event-header";
import { ManageTabs, type ManageTab } from "@/components/manage/manage-tabs";
import { SettingsForm } from "@/components/manage/settings-form";
import { requireEventAccess } from "@/lib/authz";

export const metadata: Metadata = { title: "Manage exchange" };

const tabs: ManageTab[] = ["people", "invites", "rules", "draw", "settings"];

export default async function ManagePage({ params, searchParams }: PageProps<"/events/[id]/manage">) {
  const { id } = await params;
  const { tab } = await searchParams;
  const { event, me, isOrganizer } = await requireEventAccess(id);
  if (!isOrganizer) notFound();
  const initial = tabs.includes(tab as ManageTab) ? (tab as ManageTab) : "people";

  return (
    <div className="grid gap-8">
      <EventHeader event={event} isOrganizer showManage={false} back={{ href: `/events/${id}`, label: "Back to exchange" }} />
      <ManageTabs
        initial={initial}
        panels={{
          people: null,
          invites: null,
          rules: null,
          draw: null,
          settings: <SettingsForm event={event} organizerInDraw={me ? me.inDraw : null} />,
        }}
      />
    </div>
  );
}
