"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleNotchIcon } from "@/components/icons";
import { toast } from "sonner";
import type { Event } from "@/db/schema";
import { cancelEvent, setOrganizerInDraw, updateEvent } from "@/server/actions/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { SwitchRow } from "@/components/ui/misc";
import {
  AdvancedFields,
  BasicsFields,
  BudgetRulesFields,
  eventToFormState,
  formStateToInput,
  type EventFormState,
} from "@/components/events/event-form-fields";

export function SettingsForm({ event, organizerInDraw }: { event: Event; organizerInDraw: boolean | null }) {
  const router = useRouter();
  const [form, setForm] = useState<EventFormState>(() => eventToFormState(event));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [inDraw, setInDraw] = useState(organizerInDraw ?? false);
  const locked = event.status !== "open";
  const patch = (p: Partial<EventFormState>) => setForm((f) => ({ ...f, ...p }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateEvent(event.id, formStateToInput(form));
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      setErrors({});
      toast.success("Changes saved");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={save} className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent>
            <BasicsFields value={form} onChange={patch} errors={errors} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Budget, dates & rules</CardTitle>
            {locked ? (
              <CardDescription>
                Names are drawn, so draw settings are locked. Budget, dates and notes can still change.
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-6">
            <BudgetRulesFields value={form} onChange={patch} errors={errors} locked={locked} />
            <AdvancedFields
              value={form}
              onChange={patch}
              locked={locked}
              extra={
                organizerInDraw !== null ? (
                  <SwitchRow
                    id="organizerInDraw"
                    label="I'm taking part too"
                    description={
                      locked ? "Locked after the draw." : "Turn off to organize without giving or getting a gift."
                    }
                    checked={inDraw}
                    disabled={locked}
                    onCheckedChange={async (v) => {
                      setInDraw(v);
                      const res = await setOrganizerInDraw(event.id, v);
                      if (!res.ok) {
                        setInDraw(!v);
                        toast.error(res.error);
                      } else router.refresh();
                    }}
                  />
                ) : null
              }
            />
          </CardContent>
        </Card>
        <div className="sticky bottom-24 z-10 flex justify-end sm:bottom-4">
          <Button type="submit" size="lg" disabled={pending} className="shadow-lg">
            {pending ? <CircleNotchIcon className="animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      </form>

      {event.status !== "cancelled" ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Cancel this exchange</CardTitle>
            <CardDescription>Everyone who joined gets a short note. This can&apos;t be undone.</CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="border-destructive/40 text-destructive">
                  Cancel exchange
                </Button>
              }
              title="Cancel this exchange?"
              description="Participants will be notified and the exchange will be closed for good."
              confirmLabel="Cancel exchange"
              destructive
              onConfirm={async () => {
                const res = await cancelEvent(event.id);
                if (!res.ok) return void toast.error(res.error);
                toast.success("Exchange cancelled");
                router.push(`/events/${event.id}`);
              }}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
