import { drawNames, type DrawOptions } from "./draw";
import { addToDraw, removeFromDraw, type RepairResult } from "./repair";
import type { Blocker, DrawPerson, DrawRules, Pair, Rng } from "./types";

export type Slot = "main" | "wildcard";

export type CoupledPairs = { main: Pair[]; wildcard: Pair[] };

/** Rules shared by both lanes, plus each lane's own soft "avoid" (e.g. last year's pairings for that lane). */
export type CoupledDrawRules = {
  exclusions?: Pair[];
  noReciprocal?: boolean;
  singleLoop?: boolean;
  mainAvoid?: Pair[];
  wildcardAvoid?: Pair[];
};

export type CoupledDrawResult =
  | { ok: true; pairs: CoupledPairs; relaxedSoftRules: boolean }
  | { ok: false; blockers: Blocker[] };

export type CoupledDrawOptions = DrawOptions & { attempts?: number };

const DEFAULT_ATTEMPTS = 20;

/** Add `pairs` as one-way bans on top of `rules` — reused to forbid a lane's own recipients in the other lane. */
function withBannedPairs(rules: DrawRules, pairs: Pair[]): DrawRules {
  return { ...rules, exclusions: [...(rules.exclusions ?? []), ...pairs] };
}

function wildcardBlockers(blockers: Blocker[]): Blocker[] {
  return blockers.map((b) => ({
    ...b,
    message: b.message.startsWith("Wildcard gift:") ? b.message : `Wildcard gift: ${b.message}`,
  }));
}

/**
 * Draws two disjoint derangements over the same people: the main gift and the
 * wildcard gift. The only rule linking them is that nobody's wildcard
 * recipient is also their main recipient — everything else (households,
 * exclusions, no-swaps, one loop) applies to each lane independently. When a
 * main draw leaves no legal wildcard arrangement, the main draw is retried
 * (bounded) before giving up.
 */
export function drawCoupled(people: DrawPerson[], rules: CoupledDrawRules = {}, options: CoupledDrawOptions = {}): CoupledDrawResult {
  const { attempts = DEFAULT_ATTEMPTS, ...drawOptions } = options;
  const shared = { exclusions: rules.exclusions, noReciprocal: rules.noReciprocal, singleLoop: rules.singleLoop };
  const mainRules: DrawRules = { ...shared, avoid: rules.mainAvoid };

  let lastWildcardBlockers: Blocker[] | null = null;
  for (let i = 0; i < Math.max(1, attempts); i++) {
    const main = drawNames(people, mainRules, drawOptions);
    if (!main.ok) return main;
    const wildcardRules = withBannedPairs({ ...shared, avoid: rules.wildcardAvoid }, main.pairs);
    const wildcard = drawNames(people, wildcardRules, drawOptions);
    if (wildcard.ok) {
      return {
        ok: true,
        pairs: { main: main.pairs, wildcard: wildcard.pairs },
        relaxedSoftRules: main.relaxedSoftRules || wildcard.relaxedSoftRules,
      };
    }
    lastWildcardBlockers = wildcard.blockers;
  }
  return {
    ok: false,
    blockers: wildcardBlockers(
      lastWildcardBlockers ?? [{ code: "rules_conflict", message: "No arrangement works for both gifts." }],
    ),
  };
}

/** Pre-draw check without committing to a result. */
export function checkCoupledDraw(people: DrawPerson[], rules: CoupledDrawRules = {}, options: CoupledDrawOptions = {}) {
  const result = drawCoupled(people, rules, options);
  return result.ok ? { ok: true as const, relaxedSoftRules: result.relaxedSoftRules } : result;
}

export type CoupledRepairResult =
  | { ok: true; pairs: CoupledPairs; changedGivers: { main: string[]; wildcard: string[] } }
  | { ok: false; reason: string };

/**
 * Patch both lanes when someone leaves the draw. Each lane is repaired with
 * the existing single-lane splice; the wildcard lane also keeps banning
 * everyone's (possibly just-changed) main recipient as their wildcard
 * recipient. If either lane can't be patched, the caller falls back to a full
 * redraw.
 */
export function removeFromCoupledDraw(
  people: DrawPerson[],
  rules: DrawRules,
  pairs: CoupledPairs,
  removedId: string,
  rng?: Rng,
): CoupledRepairResult {
  const main: RepairResult = removeFromDraw(people, rules, pairs.main, removedId, rng);
  if (!main.ok) return main;
  const wildcard: RepairResult = removeFromDraw(people, withBannedPairs(rules, main.pairs), pairs.wildcard, removedId, rng);
  if (!wildcard.ok) return wildcard;
  return {
    ok: true,
    pairs: { main: main.pairs, wildcard: wildcard.pairs },
    changedGivers: { main: main.changedGivers, wildcard: wildcard.changedGivers },
  };
}

/**
 * Splice a late joiner into both lanes the same way: existing splice per
 * lane, with the wildcard lane still banning everyone's main recipient.
 */
export function addToCoupledDraw(
  people: DrawPerson[],
  rules: DrawRules,
  pairs: CoupledPairs,
  newcomerId: string,
  rng?: Rng,
): CoupledRepairResult {
  const main: RepairResult = addToDraw(people, rules, pairs.main, newcomerId, rng);
  if (!main.ok) return main;
  const wildcard: RepairResult = addToDraw(people, withBannedPairs(rules, main.pairs), pairs.wildcard, newcomerId, rng);
  if (!wildcard.ok) return wildcard;
  return {
    ok: true,
    pairs: { main: main.pairs, wildcard: wildcard.pairs },
    changedGivers: { main: main.changedGivers, wildcard: wildcard.changedGivers },
  };
}
