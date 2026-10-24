import { validate } from "./constraints";
import { cryptoRng, shuffle } from "./rng";
import type { DrawPerson, DrawRules, Pair, Rng } from "./types";

export type RepairResult =
  | {
      ok: true;
      pairs: Pair[];
      /** Givers whose recipient changed (they need to be told). */
      changedGivers: string[];
    }
  | { ok: false; reason: string };

function changed(before: Pair[], after: Pair[]) {
  const prev = new Map(before.map((p) => [p.giverId, p.recipientId]));
  return after.filter((p) => prev.has(p.giverId) && prev.get(p.giverId) !== p.recipientId).map((p) => p.giverId);
}

/**
 * Remove someone from an existing draw. Their Santa takes over their giftee,
 * so only one person's match changes. If that breaks a rule, try a two-person
 * fix before giving up (the caller then offers a full redraw).
 */
export function removeFromDraw(
  people: DrawPerson[],
  rules: DrawRules,
  pairs: Pair[],
  removedId: string,
  rng: Rng = cryptoRng,
): RepairResult {
  const remaining = people.filter((p) => p.id !== removedId);
  const santa = pairs.find((p) => p.recipientId === removedId);
  const giftee = pairs.find((p) => p.giverId === removedId);
  if (!santa || !giftee) {
    const kept = pairs.filter((p) => p.giverId !== removedId && p.recipientId !== removedId);
    return validate(remaining, rules, kept).length === 0
      ? { ok: true, pairs: kept, changedGivers: [] }
      : { ok: false, reason: "This person wasn't in the draw cleanly. Redraw to fix it." };
  }

  const rest = pairs.filter((p) => p.giverId !== removedId && p.recipientId !== removedId);
  const direct = [...rest, { giverId: santa.giverId, recipientId: giftee.recipientId }];
  if (validate(remaining, rules, direct).length === 0) return { ok: true, pairs: direct, changedGivers: [santa.giverId] };

  // Swap targets with one other giver A (A→B becomes santa→B and A→giftee).
  for (const other of shuffle(rest, rng)) {
    const candidate = [
      ...rest.filter((p) => p !== other),
      { giverId: santa.giverId, recipientId: other.recipientId },
      { giverId: other.giverId, recipientId: giftee.recipientId },
    ];
    if (validate(remaining, rules, candidate).length === 0)
      return { ok: true, pairs: candidate, changedGivers: changed(pairs, candidate) };
  }
  return { ok: false, reason: "Removing them leaves no valid way to patch the chain. A full redraw is needed." };
}

/**
 * Add a late joiner to an existing draw by splicing them into the chain:
 * if A gave to B, A now gives to the newcomer and the newcomer gives to B.
 * Only A's match changes.
 */
export function addToDraw(
  people: DrawPerson[],
  rules: DrawRules,
  pairs: Pair[],
  newcomerId: string,
  rng: Rng = cryptoRng,
): RepairResult {
  if (!people.some((p) => p.id === newcomerId))
    return { ok: false, reason: "The newcomer must be included in the participant list." };
  if (pairs.some((p) => p.giverId === newcomerId || p.recipientId === newcomerId))
    return { ok: false, reason: "They're already in the draw." };

  for (const link of shuffle(pairs, rng)) {
    const candidate = [
      ...pairs.filter((p) => p !== link),
      { giverId: link.giverId, recipientId: newcomerId },
      { giverId: newcomerId, recipientId: link.recipientId },
    ];
    if (validate(people, rules, candidate).length === 0)
      return { ok: true, pairs: candidate, changedGivers: [link.giverId] };
  }
  return { ok: false, reason: "There's nowhere to fit them in without breaking a rule. A full redraw is needed." };
}
