/**
 * Dev helper: screenshots pages at the Galaxy Z Fold cover-screen viewport
 * (~344x882) alongside a normal phone viewport, and reports any horizontal
 * overflow. Useful for catching narrow-screen layout regressions.
 * Usage: tsx scripts/fold-screens.ts alice@example.com /events /wishlists
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { closeDb, latestEmailLink } from "../e2e/helpers";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = process.env.OUT ?? "/tmp/fold-shots";

async function main() {
  const [email, ...paths] = process.argv.slice(2);
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const [label, viewport] of [
    ["fold-cover", { width: 344, height: 882 }],
    ["phone", { width: 390, height: 844 }],
  ] as const) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    if (email && email !== "-") {
      const started = new Date(Date.now() - 1000);
      const res = await page.request.post(`${base}/api/auth/sign-in/magic-link`, {
        data: { email, callbackURL: "/events" },
        headers: { origin: base },
      });
      if (!res.ok()) throw new Error(`magic link failed: ${res.status()}`);
      await page.goto(`${base}${await latestEmailLink(email, /magic-link\/verify/, started)}`);
    }
    for (const p of paths) {
      await page.goto(`${base}${p}`);
      await page.waitForLoadState("networkidle");
      const name = `${label}${p.replace(/[^a-z0-9]+/gi, "_")}.png`;
      await page.screenshot({ path: `${out}/${name}` });
      const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      console.log(`${out}/${name} overflowX=${overflowX}`);
    }
    await context.close();
  }
  await browser.close();
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
