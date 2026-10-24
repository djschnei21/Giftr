/**
 * Dev helper: signs in as a seeded user and captures screenshots.
 * Usage: tsx scripts/screenshots.ts alice@example.com /events /events/new
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { closeDb, latestEmailLink } from "../e2e/helpers";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = process.env.OUT ?? "/tmp/shots";

async function main() {
  const [email, ...paths] = process.argv.slice(2);
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const [label, viewport] of [
    ["desktop", { width: 1280, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ] as const) {
    const context = await browser.newContext({ viewport, colorScheme: process.env.DARK ? "dark" : "light" });
    const page = await context.newPage();
    if (email && email !== "-") {
      const started = new Date(Date.now() - 1000);
      const res = await page.request.post(`${base}/api/auth/sign-in/magic-link`, {
        data: { email, callbackURL: "/events" },
        headers: { origin: base },
      });
      if (!res.ok()) throw new Error(`magic link failed: ${res.status()}`);
      await page.goto(await latestEmailLink(email, /magic-link\/verify/, started));
    }
    for (const p of paths) {
      await page.goto(`${base}${p}`);
      await page.waitForLoadState("networkidle");
      const name = `${label}${p.replace(/[^a-z0-9]+/gi, "_")}.png`;
      await page.screenshot({ path: `${out}/${name}`, fullPage: true });
      console.log(`${out}/${name}`);
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
