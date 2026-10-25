import { describe, expect, it } from "vitest";
import { isAllowedUrl, isPrivateAddress } from "./net";
import { nextProductUrl, parseHtml, productPageToOpen } from "./parse";

describe("isPrivateAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::",
    "fe80::1",
    "fd00::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "64:ff9b::a00:1",
  ])("blocks %s", (ip) => expect(isPrivateAddress(ip)).toBe(true));

  it.each(["8.8.8.8", "172.32.0.1", "151.101.1.69", "2606:4700::6810:84e5", "::ffff:8.8.8.8"])("allows %s", (ip) =>
    expect(isPrivateAddress(ip)).toBe(false),
  );
});

describe("isAllowedUrl", () => {
  it("allows public http(s) links", () => {
    expect(isAllowedUrl("https://www.example.com/item?id=1")).not.toBeNull();
  });
  it.each([
    "file:///etc/passwd",
    "ftp://example.com",
    "javascript:alert(1)",
    "http://localhost:3000",
    "http://127.0.0.1/admin",
    "http://[::1]/",
    "http://169.254.169.254/latest/meta-data",
    "http://user:pass@example.com",
    "http://example.com:22",
    "http://printer.local/",
    "not a url",
  ])("rejects %s", (raw) => expect(isAllowedUrl(raw)).toBeNull());
});

