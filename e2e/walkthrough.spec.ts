import { devices, expect, test, type Page } from "@playwright/test";
import { closeDb, signIn } from "./helpers";

// Records a narrated-pace walkthrough: the organizer on desktop, a participant on a phone.
// Run with `WALKTHROUGH=1 pnpm test:e2e walkthrough`; videos land in test-results/.
test.skip(!process.env.WALKTHROUGH, "Set WALKTHROUGH=1 to record the walkthrough");
test.afterAll(closeDb);

const run = Date.now().toString(36);
const pause = (page: Page, ms = 1200) => page.waitForTimeout(ms);
const who = (first: string) => ({ name: `${first} Walker`, email: `${first.toLowerCase()}+walk${run}@example.com` });

test("walkthrough", async ({ browser }) => {
  test.setTimeout(300_000);
  const video = (size: { width: number; height: number }) => ({ recordVideo: { dir: "test-results/walkthrough", size } });

  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...video({ width: 1280, height: 800 }) });
  const phoneDevice = devices["iPhone 13"];
  const phone = await browser.newContext({
    viewport: phoneDevice.viewport,
    deviceScaleFactor: phoneDevice.deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
    userAgent: phoneDevice.userAgent,
    ...video(phoneDevice.viewport),
  });
  const offCamera = await browser.newContext();

  const alice = who("Alice");
  const carol = who("Carol");
  const a = await desktop.newPage();
  const c = await phone.newPage();

  await a.goto("/");
  await pause(a, 2000);
  await a.mouse.wheel(0, 900);
  await pause(a);
  await signIn(a, alice.email, alice.name, "/events/new");

  await a.getByLabel("Exchange name").pressSequentially("Friendsmas 2026", { delay: 40 });
  await a.getByLabel("Where?").pressSequentially("Maya's place, 7pm", { delay: 30 });
  await pause(a);
  await a.getByRole("button", { name: "Continue" }).click();
  await a.getByLabel("Minimum budget").fill("25");
  await a.getByLabel("Maximum budget").fill("40");
  await a.getByLabel("House rules").pressSequentially("Homemade gifts welcome.", { delay: 30 });
  await pause(a);
  await a.getByRole("button", { name: "Continue" }).click();
  await pause(a);
  await a.getByRole("button", { name: "Create exchange" }).click();
  await a.waitForURL(/\/events\/[\w-]+\?created=1/);
  const eventId = new URL(a.url()).pathname.split("/")[2];
  const joinPath = new URL((await a.getByTestId("invite-url").first().textContent())!.trim()).pathname;
  await pause(a, 2000);

  // Carol joins from the shared link on her phone.
  await c.goto(joinPath);
  await pause(c, 2000);
  await signIn(c, carol.email, carol.name, joinPath);
  await pause(c);
  await c.getByRole("button", { name: "Count me in" }).click();
  await c.waitForURL(`**/events/${eventId}`);
  await pause(c, 1500);
  await c.getByRole("link", { name: "add a few ideas" }).click();
  await c.getByLabel("What is it?").pressSequentially("Chunky knit sweater", { delay: 40 });
  await c.getByLabel("Notes for your Santa").pressSequentially("Size L, anything but orange", { delay: 30 });
  await c.getByRole("button", { name: "Add to wishlist" }).click();
  await expect(c.getByTestId("wishlist-items")).toContainText("Chunky knit sweater");
  await pause(c, 1500);

  // Ben and Dan join off camera.
  for (const first of ["Ben", "Dan"]) {
    const p = who(first);
    const page = await offCamera.newPage();
    await signIn(page, p.email, p.name, joinPath);
    await page.getByRole("button", { name: "Count me in" }).click();
    await page.waitForURL(`**/events/${eventId}`);
    await offCamera.clearCookies();
    await page.close();
  }

  await a.goto(`/events/${eventId}/manage`);
  await pause(a, 1500);
  await a.getByRole("tab", { name: "Households & exclusions" }).click();
  await a.getByRole("button", { name: "Add household" }).click();
  const dialog = a.getByRole("dialog");
  await dialog.getByLabel("Name").fill("The Walkers");
  await dialog.getByLabel(alice.name).check();
  await dialog.getByLabel(who("Ben").name).check();
  await pause(a, 800);
  await dialog.getByRole("button", { name: "Save household" }).click();
  await pause(a, 1500);
  await a.getByRole("tab", { name: "Draw" }).click();
  await pause(a, 1500);
  await a.getByTestId("draw-now").click();
  await pause(a, 800);
  await a.getByRole("alertdialog").getByRole("button", { name: "Draw names" }).click();
  await expect(a.getByTestId("draw-viewed")).toBeVisible();
  await pause(a, 1500);

  await a.goto(`/events/${eventId}`);
  await pause(a);
  await a.getByRole("button", { name: "Unwrap your match" }).click();
  await pause(a, 2500);
  await a.getByRole("link", { name: /wishlist/ }).first().click();
  await a.waitForURL(`**/events/${eventId}/match`);
  await pause(a, 1500);
  await a.mouse.wheel(0, 600);
  await pause(a);
  await a.getByLabel("Message", { exact: true }).pressSequentially("What's your favourite colour?", { delay: 40 });
  await a.getByRole("button", { name: "Send message" }).click();
  await pause(a, 1500);

  await c.goto(`/events/${eventId}`);
  await pause(c);
  await c.getByRole("button", { name: "Unwrap your match" }).click();
  await pause(c, 2500);
  await c.mouse.wheel(0, 700);
  await pause(c, 1500);
  const santa = c.locator("#santa");
  if (await santa.count()) {
    await santa.getByLabel("Message", { exact: true }).pressSequentially("Forest green!", { delay: 50 });
    await santa.getByRole("button", { name: "Send message" }).click();
    await pause(c, 1500);
  }

  await desktop.close();
  await phone.close();
  await offCamera.close();
});
