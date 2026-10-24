import { chromium } from "@playwright/test";
import { closeDb, latestEmailLink } from "../e2e/helpers";
const base = "http://localhost:3000";
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("[console]", m.type(), m.text().slice(0, 1500)); });
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  const started = new Date(Date.now() - 1000);
  await page.request.post(`${base}/api/auth/sign-in/magic-link`, { data: { email: process.argv[2], callbackURL: "/events" }, headers: { origin: base } });
  await page.goto(await latestEmailLink(process.argv[2], /magic-link\/verify/, started));
  for (const p of process.argv.slice(3)) { console.log("== ", p); await page.goto(base + p); await page.waitForLoadState("networkidle"); await page.waitForTimeout(500); }
  await browser.close(); await closeDb();
})();
