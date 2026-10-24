CREATE TYPE "public"."draw_mode" AS ENUM('manual', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('open', 'drawn', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."exchange_type" AS ENUM('in_person', 'shipped');--> statement-breakpoint
CREATE TYPE "public"."gift_status" AS ENUM('not_started', 'purchased', 'shipped', 'given');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."participant_role" AS ENUM('organizer', 'member');--> statement-breakpoint
CREATE TYPE "public"."participant_status" AS ENUM('joined', 'declined', 'removed');--> statement-breakpoint
CREATE TYPE "public"."sender_role" AS ENUM('santa', 'giftee');--> statement-breakpoint
CREATE TABLE "assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"giver_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"gift_status" "gift_status" DEFAULT 'not_started' NOT NULL,
	"giver_notes" text,
	"bought_item_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"changed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_giver_id_unique" UNIQUE("giver_id")
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"dedupe_key" text,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"provider" text NOT NULL,
	"html" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_log_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"organizer_id" text NOT NULL,
	"status" "event_status" DEFAULT 'open' NOT NULL,
	"exchange_date" date NOT NULL,
	"exchange_type" "exchange_type" DEFAULT 'in_person' NOT NULL,
	"location" text,
	"budget_min" integer,
	"budget_max" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"join_deadline" date,
	"draw_mode" "draw_mode" DEFAULT 'manual' NOT NULL,
	"draw_date" date,
	"rules" text,
	"no_reciprocal" boolean DEFAULT true NOT NULL,
	"single_loop" boolean DEFAULT false NOT NULL,
	"show_participants" boolean DEFAULT true NOT NULL,
	"organizer_can_view_matches" boolean DEFAULT false NOT NULL,
	"invite_code" text NOT NULL,
	"invite_link_enabled" boolean DEFAULT true NOT NULL,
	"previous_event_id" text,
	"drawn_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "exclusion" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"giver_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by_id" text,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	CONSTRAINT "invitation_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"sender_role" "sender_role" NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participant" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"user_id" text,
	"display_name" text NOT NULL,
	"role" "participant_role" DEFAULT 'member' NOT NULL,
	"status" "participant_status" DEFAULT 'joined' NOT NULL,
	"in_draw" boolean DEFAULT true NOT NULL,
	"wishlist_id" text,
	"household_id" text,
	"match_viewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"about_me" text,
	"likes" text,
	"dislikes" text,
	"favorite_colors" text,
	"sizes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"address" jsonb,
	"notify_reminders" boolean DEFAULT true NOT NULL,
	"notify_messages" boolean DEFAULT true NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "wishlist" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlist_item" (
	"id" text PRIMARY KEY NOT NULL,
	"wishlist_id" text NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"image_url" text,
	"price" integer,
	"currency" text,
	"notes" text,
	"most_wanted" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_giver_id_participant_id_fk" FOREIGN KEY ("giver_id") REFERENCES "public"."participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_recipient_id_participant_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_organizer_id_user_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exclusion" ADD CONSTRAINT "exclusion_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exclusion" ADD CONSTRAINT "exclusion_giver_id_participant_id_fk" FOREIGN KEY ("giver_id") REFERENCES "public"."participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exclusion" ADD CONSTRAINT "exclusion_recipient_id_participant_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household" ADD CONSTRAINT "household_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_assignment_id_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant" ADD CONSTRAINT "participant_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant" ADD CONSTRAINT "participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant" ADD CONSTRAINT "participant_wishlist_id_wishlist_id_fk" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlist"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant" ADD CONSTRAINT "participant_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD CONSTRAINT "wishlist_item_wishlist_id_wishlist_id_fk" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignment_event_idx" ON "assignment" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "assignment_recipient_idx" ON "assignment" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "email_log_created_idx" ON "email_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_organizer_idx" ON "event" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "event_status_idx" ON "event" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "exclusion_pair_idx" ON "exclusion" USING btree ("event_id","giver_id","recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_event_email_idx" ON "invitation" USING btree ("event_id",lower("email"));--> statement-breakpoint
CREATE INDEX "message_assignment_idx" ON "message" USING btree ("assignment_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "participant_event_user_idx" ON "participant" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "participant_user_idx" ON "participant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wishlist_owner_idx" ON "wishlist" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "wishlist_item_list_idx" ON "wishlist_item" USING btree ("wishlist_id","position");--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");