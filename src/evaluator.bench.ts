import { bench, describe } from "vitest";
import { evaluateHand } from "./evaluator";
import type { DiceSet } from "./types";

const D = (a: number, b: number, c: number, d: number, e: number): DiceSet =>
  [a, b, c, d, e] as DiceSet;

// Per-class benchmarks — useful for spotting which classifier branches are slow.
describe("evaluateHand: per class", () => {
  bench("nothing", () => {
    evaluateHand(D(1, 2, 3, 4, 6));
  });
  bench("pair", () => {
    evaluateHand(D(5, 5, 1, 3, 4));
  });
  bench("two-pairs", () => {
    evaluateHand(D(1, 1, 3, 2, 2));
  });
  bench("threes", () => {
    evaluateHand(D(1, 2, 4, 4, 4));
  });
  bench("small-straight", () => {
    evaluateHand(D(5, 3, 1, 4, 2));
  });
  bench("big-straight", () => {
    evaluateHand(D(5, 2, 4, 3, 6));
  });
  bench("full-house", () => {
    evaluateHand(D(1, 1, 1, 5, 5));
  });
  bench("four", () => {
    evaluateHand(D(3, 3, 3, 3, 2));
  });
  bench("five", () => {
    evaluateHand(D(2, 2, 2, 2, 2));
  });
});

// Aggregate benchmark — exercises all 7776 ordered dice combinations once.
// Use this as the headline number when comparing implementations.
const ALL_COMBINATIONS: DiceSet[] = (() => {
  const out: DiceSet[] = [];
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++)
      for (let c = 1; c <= 6; c++)
        for (let d = 1; d <= 6; d++)
          for (let e = 1; e <= 6; e++) out.push(D(a, b, c, d, e));
  return out;
})();

describe("evaluateHand: aggregate", () => {
  bench("all 7776 ordered dice combinations", () => {
    for (const dice of ALL_COMBINATIONS) evaluateHand(dice);
  });

  bench("uniform random roll (single)", () => {
    const dice = D(
      1 + ((Math.random() * 6) | 0),
      1 + ((Math.random() * 6) | 0),
      1 + ((Math.random() * 6) | 0),
      1 + ((Math.random() * 6) | 0),
      1 + ((Math.random() * 6) | 0),
    );
    evaluateHand(dice);
  });
});
