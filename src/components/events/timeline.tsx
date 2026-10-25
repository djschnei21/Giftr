import { CheckIcon } from "lucide-react";
import type { Event } from "@/db/schema";
import { dateLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { eventPhase } from "./status";

type Step = { title: string; detail: string; state: "done" | "current" | "upcoming" };

export function Timeline({ event, joined }: { event: Event; joined: number }) {
  const phase = eventPhase(event);
  const drawn = event.status !== "open" && event.drawnAt;
  const steps: Step[] = [
    {
      title: "Gather everyone",
      detail: `${joined} joined${event.joinDeadline ? ` · join by ${dateLabel(event.joinDeadline, "MMM d")}` : ""}`,
      state: phase === "invites" ? "current" : "done",
    },
    {
      title: "Draw names",
      detail: drawn
        ? `Drawn ${dateLabel(event.drawnAt!.toISOString().slice(0, 10), "MMM d")}`
        : event.drawMode === "scheduled" && event.drawDate
          ? `Automatically on ${dateLabel(event.drawDate, "MMM d")}`
          : "When the organizer is ready",
      state: drawn ? "done" : "upcoming",
    },
    {
      title: "Shop & wrap",
      detail: "Check your match's wishlist",
      state: phase === "shopping" ? "current" : phase === "exchange" || phase === "done" ? "done" : "upcoming",
    },
    {
      title: "Exchange day",
      detail: dateLabel(event.exchangeDate),
      state: phase === "exchange" ? "current" : phase === "done" ? "done" : "upcoming",
    },
  ];
  if (phase === "cancelled") return null;

  return (
    <ol className="grid gap-0" aria-label="Exchange timeline">
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
          {i < steps.length - 1 ? (
            <span
              className={cn(
                "absolute top-7 bottom-0 left-[13px] w-px",
                s.state === "done" ? "bg-primary" : "bg-border",
              )}
              aria-hidden
            />
          ) : null}
          <span
            className={cn(
              "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
              s.state === "done" && "border-primary bg-primary text-primary-foreground",
              s.state === "current" && "border-primary bg-card text-primary ring-4 ring-primary/15",
              s.state === "upcoming" && "border-border bg-card text-muted-foreground",
            )}
          >
            {s.state === "done" ? <CheckIcon className="size-3.5" /> : i + 1}
          </span>
          <div className="grid min-w-0 gap-0.5 pt-0.5">
            <p className={cn("text-sm font-medium", s.state === "upcoming" && "text-muted-foreground")}>
              {s.title}
              {s.state === "current" ? <span className="sr-only"> (current step)</span> : null}
            </p>
            <p className="text-[13px] text-muted-foreground">{s.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
