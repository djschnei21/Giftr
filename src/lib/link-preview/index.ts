import "server-only";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import zlib from "node:zlib";
import { isAllowedUrl, isPrivateAddress } from "./net";
import { parseHtml, productPageToOpen, type LinkPreview } from "./parse";

export type { LinkPreview };

const MAX_BYTES = 1_000_000;
const TIMEOUT_MS = 5_000;
const MAX_REDIRECTS = 4;

class BlockedError extends Error {}

/** DNS lookup that refuses private addresses, checked at connect time so rebinding can't slip through. */
const guardedLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as unknown as LookupAddress[];
    const bad = list.find((a) => isPrivateAddress(a.address));
    if (bad || list.length === 0) return callback(new BlockedError("Blocked address"), "", 0);
    if ((options as { all?: boolean }).all) return (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

type RawResponse = { status: number; location?: string; contentType: string; body: Buffer };

function requestOnce(url: URL, signal: AbortSignal): Promise<RawResponse> {
  const mod = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = mod.request(
      url,
      {
        method: "GET",
        lookup: guardedLookup,
        signal,
        headers: {
          // A browser agent: storefronts (Amazon especially) answer a bot UA with a
          // shell page whose title is just the store name.
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          accept: "text/html,application/xhtml+xml",
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const contentType = String(res.headers["content-type"] ?? "");
        if (status >= 300 && status < 400) {
          res.resume();
          return resolve({ status, location: res.headers.location, contentType, body: Buffer.alloc(0) });
        }
        if (!/html/i.test(contentType)) {
          res.destroy();
          return resolve({ status, contentType, body: Buffer.alloc(0) });
        }
        const encoding = String(res.headers["content-encoding"] ?? "").toLowerCase();
        const stream =
          encoding === "gzip"
            ? res.pipe(zlib.createGunzip())
            : encoding === "deflate"
              ? res.pipe(zlib.createInflate())
              : encoding === "br"
                ? res.pipe(zlib.createBrotliDecompress())
                : res;
        const chunks: Buffer[] = [];
        let size = 0;
        stream.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BYTES) {
            res.destroy();
            stream.destroy();
            return resolve({ status, contentType, body: Buffer.concat(chunks) });
          }
          chunks.push(chunk);
        });
        stream.on("end", () => resolve({ status, contentType, body: Buffer.concat(chunks) }));
        stream.on("error", reject);
      },
    );
    req.on("error", reject);
    req.end();
  });
}

/**
 * Fetch title, image and price for a product link. Only public http(s)
 * addresses are reachable; every redirect hop is re-validated.
 */
export async function fetchLinkPreview(raw: string): Promise<LinkPreview | null> {
  const start = isAllowedUrl(raw);
  if (!start) return null;
  let url: URL = start;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  // A short link can already yield a product name (from the URL slug) and still
  // have no price. Keep that preview if the product page itself fails to load.
  let previous: LinkPreview | null = null;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const res = await requestOnce(url, controller.signal);
      if (res.location) {
        const redirected = isAllowedUrl(new URL(res.location, url).toString());
        if (!redirected) return previous;
        url = redirected;
        continue;
      }
      if (res.status < 200 || res.status >= 300 || res.body.length === 0) return previous ?? empty(url);
      const html = res.body.toString("utf8");
      const preview = parseHtml(html, url.toString());
      const merged = mergePreview(previous, preview);
      const follow: string | null = hop < MAX_REDIRECTS ? productPageToOpen(preview, html, url.toString()) : null;
      const next = follow ? isAllowedUrl(follow) : null;
      if (next) {
        previous = merged;
        url = next;
        continue;
      }
      return merged;
    }
    return previous;
  } catch {
    return previous;
  } finally {
    clearTimeout(timer);
  }
}

function mergePreview(previous: LinkPreview | null, next: LinkPreview): LinkPreview {
  if (!previous) return next;
  return {
    url: next.url,
    title: next.title ?? previous.title,
    imageUrl: next.imageUrl ?? previous.imageUrl,
    price: next.price ?? previous.price,
    currency: next.price !== null ? (next.currency ?? previous.currency) : (previous.currency ?? next.currency),
    siteName: next.siteName ?? previous.siteName,
  };
}

function empty(url: URL): LinkPreview {
  return { url: url.toString(), title: null, imageUrl: null, price: null, currency: null, siteName: null };
}
