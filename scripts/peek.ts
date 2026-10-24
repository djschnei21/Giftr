/**
 * Dev helper: sign in as someone, open a page, screenshot it and print console errors.
 * Usage: tsx scripts/peek.ts <email> <path> [width]
 */
import { chromium } from "@playwright/test";
import { closeDb, latestEmailLink } from "../e2e/helpers";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = process.env.OUT ?? "/tmp/shots";

async function main() {
  const [email, path, width] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: Number(width ?? 1280), height: 900 } })).newPage();
  page.on("console", (m) => m.type() === "error" && console.log("[console]", m.text()));
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  const started = new Date(Date.now() - 1000);
  await page.request.post(`${base}/api/auth/sign-in/magic-link`, { data: { email, callbackURL: "/events" }, headers: { origin: base } });
  await page.goto(await latestEmailLink(email, /magic-link\/verify/, started));
  await page.goto(`${base}${path}`);
  await page.waitForTimeout(800);
  const name = path.replace(/[^a-z0-9]+/gi, "_");
  await page.screenshot({ path: `${out}/peek${name}.png`, fullPage: true });
  console.log(`${out}/peek${name}.png`);
  await browser.close();
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
