"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CheckIcon, GiftIcon, PackageCheckIcon, ShoppingBagIcon, TruckIcon } from "lucide-react";
import { toast } from "sonner";
import type { AssignmentSlot, WishlistItem } from "@/db/schema";
import { saveGiverNotes, setGiftStatus, toggleBoughtItem } from "@/server/actions/match";
import { ItemCard } from "@/components/wishlists/item-card";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type GiftStatus = "not_started" | "purchased" | "shipped" | "given";

export function GiftStatusPicker({
  eventId,
  slot,
  status,
  shipped,
}: {
  eventId: string;
  slot: AssignmentSlot;
  status: GiftStatus;
  shipped: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [, start] = useTransition();
  const steps: { value: GiftStatus; label: string; icon: React.ReactNode }[] = [
    { value: "not_started", label: "Still looking", icon: <ShoppingBagIcon /> },
    { value: "purchased", label: "Bought it", icon: <PackageCheckIcon /> },
    ...(shipped ? [{ value: "shipped" as const, label: "Shipped", icon: <TruckIcon /> }] : []),
    { value: "given", label: "Given", icon: <GiftIcon /> },
  ];
  const current = steps.findIndex((s) => s.value === optimistic);

  return (
    <div role="radiogroup" aria-label="Gift status" className="grid grid-flow-col gap-1.5 rounded-2xl bg-secondary/60 p-1.5">
      {steps.map((s, i) => {
        const checked = s.value === optimistic;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() =>
              start(async () => {
                setOptimistic(s.value);
                const res = await setGiftStatus(eventId, slot, s.value);
                if (!res.ok) toast.error(res.error);
              })
            }
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-xs font-medium transition outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:flex-row sm:justify-center sm:text-sm [&_svg]:size-4",
              checked
                ? "bg-card text-foreground shadow-sm"
                : i < current
                  ? "text-primary hover:bg-card/60"
                  : "text-muted-foreground hover:bg-card/60",
            )}
          >
            {i < current ? <CheckIcon /> : s.icon}
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

type Item = Pick<WishlistItem, "id" | "title" | "url" | "imageUrl" | "notes" | "mostWanted">;

export function BoughtChecklist({ eventId, items, bought }: { eventId: string; items: Item[]; bought: string[] }) {
  const [optimistic, setOptimistic] = useOptimistic(
    new Set(bought),
    (s: Set<string>, change: { id: string; on: boolean }) => {
      const next = new Set(s);
      if (change.on) next.add(change.id);
      else next.delete(change.id);
      return next;
    },
  );
  const [, start] = useTransition();

  return (
    <ul className="grid gap-3">
      {items.map((item) => {
        const on = optimistic.has(item.id);
        return (
          <li key={item.id}>
            <ItemCard
              item={item}
              muted={on}
              className={on ? "bg-accent/30" : undefined}
              actions={
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={on ? `Unmark ${item.title} as bought` : `Mark ${item.title} as bought`}
                  onClick={() =>
                    start(async () => {
                      setOptimistic({ id: item.id, on: !on });
                      const res = await toggleBoughtItem(eventId, item.id, !on);
                      if (!res.ok) toast.error(res.error);
                    })
                  }
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary",
                  )}
                >
                  <CheckIcon className="size-3.5" />
                  <span className="hidden sm:inline">{on ? "Bought" : "Mark bought"}</span>
                </button>
              }
            />
          </li>
        );
      })}
    </ul>
  );
}

export function GiverNotes({ eventId, slot, initial }: { eventId: string; slot: AssignmentSlot; initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();

  function save() {
    if (value === saved) return;
    start(async () => {
      const res = await saveGiverNotes(eventId, slot, value);
      if (!res.ok) return void toast.error(res.error);
      setSaved(value);
    });
  }

  return (
    <div className="grid gap-1.5">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        maxLength={2000}
        rows={3}
        aria-label="Private notes"
        placeholder="Gift ideas, order numbers, where you hid it…"
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {pending ? "Saving…" : value !== saved ? "Saves when you click away." : "Only you can see these notes."}
      </p>
    </div>
  );
}
