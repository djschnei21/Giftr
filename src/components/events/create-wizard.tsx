"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, CircleNotchIcon, XIcon } from "@/components/icons";
import { toast } from "sonner";
import { createEvent } from "@/server/actions/events";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { SwitchRow } from "@/components/ui/misc";
import { InviteCard } from "@/components/events/invite-card";
import {
  AdvancedFields,
  BasicsFields,
  BudgetRulesFields,
  formStateToInput,
  type EventFormState,
} from "@/components/events/event-form-fields";
import { parseEmailList } from "@/lib/validation";
import { cn } from "@/lib/utils";

const steps = [
  { id: "basics", title: "The basics", subtitle: "Name it and pick a day." },
  { id: "rules", title: "Budget and rules", subtitle: "Set expectations so nobody overspends." },
  { id: "invite", title: "Invite people", subtitle: "Add emails now, or share a link after." },
] as const;

const stepFields: Record<number, (keyof EventFormState)[]> = {
  0: ["name", "exchangeDate", "location", "description"],
  1: [
    "drawFormat",
    "budgetMin",
    "budgetMax",
    "wildcardBudgetMin",
    "wildcardBudgetMax",
    "joinDeadline",
    "drawDate",
    "rules",
  ],
};

export function CreateEventWizard({
  organizerName,
  defaults,
}: {
  organizerName: string;
  defaults: { exchangeDate: string };
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [organizerInDraw, setOrganizerInDraw] = useState(true);
  const [emailDraft, setEmailDraft] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [form, setForm] = useState<EventFormState>({
    name: "",
    description: "",
    exchangeDate: defaults.exchangeDate,
    exchangeType: "in_person",
    location: "",
    drawFormat: "classic",
    budgetMin: "",
    budgetMax: "",
    wildcardBudgetMin: "",
    wildcardBudgetMax: "",
    currency: "USD",
    joinDeadline: "",
    drawMode: "manual",
    drawDate: "",
    rules: "",
    noReciprocal: true,
    singleLoop: false,
    showParticipants: true,
    organizerCanViewMatches: false,
  });

  const patch = (p: Partial<EventFormState>) => {
    setForm((f) => ({ ...f, ...p }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(p)) delete next[k];
      return next;
    });
  };

  function commitEmails() {
    const parsed = parseEmailList(emailDraft);
    if (!parsed.length) return;
    const valid = parsed.filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).map((e) => e.toLowerCase());
    const invalid = parsed.length - valid.length;
    setEmails((prev) => [...new Set([...prev, ...valid])]);
    setEmailDraft(invalid ? parsed.filter((e) => !valid.includes(e.toLowerCase())).join(", ") : "");
    if (invalid) setErrors((e) => ({ ...e, inviteEmails: "Some of those don't look like email addresses." }));
    else setErrors(({ inviteEmails: _, ...rest }) => rest);
  }

  function validateStep(i: number) {
    const errs: Record<string, string> = {};
    if (i === 0) {
      if (!form.name.trim()) errs.name = "Give your exchange a name.";
      if (!form.exchangeDate) errs.exchangeDate = "Pick a date.";
    }
    if (i === 1) {
      if (form.drawMode === "scheduled" && !form.drawDate) errs.drawDate = "Pick a draw date.";
      if (form.budgetMin && form.budgetMax && Number(form.budgetMin) > Number(form.budgetMax))
        errs.budgetMax = "The maximum should be at least the minimum.";
      if (
        form.drawFormat === "wildcard" &&
        form.wildcardBudgetMin &&
        form.wildcardBudgetMax &&
        Number(form.wildcardBudgetMin) > Number(form.wildcardBudgetMax)
      )
        errs.wildcardBudgetMax = "The maximum should be at least the minimum.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function submit() {
    const pendingEmails = parseEmailList(emailDraft).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    const allEmails = [...new Set([...emails, ...pendingEmails.map((e) => e.toLowerCase())])];
    startTransition(async () => {
      const res = await createEvent({ ...formStateToInput(form), organizerInDraw, inviteEmails: allEmails });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        const firstBad = Object.keys(res.fieldErrors ?? {})[0] as keyof EventFormState | undefined;
        const badStep = firstBad
          ? Number(Object.entries(stepFields).find(([, f]) => f.includes(firstBad))?.[0] ?? step)
          : step;
        setStep(badStep);
        toast.error(res.error);
        return;
      }
      toast.success(
        res.data.invited
          ? `Exchange created, ${res.data.invited} invite${res.data.invited === 1 ? "" : "s"} on the way`
          : "Exchange created",
      );
      router.push(`/events/${res.data.id}?created=1`);
    });
  }

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <div className="mx-auto w-full max-w-xl">
        <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
          {steps.map((s, i) => (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold transition",
                  i < step && "bg-primary text-primary-foreground",
                  i === step && "bg-foreground text-background",
                  i > step && "bg-secondary text-muted-foreground",
                )}
                aria-current={i === step ? "step" : undefined}
              >
                {i < step ? <CheckIcon className="size-4" /> : i + 1}
              </span>
              <span className={cn("hidden text-sm sm:inline", i === step ? "font-semibold" : "text-muted-foreground")}>
                {s.title}
              </span>
              {i < steps.length - 1 ? <span className="h-px flex-1 bg-border" /> : null}
            </li>
          ))}
        </ol>

        <header className="mb-8 grid gap-2">
          <h1 className="font-display text-4xl">{current.title}</h1>
          <p className="text-muted-foreground">{current.subtitle}</p>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -16, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            {step === 0 ? <BasicsFields value={form} onChange={patch} errors={errors} /> : null}
            {step === 1 ? (
              <div className="grid gap-6">
                <BudgetRulesFields value={form} onChange={patch} errors={errors} />
                <AdvancedFields
                  value={form}
                  onChange={patch}
                  extra={
                    <SwitchRow
                      id="organizerInDraw"
                      label="I'm taking part too"
                      description="Turn off to organize without giving or getting a gift."
                      checked={organizerInDraw}
                      onCheckedChange={setOrganizerInDraw}
                    />
                  }
                />
              </div>
            ) : null}
            {step === 2 ? (
              <div className="grid gap-4">
                <label htmlFor="emails" className="text-sm font-semibold">
                  Email addresses
                </label>
                <Textarea
                  id="emails"
                  value={emailDraft}
                  placeholder="sam@example.com, alex@example.com"
                  onChange={(e) => setEmailDraft(e.target.value)}
                  onBlur={(e) => {
                    // Adding chips shifts the nav buttons, which would swallow the click that caused this blur.
                    if (e.relatedTarget instanceof Element && e.relatedTarget.closest("[data-wizard-nav]")) return;
                    commitEmails();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      commitEmails();
                    }
                  }}
                  className="min-h-20"
                />
                {errors.inviteEmails ? <p className="text-xs text-destructive">{errors.inviteEmails}</p> : null}
                {emails.length ? (
                  <ul className="flex flex-wrap gap-2" aria-label="Invitees">
                    {emails.map((email) => (
                      <li
                        key={email}
                        className="flex max-w-full items-center gap-1 rounded-lg bg-secondary py-1 pr-1 pl-3 text-sm font-medium break-all"
                      >
                        {email}
                        <button
                          type="button"
                          aria-label={`Remove ${email}`}
                          className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                          onClick={() => setEmails((prev) => prev.filter((e) => e !== email))}
                        >
                          <XIcon className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="rounded-xl bg-accent p-4 text-sm font-medium text-accent-foreground">
                  You&apos;ll also get a link to share in your group chat. Anyone with it can join until names are
                  drawn.
                </p>
                <div className="lg:hidden">
                  <p className="mb-3 text-sm font-semibold">Preview</p>
                  <InviteCard data={{ ...previewData(form), organizerName }} />
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3" data-wizard-nav>
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={pending}>
              <ArrowLeftIcon /> Back
            </Button>
          ) : (
            <span />
          )}
          {isLast ? (
            <Button size="lg" onClick={submit} disabled={pending}>
              {pending ? <CircleNotchIcon className="animate-spin" /> : null}
              Create exchange
            </Button>
          ) : (
            <Button size="lg" onClick={() => validateStep(step) && setStep((s) => s + 1)}>
              Continue <ArrowRightIcon />
            </Button>
          )}
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Invite preview</p>
          <InviteCard data={{ ...previewData(form), organizerName }} />
        </div>
      </aside>
    </div>
  );
}

function previewData(form: EventFormState) {
  return {
    name: form.name,
    exchangeDate: form.exchangeDate,
    exchangeType: form.exchangeType,
    location: form.location,
    drawFormat: form.drawFormat,
    budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
    budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
    wildcardBudgetMin: form.wildcardBudgetMin ? Number(form.wildcardBudgetMin) : null,
    wildcardBudgetMax: form.wildcardBudgetMax ? Number(form.wildcardBudgetMax) : null,
    currency: form.currency,
    description: form.description,
  };
}
