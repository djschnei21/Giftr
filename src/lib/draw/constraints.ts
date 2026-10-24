import type { DrawPerson, DrawRules, Pair } from "./types";

export type Graph = {
  people: DrawPerson[];
  index: Map<string, number>;
  /** allowed[g][r]: giver g may draw recipient r (hard rules only, plus optional soft). */
  allowed: boolean[][];
};

const key = (g: string, r: string) => `${g}\u0000${r}`;

export function buildGraph(people: DrawPerson[], rules: DrawRules, includeSoft: boolean): Graph {
  const index = new Map(people.map((p, i) => [p.id, i]));
  const banned = new Set<string>();
  for (const e of rules.exclusions ?? []) banned.add(key(e.giverId, e.recipientId));
  if (includeSoft) for (const e of rules.avoid ?? []) banned.add(key(e.giverId, e.recipientId));

  const allowed = people.map((g) =>
    people.map((r) => {
      if (g.id === r.id) return false;
      if (g.householdId && g.householdId === r.householdId) return false;
      return !banned.has(key(g.id, r.id));
    }),
  );
  return { people, index, allowed };
}

/** Every hard-rule violation in a proposed assignment (empty means valid). */
export function validate(people: DrawPerson[], rules: DrawRules, pairs: Pair[]): string[] {
  const problems: string[] = [];
  const graph = buildGraph(people, rules, false);
  const giverOf = new Map<string, string>();
  const recipientOf = new Map<string, string>();

  for (const p of pairs) {
    if (!graph.index.has(p.giverId) || !graph.index.has(p.recipientId)) {
      problems.push(`unknown participant in ${p.giverId}→${p.recipientId}`);
      continue;
    }
    if (recipientOf.has(p.giverId)) problems.push(`${p.giverId} gives twice`);
    if (giverOf.has(p.recipientId)) problems.push(`${p.recipientId} receives twice`);
    recipientOf.set(p.giverId, p.recipientId);
    giverOf.set(p.recipientId, p.giverId);
    if (!graph.allowed[graph.index.get(p.giverId)!][graph.index.get(p.recipientId)!])
      problems.push(`${p.giverId}→${p.recipientId} breaks a rule`);
  }
  for (const person of people) {
    if (!recipientOf.has(person.id)) problems.push(`${person.id} gives to nobody`);
    if (!giverOf.has(person.id)) problems.push(`${person.id} receives from nobody`);
  }
  if (rules.noReciprocal) {
    for (const [g, r] of recipientOf) if (recipientOf.get(r) === g) problems.push(`${g}↔${r} is a two-person swap`);
  }
  if (rules.singleLoop && people.length > 0 && problems.length === 0) {
    let steps = 0;
    let cur = people[0].id;
    do {
      cur = recipientOf.get(cur)!;
      steps++;
    } while (cur !== people[0].id && steps <= people.length);
    if (steps !== people.length) problems.push("not a single loop");
  }
  return [...new Set(problems)];
}
