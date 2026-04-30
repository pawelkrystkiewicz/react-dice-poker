import type { DiceSet, Difficulty } from "./types";

/**
 * Decide which dice the AI should HOLD before re-rolling.
 * Returns a length-5 boolean tuple (true = hold, false = re-roll).
 *
 * Strategies:
 *   - random: hold a random subset.
 *   - naive : hold dice belonging to the most-frequent value, re-roll the rest.
 *   - greedy: detect the current partial hand and hold whatever contributes to
 *             the best achievable upgrade. NOTE: this needs evaluateHand() to
 *             be useful — left as a stub for now.
 */
export function chooseHolds(
  dice: DiceSet,
  difficulty: Difficulty,
): [boolean, boolean, boolean, boolean, boolean] {
  if (difficulty === "random") return randomHolds();
  if (difficulty === "naive") return naiveHolds(dice);
  return greedyHolds(dice);
}

function randomHolds(): [boolean, boolean, boolean, boolean, boolean] {
  return [
    Math.random() < 0.5,
    Math.random() < 0.5,
    Math.random() < 0.5,
    Math.random() < 0.5,
    Math.random() < 0.5,
  ];
}

function naiveHolds(dice: DiceSet): [boolean, boolean, boolean, boolean, boolean] {
  const counts = new Map<number, number>();
  for (const d of dice) counts.set(d, (counts.get(d) ?? 0) + 1);
  let bestValue: number = dice[0];
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount || (count === bestCount && value > bestValue)) {
      bestValue = value;
      bestCount = count;
    }
  }
  // If no value repeats (bestCount === 1), hold the highest die only.
  if (bestCount === 1) {
    const max = Math.max(...dice);
    return dice.map((d) => d === max) as [boolean, boolean, boolean, boolean, boolean];
  }
  return dice.map((d) => d === bestValue) as [boolean, boolean, boolean, boolean, boolean];
}

function greedyHolds(dice: DiceSet): [boolean, boolean, boolean, boolean, boolean] {
  // TODO: implement once evaluateHand is ready. Should consider:
  //   - if hand already >= threes, hold everything (don't risk it)
  //   - if 4 of 5 form a straight, hold those 4 and re-roll the odd one
  //   - if pair + isolated kickers, hold the pair, re-roll kickers
  // For now fall back to naive so the game is playable.
  return naiveHolds(dice);
}
