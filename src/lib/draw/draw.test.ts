import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  addToCoupledDraw,
  addToDraw,
  drawCoupled,
  drawNames,
  removeFromCoupledDraw,
  removeFromDraw,
  seededRng,
  validate,
  type CoupledPairs,
  type DrawPerson,
  type DrawRules,
  type Pair,
} from ".";

const people = (n: number, households: (string | null)[] = []): DrawPerson[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, householdId: households[i] ?? null }));

/** Exhaustively decide whether any valid assignment exists (small n only). */
function bruteForceExists(ps: DrawPerson[], rules: DrawRules): boolean {
  if (ps.length < 2) return false;
  const ids = ps.map((p) => p.id);
  const permute = (rest: string[], acc: string[]): boolean => {
    if (rest.length === 0) {
      const pairs = acc.map((r, i) => ({ giverId: ids[i], recipientId: r }));
      return validate(ps, rules, pairs).length === 0;
    }
    return rest.some((r, i) => permute([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, r]));
  };
  return permute(ids, []);
}

const scenario = fc
  .integer({ min: 0, max: 7 })
  .chain((n) =>
    fc.record({
      n: fc.constant(n),
      households: fc.array(fc.option(fc.constantFrom("h1", "h2", "h3"), { nil: null }), {
        minLength: n,
        maxLength: n,
      }),
      exclusions: fc.array(
        fc.record({ g: fc.nat({ max: Math.max(n - 1, 0) }), r: fc.nat({ max: Math.max(n - 1, 0) }) }),
        { maxLength: n * 2 },
      ),
      noReciprocal: fc.boolean(),
      singleLoop: fc.boolean(),
      seed: fc.integer(),
    }),
  );

describe("drawNames", () => {
  it("returns valid assignments and only fails when no assignment exists", () => {
    fc.assert(
      fc.property(scenario, (s) => {
        const ps = people(s.n, s.households);
        const rules: DrawRules = {
          exclusions: s.exclusions.map((e) => ({ giverId: `p${e.g}`, recipientId: `p${e.r}` })),
          noReciprocal: s.noReciprocal,
          singleLoop: s.singleLoop,
        };
        const result = drawNames(ps, rules, { rng: seededRng(s.seed), shuffleAttempts: 50 });
        if (result.ok) {
          expect(validate(ps, rules, result.pairs)).toEqual([]);
        } else {
          expect(result.blockers.length).toBeGreaterThan(0);
          expect(bruteForceExists(ps, rules)).toBe(false);
        }
      }),
      { numRuns: 400 },
    );
  });

  it("finds tight solutions through the backtracking search", () => {
    // Everyone may only give to the next person: exactly one valid draw.
    const ps = people(12);
    const exclusions: Pair[] = [];
    for (let g = 0; g < 12; g++)
      for (let r = 0; r < 12; r++) if (r !== (g + 1) % 12 && r !== g) exclusions.push({ giverId: `p${g}`, recipientId: `p${r}` });
    const result = drawNames(ps, { exclusions }, { rng: seededRng(1), shuffleAttempts: 10 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.method).toBe("search");
      expect(validate(ps, { exclusions }, result.pairs)).toEqual([]);
    }
  });

  it("explains who is excluded from everyone", () => {
    const ps = people(3);
    const exclusions = [
      { giverId: "p0", recipientId: "p1" },
      { giverId: "p0", recipientId: "p2" },
    ];
    const result = drawNames(ps, { exclusions });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.blockers[0].message).toMatch(/P0 is excluded from everyone/);
  });

  it("explains an oversized household", () => {
    const result = drawNames(people(5, ["h", "h", "h", null, null]));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.blockers[0].code).toBe("household_too_big");
  });

  it("names the squeezed group", () => {
    // p0 and p1 can both only draw p2.
    const ps = people(4);
    const exclusions = ["p1", "p3"].flatMap((r) => [{ giverId: "p0", recipientId: r }]).concat(
      ["p0", "p3"].map((r) => ({ giverId: "p1", recipientId: r })),
    );
    const result = drawNames(ps, { exclusions });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.blockers[0].code).toBe("group_squeezed");
      expect(result.blockers[0].message).toContain("P0 and P1 can only draw P2");
    }
  });

  it("suggests turning off the swap rule for two people", () => {
    const result = drawNames(people(2), { noReciprocal: true });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.blockers[0].code).toBe("too_few_for_no_swaps");
  });

  it("produces a single loop when asked", () => {
    const ps = people(9);
    for (let seed = 0; seed < 20; seed++) {
      const result = drawNames(ps, { singleLoop: true }, { rng: seededRng(seed) });
      expect(result.ok && validate(ps, { singleLoop: true }, result.pairs)).toEqual([]);
    }
  });

  it("is roughly uniform over valid draws", () => {
    // 4 people have 9 derangements; each should come up about 1/9 of the time.
    const ps = people(4);
    const counts = new Map<string, number>();
    const rng = seededRng(42);
    const runs = 9000;
    for (let i = 0; i < runs; i++) {
      const result = drawNames(ps, {}, { rng });
      if (!result.ok) throw new Error("unexpected failure");
      const k = result.pairs.map((p) => p.recipientId).join(",");
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    expect(counts.size).toBe(9);
    for (const c of counts.values()) expect(Math.abs(c - runs / 9)).toBeLessThan(150);
  });

  it("avoids last year's pairings unless impossible", () => {
    const ps = people(3);
    const avoid = [{ giverId: "p0", recipientId: "p1" }];
    for (let seed = 0; seed < 20; seed++) {
      const result = drawNames(ps, { avoid }, { rng: seededRng(seed) });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.relaxedSoftRules).toBe(false);
        expect(result.pairs.find((p) => p.giverId === "p0")?.recipientId).toBe("p2");
      }
    }
    const impossible = drawNames(people(2), { avoid: [{ giverId: "p0", recipientId: "p1" }] });
    expect(impossible.ok && impossible.relaxedSoftRules).toBe(true);
  });
});

