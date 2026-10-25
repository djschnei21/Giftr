"use client";

import { useState, useTransition } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVerticalIcon, PencilSimpleIcon, PlusIcon, StarIcon, TrashIcon } from "@/components/icons";
import { toast } from "sonner";
import type { WishlistItem } from "@/db/schema";
import {
  addWishlistItem,
  deleteWishlistItem,
  reorderWishlistItems,
  toggleMostWanted,
  updateWishlistItem,
} from "@/server/actions/wishlists";
import { useAction } from "@/components/use-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveDialog } from "@/components/ui/dialog";
import { ItemCard } from "./item-card";
import { emptyItem, ItemForm, toInput, type ItemFormState } from "./item-form";
import { cn } from "@/lib/utils";

function SortableItem({
  item,
  onEdit,
  onDelete,
  onStar,
}: {
  item: WishlistItem;
  onEdit: () => void;
  onDelete: () => void;
  onStar: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10")}
    >
      <ItemCard
        item={item}
        className={cn(isDragging && "shadow-lg ring-2 ring-primary/30")}
        leading={
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Reorder ${item.title}`}
            className="-ml-1 flex h-16 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing sm:h-20"
            {...attributes}
            {...listeners}
          >
            <DotsSixVerticalIcon className="size-4" />
          </button>
        }
        actions={
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              className="sm:size-10"
              onClick={onStar}
              aria-label={item.mostWanted ? "Unmark most wanted" : "Mark most wanted"}
            >
              <StarIcon weight={item.mostWanted ? "fill" : "bold"} className={cn(item.mostWanted && "text-gold")} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="sm:size-10"
              onClick={onEdit}
              aria-label={`Edit ${item.title}`}
            >
              <PencilSimpleIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="sm:size-10"
              onClick={onDelete}
              aria-label={`Delete ${item.title}`}
            >
              <TrashIcon />
            </Button>
          </>
        }
      />
    </li>
  );
}

function toState(item: WishlistItem): ItemFormState {
  return {
    url: item.url ?? "",
    title: item.title,
    imageUrl: item.imageUrl ?? "",
    notes: item.notes ?? "",
    mostWanted: item.mostWanted,
  };
}

export function WishlistEditor({ wishlistId, items: serverItems }: { wishlistId: string; items: WishlistItem[] }) {
  const [items, setItems] = useState(serverItems);
  const [pending, run] = useAction();
  const [, startReorder] = useTransition();
  const [editing, setEditing] = useState<WishlistItem | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(serverItems.length === 0);

  const [synced, setSynced] = useState(serverItems);
  if (synced !== serverItems) {
    setSynced(serverItems);
    setItems(serverItems);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, from, to);
    setItems(next);
    startReorder(async () => {
      const res = await reorderWishlistItems(
        wishlistId,
        next.map((i) => i.id),
      );
      if (!res.ok) {
        toast.error(res.error);
        setItems(serverItems);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {adding ? (
        <Card>
          <CardHeader>
            <CardTitle>Add an idea</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemForm
              idPrefix="new-item"
              initial={emptyItem()}
              submitLabel="Add to wishlist"
              pending={pending}
              errors={errors}
              onSubmit={(state, reset) =>
                run(
                  async () => {
                    const res = await addWishlistItem(wishlistId, toInput(state));
                    setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
                    return res;
                  },
                  { success: "Added", onSuccess: reset },
                )
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" className="justify-self-start" onClick={() => setAdding(true)}>
          <PlusIcon /> Add an idea
        </Button>
      )}

      {items.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="grid grid-cols-1 gap-3" aria-label="Wishlist items" data-testid="wishlist-items">
              {items.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onEdit={() => {
                    setErrors({});
                    setEditing(item);
                  }}
                  onStar={() => {
                    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, mostWanted: !i.mostWanted } : i)));
                    run(() => toggleMostWanted(item.id, !item.mostWanted));
                  }}
                  onDelete={() => {
                    setItems((list) => list.filter((i) => i.id !== item.id));
                    run(() => deleteWishlistItem(item.id), { success: `Removed “${item.title}”` });
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : null}
      {items.length > 1 ? (
        <p className="text-center text-xs text-muted-foreground">Drag the handle to put your favorites first.</p>
      ) : null}

      <ResponsiveDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title="Edit idea">
        {editing ? (
          <div className="pb-5 sm:pb-0">
            <ItemForm
              key={editing.id}
              idPrefix="edit-item"
              initial={toState(editing)}
              submitLabel="Save"
              pending={pending}
              errors={errors}
              onSubmit={(state) =>
                run(
                  async () => {
                    const res = await updateWishlistItem(editing.id, toInput(state));
                    setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
                    return res;
                  },
                  { success: "Saved", onSuccess: () => setEditing(null) },
                )
              }
            />
          </div>
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}
