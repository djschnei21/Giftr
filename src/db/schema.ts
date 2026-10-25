import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { user } from "./auth-schema";

export * from "./auth-schema";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(16));
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export type Address = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
};

export type Sizes = {
  top?: string;
  bottom?: string;
  shoe?: string;
  ring?: string;
  other?: string;
};

export const profile = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  aboutMe: text("about_me"),
  likes: text("likes"),
  dislikes: text("dislikes"),
  favoriteColors: text("favorite_colors"),
  sizes: jsonb("sizes").$type<Sizes>().notNull().default({}),
  address: jsonb("address").$type<Address>(),
  notifyReminders: boolean("notify_reminders").notNull().default(true),
  notifyMessages: boolean("notify_messages").notNull().default(true),
  unsubscribeToken: text("unsubscribe_token")
    .notNull()
    .unique()
    .$defaultFn(() => nanoid(32)),
  updatedAt: updatedAt(),
});

export const eventStatus = pgEnum("event_status", ["open", "drawn", "completed", "cancelled"]);
export const exchangeType = pgEnum("exchange_type", ["in_person", "shipped"]);
export const drawMode = pgEnum("draw_mode", ["manual", "scheduled"]);
/** Classic: one draw. Wildcard: everyone also draws a second, lower-budget "wildcard" recipient with no wishlist. */
export const drawFormat = pgEnum("draw_format", ["classic", "wildcard"]);
export const assignmentSlot = pgEnum("assignment_slot", ["main", "wildcard"]);

