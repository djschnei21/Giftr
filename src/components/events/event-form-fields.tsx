"use client";

import { ChevronDownIcon, HandshakeIcon, PackageIcon, GiftIcon, SparklesIcon } from "lucide-react";
import { Field } from "@/components/ui/label";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { SwitchRow } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/segmented";
import { currencies } from "@/lib/format";
import type { Event } from "@/db/schema";

export type EventFormState = {
  name: string;
  description: string;
  exchangeDate: string;
  exchangeType: "in_person" | "shipped";
  location: string;
  drawFormat: "classic" | "wildcard";
  budgetMin: string;
  budgetMax: string;
  wildcardBudgetMin: string;
  wildcardBudgetMax: string;
  currency: (typeof currencies)[number];
  joinDeadline: string;
  drawMode: "manual" | "scheduled";
  drawDate: string;
  rules: string;
  noReciprocal: boolean;
  singleLoop: boolean;
  showParticipants: boolean;
  organizerCanViewMatches: boolean;
};

export function eventToFormState(ev: Event): EventFormState {
  return {
    name: ev.name,
    description: ev.description ?? "",
    exchangeDate: ev.exchangeDate,
    exchangeType: ev.exchangeType,
    location: ev.location ?? "",
    drawFormat: ev.drawFormat,
    budgetMin: ev.budgetMin?.toString() ?? "",
    budgetMax: ev.budgetMax?.toString() ?? "",
    wildcardBudgetMin: ev.wildcardBudgetMin?.toString() ?? "",
    wildcardBudgetMax: ev.wildcardBudgetMax?.toString() ?? "",
    currency: (currencies as readonly string[]).includes(ev.currency) ? (ev.currency as EventFormState["currency"]) : "USD",
    joinDeadline: ev.joinDeadline ?? "",
    drawMode: ev.drawMode,
    drawDate: ev.drawDate ?? "",
    rules: ev.rules ?? "",
    noReciprocal: ev.noReciprocal,
    singleLoop: ev.singleLoop,
    showParticipants: ev.showParticipants,
    organizerCanViewMatches: ev.organizerCanViewMatches,
  };
}

type FieldsProps = {
  value: EventFormState;
  onChange: (patch: Partial<EventFormState>) => void;
  errors?: Record<string, string>;
  locked?: boolean;
};

export function BasicsFields({ value, onChange, errors = {} }: FieldsProps) {
  return (
    <div className="grid gap-5">
      <Field label="Exchange name" htmlFor="name" error={errors.name}>
        <Input
          id="name"
          value={value.name}
          maxLength={80}
          placeholder="Office Holiday Swap"
          onChange={(e) => onChange({ name: e.target.value })}
          aria-invalid={Boolean(errors.name)}
        />
      </Field>
      <Field label="Gift exchange day" htmlFor="exchangeDate" error={errors.exchangeDate}>
        <Input
          id="exchangeDate"
          type="date"
          value={value.exchangeDate}
          onChange={(e) => onChange({ exchangeDate: e.target.value })}
          aria-invalid={Boolean(errors.exchangeDate)}
        />
      </Field>
      <div className="grid gap-2">
        <span className="text-sm font-medium">How are gifts exchanged?</span>
        <Segmented
          name="exchangeType"
          value={value.exchangeType}
          onChange={(exchangeType) => onChange({ exchangeType })}
          options={[
            { value: "in_person", label: "In person", icon: <HandshakeIcon />, description: "Everyone meets up" },
            { value: "shipped", label: "Shipped", icon: <PackageIcon />, description: "Santas see addresses" },
          ]}
        />
      </div>
      {value.exchangeType === "in_person" ? (
        <Field label="Where?" htmlFor="location" hint="Optional" error={errors.location}>
          <Input
            id="location"
            value={value.location}
            maxLength={200}
            placeholder="The Miller's place, 7pm"
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </Field>
      ) : null}
      <Field label="A note for everyone" htmlFor="description" hint="Optional" error={errors.description}>
        <Textarea
          id="description"
          value={value.description}
          maxLength={1000}
          placeholder="Ugly sweaters encouraged."
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </Field>
    </div>
  );
}

