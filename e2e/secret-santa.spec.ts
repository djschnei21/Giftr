import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { closeDb, latestEmailLink, newUserContext, testDb } from "./helpers";

const run = Date.now().toString(36);
const person = (first: string) => ({
  name: `${first} E2e`,
  email: `${first.toLowerCase()}+${run}@example.com`,
  gift: `${first}'s ${["wool socks", "pour-over kettle", "board game", "houseplant"][first.length % 4]}`,
});
const alice = person("Alice");
const ben = person("Ben");
const carol = person("Carol");
const dan = person("Dan");

async function expectAccessible(page: Page) {
  await expect(page).toHaveTitle(/Giftr/);
  // Entrance animations read as low contrast while they fade in, so let the one-shot ones finish.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.playState !== "running" || a.effect?.getComputedTiming().iterations === Infinity),
  );
  // Toasts are scanned mid-animation, where their partial opacity reads as low contrast.
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).exclude("[data-sonner-toaster]").analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

async function addWishlistIdea(page: Page, eventId: string, title: string) {
  await page.goto(`/events/${eventId}`);
  await page.getByRole("link", { name: "add a few ideas" }).click();
  await page.waitForURL(/\/wishlists\//);
  await page.getByLabel("What is it?").fill(title);
  await page.getByRole("button", { name: "Add to wishlist" }).click();
  await expect(page.getByTestId("wishlist-items")).toContainText(title);
}

async function unwrap(page: Page, eventId: string) {
  await page.goto(`/events/${eventId}`);
  await page.getByRole("button", { name: "Unwrap your match" }).click();
  return page.getByTestId("giftee-name");
}

test.afterAll(closeDb);

test("four friends run a Secret Santa from invite to anonymous chat", async ({ browser }) => {
  test.setTimeout(240_000);

  // Alice creates the exchange and invites Ben by email.
  const a = await newUserContext(browser, alice.email, alice.name, "/events/new");
  await a.page.getByLabel("Exchange name").fill(`Friendsmas ${run}`);
  await a.page.getByRole("button", { name: "Continue" }).click();
  await a.page.getByLabel("Minimum budget").fill("20");
  await a.page.getByLabel("Maximum budget").fill("40");
  await a.page.getByRole("button", { name: "Continue" }).click();
  await a.page.getByLabel("Email addresses").fill(ben.email);
  await a.page.getByRole("button", { name: "Create exchange" }).click();
  await a.page.waitForURL(/\/events\/[\w-]+\?created=1/);
  const eventId = new URL(a.page.url()).pathname.split("/")[2];
  const inviteUrl = new URL((await a.page.getByTestId("invite-url").first().textContent())!.trim());
  const joinPath = inviteUrl.pathname;
  await expectAccessible(a.page);

  // Ben joins from his email invite; Carol and Dan from the shared link.
  const b = await newUserContext(browser, ben.email, ben.name);
  await b.page.goto(await latestEmailLink(ben.email, /\/join\//));
  await expect(b.page.getByText(`Friendsmas ${run}`).first()).toBeVisible();
  await b.page.getByRole("button", { name: "Count me in" }).click();
  await b.page.waitForURL(`**/events/${eventId}`);

  const c = await newUserContext(browser, carol.email, carol.name, joinPath);
  await c.page.getByRole("button", { name: "Count me in" }).click();
  await c.page.waitForURL(`**/events/${eventId}`);

  const d = await newUserContext(browser, dan.email, dan.name, joinPath);
  await expectAccessible(d.page);
  await d.page.getByRole("button", { name: "Count me in" }).click();
  await d.page.waitForURL(`**/events/${eventId}`);

  // Everyone adds an idea to the wishlist they're sharing.
  for (const [ctx, p] of [
    [a, alice],
    [b, ben],
    [c, carol],
    [d, dan],
  ] as const) {
    await addWishlistIdea(ctx.page, eventId, p.gift);
  }
  await expectAccessible(d.page);

  // Alice and Ben live together, and Alice shouldn't draw Dan. With no two-person
  // swaps that leaves exactly one valid chain: Alice → Carol → Ben → Dan → Alice.
  await a.page.goto(`/events/${eventId}/manage?tab=people`);
  await expect(a.page.getByTestId("people-list").getByRole("listitem")).toHaveCount(4);
  await a.page.getByRole("tab", { name: "Households & exclusions" }).click();
  await a.page.getByRole("button", { name: "Add household" }).click();
  const dialog = a.page.getByRole("dialog");
  await dialog.getByLabel("Name").fill("The Roommates");
  await dialog.getByLabel(alice.name).check();
  await dialog.getByLabel(ben.name).check();
  await dialog.getByRole("button", { name: "Save household" }).click();
  await expect(a.page.getByTestId("households")).toContainText("The Roommates");

  await a.page.locator("#ex-giver").selectOption({ label: alice.name });
  await a.page.locator("#ex-recipient").selectOption({ label: dan.name });
  await a.page.getByRole("switch", { name: /Both ways/ }).click();
  await a.page.getByRole("button", { name: "Add exclusion" }).click();
  await expect(a.page.getByTestId("exclusions")).toContainText("won't be drawn");

  // Draw.
  await a.page.getByRole("tab", { name: "Draw" }).click();
  await expect(a.page.getByTestId("draw-checks")).not.toContainText("impossible");
  await a.page.getByTestId("draw-now").click();
  await a.page.getByRole("alertdialog").getByRole("button", { name: "Draw names" }).click();
  await expect(a.page.getByTestId("draw-viewed")).toHaveText("0 of 4 have opened their match.");

  // The organizer only sees totals, never pairings.
  await expect(a.page.getByText("All matches", { exact: true })).toHaveCount(0);
  const managedHtml = await a.page.content();
  for (const [giver, recipient] of [
    [ben, dan],
    [carol, ben],
    [dan, alice],
  ]) {
    expect(managedHtml).not.toContain(`${giver.name}</span><span class="text-muted-foreground">→</span><span>${recipient.name}`);
  }

  // Each person unwraps their own match.
  await expect(await unwrap(a.page, eventId)).toHaveText(carol.name);
  await expect(await unwrap(b.page, eventId)).toHaveText(dan.name);
  await expect(await unwrap(c.page, eventId)).toHaveText(ben.name);
  await expect(await unwrap(d.page, eventId)).toHaveText(alice.name);

  // Alice opens Carol's wishlist, ticks the idea off privately and asks a question.
  await a.page.getByRole("link", { name: /See Carol's wishlist/ }).click();
  await a.page.waitForURL(`**/events/${eventId}/match`);
  await expect(a.page.getByText(carol.gift).first()).toBeVisible();
  await a.page.getByRole("button", { name: `Mark ${carol.gift} as bought` }).click();
  await expect(a.page.getByRole("button", { name: `Unmark ${carol.gift} as bought` })).toBeVisible();
  await a.page.getByLabel("Message", { exact: true }).fill("Medium or large for the sweater?");
  await a.page.getByRole("button", { name: "Send message" }).click();
  await expect(a.page.getByTestId("message-mine")).toContainText("Medium or large");
  await expectAccessible(a.page);

  // Carol sees an anonymous question and answers it.
  await c.page.goto(`/events/${eventId}#santa`);
  await c.page.reload();
  const santaCard = c.page.locator("#santa");
  await expect(santaCard).toContainText("Your Secret Santa");
  await expect(santaCard.getByTestId("message-theirs")).toContainText("Medium or large");
  await expect(santaCard).not.toContainText("Alice");
  await santaCard.getByLabel("Message", { exact: true }).fill("Large please!");
  await santaCard.getByRole("button", { name: "Send message" }).click();
  await expect(santaCard.getByTestId("message-mine")).toContainText("Large please!");

  await a.page.reload();
  await expect(a.page.getByTestId("message-theirs")).toContainText("Large please!");

  // Carol's notification email and the stored messages never name her Santa.
  const { rows: emails } = await testDb().query<{ html: string; subject: string }>(
    `select html, subject from email_log where lower(to_email) = lower($1) and kind = 'new_message'`,
    [carol.email],
  );
  expect(emails.length).toBeGreaterThan(0);
  for (const e of emails) expect(`${e.subject} ${e.html}`).not.toContain("Alice");

  // Ben, who isn't Carol's Santa, can't see her thread or Alice's match.
  await b.page.goto(`/events/${eventId}/match`);
  await expect(b.page.getByText("Medium or large")).toHaveCount(0);
  await expect(b.page.getByText(carol.gift)).toHaveCount(0);

  await a.page.goto(`/events/${eventId}/manage?tab=draw`);
  await expect(a.page.getByTestId("draw-viewed")).toHaveText("4 of 4 have opened their match.");

  for (const ctx of [a, b, c, d]) await ctx.context.close();
});

test("marketing and legal pages pass an accessibility check", async ({ page }) => {
  for (const path of ["/", "/privacy", "/terms", "/sign-in"]) {
    await page.goto(path);
    await expectAccessible(page);
  }
});

test("signed-in people can get back to the home page and keep their app nav", async ({ browser }) => {
  const erin = person("Erin");
  const { context, page } = await newUserContext(browser, erin.email, erin.name);
  await expect(page).toHaveURL(/\/events$/);

  await page.getByRole("banner").getByRole("link", { name: "Giftr" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Wishlists" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await expectAccessible(page);

  await nav.getByRole("link", { name: "Exchanges" }).click();
  await expect(page).toHaveURL(/\/events$/);
  await context.close();
});
