import type { Event } from "@/db/schema";
import { daysUntil, todayISO } from "@/lib/format";

export type Phase = "invites" | "draw" | "shopping" | "exchange" | "done" | "cancelled";

export function eventPhase(ev: Pick<Event, "status" | "exchangeDate">, today = todayISO()): Phase {
  if (ev.status === "cancelled") return "cancelled";
  if (ev.status === "completed") return "done";
  if (ev.status === "open") return "invites";
  if (ev.exchangeDate === today) return "exchange";
  if (ev.exchangeDate < today) return "done";
  return "shopping";
}

export function statusBadge(ev: Pick<Event, "status" | "exchangeDate">) {
  const phase = eventPhase(ev);
  switch (phase) {
    case "cancelled":
      return { label: "Cancelled", variant: "destructive" as const };
    case "done":
      return { label: "Wrapped up", variant: "secondary" as const };
    case "invites":
      return { label: "Gathering people", variant: "gold" as const };
    case "exchange":
      return { label: "Exchange day", variant: "berry" as const };
    default:
      return { label: "Names drawn", variant: "default" as const };
  }
}

export function countdownLabel(exchangeDate: string) {
  const d = daysUntil(exchangeDate);
  if (d < 0) return null;
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  return `${d} days to go`;
}
