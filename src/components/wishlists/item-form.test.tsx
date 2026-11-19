/**
 * @vitest-environment jsdom
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("ignores a preview that resolves after the link has changed", async () => {
    let resolvePreview: (value: Awaited<ReturnType<typeof previewLink>>) => void = () => {};
    preview.mockReturnValue(
      new Promise((resolve) => {
        resolvePreview = resolve;
      }),
    );
    renderForm();
    const link = await blurLink(coat);
    fireEvent.change(link, { target: { value: "https://shop.example.com/other" } });

    await act(async () => {
      resolvePreview({
        ok: true,
        data: {
          url: coat,
          title: "Long Chesterfield coat",
          imageUrl: "https://cdn.example.com/coat.jpg",
          price: null,
          currency: null,
          siteName: "Ann Taylor",
        },
      });
    });

    expect((link as HTMLInputElement).value).toBe("https://shop.example.com/other");
    expect((screen.getByLabelText("What is it?") as HTMLInputElement).value).toBe("");
    expect(document.querySelector("img")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.activeElement).not.toBe(screen.getByLabelText("What is it?"));
  });

  it("keeps a picture from a partial preview and still asks for a name", async () => {
    preview.mockResolvedValue({
      ok: true,
      data: {
        url: coat,
        title: null,
        imageUrl: "https://cdn.example.com/coat.jpg",
        price: null,
        currency: null,
        siteName: "Ann Taylor",
      },
    });
    renderForm();
    await blurLink();

    expect((await screen.findByRole("status")).textContent).toBe(unread);
    expect(document.querySelector("img")?.getAttribute("src")).toBe("https://cdn.example.com/coat.jpg");
    expect(document.activeElement).toBe(screen.getByLabelText("What is it?"));
    expect((screen.getByRole("button", { name: "Add to wishlist" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("keeps a name the user already typed and does not steal focus", async () => {
    let resolvePreview: (value: Awaited<ReturnType<typeof previewLink>>) => void = () => {};
    preview.mockReturnValue(
      new Promise((resolve) => {
        resolvePreview = resolve;
      }),
    );
    renderForm();
    const name = screen.getByLabelText("What is it?");
    fireEvent.change(name, { target: { value: "Wool coat" } });
    const link = screen.getByLabelText("Link");
    fireEvent.change(link, { target: { value: coat } });
    link.focus();
    fireEvent.blur(link);

    await act(async () => {
      resolvePreview({
        ok: true,
        data: {
          url: coat,
          title: "Long Chesterfield coat",
          imageUrl: "https://cdn.example.com/coat.jpg",
          price: null,
          currency: null,
          siteName: "Ann Taylor",
        },
      });
    });

    expect((name as HTMLInputElement).value).toBe("Wool coat");
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.activeElement).not.toBe(name);
  });
});
