/**
 * Dev helper: organizer draws names for the seeded exchange, then a participant unwraps their match.
 * Usage: tsx scripts/try-draw.ts <eventId>
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
  const eventId = process.argv[2];
  const browser = await chromium.launch();
  const org = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  org.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await signIn(org, "alice@example.com");
  await org.goto(`${base}/events/${eventId}/manage?tab=rules`);
  await org.screenshot({ path: `${out}/rules.png`, fullPage: true });
  await org.goto(`${base}/events/${eventId}/manage?tab=draw`);
  await org.screenshot({ path: `${out}/draw-before.png`, fullPage: true });
  await org.getByTestId("draw-now").click();
  await org.getByRole("button", { name: "Draw names" }).click();
  await org.getByText("Names are drawn").first().waitFor();
  await org.screenshot({ path: `${out}/draw-after.png`, fullPage: true });

  const ben = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await signIn(ben, "ben@example.com");
  await ben.goto(`${base}/events/${eventId}`);
  await ben.screenshot({ path: `${out}/reveal-before.png` });
  await ben.getByRole("button", { name: "Unwrap your match" }).click();
  await ben.getByTestId("giftee-name").waitFor();
  await ben.waitForTimeout(400);
  await ben.screenshot({ path: `${out}/reveal-after.png` });
  console.log("Ben drew:", await ben.getByTestId("giftee-name").textContent());
  await browser.close();
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
