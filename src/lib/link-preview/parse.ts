export type LinkPreview = {
  url: string;
  title: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  siteName: string | null;
};

const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeEntities(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return entities[code.toLowerCase()] ?? m;
  });
}

function attrs(tag: string) {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([a-zA-Z:_-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g))
    out[m[1].toLowerCase()] = decodeEntities(m[3] ?? m[4] ?? m[5] ?? "");
  return out;
}

function pageHost(pageUrl: string) {
  try {
    return new URL(pageUrl).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isAmazonHost(hostname: string) {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  return h === "a.co" || h === "amzn.to" || h.endsWith(".amzn.to") || /(^|\.)amazon\.[a-z.]+$/.test(h);
}

/** "Amazon" / "Amazon.com" are the store, not the product. */
export function isGenericTitle(title: string | null | undefined) {
  if (!title) return true;
  const v = title.trim().toLowerCase().replace(/\s+/g, " ");
  if (!v) return true;
  if (/^amazon(?:\.com)?$/.test(v) || v === "amzn" || v === "amzn.to") return true;
  return v.startsWith("amazon.com: online shopping");
}

/** Turn "Amazon.com: Mug : Home & Kitchen" into "Mug" on Amazon pages only. */
function polishAmazonTitle(title: string, pageUrl: string) {
  if (!isAmazonHost(pageHost(pageUrl))) return title;
  const prefixed = title.match(/^amazon(?:\.com)?\s*:\s*([\s\S]+)$/i);
  if (!prefixed) return title;
  const parts = prefixed[1].split(/\s:\s/);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1].trim();
    if (last.length > 0 && last.length <= 48 && !/\d/.test(last)) parts.pop();
  }
  return parts.join(" : ").trim();
}

function usableTitle(raw: string | null | undefined, pageUrl: string) {
  const c = clean(raw);
  if (!c) return null;
  const polished = polishAmazonTitle(c, pageUrl);
  return polished && !isGenericTitle(polished) ? polished : null;
}

function firstUsable(list: (string | null | undefined)[], pageUrl: string) {
  for (const item of list) {
    const title = usableTitle(item, pageUrl);
    if (title) return title;
  }
  return null;
}

function titleFromAmazonPath(urls: string[]) {
  for (const raw of urls) {
    try {
      const u = new URL(raw);
      if (!isAmazonHost(u.hostname)) continue;
      const slug = u.pathname.match(/\/([^/]+)\/(?:dp|gp\/product|gp\/aw\/d)\//i)?.[1];
      if (!slug || /^(dp|gp|product)$/i.test(slug)) continue;
      const decoded = decodeURIComponent(slug).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
      if (decoded.length < 3 || isGenericTitle(decoded)) continue;
      return decoded.slice(0, 200);
    } catch {
      // Ignore malformed canonical URLs.
    }
  }
  return null;
}

/**
 * When a short link returns a shell page (title "Amazon") pointing at the real
 * product, this is that product URL. Null if we're already on it.
 */
export function nextProductUrl(html: string, pageUrl: string) {
  let current: URL;
  try {
    current = new URL(pageUrl);
  } catch {
    return null;
  }
  const head = html.slice(0, 200_000);
  const candidates: string[] = [];
  for (const m of head.matchAll(/<(meta|link)\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    if ((a["http-equiv"] ?? "").toLowerCase() === "refresh" && a.content) {
      const url = a.content.match(/url\s*=\s*['"]?([^'">\s]+)/i)?.[1];
      if (url) candidates.push(url);
    }
    if (a.href && (a.rel ?? "").toLowerCase().split(/\s+/).includes("canonical")) candidates.push(a.href);
    if ((a.property ?? "").toLowerCase() === "og:url" && a.content) candidates.push(a.content);
  }
  for (const raw of candidates) {
    try {
      const next = new URL(raw, pageUrl);
      if (next.protocol !== "http:" && next.protocol !== "https:") continue;
      if (!isAmazonHost(next.hostname)) continue;
      if (!/\/(?:dp|gp\/product|gp\/aw\/d)\//i.test(next.pathname)) continue;
      if (next.hostname === current.hostname && next.pathname.replace(/\/$/, "") === current.pathname.replace(/\/$/, ""))
        continue;
      return next.toString();
    } catch {
      // Ignore malformed follow-up URLs.
    }
  }
  return null;
}

function clean(s: string | null | undefined, max = 200) {
  if (!s) return null;
  const v = decodeEntities(s).replace(/\s+/g, " ").trim();
  return v ? v.slice(0, max) : null;
}

function parsePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).replace(/[^\d.,]/g, "");
  if (!s) return null;
  // "1.299,00" vs "1,299.00"
  const normalized = /,\d{2}$/.test(s) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 && n < 1_000_000 ? Math.round(n) : null;
}

type JsonLd = Record<string, unknown>;

function findProduct(node: unknown): JsonLd | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const found = findProduct(n);
      if (found) return found;
    }
    return null;
  }
  const obj = node as JsonLd;
  const type = obj["@type"];
  if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return obj;
  return findProduct(obj["@graph"]);
}

