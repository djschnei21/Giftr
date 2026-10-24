/**
 * Dev helper: a Santa messages their giftee from the match page, the giftee replies.
 * Usage: tsx scripts/try-chat.ts <eventId> <santaEmail> <gifteeEmail>
 */
import { chromium, type Page } from "@playwright/test";
import { closeDb, latestEmailLink } from "../e2e/helpers";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = process.env.OUT ?? "/tmp/shots";

async function signIn(page: Page, email: string) {
  const started = new Date(Date.now() - 1000);
  await page.request.post(`${base}/api/auth/sign-in/magic-link`, { data: { email, callbackURL: "/events" }, headers: { origin: base } });
  await page.goto(await latestEmailLink(email, /magic-link\/verify/, started));
}

async function main() {
  const [eventId, santaEmail, gifteeEmail] = process.argv.slice(2);
  const browser = await chromium.launch();
  const santa = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  santa.on("pageerror", (e) => console.log("[santa pageerror]", e.message));
  await signIn(santa, santaEmail);
  await santa.goto(`${base}/events/${eventId}/match`);
  await santa.getByLabel("Message", { exact: true }).fill("Hi! What's your favorite kind of tea?");
  await santa.getByRole("button", { name: "Send message" }).click();
  await santa.getByTestId("message-mine").first().waitFor();
  await santa.getByRole("button", { name: /Mark .* as bought/ }).first().click();
  await santa.getByRole("radio", { name: "Bought it" }).waitFor();
  await santa.waitForTimeout(800);
  await santa.screenshot({ path: `${out}/match-santa.png`, fullPage: true });

  const giftee = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  giftee.on("pageerror", (e) => console.log("[giftee pageerror]", e.message));
  await signIn(giftee, gifteeEmail);
  await giftee.goto(`${base}/events/${eventId}#santa`);
  await giftee.getByTestId("message-theirs").first().waitFor();
  const html = await giftee.content();
  console.log("giftee page mentions santa email?", html.includes(santaEmail));
  await giftee.getByPlaceholder("Message your Santa…").fill("Earl Grey, always!");
  await giftee.getByRole("button", { name: "Send message" }).click();
  await giftee.getByTestId("message-mine").first().waitFor();
  await giftee.waitForTimeout(500);
  await giftee.locator("#santa").screenshot({ path: `${out}/match-giftee.png` });

  await santa.reload();
  await santa.getByTestId("message-theirs").first().waitFor();
  console.log("santa sees reply:", await santa.getByTestId("message-theirs").first().textContent());
  await browser.close();
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
