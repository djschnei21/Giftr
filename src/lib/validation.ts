import { z } from "zod";
import { currencies } from "@/lib/format";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");
const optionalDate = z
  .union([isoDate, z.literal(""), z.null()])
  .optional()
  .transform((v) => v || null);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .optional()
    .nullable()
    .transform((v) => v || null);
const optionalAmount = z
  .union([z.coerce.number().int("Whole numbers only.").min(0).max(100_000), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v === undefined || v === null ? null : v));

export const emailList = z
  .array(z.string().trim().toLowerCase().pipe(z.email("One of those emails doesn't look right.")))
  .max(100, "That's a lot of invites — add up to 100 at a time.")
  .transform((list) => [...new Set(list)]);

export function parseEmailList(raw: string) {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const eventFields = {
  name: z.string().trim().min(1, "Give your exchange a name.").max(80, "Keep it under 80 characters."),
  description: optionalText(1000),
  exchangeDate: isoDate,
  exchangeType: z.enum(["in_person", "shipped"]),
  location: optionalText(200),
  budgetMin: optionalAmount,
  budgetMax: optionalAmount,
  currency: z.enum(currencies),
  joinDeadline: optionalDate,
  drawMode: z.enum(["manual", "scheduled"]),
  drawDate: optionalDate,
  rules: optionalText(2000),
  noReciprocal: z.boolean(),
  singleLoop: z.boolean(),
  showParticipants: z.boolean(),
  organizerCanViewMatches: z.boolean(),
};

type DateChecked = {
  exchangeDate: string;
  joinDeadline: string | null;
  drawMode: "manual" | "scheduled";
  drawDate: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
};

function checkDates<T extends DateChecked>(v: T, ctx: z.RefinementCtx, today: string) {
  if (v.exchangeDate < today) ctx.addIssue({ code: "custom", path: ["exchangeDate"], message: "The exchange date has already passed." });
  if (v.joinDeadline && v.joinDeadline > v.exchangeDate)
    ctx.addIssue({ code: "custom", path: ["joinDeadline"], message: "The join deadline must be before the exchange." });
  if (v.drawMode === "scheduled") {
    if (!v.drawDate) ctx.addIssue({ code: "custom", path: ["drawDate"], message: "Pick a draw date." });
    else if (v.drawDate > v.exchangeDate)
      ctx.addIssue({ code: "custom", path: ["drawDate"], message: "Names must be drawn before the exchange." });
    else if (v.drawDate < today) ctx.addIssue({ code: "custom", path: ["drawDate"], message: "The draw date has already passed." });
    else if (v.joinDeadline && v.drawDate < v.joinDeadline)
      ctx.addIssue({ code: "custom", path: ["drawDate"], message: "Draw on or after the join deadline." });
  }
  if (v.budgetMin !== null && v.budgetMax !== null && v.budgetMin > v.budgetMax)
    ctx.addIssue({ code: "custom", path: ["budgetMax"], message: "The maximum should be at least the minimum." });
}

export function createEventSchema(today: string) {
  return z
    .object({ ...eventFields, organizerInDraw: z.boolean(), inviteEmails: emailList })
    .superRefine((v, ctx) => checkDates(v, ctx, today));
}

export function updateEventSchema(today: string) {
  return z.object(eventFields).superRefine((v, ctx) => checkDates(v, ctx, today));
}

export type CreateEventInput = z.input<ReturnType<typeof createEventSchema>>;
export type UpdateEventInput = z.input<ReturnType<typeof updateEventSchema>>;
