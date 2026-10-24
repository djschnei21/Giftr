import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { Pool } from "pg";

let pool: Pool | null = null;

export function testDb() {
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL ?? "postgresql://giftr:giftr@localhost:5432/giftr_test",
    max: 2,
  });
  return pool;
}

export async function closeDb() {
  await pool?.end();
  pool = null;
}

/** Finds the newest link of a given kind emailed to `email` via the dev outbox table, as a path on the test server. */
export async function latestEmailLink(email: string, match: RegExp, after?: Date): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const { rows } = await testDb().query<{ html: string }>(
      `select html from email_log where lower(to_email) = lower($1) and provider = 'dev' and created_at > $2 order by created_at desc limit 5`,
      [email, after ?? new Date(0)],
    );
    for (const row of rows) {
      const links = [...row.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replaceAll("&amp;", "&"));
      const found = links.find((l) => match.test(l));
      if (found) {
        const u = new URL(found);
        return u.pathname + u.search;
      }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No email matching ${match} for ${email}`);
}

/** Signs in through the real email-link flow and finishes onboarding if needed. */
export async function signIn(page: Page, email: string, name: string, next = "/events") {
  const started = new Date(Date.now() - 1000);
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  const link = await latestEmailLink(email, /magic-link\/verify/, started);
  await page.goto(link);
  if (page.url().includes("/welcome")) {
    await page.getByPlaceholder("Your name").fill(name);
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.waitForURL((u) => !u.pathname.startsWith("/welcome") && !u.pathname.startsWith("/sign-in"));
}

export async function newUserContext(browser: Browser, email: string, name: string, next?: string) {
  const context: BrowserContext = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, email, name, next);
  return { context, page };
}
