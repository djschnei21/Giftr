import { addDays, format } from "date-fns";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { nanoid } from "nanoid";
import { Pool } from "pg";
import * as schema from "./schema";

const people = [
  { name: "Alice Hartley", email: "alice@example.com", likes: "Pottery, mystery novels, good olive oil", top: "M", shoe: "8" },
  { name: "Ben Hartley", email: "ben@example.com", likes: "Cycling, coffee gear, vinyl", top: "L", shoe: "11" },
  { name: "Chloe Park", email: "chloe@example.com", likes: "Houseplants, board games, tea", top: "S", shoe: "7" },
  { name: "Dev Patel", email: "dev@example.com", likes: "Hot sauce, hiking, mechanical keyboards", top: "L", shoe: "10" },
  { name: "Emma Rossi", email: "emma@example.com", likes: "Baking, candles (unscented!), jazz", top: "M", shoe: "8.5" },
];

const items: Record<string, { title: string; price: number; url?: string; mostWanted?: boolean; notes?: string }[]> = {
  "alice@example.com": [
    { title: "Hand-thrown ceramic mug", price: 32, mostWanted: true, notes: "Earthy glazes, nothing too bright" },
    { title: "The Thursday Murder Club (hardcover)", price: 18 },
    { title: "Single-estate olive oil sampler", price: 40 },
  ],
  "ben@example.com": [
    { title: "Pour-over coffee kettle", price: 45, mostWanted: true },
    { title: "Bike multi-tool", price: 25 },
  ],
  "chloe@example.com": [
    { title: "Wingspan board game", price: 50, mostWanted: true },
    { title: "Loose-leaf tea tin set", price: 22 },
    { title: "Self-watering planter", price: 28 },
  ],
  "dev@example.com": [{ title: "Hot sauce subscription (3 months)", price: 45, mostWanted: true }],
  "emma@example.com": [
    { title: "Silicone baking mat set", price: 20 },
    { title: "Kind of Blue — vinyl", price: 30, mostWanted: true },
  ],
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const emails = people.map((p) => p.email);

  const existing = await db.select().from(schema.user).where(inArray(schema.user.email, emails));
  if (existing.length) {
    await db.delete(schema.event).where(inArray(schema.event.organizerId, existing.map((u) => u.id)));
    await db.delete(schema.user).where(inArray(schema.user.email, emails));
  }

  const users = await db
    .insert(schema.user)
    .values(people.map((p) => ({ id: nanoid(24), name: p.name, email: p.email, emailVerified: true })))
    .returning();

  const listByUser = new Map<string, string>();
  for (const u of users) {
    const p = people.find((x) => x.email === u.email)!;
    await db.insert(schema.profile).values({
      userId: u.id,
      likes: p.likes,
      sizes: { top: p.top, shoe: p.shoe },
      address: { name: u.name, line1: "123 Evergreen Lane", city: "Portland", region: "OR", postalCode: "97201", country: "US" },
    });
    const [list] = await db.insert(schema.wishlist).values({ ownerId: u.id, name: "My wishlist", isDefault: true }).returning();
    listByUser.set(u.id, list.id);
    await db.insert(schema.wishlistItem).values(
      items[u.email].map((it, i) => ({ wishlistId: list.id, title: it.title, price: it.price, currency: "USD", mostWanted: it.mostWanted ?? false, notes: it.notes, position: i })),
    );
  }

  const alice = users.find((u) => u.email === "alice@example.com")!;
  const [ev] = await db
    .insert(schema.event)
    .values({
      name: "Hartley Family Secret Santa",
      description: "Our annual Christmas Eve exchange at Grandma's. Bring your best wrapping game!",
      organizerId: alice.id,
      exchangeDate: format(addDays(new Date(), 45), "yyyy-MM-dd"),
      joinDeadline: format(addDays(new Date(), 20), "yyyy-MM-dd"),
      location: "Grandma's house",
      budgetMin: 25,
      budgetMax: 50,
      rules: "Homemade gifts are welcome. Keep it under budget — the fun is in the thought!",
    })
    .returning();

  const [household] = await db.insert(schema.household).values({ eventId: ev.id, name: "Alice & Ben" }).returning();
  await db.insert(schema.participant).values(
    users.map((u) => ({
      eventId: ev.id,
      userId: u.id,
      displayName: u.name,
      role: u.id === alice.id ? ("organizer" as const) : ("member" as const),
      wishlistId: listByUser.get(u.id),
      householdId: u.email === "alice@example.com" || u.email === "ben@example.com" ? household.id : null,
    })),
  );

  const count = await db.select().from(schema.participant).where(eq(schema.participant.eventId, ev.id));
  console.log(`Seeded ${users.length} users and "${ev.name}" with ${count.length} participants.`);
  console.log("Sign in as alice@example.com (organizer) via the dev outbox.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
