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

/** Storefront currency when the price text itself has no region marker (bare "$"). */
function currencyFromAmazonHost(hostname: string): string | null {
  const h = hostname.toLowerCase().replace(/^www\./, "");
  if (h === "a.co" || h === "amzn.to" || h.endsWith(".amzn.to") || h === "amazon.com" || h.endsWith(".amazon.com"))
    return "USD";
  if (h === "amazon.ca" || h.endsWith(".amazon.ca")) return "CAD";
  if (h === "amazon.co.uk" || h.endsWith(".amazon.co.uk")) return "GBP";
  if (h === "amazon.com.au" || h.endsWith(".amazon.com.au")) return "AUD";
  if (h === "amazon.com.mx" || h.endsWith(".amazon.com.mx")) return "MXN";
  if (h === "amazon.co.jp" || h.endsWith(".amazon.co.jp")) return "JPY";
  if (h === "amazon.in" || h.endsWith(".amazon.in")) return "INR";
  if (h === "amazon.com.br" || h.endsWith(".amazon.com.br")) return "BRL";
  if (h === "amazon.se" || h.endsWith(".amazon.se")) return "SEK";
  if (/(^|\.)amazon\.(de|fr|it|es|nl|com\.be)$/.test(h)) return "EUR";
  return null;
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
      if (
        next.hostname === current.hostname &&
        next.pathname.replace(/\/$/, "") === current.pathname.replace(/\/$/, "")
      )
        continue;
      return next.toString();
    } catch {
      // Ignore malformed follow-up URLs.
    }
  }
  return null;
}

/**
 * Open the product page when this response is only a short-link shell: a real
 * title (often just the URL slug) with no price, or a placeholder title.
 * Returns null once we're already on that product URL.
 */
export function productPageToOpen(preview: Pick<LinkPreview, "title" | "price">, html: string, pageUrl: string) {
  if (preview.price !== null && !isGenericTitle(preview.title)) return null;
  return nextProductUrl(html, pageUrl);
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

const PRICE_CLASS = /^(?:priceToPay|apexPriceToPay|apex-pricetopay-value)$/i;

function classTokens(cls: string) {
  return cls.split(/\s+/).filter(Boolean);
}

function hasToken(cls: string, name: string) {
  return classTokens(cls).some((token) => token.toLowerCase() === name.toLowerCase());
}

const TAG = String.raw`<([a-z0-9]+)\b(?:[^>"']|"[^"]*"|'[^']*')*>`;

function classAttr(tag: string) {
  const match = tag.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  return match?.[1] ?? match?.[2] ?? "";
}

/** Inner HTML of the element that starts at `start` (the index of its `<`). */
function elementInner(html: string, start: number) {
  const open = html.slice(start).match(new RegExp(`^${TAG}`, "i"));
  if (!open) return "";
  const tag = open[1].toLowerCase();
  const innerStart = start + open[0].length;
  const re = new RegExp(String.raw`</?${tag}\b(?:[^>"']|"[^"]*"|'[^']*')*>`, "gi");
  re.lastIndex = innerStart;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(innerStart, match.index);
  }
  return html.slice(innerStart, innerStart + 1500);
}

