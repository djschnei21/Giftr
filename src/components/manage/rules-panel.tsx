"use client";

import { useState } from "react";
import { ArrowRightIcon, ArrowLeftRightIcon, HomeIcon, LockIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { addExclusion, deleteHousehold, removeExclusion, saveHousehold } from "@/server/actions/draw";
import { useAction } from "@/components/use-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveDialog } from "@/components/ui/dialog";
import { Input, NativeSelect } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { SwitchRow } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

type Person = { id: string; name: string; householdId: string | null };
type Household = { id: string; name: string };
type Exclusion = { id: string; giverId: string; recipientId: string; giverName: string; recipientName: string };
type Blocker = { message: string };

type Props = {
  eventId: string;
  locked: boolean;
  people: Person[];
  households: Household[];
  exclusions: Exclusion[];
  blockers: Blocker[];
};

/** Collapse A→B + B→A into one "both ways" row. */
function groupExclusions(list: Exclusion[]) {
  const seen = new Set<string>();
  const rows: { ids: string[]; a: string; b: string; mutual: boolean }[] = [];
  for (const e of list) {
    if (seen.has(e.id)) continue;
    const back = list.find((x) => x.giverId === e.recipientId && x.recipientId === e.giverId);
    seen.add(e.id);
    if (back) seen.add(back.id);
    rows.push({ ids: back ? [e.id, back.id] : [e.id], a: e.giverName, b: e.recipientName, mutual: !!back });
  }
  return rows;
}

export function RulesPanel({ eventId, locked, people, households, exclusions, blockers }: Props) {
  const [pending, run] = useAction();
  const [editing, setEditing] = useState<Household | "new" | null>(null);
  const [hhName, setHhName] = useState("");
  const [hhMembers, setHhMembers] = useState<Set<string>>(new Set());
  const [giver, setGiver] = useState("");
  const [recipient, setRecipient] = useState("");
  const [bothWays, setBothWays] = useState(true);
  const rows = groupExclusions(exclusions);

  function openHousehold(h: Household | "new") {
    setEditing(h);
    setHhName(h === "new" ? "" : h.name);
    setHhMembers(new Set(h === "new" ? [] : people.filter((p) => p.householdId === h.id).map((p) => p.id)));
  }

  return (
    <div className="grid gap-6">
      {locked ? (
        <div className="flex items-start gap-3 rounded-2xl border bg-secondary/60 p-4 text-sm">
          <LockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p>Names are drawn, so these rules are locked. To change them, undo the draw from the Draw tab and draw again.</p>
        </div>
      ) : blockers.length ? (
        <div role="alert" className="grid gap-1 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">These rules make the draw impossible</p>
          {blockers.map((b, i) => (
            <p key={i}>{b.message}</p>
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-1.5">
              <CardTitle>Households</CardTitle>
              <CardDescription>People in the same household never draw each other — perfect for couples and roommates.</CardDescription>
            </div>
            {!locked ? (
              <Button variant="outline" size="sm" onClick={() => openHousehold("new")} disabled={people.length < 2}>
                <PlusIcon /> Add
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {households.length === 0 ? (
            <p className="text-sm text-muted-foreground">No households yet.</p>
          ) : (
            <ul className="grid gap-3" data-testid="households">
              {households.map((h) => {
                const members = people.filter((p) => p.householdId === h.id);
                return (
                  <li key={h.id} className="flex items-center gap-3 rounded-xl border p-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <HomeIcon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{h.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{members.map((m) => m.name).join(", ")}</p>
                    </div>
                    {!locked ? (
                      <>
                        <Button variant="ghost" size="icon" aria-label={`Edit ${h.name}`} onClick={() => openHousehold(h)}>
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${h.name}`}
                          disabled={pending}
                          onClick={() => run(() => deleteHousehold(eventId, h.id), { success: "Household removed" })}
                        >
                          <Trash2Icon />
                        </Button>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exclusions</CardTitle>
          <CardDescription>Keep specific people from drawing each other — like last year&apos;s pair, or the boss.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {rows.length ? (
            <ul className="grid gap-2" data-testid="exclusions">
              {rows.map((r) => (
                <li key={r.ids.join()} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                  <span className="font-medium">{r.a}</span>
                  {r.mutual ? (
                    <ArrowLeftRightIcon className="size-4 text-muted-foreground" aria-label="and" />
                  ) : (
                    <ArrowRightIcon className="size-4 text-muted-foreground" aria-label="won't draw" />
                  )}
                  <span className="font-medium">{r.b}</span>
                  <span className="text-muted-foreground">{r.mutual ? "won't draw each other" : "won't be drawn"}</span>
                  {!locked ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto size-8"
                      aria-label={`Remove exclusion between ${r.a} and ${r.b}`}
                      disabled={pending}
                      onClick={() => run(() => removeExclusion(eventId, r.ids))}
                    >
                      <XIcon />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No exclusions yet.</p>
          )}

          {!locked && people.length >= 2 ? (
            <form
              className="grid gap-3 rounded-2xl bg-secondary/50 p-4"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => addExclusion(eventId, giver, recipient, bothWays), {
                  success: "Exclusion added",
                  onSuccess: () => {
                    setGiver("");
                    setRecipient("");
                  },
                });
              }}
            >
              <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <Field label="This person" htmlFor="ex-giver">
                  <NativeSelect id="ex-giver" value={giver} onChange={(e) => setGiver(e.target.value)}>
                    <option value="">Choose…</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <span className="hidden pb-2.5 text-sm text-muted-foreground sm:block">won&apos;t draw</span>
                <Field label="This person" htmlFor="ex-recipient">
                  <NativeSelect id="ex-recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)}>
                    <option value="">Choose…</option>
                    {people
                      .filter((p) => p.id !== giver)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </NativeSelect>
                </Field>
              </div>
              <SwitchRow id="ex-both" label="Both ways" description="Neither can draw the other." checked={bothWays} onCheckedChange={setBothWays} />
              <Button type="submit" variant="secondary" className="justify-self-end" disabled={pending || !giver || !recipient}>
                <PlusIcon /> Add exclusion
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === "new" ? "New household" : "Edit household"}
        description="Pick everyone who lives together."
      >
        <form
          className="grid gap-4 pb-5 sm:pb-0"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveHousehold(eventId, editing === "new" || !editing ? null : editing.id, { name: hhName, memberIds: [...hhMembers] }), {
              success: "Household saved",
              onSuccess: () => setEditing(null),
            });
          }}
        >
          <Field label="Name" htmlFor="hh-name">
            <Input id="hh-name" placeholder="The Hartleys" value={hhName} onChange={(e) => setHhName(e.target.value)} maxLength={60} />
          </Field>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Members</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {people.map((p) => {
                const on = hhMembers.has(p.id);
                const elsewhere = p.householdId && (editing === "new" || p.householdId !== editing?.id);
                return (
                  <label
                    key={p.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                      on && "border-primary bg-accent/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--primary)]"
                      checked={on}
                      onChange={() =>
                        setHhMembers((s) => {
                          const next = new Set(s);
                          if (on) next.delete(p.id);
                          else next.add(p.id);
                          return next;
                        })
                      }
                    />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    {elsewhere && p.householdId ? <Badge variant="outline">moves</Badge> : null}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <Button type="submit" disabled={pending || !hhName.trim() || hhMembers.size < 2}>
            Save household
          </Button>
        </form>
      </ResponsiveDialog>
    </div>
  );
}
