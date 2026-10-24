import type { Rng } from "./types";

/** Uniform [0, 1) from the platform CSPRNG. */
export const cryptoRng: Rng = () => {
  const buf = new Uint32Array(2);
  globalThis.crypto.getRandomValues(buf);
  // 53 bits of randomness, like Math.random's mantissa.
  return (buf[0] * 2 ** 21 + (buf[1] >>> 11)) / 2 ** 53;
};

/** Deterministic generator for tests (mulberry32). */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng: Rng, maxExclusive: number) {
  return Math.floor(rng() * maxExclusive);
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
