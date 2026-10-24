import { ExternalLinkIcon, GiftIcon, StarIcon } from "lucide-react";
import type { WishlistItem } from "@/db/schema";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

export function hostname(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Presentational item row shared by the editor and the match page. */
export function ItemCard({
  item,
  fallbackCurrency = "USD",
  leading,
  actions,
  className,
  muted,
}: {
  item: Pick<WishlistItem, "id" | "title" | "url" | "imageUrl" | "price" | "currency" | "notes" | "mostWanted">;
  fallbackCurrency?: string;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  muted?: boolean;
}) {
  const host = hostname(item.url);
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border bg-card p-3 sm:p-4", className)}>
      {leading}
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-muted-foreground sm:size-20">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" referrerPolicy="no-referrer" loading="lazy" className="size-full object-cover" />
        ) : (
          <GiftIcon className="size-6 opacity-50" />
        )}
      </div>
      <div className="grid min-w-0 flex-1 gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {item.mostWanted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-[color-mix(in_oklch,var(--gold),black_35%)] dark:text-gold">
              <StarIcon className="size-3 fill-current" /> Most wanted
            </span>
          ) : null}
        </div>
        <p className={cn("font-medium leading-snug break-words", muted && "text-muted-foreground line-through decoration-1")}>
          {item.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {item.price !== null ? <span className="font-medium text-foreground">{money(item.price, item.currency ?? fallbackCurrency)}</span> : null}
          {item.url && host ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline"
            >
              {host} <ExternalLinkIcon className="size-3" />
            </a>
          ) : null}
        </div>
        {item.notes ? <p className="text-sm whitespace-pre-line text-muted-foreground">{item.notes}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-0.5">{actions}</div> : null}
    </div>
  );
}
