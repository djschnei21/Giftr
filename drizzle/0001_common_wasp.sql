CREATE TYPE "public"."assignment_slot" AS ENUM('main', 'wildcard');--> statement-breakpoint
CREATE TYPE "public"."draw_format" AS ENUM('classic', 'wildcard');--> statement-breakpoint
ALTER TABLE "assignment" DROP CONSTRAINT "assignment_giver_id_unique";--> statement-breakpoint
ALTER TABLE "assignment" ADD COLUMN "slot" "assignment_slot" DEFAULT 'main' NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "draw_format" "draw_format" DEFAULT 'classic' NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "wildcard_budget_min" integer;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "wildcard_budget_max" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_giver_slot_idx" ON "assignment" USING btree ("giver_id","slot");