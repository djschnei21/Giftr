"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateNotificationPrefs, updateNotificationPrefsByToken, type NotificationPrefs } from "@/server/actions/notifications";
import { SwitchRow } from "@/components/ui/misc";

/** Saves each toggle as soon as it flips, either for the signed-in user or via an unsubscribe token. */
export function NotificationPrefsForm({ initial, token }: { initial: NotificationPrefs; token?: string }) {
  const [prefs, setPrefs] = useState(initial);
  const [, start] = useTransition();

  function change(patch: Partial<NotificationPrefs>) {
    const before = prefs;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    start(async () => {
      const res = token ? await updateNotificationPrefsByToken(token, next) : await updateNotificationPrefs(next);
      if (!res.ok) {
        setPrefs(before);
        toast.error(res.error);
      } else toast.success("Notification settings saved");
    });
  }

  return (
    <div className="grid gap-3">
      <SwitchRow
        id="notify-reminders"
        label="Reminders"
        description="Nudges to add wishlist ideas, open your match, and buy your gift in time."
        checked={prefs.notifyReminders}
        onCheckedChange={(v) => change({ notifyReminders: v })}
      />
      <SwitchRow
        id="notify-messages"
        label="Anonymous messages"
        description="An email when your Santa or giftee writes to you (at most one every 30 minutes)."
        checked={prefs.notifyMessages}
        onCheckedChange={(v) => change({ notifyMessages: v })}
      />
      <p className="text-xs text-muted-foreground">
        We&apos;ll always email you about invitations, the draw, and changes to your match.
      </p>
    </div>
  );
}
