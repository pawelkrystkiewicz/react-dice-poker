import type { DiceSet, HandResult } from "./types";

/**
 * STUB — implement this yourself.
 *
 * Given a sorted/unsorted set of 5 dice, classify the hand and return the
 * tie-breaking ordered values (see HandResult).
 *
 * Rules (Witcher 1 dice poker):
 *   nothing         no combination
 *   pair            2 of a kind                     [5,5,1,3,4]
 *   two-pairs       two distinct pairs              [1,1,3,2,2]
 *   threes          3 of a kind                     [1,2,4,4,4]
 *   small-straight  1..5, no repeats                [5,3,1,4,2]
 *   big-straight    2..6, no repeats                [5,2,4,1,6]
 *   full-house      pair + threes                   [1,1,1,5,5]
 *   four (Kareta)   4 of a kind                     [3,3,3,3,2]
 *   five (Poker)    5 of a kind                     [2,2,2,2,2]
 *
 * Tie-breaker conventions (used by the comparator):
 *   - Higher hand class wins outright.
 *   - Within a class, compare `tieBreakers` lexicographically:
 *       pair        -> [pairValue, kicker1, kicker2, kicker3]   (kickers desc)
 *       two-pairs   -> [highPair, lowPair, kicker]
 *       threes      -> [tripleValue, kicker1, kicker2]
 *       full-house  -> [tripleValue, pairValue]
 *       four        -> [quadValue, kicker]
 *       five        -> [fiveValue]
 *       straights   -> [highestDie]  (or [] — they only differ by class)
 *       nothing     -> dice values sorted descending
 */
export function evaluateHand(_dice: DiceSet): HandResult {
  throw new Error("evaluateHand: not implemented yet");
}

/**
 * Compares two evaluated hands.
 * Returns >0 if `a` beats `b`, <0 if `b` beats `a`, 0 if tied.
 *
 * Provided for you so the AI and reveal logic can wire up immediately —
 * you only need to write `evaluateHand`.
 */
export function compareHands(a: HandResult, b: HandResult): number {
  const ra = handRank(a.class);
  const rb = handRank(b.class);
  if (ra !== rb) return ra - rb;
  for (let i = 0; i < Math.max(a.tieBreakers.length, b.tieBreakers.length); i++) {
    const av = a.tieBreakers[i] ?? 0;
    const bv = b.tieBreakers[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function handRank(c: HandResult["class"]): number {
  const ranks: Record<HandResult["class"], number> = {
    nothing: 0,
    pair: 1,
    "two-pairs": 2,
    threes: 3,
    "small-straight": 4,
    "big-straight": 5,
    "full-house": 6,
    four: 7,
    five: 8,
  };
  return ranks[c];
}