export function BudgetRulesFields({ value, onChange, errors = {}, locked }: FieldsProps) {
  const wildcard = value.drawFormat === "wildcard";
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <span className="text-sm font-medium">Exchange format</span>
        <Segmented
          name="drawFormat"
          value={value.drawFormat}
          disabled={locked}
          onChange={(drawFormat) => onChange({ drawFormat })}
          options={[
            { value: "classic", label: "Classic", icon: <GiftIcon />, description: "One match each, wishlists on" },
            { value: "wildcard", label: "Wild card", icon: <SparklesIcon />, description: "Two matches: a main gift + a surprise" },
          ]}
        />
      </div>

      <div className="grid gap-2">
        <span className="text-sm font-medium">{wildcard ? "Main gift budget" : "Budget"}</span>
        <div className="grid grid-cols-[1fr_1fr_6.5rem] gap-2">
          <Input
            aria-label={wildcard ? "Minimum main gift budget" : "Minimum budget"}
            inputMode="numeric"
            placeholder="Min"
            value={value.budgetMin}
            onChange={(e) => onChange({ budgetMin: e.target.value.replace(/\D/g, "") })}
          />
          <Input
            aria-label={wildcard ? "Maximum main gift budget" : "Maximum budget"}
            inputMode="numeric"
            placeholder="Max"
            value={value.budgetMax}
            onChange={(e) => onChange({ budgetMax: e.target.value.replace(/\D/g, "") })}
            aria-invalid={Boolean(errors.budgetMax)}
          />
          <NativeSelect
            aria-label="Currency"
            value={value.currency}
            onChange={(e) => onChange({ currency: e.target.value as EventFormState["currency"] })}
          >
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </NativeSelect>
        </div>
        {errors.budgetMax ? <p className="text-[13px] text-destructive">{errors.budgetMax}</p> : null}
      </div>

      {wildcard ? (
        <div className="grid gap-2">
          <span className="text-sm font-medium">Wild card gift budget</span>
          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <Input
              aria-label="Minimum wild card budget"
              inputMode="numeric"
              placeholder="Min"
              value={value.wildcardBudgetMin}
              onChange={(e) => onChange({ wildcardBudgetMin: e.target.value.replace(/\D/g, "") })}
            />
            <Input
              aria-label="Maximum wild card budget"
              inputMode="numeric"
              placeholder="Max"
              value={value.wildcardBudgetMax}
              onChange={(e) => onChange({ wildcardBudgetMax: e.target.value.replace(/\D/g, "") })}
              aria-invalid={Boolean(errors.wildcardBudgetMax)}
            />
          </div>
          {errors.wildcardBudgetMax ? <p className="text-[13px] text-destructive">{errors.wildcardBudgetMax}</p> : null}
          <p className="text-[13px] text-muted-foreground">
            No wishlist here — just a name and this budget, so it stays a fun surprise.
          </p>
        </div>
      ) : null}

      <Field label="Join by" htmlFor="joinDeadline" hint="Optional. We'll remind people who haven't joined." error={errors.joinDeadline}>
        <Input id="joinDeadline" type="date" value={value.joinDeadline} onChange={(e) => onChange({ joinDeadline: e.target.value })} />
      </Field>

      <div className="grid gap-2">
        <span className="text-sm font-medium">When should names be drawn?</span>
        <Segmented
          name="drawMode"
          value={value.drawMode}
          disabled={locked}
          onChange={(drawMode) => onChange({ drawMode })}
          options={[
            { value: "manual", label: "When I'm ready", description: "Tap “Draw names”" },
            { value: "scheduled", label: "On a date", description: "Giftr draws automatically" },
          ]}
        />
        {value.drawMode === "scheduled" ? (
          <div className="mt-1 grid gap-2">
            <Input
              aria-label="Draw date"
              type="date"
              value={value.drawDate}
              disabled={locked}
              onChange={(e) => onChange({ drawDate: e.target.value })}
              aria-invalid={Boolean(errors.drawDate)}
            />
            {errors.drawDate ? <p className="text-[13px] text-destructive">{errors.drawDate}</p> : null}
          </div>
        ) : null}
      </div>

      <Field label="House rules" htmlFor="rules" hint="Optional" error={errors.rules}>
        <Textarea
          id="rules"
          value={value.rules}
          maxLength={2000}
          placeholder="Homemade gifts welcome. No gift cards."
          onChange={(e) => onChange({ rules: e.target.value })}
        />
      </Field>
    </div>
  );
}

export function AdvancedFields({
  value,
  onChange,
  locked,
  extra,
}: FieldsProps & { extra?: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
        Advanced options
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid gap-4 border-t px-4 py-4">
        {extra}
        <SwitchRow
          id="noReciprocal"
          label="No two-person swaps"
          description="If Sam gets Alex, Alex won't get Sam."
          checked={value.noReciprocal}
          disabled={locked}
          onCheckedChange={(noReciprocal) => onChange({ noReciprocal })}
        />
        <SwitchRow
          id="singleLoop"
          label="One big loop"
          description="Gifts pass around the whole group in a single chain."
          checked={value.singleLoop}
          disabled={locked}
          onCheckedChange={(singleLoop) => onChange({ singleLoop })}
        />
        <SwitchRow
          id="showParticipants"
          label="Show who's participating"
          description="Members can see the list of people in the exchange."
          checked={value.showParticipants}
          onCheckedChange={(showParticipants) => onChange({ showParticipants })}
        />
        <SwitchRow
          id="organizerCanViewMatches"
          label="Organizer can see all matches"
          description="Everyone will see that this is on. Can't be turned on after the draw."
          checked={value.organizerCanViewMatches}
          disabled={locked && !value.organizerCanViewMatches}
          onCheckedChange={(organizerCanViewMatches) => onChange({ organizerCanViewMatches })}
        />
      </div>
    </details>
  );
}

export function formStateToInput(v: EventFormState) {
  return {
    ...v,
    budgetMin: v.budgetMin === "" ? null : Number(v.budgetMin),
    budgetMax: v.budgetMax === "" ? null : Number(v.budgetMax),
    wildcardBudgetMin: v.drawFormat === "wildcard" && v.wildcardBudgetMin !== "" ? Number(v.wildcardBudgetMin) : null,
    wildcardBudgetMax: v.drawFormat === "wildcard" && v.wildcardBudgetMax !== "" ? Number(v.wildcardBudgetMax) : null,
    joinDeadline: v.joinDeadline || null,
    drawDate: v.drawDate || null,
    location: v.exchangeType === "in_person" ? v.location : "",
  };
}
