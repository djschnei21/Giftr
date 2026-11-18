import { describe, expect, it } from "vitest";
import { FESTIVITY_BOOT_SCRIPT, FESTIVITY_STORAGE_KEY, parseFestivity } from "./festivity";

describe("parseFestivity", () => {
  it.each(["high", "medium", "low"] as const)("keeps %s", (level) => {
    expect(parseFestivity(level)).toBe(level);
  });

  it.each([null, undefined, "", "HIGH", "none", " festive ", "0", "max"])("maps %j to high", (value) => {
    expect(parseFestivity(value)).toBe("high");
  });
});

describe("festivity boot script", () => {
  function boot(stored: string | null, fail = false) {
    const attrs = new Map<string, string>();
    const document = {
      documentElement: {
        setAttribute(name: string, value: string) {
          attrs.set(name, value);
        },
      },
    };
    const localStorage = {
      getItem(key: string) {
        if (fail) throw new Error("blocked");
        if (key !== FESTIVITY_STORAGE_KEY) return null;
        return stored;
      },
    };
    const run = new Function("document", "localStorage", FESTIVITY_BOOT_SCRIPT) as (
      document: { documentElement: { setAttribute(name: string, value: string): void } },
      localStorage: { getItem(key: string): string | null },
    ) => void;
    run(document, localStorage);
    return attrs.get("data-festivity");
  }

  it("writes a stored medium or low stop", () => {
    expect(boot("low")).toBe("low");
    expect(boot("medium")).toBe("medium");
    expect(boot("high")).toBe("high");
  });

  it("maps a missing, junk, or unreadable value to high", () => {
    expect(boot(null)).toBe("high");
    expect(boot("extra")).toBe("high");
    expect(boot("low", true)).toBe("high");
  });
});