export function parseHtml(html: string, pageUrl: string): LinkPreview {
  const head = html.slice(0, 500_000);
  const meta: Record<string, string> = {};
  const metaAll: Record<string, string[]> = {};
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    const key = (a.property ?? a.name ?? a.itemprop ?? "").toLowerCase();
    if (key && a.content) {
      (metaAll[key] ??= []).push(a.content);
      if (!(key in meta)) meta[key] = a.content;
    }
  }
  let canonical: string | null = null;
  for (const m of head.matchAll(/<link\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    if (!canonical && a.href && (a.rel ?? "").toLowerCase().split(/\s+/).includes("canonical")) canonical = a.href;
  }

  let product: JsonLd | null = null;
  for (const m of head.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      product = findProduct(JSON.parse(m[1]));
      if (product) break;
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }
  const offers = product?.offers as JsonLd | JsonLd[] | undefined;
  const offer = Array.isArray(offers) ? offers[0] : offers;
  const ldImage = product?.image;
  const ldImageUrl =
    typeof ldImage === "string"
      ? ldImage
      : Array.isArray(ldImage)
        ? typeof ldImage[0] === "string"
          ? ldImage[0]
          : ((ldImage[0] as JsonLd | undefined)?.url as string | undefined)
        : ((ldImage as JsonLd | undefined)?.url as string | undefined);

  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  // Amazon (and its a.co short links) often lead with og:title "Amazon" and put the
  // real name in a later tag, JSON-LD, or #productTitle. Skip placeholders.
  const productTitle = head
    .match(/<span[^>]*\bid=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]
    ?.replace(/<[^>]+>/g, " ");
  const title =
    firstUsable([...(metaAll["og:title"] ?? []), ...(metaAll["twitter:title"] ?? [])], pageUrl) ??
    firstUsable(
      [productTitle, typeof product?.name === "string" ? product.name : null, ...(metaAll["title"] ?? []), titleTag],
      pageUrl,
    ) ??
    titleFromAmazonPath([canonical, pageUrl].filter((u): u is string => !!u));

  const rawImage = meta["og:image"] ?? meta["og:image:url"] ?? meta["twitter:image"] ?? ldImageUrl;
  let imageUrl: string | null = null;
  if (rawImage) {
    try {
      const resolved = new URL(rawImage, pageUrl);
      if (resolved.protocol === "https:" || resolved.protocol === "http:") imageUrl = resolved.toString();
    } catch {
      imageUrl = null;
    }
  }

  const price = parsePrice(
    meta["product:price:amount"] ??
      meta["og:price:amount"] ??
      meta["price"] ??
      (offer?.price as string | number | undefined) ??
      (offer?.lowPrice as string | number | undefined),
  );
  const currencyRaw =
    meta["product:price:currency"] ?? meta["og:price:currency"] ?? meta["pricecurrency"] ?? (offer?.priceCurrency as string | undefined);
  const currency = currencyRaw && /^[A-Za-z]{3}$/.test(currencyRaw) ? currencyRaw.toUpperCase() : null;

  return {
    url: pageUrl,
    title,
    imageUrl,
    price,
    currency,
    siteName: clean(meta["og:site_name"], 80),
  };
}