describe("repairs", () => {
  const ruleSets = fc.record({ noReciprocal: fc.boolean(), singleLoop: fc.boolean() });

  it("removing someone changes at most two matches and stays valid", () => {
    fc.assert(
      fc.property(fc.integer({ min: 4, max: 10 }), ruleSets, fc.integer(), fc.nat(), (n, flags, seed, pick) => {
        const ps = people(n);
        const rules: DrawRules = flags;
        const drawn = drawNames(ps, rules, { rng: seededRng(seed) });
        if (!drawn.ok) return;
        const removed = ps[pick % n].id;
        const result = removeFromDraw(ps, rules, drawn.pairs, removed, seededRng(seed));
        if (!result.ok) return;
        const remaining = ps.filter((p) => p.id !== removed);
        expect(validate(remaining, rules, result.pairs)).toEqual([]);
        expect(result.changedGivers.length).toBeLessThanOrEqual(2);
      }),
      { numRuns: 200 },
    );
  });

  it("a removal in a plain loop only changes the removed person's Santa", () => {
    const ps = people(5);
    const pairs = ps.map((p, i) => ({ giverId: p.id, recipientId: ps[(i + 1) % 5].id }));
    const result = removeFromDraw(ps, { singleLoop: true }, pairs, "p2");
    expect(result).toMatchObject({ ok: true, changedGivers: ["p1"] });
    if (result.ok) expect(result.pairs.find((p) => p.giverId === "p1")?.recipientId).toBe("p3");
  });

  it("a late joiner is spliced in and only one match changes", () => {
    fc.assert(
      fc.property(fc.integer({ min: 3, max: 10 }), ruleSets, fc.integer(), (n, flags, seed) => {
        const ps = people(n);
        const rules: DrawRules = flags;
        const drawn = drawNames(ps, rules, { rng: seededRng(seed) });
        if (!drawn.ok) return;
        const all = [...ps, { id: "new", name: "New" }];
        const result = addToDraw(all, rules, drawn.pairs, "new", seededRng(seed));
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(validate(all, rules, result.pairs)).toEqual([]);
          expect(result.changedGivers).toHaveLength(1);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("reports when a late joiner can't fit", () => {
    const ps = people(3);
    const pairs = [
      { giverId: "p0", recipientId: "p1" },
      { giverId: "p1", recipientId: "p2" },
      { giverId: "p2", recipientId: "p0" },
    ];
    const all = [...ps, { id: "new", name: "New" }];
    const exclusions = ps.map((p) => ({ giverId: "new", recipientId: p.id }));
    expect(addToDraw(all, { exclusions }, pairs, "new").ok).toBe(false);
  });
});

function noGiverRepeatsRecipient(pairs: CoupledPairs) {
  const mainOf = new Map(pairs.main.map((p) => [p.giverId, p.recipientId]));
  return pairs.wildcard.every((p) => mainOf.get(p.giverId) !== p.recipientId);
}

const coupledRuleSets = fc.record({ noReciprocal: fc.boolean(), singleLoop: fc.boolean() });

describe("drawCoupled", () => {
  it("draws two independently valid lanes where nobody's wildcard is their main recipient", () => {
    fc.assert(
      fc.property(fc.integer({ min: 3, max: 9 }), coupledRuleSets, fc.integer(), (n, flags, seed) => {
        const ps = people(n);
        const rules: DrawRules = flags;
        const result = drawCoupled(ps, rules, { rng: seededRng(seed), shuffleAttempts: 50 });
        if (!result.ok) return;
        expect(validate(ps, rules, result.pairs.main)).toEqual([]);
        expect(validate(ps, rules, result.pairs.wildcard)).toEqual([]);
        expect(noGiverRepeatsRecipient(result.pairs)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it("fails with a clear blocker when only two people are in the draw", () => {
    // With 2 people, every main draw forces the only possible wildcard recipient to match it.
    const result = drawCoupled(people(2));
    expect(result.ok).toBe(false);
  });

  it("always finds a valid pair of loops for a plain group of 4+", () => {
    for (let seed = 0; seed < 30; seed++) {
      const ps = people(4 + (seed % 5));
      const result = drawCoupled(ps, {}, { rng: seededRng(seed) });
      expect(result.ok).toBe(true);
      if (result.ok) expect(noGiverRepeatsRecipient(result.pairs)).toBe(true);
    }
  });
});

describe("coupled repairs", () => {
  it("removing someone keeps both lanes valid and collision-free", () => {
    fc.assert(
      fc.property(fc.integer({ min: 5, max: 10 }), coupledRuleSets, fc.integer(), fc.nat(), (n, flags, seed, pick) => {
        const ps = people(n);
        const rules: DrawRules = flags;
        const drawn = drawCoupled(ps, rules, { rng: seededRng(seed) });
        if (!drawn.ok) return;
        const removed = ps[pick % n].id;
        const result = removeFromCoupledDraw(ps, rules, drawn.pairs, removed, seededRng(seed));
        if (!result.ok) return;
        const remaining = ps.filter((p) => p.id !== removed);
        expect(validate(remaining, rules, result.pairs.main)).toEqual([]);
        expect(validate(remaining, rules, result.pairs.wildcard)).toEqual([]);
        expect(noGiverRepeatsRecipient(result.pairs)).toBe(true);
      }),
      { numRuns: 150 },
    );
  });

  it("a late joiner is spliced into both lanes without a collision", () => {
    fc.assert(
      fc.property(fc.integer({ min: 4, max: 10 }), coupledRuleSets, fc.integer(), (n, flags, seed) => {
        const ps = people(n);
        const rules: DrawRules = flags;
        const drawn = drawCoupled(ps, rules, { rng: seededRng(seed) });
        if (!drawn.ok) return;
        const all = [...ps, { id: "new", name: "New" }];
        const result = addToCoupledDraw(all, rules, drawn.pairs, "new", seededRng(seed));
        if (!result.ok) return;
        expect(validate(all, rules, result.pairs.main)).toEqual([]);
        expect(validate(all, rules, result.pairs.wildcard)).toEqual([]);
        expect(noGiverRepeatsRecipient(result.pairs)).toBe(true);
      }),
      { numRuns: 150 },
    );
  });
});
