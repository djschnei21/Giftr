"use client";

import { useRef, useState, useTransition } from "react";
import { Link2Icon, Loader2Icon, StarIcon } from "lucide-react";
import { previewLink } from "@/server/actions/wishlists";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { currencies } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ItemFormState = {
  url: string;
  title: string;
  price: string;
  currency: string;
  imageUrl: string;
  notes: string;
  mostWanted: boolean;
};

export const emptyItem = (currency = "USD"): ItemFormState => ({
  url: "",
  title: "",
  price: "",
  currency,
  imageUrl: "",
  notes: "",
  mostWanted: false,
});

export function toInput(s: ItemFormState) {
  return {
    url: s.url.trim() || null,
    title: s.title,
    price: s.price.trim() === "" ? null : s.price,
    currency: s.currency as (typeof currencies)[number],
    imageUrl: s.imageUrl.trim() || null,
    notes: s.notes,
    mostWanted: s.mostWanted,
  };
}

function looksLikeUrl(v: string) {
  return /^https?:\/\/\S+\.\S+/i.test(v.trim());
}

/** Amazon's placeholder title. A real product name should replace it. */
function isPlaceholderTitle(title: string) {
  const v = title.trim().toLowerCase();
  return !v || v === "amazon" || v === "amazon.com" || v === "amzn";
}

export function ItemForm({
  initial,
  submitLabel,
  onSubmit,
  pending,
  errors = {},
  idPrefix,
}: {
  initial: ItemFormState;
  submitLabel: string;
  onSubmit: (state: ItemFormState, reset: () => void) => void;
  pending: boolean;
  errors?: Record<string, string>;
  idPrefix: string;
}) {
  const [state, setState] = useState(initial);
  const [fetching, startFetch] = useTransition();
  const lastFetched = useRef<string | null>(null);
  const set = (p: Partial<ItemFormState>) => setState((s) => ({ ...s, ...p }));

  function fetchPreview(url: string) {
    const filledIn = !isPlaceholderTitle(state.title) && state.price.trim() !== "";
    if (!looksLikeUrl(url) || (lastFetched.current === url && filledIn)) return;
    lastFetched.current = url;
    startFetch(async () => {
      const res = await previewLink(url.trim());
      if (!res.ok || !res.data) {
        if (lastFetched.current === url) lastFetched.current = null;
        return;
      }
      const p = res.data;
      if (p.title && isPlaceholderTitle(p.title) && lastFetched.current === url) lastFetched.current = null;
      setState((s) => ({
        ...s,
        title: isPlaceholderTitle(s.title) ? p.title || s.title : s.title || p.title || "",
        imageUrl: s.imageUrl || p.imageUrl || "",
        price: s.price || (p.price !== null ? String(p.price) : ""),
        currency: p.currency && (currencies as readonly string[]).includes(p.currency) && !s.price ? p.currency : s.currency,
      }));
    });
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(state, () => {
          setState(emptyItem(state.currency));
          lastFetched.current = null;
        });
      }}
    >
      <Field
        label="Link"
        htmlFor={`${idPrefix}-url`}
        hint={fetching ? "Grabbing the details…" : "Paste a product link and we'll fill in the rest."}
        error={errors.url}
      >
        <div className="relative">
          <Link2Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`${idPrefix}-url`}
            inputMode="url"
            placeholder="https://"
            className="pl-9"
            value={state.url}
            onChange={(e) => set({ url: e.target.value })}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (looksLikeUrl(text)) setTimeout(() => fetchPreview(text), 0);
            }}
            onBlur={(e) => fetchPreview(e.target.value)}
          />
          {fetching ? <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Field label="What is it?" htmlFor={`${idPrefix}-title`} error={errors.title}>
          <div className="flex gap-3">
            {state.imageUrl ? (
              <img src={state.imageUrl} alt="" referrerPolicy="no-referrer" className="size-11 shrink-0 rounded-lg border object-cover" />
            ) : null}
            <Input
              id={`${idPrefix}-title`}
              placeholder="e.g. Hand-thrown ceramic mug"
              value={state.title}
              onChange={(e) => set({ title: e.target.value })}
              maxLength={200}
            />
          </div>
        </Field>
        <Field label="Price" htmlFor={`${idPrefix}-price`} error={errors.price}>
          <div className="flex gap-2">
            <Input
              id={`${idPrefix}-price`}
              inputMode="numeric"
              className="w-24"
              placeholder="30"
              value={state.price}
              onChange={(e) => set({ price: e.target.value.replace(/[^\d]/g, "") })}
            />
            <NativeSelect aria-label="Currency" className="w-24" value={state.currency} onChange={(e) => set({ currency: e.target.value })}>
              {currencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </div>
        </Field>
      </div>

      <Field label="Notes for your Santa" htmlFor={`${idPrefix}-notes`} error={errors.notes}>
        <Textarea
          id={`${idPrefix}-notes`}
          rows={2}
          placeholder="e.g. Size M, any color but orange"
          value={state.notes}
          onChange={(e) => set({ notes: e.target.value })}
          maxLength={1000}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          aria-pressed={state.mostWanted}
          onClick={() => set({ mostWanted: !state.mostWanted })}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            state.mostWanted ? "border-gold bg-gold/15 text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <StarIcon className={cn("size-4", state.mostWanted && "fill-gold text-gold")} /> Most wanted
        </button>
        <Button type="submit" disabled={pending || !state.title.trim()}>
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
