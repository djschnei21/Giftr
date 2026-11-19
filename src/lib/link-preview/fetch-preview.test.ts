import { EventEmitter } from "node:events";
import https from "node:https";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { fetchLinkPreview } from "./index";

const COAT = "https://www.anntaylor.com/clothing/coats/cat2820007/long-chesterfield-coat/855462.html";

type ResponseEvents = {
  html: (body: string, status?: number) => void;
  fail: (err?: Error) => void;
};

function stubRequest(onEnd: (events: ResponseEvents) => void) {
  return vi.spyOn(https, "request").mockImplementation((...args: unknown[]) => {
    const callback = args.find((arg) => typeof arg === "function") as (res: EventEmitter) => void;
    const req = new EventEmitter();
    const end = () => {
      onEnd({
        html(body, status = 200) {
          const res = new EventEmitter();
          Object.assign(res, {
            statusCode: status,
            headers: { "content-type": "text/html; charset=utf-8" },
            resume() {},
            destroy() {},
          });
          callback(res);
          res.emit("data", Buffer.from(body));
          res.emit("end");
        },
        fail(err = new Error("getaddrinfo ENOTFOUND")) {
          req.emit("error", err);
        },
      });
    };
    return Object.assign(req, { end }) as unknown as ReturnType<typeof https.request>;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchLinkPreview", () => {
  it("returns no title when the page has nothing usable", async () => {
    stubRequest(({ html }) => {
      html(`<html><head><meta property="og:site_name" content="Ann Taylor"></head><body></body></html>`);
    });
    const preview = await fetchLinkPreview(COAT);
    expect(preview).toMatchObject({ url: COAT, title: null, imageUrl: null, siteName: "Ann Taylor" });
  });

  it("returns null when the fetch fails", async () => {
    stubRequest(({ fail }) => fail());
    await expect(fetchLinkPreview(COAT)).resolves.toBeNull();
  });

  it("still refuses private addresses without fetching", async () => {
    const request = vi.spyOn(https, "request");
    await expect(fetchLinkPreview("http://127.0.0.1/admin")).resolves.toBeNull();
    expect(request).not.toHaveBeenCalled();
  });
});
