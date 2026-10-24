import { buildGraph, type Graph } from "./constraints";
import { explainInfeasible } from "./feasibility";
import { cryptoRng, shuffle } from "./rng";
import type { Blocker, DrawPerson, DrawResult, DrawRules, Pair, Rng } from "./types";

export type DrawOptions = {
  rng?: Rng;
  shuffleAttempts?: number;
  searchBudget?: number;
};

type Indexed = number[]; // recipient index for each giver index

function toPairs(graph: Graph, rec: Indexed): Pair[] {
  return rec.map((r, g) => ({ giverId: graph.people[g].id, recipientId: graph.people[r].id }));
}

function shuffleAttempt(graph: Graph, rules: DrawRules, rng: Rng): Indexed | null {
  const n = graph.people.length;
  const idx = [...Array(n).keys()];
  const rec = new Array<number>(n);
  if (rules.singleLoop) {
    const order = shuffle(idx, rng);
    for (let i = 0; i < n; i++) rec[order[i]] = order[(i + 1) % n];
  } else {
    const perm = shuffle(idx, rng);
    for (let g = 0; g < n; g++) rec[g] = perm[g];
  }
  for (let g = 0; g < n; g++) {
    if (!graph.allowed[g][rec[g]]) return null;
    if (rules.noReciprocal && rec[rec[g]] === g) return null;
  }
  return rec;
}

type SearchOutcome = { rec: Indexed } | { exhausted: boolean };

function search(graph: Graph, rules: DrawRules, rng: Rng, budget: number): SearchOutcome {
  const n = graph.people.length;
  const rec = new Array<number>(n).fill(-1);
  const giverOf = new Array<number>(n).fill(-1);
  const optionCount = graph.allowed.map((row) => row.filter(Boolean).length);
  // Most-constrained givers first; random tie-breaks keep results varied.
  const order = shuffle([...Array(n).keys()], rng).sort((a, b) => optionCount[a] - optionCount[b]);
  const candidates = order.map((g) =>
    shuffle(
      [...Array(n).keys()].filter((r) => graph.allowed[g][r]),
      rng,
    ),
  );
  let nodes = 0;
  let exhausted = false;

  const closesShortLoop = (g: number, r: number, assigned: number) => {
    let cur = r;
    while (rec[cur] !== -1) cur = rec[cur];
    return cur === g && assigned + 1 < n;
  };

  const step = (i: number): boolean => {
    if (i === n) return true;
    if (++nodes > budget) {
      exhausted = true;
      return false;
    }
    const g = order[i];
    for (const r of candidates[i]) {
      if (giverOf[r] !== -1) continue;
      if (rules.noReciprocal && rec[r] === g) continue;
      if (rules.singleLoop && closesShortLoop(g, r, i)) continue;
      rec[g] = r;
      giverOf[r] = g;
      if (step(i + 1)) return true;
      rec[g] = -1;
      giverOf[r] = -1;
      if (exhausted) return false;
    }
    return false;
  };

  return step(0) ? { rec } : { exhausted };
}

type AttemptResult =
  | { graph: Graph; rec: Indexed; method: "shuffle" | "search" }
  | { graph: Graph; blockers: Blocker[] };

function attempt(
  people: DrawPerson[],
  rules: DrawRules,
  includeSoft: boolean,
  opts: Required<DrawOptions>,
): AttemptResult {
  const graph = buildGraph(people, rules, includeSoft);
  const blockers = explainInfeasible(graph, rules);
  if (blockers.length) return { graph, blockers };

  for (let i = 0; i < opts.shuffleAttempts; i++) {
    const rec = shuffleAttempt(graph, rules, opts.rng);
    if (rec) return { graph, rec, method: "shuffle" };
  }
  const outcome = search(graph, rules, opts.rng, opts.searchBudget);
  if ("rec" in outcome) return { graph, rec: outcome.rec, method: "search" };
  return { graph, blockers: [conflictBlocker(people, rules, opts, outcome.exhausted)] };
}

function conflictBlocker(
  people: DrawPerson[],
  rules: DrawRules,
  opts: Required<DrawOptions>,
  exhausted: boolean,
): Blocker {
  const plain = { exclusions: rules.exclusions };
  const culprit = (r: DrawRules) => {
    const graph = buildGraph(people, r, false);
    if (explainInfeasible(graph, r).length) return false;
    return "rec" in search(graph, r, opts.rng, opts.searchBudget);
  };
  const tips: string[] = [];
  if (rules.singleLoop && culprit({ ...plain, noReciprocal: rules.noReciprocal })) tips.push("turn off “One big loop”");
  if (rules.noReciprocal && culprit({ ...plain, singleLoop: rules.singleLoop })) tips.push("turn off “No two-person swaps”");
  const fix = tips.length ? `Try to ${tips.join(" or ")}, or remove an exclusion.` : "Try removing an exclusion or household link.";
  return {
    code: "rules_conflict",
    message: `${exhausted ? "We couldn't find" : "There's no"} arrangement that satisfies every rule at once. ${fix}`,
  };
}

/**
 * Draw names. Every valid assignment is equally likely when found by the
 * shuffle phase; the randomized search is a fallback for tightly constrained
 * groups. The soft "avoid" rule is relaxed only when the draw is otherwise
 * impossible.
 */
export function drawNames(people: DrawPerson[], rules: DrawRules = {}, options: DrawOptions = {}): DrawResult {
  const opts: Required<DrawOptions> = {
    rng: options.rng ?? cryptoRng,
    shuffleAttempts: options.shuffleAttempts ?? 4000,
    searchBudget: options.searchBudget ?? 200_000,
  };
  const hasSoft = (rules.avoid?.length ?? 0) > 0;
  if (hasSoft) {
    const strict = attempt(people, rules, true, opts);
    if ("rec" in strict)
      return { ok: true, pairs: toPairs(strict.graph, strict.rec), relaxedSoftRules: false, method: strict.method };
  }
  const result = attempt(people, rules, false, opts);
  if ("rec" in result)
    return { ok: true, pairs: toPairs(result.graph, result.rec), relaxedSoftRules: hasSoft, method: result.method };
  return { ok: false, blockers: result.blockers };
}

/** Pre-draw check without committing to a result. */
export function checkDraw(people: DrawPerson[], rules: DrawRules = {}, options: DrawOptions = {}) {
  const result = drawNames(people, rules, options);
  return result.ok ? { ok: true as const, relaxedSoftRules: result.relaxedSoftRules } : result;
}
