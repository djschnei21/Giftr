import { expect, test } from "@playwright/test";
import { closeDb, newUserContext } from "./helpers";

const run = Date.now().toString(36);
const unread = "We couldn't read that page. Type a name to add it.";

test.afterAll(closeDb);

test("a blocked product link can be saved once the person types a name", async ({ browser }) => {
  const email = `coat+${run}@example.com`;
  const { context, page } = await newUserContext(browser, email, "Casey E2e", "/wishlists");

  await page.getByRole("button", { name: "New wishlist" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(`Coats ${run}`);
  await dialog.getByRole("button", { name: "Create wishlist" }).click();
  await page.waitForURL(/\/wishlists\/[\w-]+$/);

  const link = page.getByLabel("Link");
  await link.fill("https://www.anntaylor.invalid/clothing/coats/long-chesterfield-coat");
  await link.blur();

  const form = page.locator("form").filter({ has: page.getByLabel("What is it?") });
  await expect(form.getByRole("status")).toHaveText(unread);
  await expect(form.getByRole("button", { name: "Add to wishlist" })).toBeDisabled();
  await expect(page.getByLabel("What is it?")).toBeFocused();
  await form.screenshot({ path: "test-results/gif-6-unread-link.png" });

  await page.getByLabel("What is it?").fill("Long Chesterfield coat");
  await expect(form.getByRole("button", { name: "Add to wishlist" })).toBeEnabled();
  await form.getByRole("button", { name: "Add to wishlist" }).click();

  const items = page.getByTestId("wishlist-items");
  await expect(items).toContainText("Long Chesterfield coat");
  await expect(items.getByRole("link", { name: "anntaylor.invalid" })).toHaveAttribute(
    "href",
    "https://www.anntaylor.invalid/clothing/coats/long-chesterfield-coat",
  );

  await context.close();
});
