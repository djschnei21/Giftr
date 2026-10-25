import type { Graph } from "./constraints";
import type { Blocker, DrawPerson, DrawRules } from "./types";

export function listNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Kuhn's algorithm. Returns matchOfRecipient[r] = giver index or -1. */
export function maxMatching(allowed: boolean[][]): number[] {
  const n = allowed.length;
  const matchOfRecipient = new Array<number>(n).fill(-1);
  const tryGiver = (g: number, seen: boolean[]): boolean => {
    for (let r = 0; r < n; r++) {
      if (!allowed[g][r] || seen[r]) continue;
      seen[r] = true;
      if (matchOfRecipient[r] === -1 || tryGiver(matchOfRecipient[r], seen)) {
        matchOfRecipient[r] = g;
        return true;
      }
    }
    return false;
  };
  for (let g = 0; g < n; g++) tryGiver(g, new Array<boolean>(n).fill(false));
  return matchOfRecipient;
}

/**
 * Structural checks that explain why a draw is impossible. These are exact for
 * the basic rules (self, households, exclusions). Swap and loop rules can make
 * an otherwise-feasible draw impossible; the search reports that separately.
 */
export function explainInfeasible(graph: Graph, rules: DrawRules): Blocker[] {
  const { people, allowed } = graph;
  const n = people.length;
  if (n < 2) return [{ code: "too_few", message: "You need at least 2 people in the draw." }];
  if (rules.noReciprocal && n < 3)
    return [
      {
        code: "too_few_for_no_swaps",
        message: "With only 2 people they'd have to swap. Add a third person or turn off “No pair swaps”.",
      },
    ];

  const blockers: Blocker[] = [];

  const households = new Map<string, DrawPerson[]>();
  for (const p of people) {
    if (!p.householdId) continue;
    households.set(p.householdId, [...(households.get(p.householdId) ?? []), p]);
  }
  for (const members of households.values()) {
    if (members.length > n - members.length) {
      blockers.push({
        code: "household_too_big",
        message: `${listNames(members.map((m) => m.name))} are in one household. That's ${members.length} of ${n} people, so there aren't enough others for them to draw. Add more people or split the household.`,
        people: members.map((m) => m.id),
      });
    }
  }

  for (let g = 0; g < n; g++) {
    if (!allowed[g].some(Boolean))
      blockers.push({
        code: "cannot_give",
        message: `${people[g].name} is excluded from everyone, so they can't draw anybody.`,
        people: [people[g].id],
      });
    if (!allowed.some((row) => row[g]))
      blockers.push({
        code: "cannot_receive",
        message: `Nobody is allowed to draw ${people[g].name}.`,
        people: [people[g].id],
      });
  }
  if (blockers.length) return blockers;

  const matchOfRecipient = maxMatching(allowed);
  const matchedGivers = new Set(matchOfRecipient.filter((g) => g >= 0));
  const unmatched = people.findIndex((_, g) => !matchedGivers.has(g));
  if (unmatched === -1) return [];

  // Grow the Hall's-theorem witness: givers reachable by alternating paths
  // all compete for fewer recipients than there are givers.
  const givers = new Set([unmatched]);
  const recipients = new Set<number>();
  const queue = [unmatched];
  while (queue.length) {
    const g = queue.shift()!;
    for (let r = 0; r < n; r++) {
      if (!allowed[g][r] || recipients.has(r)) continue;
      recipients.add(r);
      const next = matchOfRecipient[r];
      if (next >= 0 && !givers.has(next)) {
        givers.add(next);
        queue.push(next);
      }
    }
  }
  const byIndex = (a: number, b: number) => a - b;
  const giverNames = [...givers].sort(byIndex).map((g) => people[g].name);
  const recipientNames = [...recipients].sort(byIndex).map((r) => people[r].name);
  return [
    {
      code: "group_squeezed",
      message: `${listNames(giverNames)} can only draw ${listNames(recipientNames)}: ${givers.size} people sharing ${recipients.size} possible ${recipients.size === 1 ? "match" : "matches"}. Remove an exclusion or a household link involving them.`,
      people: [...givers].map((g) => people[g].id),
    },
  ];
}
