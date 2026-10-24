"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import { setDisplayName } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WelcomeForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(setDisplayName, null);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="next" value={next} />
      <Label htmlFor="name" className="sr-only">
        Your name
      </Label>
      <Input id="name" name="name" required autoFocus autoComplete="name" placeholder="Your name" maxLength={60} />
      {state && !state.ok ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Continue
      </Button>
    </form>
  );
}
