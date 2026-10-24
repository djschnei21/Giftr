export type DrawPerson = {
  id: string;
  name: string;
  householdId?: string | null;
};

export type Pair = { giverId: string; recipientId: string };

export type DrawRules = {
  /** One-way: the giver must not draw the recipient. */
  exclusions?: Pair[];
  /** If A gives to B, B must not give to A. */
  noReciprocal?: boolean;
  /** Everyone forms one cycle: A → B → C → … → A. */
  singleLoop?: boolean;
  /** Soft rule: pairings to avoid (e.g. last year's). Relaxed only if needed. */
  avoid?: Pair[];
};

export type Blocker = {
  code:
    | "too_few"
    | "too_few_for_no_swaps"
    | "cannot_give"
    | "cannot_receive"
    | "household_too_big"
    | "group_squeezed"
    | "rules_conflict";
  message: string;
  people?: string[];
};

export type DrawSuccess = {
  ok: true;
  pairs: Pair[];
  /** True if the soft "avoid" rule had to be dropped to find a valid draw. */
  relaxedSoftRules: boolean;
  method: "shuffle" | "search";
};

export type DrawFailure = { ok: false; blockers: Blocker[] };

export type DrawResult = DrawSuccess | DrawFailure;

export type Rng = () => number;
