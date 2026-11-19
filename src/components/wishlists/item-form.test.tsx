/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/actions/wishlists", () => ({
  previewLink: vi.fn(),
}));

import { previewLink } from "@/server/actions/wishlists";
import { emptyItem, ItemForm } from "./item-form";

const preview = vi.mocked(previewLink);
const coat = "https://www.anntaylor.com/clothing/coats/cat2820007/long-chesterfield-coat/855462.html";
const unread = "We couldn't read that page. Type a name to add it.";

afterEach(() => {
  cleanup();
  preview.mockReset();
});

function renderForm() {
  render(
    <ItemForm
      idPrefix="new-item"
      initial={emptyItem()}
      submitLabel="Add to wishlist"
      pending={false}
      onSubmit={vi.fn()}
    />,
  );
}

async function blurLink(url = coat) {
  const link = screen.getByLabelText("Link");
  fireEvent.change(link, { target: { value: url } });
  fireEvent.blur(link);
  return link;
}

describe("ItemForm link preview", () => {
  it("keeps the link and asks for a name when the preview has no title", async () => {
    preview.mockResolvedValue({
      ok: true,
      data: { url: coat, title: null, imageUrl: null, price: null, currency: null, siteName: "Ann Taylor" },
    });
    renderForm();
    const link = await blurLink();

    expect((await screen.findByRole("status")).textContent).toBe(unread);
    expect((link as HTMLInputElement).value).toBe(coat);
    expect(document.activeElement).toBe(screen.getByLabelText("What is it?"));
    expect((screen.getByRole("button", { name: "Add to wishlist" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("What is it?"), { target: { value: "Long Chesterfield coat" } });
    expect((screen.getByRole("button", { name: "Add to wishlist" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("asks for a name when the preview fetch fails", async () => {
    preview.mockResolvedValue({ ok: true, data: null });
    renderForm();
    const link = await blurLink("https://www.anntaylor.invalid/long-chesterfield-coat");

    expect((await screen.findByRole("status")).textContent).toBe(unread);
    expect((link as HTMLInputElement).value).toBe("https://www.anntaylor.invalid/long-chesterfield-coat");
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("What is it?")));
    expect((screen.getByRole("button", { name: "Add to wishlist" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
