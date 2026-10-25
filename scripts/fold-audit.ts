/**
 * Walk every Giftr route at the Galaxy Z Fold cover width and report
 * anything that extends past the viewport. Dev-only.
 *
 * Usage: tsx scripts/fold-audit.ts
 */
import { mkdirSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";
import { closeDb, latestEmailLink, testDb } from "../e2e/helpers";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const out = process.env.OUT ?? "/tmp/fold-audit";
const width = Number(process.env.FOLD_WIDTH ?? 344);
const height = Number(process.env.FOLD_HEIGHT ?? 882);

type Targets = {
  email: string;
  openId: string;
  drawnId: string | null;
  wishlistId: string | null;
  invite: string;
  welcomeEmail: string | null;
};

/** Pull real rows so the audit covers whatever exchanges exist in the dev database. */
async function targets(): Promise<Targets> {
  const db = testDb();
  const events = await db.query<{ id: string; status: string; invite_code: string; email: string }>(
    `select e.id, e.status, e.invite_code, u.email
     from event e
     join "user" u on u.id = e.organizer_id
     where coalesce(u.name, '') <> ''
     order by e.created_at desc`,
  );
  if (!events.rows.length) throw new Error("No events in the database — seed one before running the fold audit.");
  const byEmail = new Map<string, typeof events.rows>();
  for (const row of events.rows) byEmail.set(row.email, [...(byEmail.get(row.email) ?? []), row]);
  const groups = [...byEmail.values()];
  const mine =
    groups.find((rows) => rows.some((row) => row.status === "open") && rows.some((row) => row.status === "drawn")) ??
    groups.find((rows) => rows.some((row) => row.status === "open")) ??
    groups[0];
  const open = mine.find((row) => row.status === "open") ?? mine[0];
  const drawn = mine.find((row) => row.status === "drawn") ?? null;
  const lists = await db.query<{ id: string }>(
    `select w.id from wishlist w join "user" u on u.id = w.owner_id where u.email = $1 limit 1`,
    [open.email],
  );
  const unnamed = await db.query<{ email: string }>(`select email from "user" where coalesce(name, '') = '' limit 1`);
  return {
    email: open.email,
    openId: open.id,
    drawnId: drawn?.id ?? null,
    wishlistId: lists.rows[0]?.id ?? null,
    invite: open.invite_code,
    welcomeEmail: unnamed.rows[0]?.email ?? null,
  };
}

type Hit = { path: string; overflowX: number; offenders: string[] };

async function signIn(page: Page, email: string) {
  const started = new Date(Date.now() - 1000);
  const res = await page.request.post(`${base}/api/auth/sign-in/magic-link`, {
    data: { email, callbackURL: "/events" },
    headers: { origin: base },
  });
  if (!res.ok()) throw new Error(`magic link failed for ${email}: ${res.status()} ${await res.text()}`);
  const link = await latestEmailLink(email, /magic-link\/verify/, started);
  await page.goto(`${base}${link}`);
  await page.waitForLoadState("networkidle");
}

async function snapshot(page: Page, path: string): Promise<Hit> {
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(100);
  const result = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders: string[] = [];
    const nodes = document.body.querySelectorAll<HTMLElement>("*");
    for (const el of nodes) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (rect.right <= vw + 1 && rect.left >= -1) continue;
      const parent = el.parentElement?.getBoundingClientRect();
      const parentOverflows = !!parent && (parent.right > vw + 1 || parent.left < -1);
      if (parentOverflows) continue;
      let contained = false;
      let p: HTMLElement | null = el.parentElement;
      while (p) {
        const style = getComputedStyle(p);
        const clips =
          style.overflowX === "auto" ||
          style.overflowX === "scroll" ||
          style.overflowX === "hidden" ||
          style.overflowX === "clip";
        if (clips) {
          const pr = p.getBoundingClientRect();
          if (pr.right <= vw + 1 && pr.left >= -1) contained = true;
          break;
        }
        p = p.parentElement;
      }
      if (contained) continue;
      const text = (el.innerText || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 70);
      const cls = typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 4).join(".") : "";
      offenders.push(
        `${el.tagName.toLowerCase()}${cls ? "." + cls : ""} right=${Math.round(rect.right)} w=${Math.round(rect.width)}${text ? ` "${text}"` : ""}`,
      );
      if (offenders.length >= 8) break;
    }
    return {
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      offenders,
    };
  });
  const safe = path.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home";
  await page.screenshot({ path: `${out}/${safe}.png`, fullPage: true });
  const hit = { path, ...result };
  const bad = hit.overflowX > 0 || hit.offenders.length > 0;
  console.log(`${bad ? "FAIL" : "ok  "} overflowX=${String(hit.overflowX).padStart(4)} ${hit.path}`);
  for (const line of hit.offenders) console.log(`      ${line}`);
  return hit;
}

async function measure(page: Page, path: string): Promise<Hit> {
  const response = await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  if (!response) throw new Error(`no response for ${path}`);
  return snapshot(page, path);
}

async function wizardSteps(page: Page): Promise<Hit[]> {
  const hits: Hit[] = [];
  await page.goto(`${base}/events/new`, { waitUntil: "networkidle" });
  await page.locator("#name").fill("Schneider/Cooke Family Christmas");
  await page.locator("#exchangeDate").fill("2026-12-25");
  await page.locator("#location").fill("Mom and Dad's house, 1842 North Maplewood Avenue");
  await page
    .locator("#description")
    .fill("A very long note that should wrap on the cover screen instead of running off the edge.");
  for (let step = 0; step < 3; step++) {
    hits.push(await snapshot(page, `/events/new (step ${step + 1})`));
    if (step < 2) {
      await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForTimeout(300);
    }
  }
  return hits;
}

async function main() {
  mkdirSync(out, { recursive: true });
  const data = await targets();
  const browser = await chromium.launch();
  const hits: Hit[] = [];
  const manageTabs = ["people", "invites", "rules", "draw", "settings"];

  const anon = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const anonPage = await anon.newPage();
  for (const path of [
    "/",
    "/sign-in",
    "/privacy",
    "/terms",
    `/join/${data.invite}`,
    "/join/missing-code",
    "/does-not-exist",
    "/unsubscribe/not-a-real-token",
  ]) {
    hits.push(await measure(anonPage, path));
  }
  await anon.close();

  const authed = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await authed.newPage();
  await signIn(page, data.email);
  const authedPaths = [
    "/events",
    `/events/${data.openId}`,
    ...manageTabs.map((tab) => `/events/${data.openId}/manage?tab=${tab}`),
    ...(data.drawnId
      ? [
          `/events/${data.drawnId}`,
          `/events/${data.drawnId}/match`,
          ...manageTabs.map((tab) => `/events/${data.drawnId}/manage?tab=${tab}`),
        ]
      : []),
    "/wishlists",
    ...(data.wishlistId ? [`/wishlists/${data.wishlistId}`] : []),
    "/profile",
    `/join/${data.invite}`,
    "/dev/outbox",
  ];
  for (const path of authedPaths) hits.push(await measure(page, path));
  hits.push(...(await wizardSteps(page)));
  await authed.close();

  if (data.welcomeEmail) {
    const fresh = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const welcome = await fresh.newPage();
    await signIn(welcome, data.welcomeEmail);
    hits.push(await measure(welcome, welcome.url().replace(base, "") || "/welcome"));
    await fresh.close();
  }

  await browser.close();
  await closeDb();

  const failed = hits.filter((hit) => hit.overflowX > 0 || hit.offenders.length > 0).length;
  console.log(`\n${hits.length} pages, ${failed} overflowing at ${width}px`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
