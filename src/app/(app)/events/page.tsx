import { requireUser } from "@/lib/authz";

export default async function EventsPage() {
  const user = await requireUser();
  return <h1 className="font-display text-3xl">Hi {user.name}</h1>;
}
