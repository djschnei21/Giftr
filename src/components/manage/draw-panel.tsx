"use client";

import {
  ArrowCounterClockwiseIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
  EyeIcon,
  ShuffleIcon,
  SparkleIcon,
  WarningIcon,
  XCircleIcon,
} from "@/components/icons";
import { toast } from "sonner";
import { drawNow, redrawAll, resetDraw } from "@/server/actions/draw";
import { useAction } from "@/components/use-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Snowfall } from "@/components/festive";
import { dateLabel, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

type Check = { level: "ok" | "warn" | "block"; message: string };

type Props = {
  eventId: string;
  status: "open" | "drawn" | "completed" | "cancelled";
  format: "classic" | "wildcard";
  scheduledFor: string | null;
  checks: Check[];
  canDraw: boolean;
  inDraw: number;
  viewed: { viewed: number; assigned: number };
  matches: { giverName: string; recipientName: string; slot: "main" | "wildcard"; viewed: Date | null }[] | null;
};

const icons = {
  ok: <CheckCircleIcon className="size-4 text-success" />,
  warn: <WarningIcon className="size-4 text-gold-foreground" />,
  block: <XCircleIcon className="size-4 text-destructive" />,
};

export function DrawPanel({ eventId, status, format, scheduledFor, checks, canDraw, inDraw, viewed, matches }: Props) {
  const wildcard = format === "wildcard";
  const [pending, run] = useAction();

  if (status === "open") {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Before you draw</CardTitle>
            <CardDescription>Warnings won&apos;t stop the draw. Anything in red will.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2" data-testid="draw-checks">
              {checks.map((c, i) => (
                <li
                  key={i}
                  className={cn("flex items-start gap-2 text-sm", c.level === "block" && "text-destructive")}
                >
                  <span className="mt-0.5 shrink-0">{icons[c.level]}</span>
                  {c.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="relative isolate overflow-hidden">
          <Snowfall count={18} seed={3} className="-z-10" />
          <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="grid gap-1">
              <p className="font-display text-2xl">Ready when you are</p>
              <p className="text-sm text-muted-foreground">
                {scheduledFor
                  ? `Giftr will draw names automatically on ${dateLabel(scheduledFor)}. You can also draw now.`
                  : `Everyone gets an email the moment names are drawn. ${pluralize(inDraw, "person", "people")} in the draw${wildcard ? ", each drawing two gifts" : ""}.`}
              </p>
            </div>
            <ConfirmDialog
              trigger={
                <Button size="lg" disabled={!canDraw || pending} data-testid="draw-now">
                  <ShuffleIcon /> Draw names now
                </Button>
              }
              title="Draw names now?"
              description={
                wildcard
                  ? "Everyone in the draw gets both their main and wild card match by email. People can still join later, and we'll slot them into both without spoiling anyone's match."
                  : "Everyone in the draw gets their match by email. People can still join later, and we'll slot them in without spoiling anyone's match."
              }
              confirmLabel="Draw names"
              onConfirm={() =>
                run(() => drawNow(eventId), {
                  onSuccess: (d) => {
                    toast.success(
                      wildcard
                        ? `Names drawn. ${d.count} people now have two matches.`
                        : `Names drawn. ${d.count} matches sent.`,
                    );
                    if (d.relaxedSoftRules) toast.warning("Some people got the same match as last time.");
                  },
                })
              }
            />
          </CardContent>
        </Card>
        {scheduledFor ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarCheckIcon className="size-4" /> Scheduled draws run early in the morning (UTC) on the chosen day.
          </p>
        ) : null}
      </div>
    );
  }

  if (status !== "drawn") {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">This exchange is {status}.</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <SparkleIcon className="size-6" />
          </span>
          <div>
            <p className="font-display text-2xl">Names are drawn</p>
            <p className="text-sm text-muted-foreground" data-testid="draw-viewed">
              {viewed.viewed} of {viewed.assigned} have opened their match.
            </p>
          </div>
        </CardContent>
      </Card>

      {matches ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeIcon className="size-4" /> All matches
            </CardTitle>
            <CardDescription>
              You turned on organizer access, so everyone can see that you can view this.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm">
              {matches.map((m) => (
                <li key={m.giverName + m.recipientName + m.slot} className="flex items-center gap-2">
                  <span className="font-semibold">{m.giverName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{m.recipientName}</span>
                  {wildcard ? (
                    <Badge variant={m.slot === "main" ? "secondary" : "outline"} className="ml-1">
                      {m.slot === "main" ? "Main" : "Wild card"}
                    </Badge>
                  ) : null}
                  {m.viewed ? <CheckCircleIcon className="ml-auto size-4 text-success" aria-label="Viewed" /> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Changes after the draw</CardTitle>
          <CardDescription>
            When someone joins late or is removed, Giftr patches the chain so only one person&apos;s match changes, and
            emails them. You only need these if something went wrong.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <ConfirmDialog
            trigger={
              <Button variant="outline" disabled={pending}>
                <ShuffleIcon /> Redraw everyone
              </Button>
            }
            title="Redraw everyone's names?"
            description="Every match changes and everyone gets an email. Anonymous messages and gift notes from the current draw are deleted."
            confirmLabel="Redraw"
            destructive
            onConfirm={() => run(() => redrawAll(eventId), { success: "Names redrawn. Everyone has been emailed." })}
          />
          <ConfirmDialog
            trigger={
              <Button variant="ghost" disabled={pending}>
                <ArrowCounterClockwiseIcon /> Undo the draw
              </Button>
            }
            title="Undo the draw?"
            description="All matches are cleared and the exchange reopens, so you can change households, exclusions and rules before drawing again. Nobody is emailed until you draw again."
            confirmLabel="Undo draw"
            destructive
            onConfirm={() => run(() => resetDraw(eventId), { success: "The exchange is open again." })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
