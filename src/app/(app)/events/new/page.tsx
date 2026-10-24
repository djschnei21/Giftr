import type { Metadata } from "next";
import { addDays, format } from "date-fns";
import { CreateEventWizard } from "@/components/events/create-wizard";
import { requireUser } from "@/lib/authz";

export const metadata: Metadata = { title: "New exchange" };

export default async function NewEventPage() {
  const user = await requireUser();
  const now = new Date();
  return (
    <CreateEventWizard
      organizerName={user.name}
      defaults={{ exchangeDate: format(addDays(now, 30), "yyyy-MM-dd") }}
    />
  );
}
