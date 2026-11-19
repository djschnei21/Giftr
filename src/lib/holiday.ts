export const HOLIDAY_COOKIE = "giftr-holiday";

export type Holiday = "christmas" | "hanukkah";

/** Unknown, empty, and missing values stay on the Christmas default. */
export function parseHoliday(value?: string | null): Holiday {
  return value === "hanukkah" ? "hanukkah" : "christmas";
}

/** Whole local days from today until December 25. On the 26th it rolls to next year. */
export function daysUntilChristmas(now = new Date()) {
  const year = now.getMonth() === 11 && now.getDate() > 25 ? now.getFullYear() + 1 : now.getFullYear();
  const christmas = Date.UTC(year, 11, 25);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((christmas - today) / 86_400_000);
}

const hebrewDate = new Intl.DateTimeFormat("en-u-ca-hebrew", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function localNoon(year: number, month: number, day: number) {
  return new Date(year, month, day, 12);
}

function addDays(date: Date, days: number) {
  return localNoon(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function diffDays(from: Date, to: Date) {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / 86_400_000);
}

function isTwentyFifthOfKislev(date: Date) {
  let day = "";
  let month = "";
  for (const part of hebrewDate.formatToParts(date)) {
    if (part.type === "day") day = part.value;
    if (part.type === "month") month = part.value;
  }
  return month === "Kislev" && Number(day) === 25;
}

export type HanukkahNight = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * The first candle is lit the evening before 25 Kislev, so the countdown
 * targets that local date. During the eight nights, returns which night it is.
 */
export function hanukkahStatus(now = new Date()): { daysUntil: number } | { night: HanukkahNight } {
  const today = localNoon(now.getFullYear(), now.getMonth(), now.getDate());
  for (let offset = -8; offset <= 400; offset++) {
    const kislev = addDays(today, offset);
    if (!isTwentyFifthOfKislev(kislev)) continue;
    const eve = addDays(kislev, -1);
    const daysUntil = diffDays(today, eve);
    if (daysUntil > 0) return { daysUntil };
    const night = -daysUntil + 1;
    if (night >= 1 && night <= 8) return { night: night as HanukkahNight };
  }
  return { daysUntil: 0 };
}

type HolidayCopy = {
  countdownToday: string;
  countdownOne: string;
  countdownMany: string;
  countdownNight?: (night: number) => string;
  greeting: (name: string) => string;
  heroScript: string;
  /** Trailing sentence on the hero. Empty in Hanukkah mode. */
  heroApprove: string;
  featuresEyebrow: string;
  stepsEyebrow: string;
  ctaScript: string;
  footerScript: string;
  wishlistsScript: string;
  wishlistHeaderScript: string;
  revealScript: string;
};

export const holidayCopy: Record<Holiday, HolidayCopy> = {
  christmas: {
    countdownToday: "Merry Christmas!",
    countdownOne: "sleep until Christmas",
    countdownMany: "sleeps until Christmas",
    greeting: (name) => `Ho ho ho, ${name}!`,
    heroScript: "Ho ho ho!",
    heroApprove: " Santa would approve.",
    featuresEyebrow: "Deck the halls",
    stepsEyebrow: "Three jolly steps",
    ctaScript: "Merry Christmas to all!",
    footerScript: "Merry Christmas & happy holidays",
    wishlistsScript: "Dear Santa…",
    wishlistHeaderScript: "Dear Santa, I'd love…",
    revealScript: "Santa left something under the tree…",
  },
  hanukkah: {
    countdownToday: "Happy Hanukkah!",
    countdownOne: "night until Hanukkah",
    countdownMany: "nights until Hanukkah",
    countdownNight: (night) => `Night ${night} of Hanukkah`,
    greeting: (name) => `Happy Hanukkah, ${name}!`,
    heroScript: "Chag sameach!",
    heroApprove: "",
    featuresEyebrow: "Light up the season",
    stepsEyebrow: "Three bright steps",
    ctaScript: "Happy Hanukkah to all!",
    footerScript: "Happy Hanukkah & happy holidays",
    wishlistsScript: "My wishlist…",
    wishlistHeaderScript: "I'd love…",
    revealScript: "Something's waiting by the menorah…",
  },
};
