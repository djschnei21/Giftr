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
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    const key = (a.property ?? a.name ?? a.itemprop ?? "").toLowerCase();
    if (key && a.content && !(key in meta)) meta[key] = a.content;
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
  const title = clean(meta["og:title"] ?? meta["twitter:title"] ?? (product?.name as string | undefined) ?? titleTag);

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
