import { CalendarDotsIcon, MapPinIcon, PackageIcon, SparkleIcon, WalletIcon } from "@/components/icons";
import { LogoMark } from "@/components/logo";
import { budgetLabel, longDateLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export type InviteCardData = {
  name: string;
  organizerName: string;
  exchangeDate: string;
  exchangeType: "in_person" | "shipped";
  location?: string | null;
  drawFormat?: "classic" | "wildcard";
  budgetMin: number | null;
  budgetMax: number | null;
  wildcardBudgetMin?: number | null;
  wildcardBudgetMax?: number | null;
  currency: string;
  description?: string | null;
  participantCount?: number;
};

export function InviteCard({ data, className }: { data: InviteCardData; className?: string }) {
  const budget = budgetLabel(data.budgetMin, data.budgetMax, data.currency);
  const wildcardBudget =
    data.drawFormat === "wildcard"
      ? budgetLabel(data.wildcardBudgetMin ?? null, data.wildcardBudgetMax ?? null, data.currency)
      : null;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-card shadow-[0_12px_40px_rgb(0_0_0/0.08)]",
        className,
      )}
    >
      <div className="relative h-28 overflow-hidden bg-primary">
        <svg className="absolute inset-0 size-full opacity-[0.14]" aria-hidden>
          <defs>
            <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.6" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
        <div className="absolute top-0 bottom-0 left-1/2 w-5 -translate-x-1/2 bg-berry" />
        <div className="absolute top-1/2 right-0 left-0 h-5 -translate-y-1/2 bg-berry" />
        <div className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card shadow-md">
          <LogoMark className="size-8" />
        </div>
      </div>
      <div className="grid gap-4 p-6 text-center">
        <div className="grid gap-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {data.organizerName || "You"} invited you to
          </p>
          <h2 className="font-display text-2xl font-semibold break-words">
            {data.name || "Your exchange"}
          </h2>
        </div>
        {data.description ? (
          <p className="line-clamp-3 text-sm whitespace-pre-line text-muted-foreground">{data.description}</p>
        ) : null}
        <ul className="grid gap-2 text-left text-sm">
          <li className="flex min-w-0 items-start gap-2">
            <CalendarDotsIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="min-w-0">{data.exchangeDate ? longDateLabel(data.exchangeDate) : "Pick a date"}</span>
          </li>
          <li className="flex min-w-0 items-start gap-2">
            {data.exchangeType === "shipped" ? (
              <>
                <PackageIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="min-w-0">Gifts are shipped</span>
              </>
            ) : (
              <>
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="min-w-0">{data.location || "In person"}</span>
              </>
            )}
          </li>
          {budget ? (
            <li className="flex min-w-0 items-start gap-2">
              <WalletIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="min-w-0">
                {budget}
                {data.drawFormat === "wildcard" ? " main gift" : ""}
              </span>
            </li>
          ) : null}
          {data.drawFormat === "wildcard" ? (
            <li className="flex min-w-0 items-start gap-2">
              <SparkleIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="min-w-0">
                {wildcardBudget ? `${wildcardBudget} wild card gift` : "Plus a surprise wild card gift"}
              </span>
            </li>
          ) : null}
        </ul>
        {typeof data.participantCount === "number" && data.participantCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {data.participantCount} {data.participantCount === 1 ? "person has" : "people have"} joined
          </p>
        ) : null}
      </div>
    </div>
  );
}
