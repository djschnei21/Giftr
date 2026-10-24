import { differenceInCalendarDays, format, parseISO } from "date-fns";

export const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "NZD", "INR", "JPY", "MXN", "BRL", "SEK", "CHF"] as const;

export function money(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function budgetLabel(min: number | null, max: number | null, currency: string) {
  if (min && max && min !== max) return `${money(min, currency)}–${money(max, currency)}`;
  if (max) return `Up to ${money(max, currency)}`;
  if (min) return `${money(min, currency)}+`;
  return null;
}

/** Date-only strings (YYYY-MM-DD) are treated as calendar dates, never shifted by time zone. */
export function dateLabel(value: string | null | undefined, pattern = "EEE, MMM d") {
  if (!value) return "";
  return format(parseISO(value), pattern);
}

export function longDateLabel(value: string | null | undefined) {
  return dateLabel(value, "EEEE, MMMM d, yyyy");
}

export function daysUntil(value: string, now = new Date()) {
  return differenceInCalendarDays(parseISO(value), now);
}

export function todayISO(now = new Date()) {
  return format(now, "yyyy-MM-dd");
}

export function pluralize(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