describe("parseHtml", () => {
  it("reads Open Graph tags", () => {
    const html = `<html><head><title>Fallback</title>
      <meta property="og:title" content="Wingspan &amp; Friends">
      <meta property="og:image" content="/img/wingspan.jpg">
      <meta property="product:price:amount" content="49.99">
      <meta property="product:price:currency" content="usd">
      <meta property="og:site_name" content="Board Game Shop">
    </head></html>`;
    expect(parseHtml(html, "https://shop.example.com/p/1")).toEqual({
      url: "https://shop.example.com/p/1",
      title: "Wingspan & Friends",
      imageUrl: "https://shop.example.com/img/wingspan.jpg",
      price: 50,
      currency: "USD",
      siteName: "Board Game Shop",
    });
  });

  it("falls back to JSON-LD products and the title tag", () => {
    const html = `<title> Kettle | Shop </title><script type="application/ld+json">
      {"@context":"https://schema.org","@graph":[{"@type":"Product","name":"Gooseneck kettle","image":["https://cdn.example.com/k.jpg"],
      "offers":{"@type":"Offer","price":"1.299,00","priceCurrency":"EUR"}}]}</script>`;
    const preview = parseHtml(html, "https://example.com/k");
    expect(preview.title).toBe("Gooseneck kettle");
    expect(parseHtml("<title> Kettle | Shop </title>", "https://example.com").title).toBe("Kettle | Shop");
    expect(preview.imageUrl).toBe("https://cdn.example.com/k.jpg");
    expect(preview.price).toBe(1299);
    expect(preview.currency).toBe("EUR");
  });

  it("ignores non-http images", () => {
    const html = `<meta property="og:image" content="javascript:alert(1)">`;
    expect(parseHtml(html, "https://example.com").imageUrl).toBeNull();
  });

  it("skips Amazon's placeholder title and uses the product name", () => {
    const html = `<html><head>
      <meta property="og:title" content="Amazon">
      <meta property="og:title" content="Amazon.com: Compact Mechanical Keyboard : Electronics">
      <meta property="og:image" content="https://m.media-amazon.com/images/I/keyboard.jpg">
      <meta property="product:price:amount" content="30.00">
      <meta property="product:price:currency" content="USD">
      <title>Amazon</title>
    </head><body>
      <span id="productTitle">Compact Mechanical Keyboard</span>
    </body></html>`;
    const preview = parseHtml(html, "https://www.amazon.com/dp/B0TEST1234");
    expect(preview.title).toBe("Compact Mechanical Keyboard");
    expect(preview.imageUrl).toBe("https://m.media-amazon.com/images/I/keyboard.jpg");
    expect(preview.price).toBe(30);
    expect(preview.currency).toBe("USD");
  });

  it("reads #productTitle when every meta title is just Amazon", () => {
    const html = `<title>Amazon.com</title>
      <meta property="og:title" content="Amazon.com">
      <span id="productTitle">  Wool throw blanket  </span>`;
    expect(parseHtml(html, "https://a.co/d/0148AYVW").title).toBe("Wool throw blanket");
  });

  it("uses the Amazon JSON-LD name and strips the store prefix", () => {
    const html = `<meta property="og:title" content="Amazon">
      <script type="application/ld+json">{"@type":"Product","name":"Amazon.com: Ceramic mug : Home &amp; Kitchen"}</script>`;
    expect(parseHtml(html, "https://www.amazon.com/dp/B0MUG12345").title).toBe("Ceramic mug");
  });

  it("falls back to the product slug in the canonical URL", () => {
    const html = `<meta property="og:title" content="Amazon">
      <link rel="canonical" href="https://www.amazon.com/Linen-Table-Runner/dp/B0RUNNER12">`;
    expect(parseHtml(html, "https://a.co/d/0148AYVW").title).toBe("Linen Table Runner");
  });

  it("follows an Amazon short-link shell to the product page", () => {
    const html = `<meta property="og:title" content="Amazon">
      <link rel="canonical" href="https://www.amazon.com/Linen-Table-Runner/dp/B0RUNNER12">`;
    expect(nextProductUrl(html, "https://a.co/d/0148AYVW")).toBe(
      "https://www.amazon.com/Linen-Table-Runner/dp/B0RUNNER12",
    );
    expect(nextProductUrl(html, "https://www.amazon.com/Linen-Table-Runner/dp/B0RUNNER12")).toBeNull();
  });

  it("reads the buy-box price when Amazon leaves the price meta tag off", () => {
    // Current product pages leave .a-offscreen empty and render the amount in aria-hidden spans.
    // The struck list price sits beside it and must not win. A carousel price further down must not either.
    const html = `<html><head>
      <meta property="og:title" content="Amazon.com: Compact Mechanical Keyboard : Electronics">
      <meta property="product:price:amount" content="80.00">
      <meta property="product:price:currency" content="USD">
    </head><body>
      <span id="productTitle">Compact Mechanical Keyboard</span>
      <div id="corePriceDisplay_desktop_feature_div">
        <span class="a-price a-text-price" data-a-strike="true">
          <span class="a-offscreen">$80.00</span>
        </span>
        <span class="a-price aok-align-center reinventPricePriceToPayMargin priceToPay" data-a-size="xl" data-a-color="base">
          <span class="a-offscreen"></span>
          <span aria-hidden="true"><span class="a-price-symbol">$</span><span class="a-price-whole">36<span class="a-price-decimal">.</span></span><span class="a-price-fraction">00</span></span>
        </span>
      </div>
      <span class="a-price"><span class="a-offscreen">$9.99</span></span>
    </body></html>`;
    const preview = parseHtml(html, "https://www.amazon.com/dp/B0TEST1234");
    expect(preview.title).toBe("Compact Mechanical Keyboard");
    expect(preview.price).toBe(36);
    expect(preview.currency).toBe("USD");
  });

  it("reads a classic a-offscreen buy-box price", () => {
    const html = `<span id="productTitle">Wool throw</span>
      <span class="a-price priceToPay"><span class="a-offscreen">$41.00</span></span>`;
    const preview = parseHtml(html, "https://www.amazon.com/dp/B0THROW123");
    expect(preview.price).toBe(41);
    expect(preview.currency).toBe("USD");
  });

  it("reads the price block and a Canadian dollar sign", () => {
    const html = `<span id="priceblock_ourprice" class="a-size-medium a-color-price">$27.15</span>`;
    const preview = parseHtml(html, "https://www.amazon.ca/dp/B0CAD12345");
    expect(preview.price).toBe(27);
    expect(preview.currency).toBe("CAD");
  });

  it("reads an Amazon.de price from the visible whole and fraction", () => {
    const html = `<span class="a-price priceToPay"><span class="a-offscreen"></span>
      <span aria-hidden="true"><span class="a-price-symbol">€</span><span class="a-price-whole">29<span class="a-price-decimal">,</span></span><span class="a-price-fraction">95</span></span></span>`;
    const preview = parseHtml(html, "https://www.amazon.de/dp/B0EUR12345");
    expect(preview.price).toBe(30);
    expect(preview.currency).toBe("EUR");
  });

  it("reads priceToPay JSON when the buy box markup is missing", () => {
    const html = `<span id="productTitle">Linen runner</span>
      <script>var d = {"priceToPay":{"currencySymbol":"$","priceAmount":24.2}};</script>`;
    const preview = parseHtml(html, "https://www.amazon.com/dp/B0JSON1234");
    expect(preview.price).toBe(24);
    expect(preview.currency).toBe("USD");
  });

  it("opens the product page from a short link that only has a name", () => {
    const html = `<meta property="og:title" content="Amazon">
      <link rel="canonical" href="https://www.amazon.com/Linen-Table-Runner/dp/B0RUNNER12">`;
    const preview = parseHtml(html, "https://a.co/d/0148AYVW");
    expect(preview.title).toBe("Linen Table Runner");
    expect(preview.price).toBeNull();
    expect(productPageToOpen(preview, html, "https://a.co/d/0148AYVW")).toBe(
      "https://www.amazon.com/Linen-Table-Runner/dp/B0RUNNER12",
    );
  });

  it("stays on the product page once the buy-box price is present", () => {
    const html = `<span id="productTitle">Linen Table Runner</span>
      <link rel="canonical" href="https://www.amazon.com/Linen-Table-Runner/dp/B0RUNNER12">
      <span class="a-price priceToPay"><span class="a-offscreen">$22.00</span></span>`;
    const page = "https://www.amazon.com/dp/B0RUNNER12";
    const preview = parseHtml(html, page);
    expect(preview.price).toBe(22);
    expect(productPageToOpen(preview, html, page)).toBeNull();
  });
});