export const event = pgTable(
  "event",
  {
    id: id(),
    name: text("name").notNull(),
    description: text("description"),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: eventStatus("status").notNull().default("open"),
    exchangeDate: date("exchange_date").notNull(),
    exchangeType: exchangeType("exchange_type").notNull().default("in_person"),
    location: text("location"),
    drawFormat: drawFormat("draw_format").notNull().default("classic"),
    budgetMin: integer("budget_min"),
    budgetMax: integer("budget_max"),
    /** Only used when drawFormat is "wildcard" — the smaller, no-wishlist second gift. */
    wildcardBudgetMin: integer("wildcard_budget_min"),
    wildcardBudgetMax: integer("wildcard_budget_max"),
    currency: text("currency").notNull().default("USD"),
    joinDeadline: date("join_deadline"),
    drawMode: drawMode("draw_mode").notNull().default("manual"),
    drawDate: date("draw_date"),
    rules: text("rules"),
    noReciprocal: boolean("no_reciprocal").notNull().default(true),
    singleLoop: boolean("single_loop").notNull().default(false),
    showParticipants: boolean("show_participants").notNull().default(true),
    organizerCanViewMatches: boolean("organizer_can_view_matches").notNull().default(false),
    inviteCode: text("invite_code")
      .notNull()
      .unique()
      .$defaultFn(() => nanoid(10)),
    inviteLinkEnabled: boolean("invite_link_enabled").notNull().default(true),
    previousEventId: text("previous_event_id"),
    drawnAt: timestamp("drawn_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("event_organizer_idx").on(t.organizerId), index("event_status_idx").on(t.status)],
);

export const participantRole = pgEnum("participant_role", ["organizer", "member"]);
export const participantStatus = pgEnum("participant_status", ["joined", "declined", "removed"]);

export const household = pgTable("household", {
  id: id(),
  eventId: text("event_id")
    .notNull()
    .references(() => event.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const wishlist = pgTable(
  "wishlist",
  {
    id: id(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("wishlist_owner_idx").on(t.ownerId)],
);

export const wishlistItem = pgTable(
  "wishlist_item",
  {
    id: id(),
    wishlistId: text("wishlist_id")
      .notNull()
      .references(() => wishlist.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url"),
    imageUrl: text("image_url"),
    price: integer("price"),
    currency: text("currency"),
    notes: text("notes"),
    mostWanted: boolean("most_wanted").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("wishlist_item_list_idx").on(t.wishlistId, t.position)],
);

export const participant = pgTable(
  "participant",
  {
    id: id(),
    eventId: text("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    displayName: text("display_name").notNull(),
    role: participantRole("role").notNull().default("member"),
    status: participantStatus("status").notNull().default("joined"),
    inDraw: boolean("in_draw").notNull().default(true),
    wishlistId: text("wishlist_id").references(() => wishlist.id, { onDelete: "set null" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "set null" }),
    matchViewedAt: timestamp("match_viewed_at", { withTimezone: true }),
    joinedAt: createdAt(),
  },
  (t) => [
    uniqueIndex("participant_event_user_idx").on(t.eventId, t.userId),
    index("participant_user_idx").on(t.userId),
  ],
);

export const invitationStatus = pgEnum("invitation_status", ["pending", "accepted", "declined", "revoked"]);

export const invitation = pgTable(
  "invitation",
  {
    id: id(),
    eventId: text("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    invitedById: text("invited_by_id").references(() => user.id, { onDelete: "set null" }),
    status: invitationStatus("status").notNull().default("pending"),
    createdAt: createdAt(),
    lastSentAt: timestamp("last_sent_at", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("invitation_event_email_idx").on(t.eventId, sql`lower(${t.email})`)],
);

export const exclusion = pgTable(
  "exclusion",
  {
    id: id(),
    eventId: text("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    giverId: text("giver_id")
      .notNull()
      .references(() => participant.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => participant.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("exclusion_pair_idx").on(t.eventId, t.giverId, t.recipientId)],
);

export const giftStatus = pgEnum("gift_status", ["not_started", "purchased", "shipped", "given"]);

export const assignment = pgTable(
  "assignment",
  {
    id: id(),
    eventId: text("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    giverId: text("giver_id")
      .notNull()
      .references(() => participant.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => participant.id, { onDelete: "cascade" }),
    /** "main" for every classic-exchange gift and the wishlist half of a wildcard exchange. */
    slot: assignmentSlot("slot").notNull().default("main"),
    giftStatus: giftStatus("gift_status").notNull().default("not_started"),
    giverNotes: text("giver_notes"),
    boughtItemIds: jsonb("bought_item_ids").$type<string[]>().notNull().default([]),
    changedAt: timestamp("changed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("assignment_giver_slot_idx").on(t.giverId, t.slot),
    index("assignment_event_idx").on(t.eventId),
    index("assignment_recipient_idx").on(t.recipientId),
  ],
);

export const senderRole = pgEnum("sender_role", ["santa", "giftee"]);

export const message = pgTable(
  "message",
  {
    id: id(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignment.id, { onDelete: "cascade" }),
    senderRole: senderRole("sender_role").notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("message_assignment_idx").on(t.assignmentId, t.createdAt)],
);

export const emailLog = pgTable(
  "email_log",
  {
    id: id(),
    kind: text("kind").notNull(),
    dedupeKey: text("dedupe_key").unique(),
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    provider: text("provider").notNull(),
    html: text("html"),
    createdAt: createdAt(),
  },
  (t) => [index("email_log_created_idx").on(t.createdAt)],
);

export const eventRelations = relations(event, ({ one, many }) => ({
  organizer: one(user, { fields: [event.organizerId], references: [user.id] }),
  participants: many(participant),
  invitations: many(invitation),
  households: many(household),
}));

export const participantRelations = relations(participant, ({ one }) => ({
  event: one(event, { fields: [participant.eventId], references: [event.id] }),
  user: one(user, { fields: [participant.userId], references: [user.id] }),
  wishlist: one(wishlist, { fields: [participant.wishlistId], references: [wishlist.id] }),
  household: one(household, { fields: [participant.householdId], references: [household.id] }),
}));

export const wishlistRelations = relations(wishlist, ({ one, many }) => ({
  owner: one(user, { fields: [wishlist.ownerId], references: [user.id] }),
  items: many(wishlistItem),
}));

export const wishlistItemRelations = relations(wishlistItem, ({ one }) => ({
  wishlist: one(wishlist, { fields: [wishlistItem.wishlistId], references: [wishlist.id] }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  event: one(event, { fields: [invitation.eventId], references: [event.id] }),
}));

export const householdRelations = relations(household, ({ one, many }) => ({
  event: one(event, { fields: [household.eventId], references: [event.id] }),
  members: many(participant),
}));

export type Event = typeof event.$inferSelect;
export type Participant = typeof participant.$inferSelect;
export type Wishlist = typeof wishlist.$inferSelect;
export type WishlistItem = typeof wishlistItem.$inferSelect;
export type Profile = typeof profile.$inferSelect;
export type Assignment = typeof assignment.$inferSelect;
export type Invitation = typeof invitation.$inferSelect;
export type AssignmentSlot = Assignment["slot"];
export type DrawFormat = Event["drawFormat"];
