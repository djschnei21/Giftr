import { describe, expect, it } from "vitest";
import { daysUntilChristmas, hanukkahStatus, parseHoliday } from "./holiday";

describe("parseHoliday", () => {
  it("defaults anything unknown to christmas", () => {
    expect(parseHoliday(undefined)).toBe("christmas");
    expect(parseHoliday(null)).toBe("christmas");
    expect(parseHoliday("")).toBe("christmas");
    expect(parseHoliday("nope")).toBe("christmas");
    expect(parseHoliday("Hanukkah")).toBe("christmas");
    expect(parseHoliday("christmas")).toBe("christmas");
  });

  it("accepts hanukkah", () => {
    expect(parseHoliday("hanukkah")).toBe("hanukkah");
  });
});

describe("daysUntilChristmas", () => {
  it("counts down to the 25th and rolls over the day after", () => {
    expect(daysUntilChristmas(new Date(2026, 11, 24))).toBe(1);
    expect(daysUntilChristmas(new Date(2026, 11, 25))).toBe(0);
    expect(daysUntilChristmas(new Date(2026, 11, 26))).toBe(364);
  });
});

describe("hanukkahStatus", () => {
  it("counts the evening before 25 Kislev as night 1", () => {
    expect(hanukkahStatus(new Date(2026, 11, 3))).toEqual({ daysUntil: 1 });
    expect(hanukkahStatus(new Date(2026, 11, 4))).toEqual({ night: 1 });
    expect(hanukkahStatus(new Date(2026, 11, 11))).toEqual({ night: 8 });
  });

  it("counts forward to the next eve after the festival", () => {
    const start = new Date(2026, 11, 12);
    const status = hanukkahStatus(start);
    expect(status).toEqual({ daysUntil: 377 });
    const target = new Date(start);
    target.setDate(target.getDate() + (status as { daysUntil: number }).daysUntil);
    expect(target.getFullYear()).toBe(2027);
    expect(target.getMonth()).toBe(11);
    expect(target.getDate()).toBe(24);
  });
});
