import { expect, test } from "@playwright/test";
import { closeDb, expectAccessible, newUserContext } from "./helpers";

test.afterAll(closeDb);

test("signed-out holiday toggle persists and stays accessible", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Light" }).click();
  await page.getByRole("button", { name: "Hanukkah" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-holiday", "hanukkah");
  await expect(page.getByTestId("holiday-countdown")).toHaveText(/until Hanukkah|of Hanukkah|Happy Hanukkah/);
  await expect(page.getByText("Chag sameach!")).toBeVisible();
  await expect(page.getByText("Santa would approve.")).toHaveCount(0);
  await expectAccessible(page);

  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expectAccessible(page);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-holiday", "hanukkah");
  await expect(page.getByTestId("holiday-countdown")).toHaveText(/until Hanukkah|of Hanukkah|Happy Hanukkah/);

  await page.getByRole("button", { name: "Christmas" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-holiday", "christmas");
  await expect(page.getByTestId("holiday-countdown")).toHaveText(/until Christmas|Merry Christmas/);
  await expect(page.getByText("Ho ho ho!")).toBeVisible();
});

test("signed-in holiday toggle on events stays accessible", async ({ browser }) => {
  const stamp = Date.now().toString(36);
  const { context, page } = await newUserContext(browser, `holiday+${stamp}@example.com`, "Holiday E2e", "/events");
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("button", { name: "Hanukkah" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-holiday", "hanukkah");
  await expect(page.getByText("Happy Hanukkah, Holiday!")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu", { name: "Account menu" })).toBeHidden();
  await expectAccessible(page);
  await context.close();
});