function textFromAriaHidden(inner: string) {
  const re = /<span\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  for (const match of inner.matchAll(re)) {
    if (!/\baria-hidden\s*=\s*["']true["']/i.test(match[0]) || match.index === undefined) continue;
    const text = decodeEntities(elementInner(inner, match.index).replace(/<[^>]+>/g, "")).replace(/\s+/g, "");
    if (parsePrice(text) !== null) return text;
  }
  return null;
}

/** Price inside one buy-box element. Ignores siblings, so a struck list price next door is not used. */
function priceFromElement(html: string, start: number) {
  const inner = elementInner(html, start);
  if (!inner) return null;
  for (const match of inner.matchAll(/<span\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    if (!/\ba-offscreen\b/i.test(classAttr(match[0])) || match.index === undefined) continue;
    const text = decodeEntities(inner.slice(match.index + match[0].length).split("<")[0] ?? "")
      .replace(/\s+/g, " ")
      .trim();
    if (parsePrice(text) !== null) return text;
  }
  // Current Amazon pages leave .a-offscreen empty and put "$36.00" in the aria-hidden spans.
  const hidden = textFromAriaHidden(inner);
  if (hidden && parsePrice(hidden) !== null) return hidden;
  const whole = inner.match(/class=["'][^"']*\ba-price-whole\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
  const fraction = inner.match(/class=["'][^"']*\ba-price-fraction\b[^"']*["'][^>]*>([^<]*)/i);
  if (!whole) return null;
  const w = decodeEntities(whole[1].replace(/<[^>]+>/g, "")).replace(/\s+/g, "");
  const f = fraction ? decodeEntities(fraction[1]).replace(/\s+/g, "") : "";
  const combined = /[.,]$/.test(w) ? `${w}${f}` : f ? `${w}.${f}` : w;
  return parsePrice(combined) !== null ? combined : null;
}

function firstTaggedPrice(html: string, accept: (cls: string) => boolean) {
  const re = new RegExp(TAG, "gi");
  for (const match of html.matchAll(re)) {
    const cls = classAttr(match[0]);
    if (!cls || !accept(cls)) continue;
    const price = priceFromElement(html, match.index ?? 0);
    if (price) return price;
  }
  return null;
}

function sliceById(html: string, id: string) {
  const match = new RegExp(`id=["']${id}["']`, "i").exec(html);
  if (!match || match.index === undefined) return null;
  return html.slice(match.index, match.index + 20_000);
}

function jsonPriceAmount(html: string) {
  const block = decodeEntities(html).match(/"priceToPay"\s*:\s*\{[\s\S]{0,800}?\}/)?.[0];
  const amount = block?.match(/"priceAmount"\s*:\s*"?(\d[\d.,]*)"?/)?.[1];
  return amount && parsePrice(amount) !== null ? amount : null;
}

/**
 * The price a shopper sees. Amazon no longer sends product:price meta on the
 * product page; the amount is in the buy box (or a priceToPay JSON blob when
 * the widget markup is missing).
 */
function amazonPriceRaw(html: string) {
  const pay = firstTaggedPrice(html, (cls) => classTokens(cls).some((token) => PRICE_CLASS.test(token)));
  if (pay) return pay;
  for (const id of ["corePriceDisplay_desktop_feature_div", "corePrice_feature_div", "apex_desktop"]) {
    const region = sliceById(html, id);
    if (!region) continue;
    const priced = firstTaggedPrice(region, (cls) => {
      if (!hasToken(cls, "a-price")) return false;
      if (hasToken(cls, "a-text-price") && !classTokens(cls).some((token) => PRICE_CLASS.test(token))) return false;
      return true;
    });
    if (priced) return priced;
  }
  const legacy = html.match(
    /id=["'](?:priceblock_ourprice|priceblock_dealprice|price_inside_buybox)["'][^>]*>\s*([^<]+)/i,
  );
  const legacyText = legacy?.[1] ? decodeEntities(legacy[1]).replace(/\s+/g, " ").trim() : "";
  if (legacyText && parsePrice(legacyText) !== null) return legacyText;
  return jsonPriceAmount(html);
}

const PRICE_SYMBOLS: [string, string][] = [
  ["US$", "USD"],
  ["CDN$", "CAD"],
  ["CA$", "CAD"],
  ["AU$", "AUD"],
  ["MX$", "MXN"],
  ["NZ$", "NZD"],
  ["A$", "AUD"],
  ["C$", "CAD"],
  ["R$", "BRL"],
  ["£", "GBP"],
  ["€", "EUR"],
  ["₹", "INR"],
  ["¥", "JPY"],
  ["CHF", "CHF"],
];

function symbolCurrency(raw: string, pageUrl: string) {
  for (const [token, code] of PRICE_SYMBOLS) if (raw.includes(token)) return code;
  if (raw.includes("$")) return currencyFromAmazonHost(pageHost(pageUrl)) ?? "USD";
  if (raw.includes("kr")) return "SEK";
  return null;
}

function currencyForAmazon(raw: string, html: string, pageUrl: string) {
  const fromRaw = symbolCurrency(raw, pageUrl);
  if (fromRaw) return fromRaw;
  const block = decodeEntities(html).match(/"priceToPay"\s*:\s*\{[\s\S]{0,800}?\}/)?.[0] ?? "";
  const token = block.match(/"(?:currencySymbol|priceCurrency|currencyCode)"\s*:\s*"([^"]+)"/)?.[1];
  if (token && /^[A-Za-z]{3}$/.test(token)) return token.toUpperCase();
  if (token) {
    const fromToken = symbolCurrency(token, pageUrl);
    if (fromToken) return fromToken;
  }
  return currencyFromAmazonHost(pageHost(pageUrl));
}

function amazonDisplayedPrice(html: string, pageUrl: string) {
  const raw = amazonPriceRaw(html);
  if (!raw) return null;
  const price = parsePrice(raw);
  if (price === null) return null;
  return { price, currency: currencyForAmazon(raw, html, pageUrl) };
}

function offerNode(offer: JsonLd | undefined, key: "priceSpecification") {
  const value = offer?.[key] as JsonLd | JsonLd[] | undefined;
  return Array.isArray(value) ? value[0] : value;
}

function offerAmount(offer: JsonLd | undefined): unknown {
  if (!offer) return undefined;
  const direct = offer.price ?? offer.lowPrice;
  if (direct && typeof direct === "object") {
    const nested = direct as JsonLd;
    return nested.price ?? nested.value ?? nested.amount;
  }
  if (direct !== undefined && direct !== null) return direct;
  const spec = offerNode(offer, "priceSpecification");
  return spec?.price ?? spec?.value;
}

function offerCurrency(offer: JsonLd | undefined): unknown {
  if (!offer) return undefined;
  if (typeof offer.priceCurrency === "string") return offer.priceCurrency;
  const spec = offerNode(offer, "priceSpecification");
  return spec?.priceCurrency;
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

  const currencyRaw =
    meta["product:price:currency"] ?? meta["og:price:currency"] ?? meta["pricecurrency"] ?? offerCurrency(offer);
  let price = parsePrice(
    meta["product:price:amount"] ?? meta["og:price:amount"] ?? meta["price"] ?? offerAmount(offer),
  );
  let currency =
    typeof currencyRaw === "string" && /^[A-Za-z]{3}$/.test(currencyRaw) ? currencyRaw.toUpperCase() : null;
  // The buy box is the price on the page. Meta tags on Amazon are often missing or stale.
  if (isAmazonHost(pageHost(pageUrl))) {
    const displayed = amazonDisplayedPrice(head, pageUrl);
    if (displayed) {
      price = displayed.price;
      currency = displayed.currency ?? currency;
    }
  }

  return {
    url: pageUrl,
    title,
    imageUrl,
    price,
    currency,
    siteName: clean(meta["og:site_name"], 80),
  };
}
