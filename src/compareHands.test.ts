import { describe, expect, it } from "vitest";
import { compareHands } from "./evaluator";
import type { HandClass, HandResult } from "./types";

const r = (cls: HandClass, tieBreakers: number[] = []): HandResult => ({
  class: cls,
  tieBreakers,
});

const RANK_ORDER: HandClass[] = [
  "nothing",
  "pair",
  "two-pairs",
  "threes",
  "small-straight",
  "big-straight",
  "full-house",
  "four",
  "five",
];

// ─── Class ordering ───────────────────────────────────────────────────────────

describe("compareHands: class ordering", () => {
  it.each(
    RANK_ORDER.slice(1).map((winner, i) => ({
      winner,
      loser: RANK_ORDER[i],
    })),
  )("$winner beats $loser regardless of tie-breakers", ({ winner, loser }) => {
    // even with the worst tie-breakers for the winner and the best for the loser,
    // the higher-ranked class still wins.
    expect(compareHands(r(winner, [1]), r(loser, [6, 6, 6, 6, 6]))).toBeGreaterThan(0);
    expect(compareHands(r(loser, [6, 6, 6, 6, 6]), r(winner, [1]))).toBeLessThan(0);
  });

  it.each([
    ["five", "nothing"],
    ["four", "pair"],
    ["full-house", "two-pairs"],
    ["big-straight", "threes"],
    ["small-straight", "pair"],
  ] as const)("non-adjacent: %s beats %s", (winner, loser) => {
    expect(compareHands(r(winner), r(loser))).toBeGreaterThan(0);
  });
});

// ─── Tie-breaker comparison within same class ─────────────────────────────────

describe("compareHands: tie-breakers within same class", () => {
  it("first element decides when it differs", () => {
    expect(compareHands(r("pair", [5, 1, 1, 1]), r("pair", [3, 6, 6, 6]))).toBeGreaterThan(0);
  });

  it("falls through to second element when first ties", () => {
    expect(compareHands(r("pair", [5, 6]), r("pair", [5, 4]))).toBeGreaterThan(0);
  });

  it("falls through to third when first two tie", () => {
    expect(compareHands(r("pair", [5, 6, 4]), r("pair", [5, 6, 3]))).toBeGreaterThan(0);
  });

  it("falls through to fourth when first three tie", () => {
    expect(compareHands(r("pair", [5, 6, 4, 3]), r("pair", [5, 6, 4, 2]))).toBeGreaterThan(0);
  });

  it("returns 0 when all elements are equal", () => {
    expect(compareHands(r("pair", [5, 6, 4, 3]), r("pair", [5, 6, 4, 3]))).toBe(0);
  });

  it("returns 0 when both tie-breakers are empty", () => {
    expect(compareHands(r("small-straight"), r("small-straight"))).toBe(0);
    expect(compareHands(r("five", [4]), r("five", [4]))).toBe(0);
  });
});

// ─── Different tie-breaker lengths ────────────────────────────────────────────

describe("compareHands: differing tie-breaker lengths", () => {
  it("shorter array is padded with 0 at missing positions", () => {
    // [5, 1] vs [5] → at index 1: 1 > 0, so first wins
    expect(compareHands(r("pair", [5, 1]), r("pair", [5]))).toBeGreaterThan(0);
  });

  it("padding still ties when remaining elements are 0", () => {
    expect(compareHands(r("pair", [5, 0, 0]), r("pair", [5]))).toBe(0);
  });

  it("longer-but-tied vs shorter is symmetric", () => {
    expect(compareHands(r("pair", [5]), r("pair", [5, 0]))).toBe(0);
    expect(compareHands(r("pair", [5, 0]), r("pair", [5]))).toBe(0);
  });
});

// ─── Sign symmetry ────────────────────────────────────────────────────────────

describe("compareHands: sign symmetry", () => {
  it.each([
    [r("pair", [5, 4, 3, 2]), r("pair", [3, 6, 5, 4])],
    [r("five", [6]), r("four", [6, 1])],
    [r("nothing", [6, 5, 4, 3, 1]), r("nothing", [6, 5, 4, 2, 1])],
    [r("full-house", [5, 2]), r("full-house", [3, 6])],
  ])("compare(a, b) === -compare(b, a) for case %#", (a, b) => {
    expect(compareHands(a, b)).toBe(-compareHands(b, a));
  });

  it("returns 0 for any hand compared with itself", () => {
    for (const cls of RANK_ORDER) {
      const hand = r(cls, [3, 2, 1]);
      expect(compareHands(hand, hand)).toBe(0);
    }
  });
});

// ─── Real-world spec examples (from evaluator.ts docstring) ───────────────────

describe("compareHands: documented format examples", () => {
  it("pair format [pair, k1, k2, k3]: pair of 5s with kickers 6,4,3 beats same pair with kickers 6,4,2", () => {
    expect(compareHands(r("pair", [5, 6, 4, 3]), r("pair", [5, 6, 4, 2]))).toBeGreaterThan(0);
  });

  it("two-pairs format [high, low, kicker]: 6s/3s beats 5s/4s", () => {
    expect(compareHands(r("two-pairs", [6, 3, 1]), r("two-pairs", [5, 4, 6]))).toBeGreaterThan(0);
  });

  it("two-pairs format: same top pair, higher low pair wins", () => {
    expect(compareHands(r("two-pairs", [6, 4, 1]), r("two-pairs", [6, 3, 5]))).toBeGreaterThan(0);
  });

  it("full-house format [triple, pair]: triple 5 + pair 2 beats triple 4 + pair 6", () => {
    expect(compareHands(r("full-house", [5, 2]), r("full-house", [4, 6]))).toBeGreaterThan(0);
  });

  it("four format [quad, kicker]: quads of 5 with kicker 1 beats quads of 5 with implicit lower kicker", () => {
    expect(compareHands(r("four", [5, 6]), r("four", [5, 4]))).toBeGreaterThan(0);
  });

  it("five format [value]: five 6s beat five 5s", () => {
    expect(compareHands(r("five", [6]), r("five", [5]))).toBeGreaterThan(0);
  });

  it("nothing format [d1, d2, d3, d4, d5] desc: top die decides first", () => {
    expect(
      compareHands(r("nothing", [6, 5, 4, 3, 1]), r("nothing", [5, 4, 3, 2, 1])),
    ).toBeGreaterThan(0);
  });
});
