import { appUrl } from "@/lib/utils";

export const unsubscribeTypes = ["reminders", "messages", "all"] as const;
export type UnsubscribeType = (typeof unsubscribeTypes)[number];

export function parseUnsubscribeType(value: unknown): UnsubscribeType {
  return unsubscribeTypes.includes(value as UnsubscribeType) ? (value as UnsubscribeType) : "all";
}

/** The page people land on from the footer link; it asks before changing anything. */
export function unsubscribePageUrl(token: string, type: UnsubscribeType) {
  return appUrl(`/unsubscribe/${encodeURIComponent(token)}?type=${type}`);
}

/** RFC 8058 one-click endpoint for the List-Unsubscribe header (mail clients POST to it). */
export function oneClickUnsubscribeUrl(token: string, type: UnsubscribeType) {
  return appUrl(`/api/unsubscribe/${encodeURIComponent(token)}?type=${type}`);
}

export function unsubscribePatch(type: UnsubscribeType) {
  return type === "reminders"
    ? { notifyReminders: false }
    : type === "messages"
      ? { notifyMessages: false }
      : { notifyReminders: false, notifyMessages: false };
}
