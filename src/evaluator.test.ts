import { describe, expect, it } from "vitest";
import { compareHands, evaluateHand } from "./evaluator";
import type { DiceSet, HandClass } from "./types";

const D = (a: number, b: number, c: number, d: number, e: number): DiceSet =>
  [a, b, c, d, e] as DiceSet;

const cls = (dice: DiceSet): HandClass => evaluateHand(dice).class;
const cmp = (winner: DiceSet, loser: DiceSet): number =>
  compareHands(evaluateHand(winner), evaluateHand(loser));

// ─── Classification ────────────────────────────────────────────────────────────

describe("evaluateHand: classification", () => {
  describe("nothing", () => {
    it("5 unique values not forming any straight", () => {
      expect(cls(D(1, 2, 3, 4, 6))).toBe("nothing");
      expect(cls(D(1, 2, 3, 5, 6))).toBe("nothing");
      expect(cls(D(1, 2, 4, 5, 6))).toBe("nothing");
      expect(cls(D(1, 3, 4, 5, 6))).toBe("nothing");
    });
  });

  describe("pair", () => {
    it("exactly one pair, no other combos", () => {
      expect(cls(D(5, 5, 1, 3, 4))).toBe("pair");
      expect(cls(D(2, 2, 1, 3, 6))).toBe("pair");
      expect(cls(D(6, 6, 1, 2, 3))).toBe("pair");
    });
    it("order does not matter", () => {
      expect(cls(D(1, 5, 3, 5, 4))).toBe("pair");
      expect(cls(D(4, 1, 5, 3, 5))).toBe("pair");
    });
  });

  describe("two-pairs", () => {
    it("two distinct pairs plus a kicker", () => {
      expect(cls(D(1, 1, 3, 2, 2))).toBe("two-pairs");
      expect(cls(D(6, 6, 4, 4, 1))).toBe("two-pairs");
      expect(cls(D(5, 5, 3, 3, 6))).toBe("two-pairs");
    });
    it("order does not matter", () => {
      expect(cls(D(2, 1, 1, 3, 2))).toBe("two-pairs");
    });
  });

  describe("threes", () => {
    it("exactly three of a kind, two unique kickers", () => {
      expect(cls(D(1, 2, 4, 4, 4))).toBe("threes");
      expect(cls(D(5, 5, 5, 1, 2))).toBe("threes");
      expect(cls(D(3, 3, 3, 6, 1))).toBe("threes");
    });
    it("is not full-house when kickers don't pair", () => {
      expect(cls(D(4, 4, 4, 1, 2))).toBe("threes");
    });
  });

  describe("small-straight", () => {
    it("1..5 in any order", () => {
      expect(cls(D(5, 3, 1, 4, 2))).toBe("small-straight");
      expect(cls(D(1, 2, 3, 4, 5))).toBe("small-straight");
      expect(cls(D(4, 5, 1, 2, 3))).toBe("small-straight");
    });
  });

  describe("big-straight", () => {
    it("2..6 in any order", () => {
      expect(cls(D(5, 2, 4, 3, 6))).toBe("big-straight");
      expect(cls(D(2, 3, 4, 5, 6))).toBe("big-straight");
      expect(cls(D(6, 5, 4, 3, 2))).toBe("big-straight");
    });
  });

  describe("full-house", () => {
    it("3 + 2 of two distinct values", () => {
      expect(cls(D(1, 1, 1, 5, 5))).toBe("full-house");
      expect(cls(D(6, 6, 2, 2, 2))).toBe("full-house");
      expect(cls(D(4, 4, 4, 3, 3))).toBe("full-house");
    });
    it("order does not matter", () => {
      expect(cls(D(5, 1, 5, 1, 1))).toBe("full-house");
      expect(cls(D(2, 6, 2, 6, 2))).toBe("full-house");
    });
  });

  describe("four (Kareta)", () => {
    it("4 of a kind plus a kicker", () => {
      expect(cls(D(3, 3, 3, 3, 2))).toBe("four");
      expect(cls(D(6, 6, 6, 6, 1))).toBe("four");
      expect(cls(D(2, 2, 2, 2, 5))).toBe("four");
    });
    it("order does not matter", () => {
      expect(cls(D(2, 3, 3, 3, 3))).toBe("four");
      expect(cls(D(3, 2, 3, 3, 3))).toBe("four");
    });
  });

  describe("five (Poker)", () => {
    it("all five identical", () => {
      expect(cls(D(2, 2, 2, 2, 2))).toBe("five");
      expect(cls(D(6, 6, 6, 6, 6))).toBe("five");
      expect(cls(D(1, 1, 1, 1, 1))).toBe("five");
    });
  });
});

// ─── Cross-class ordering ──────────────────────────────────────────────────────

describe("compareHands: class ordering", () => {
  it("nothing < pair", () => {
    expect(cmp(D(5, 5, 1, 2, 3), D(6, 5, 4, 2, 1))).toBeGreaterThan(0);
  });
  it("pair < two-pairs", () => {
    expect(cmp(D(2, 2, 6, 6, 1), D(6, 6, 5, 4, 3))).toBeGreaterThan(0);
  });
  it("two-pairs < threes", () => {
    expect(cmp(D(2, 2, 2, 1, 3), D(6, 6, 5, 5, 4))).toBeGreaterThan(0);
  });
  it("threes < small-straight", () => {
    expect(cmp(D(1, 2, 3, 4, 5), D(6, 6, 6, 1, 2))).toBeGreaterThan(0);
  });
  it("small-straight < big-straight", () => {
    expect(cmp(D(2, 3, 4, 5, 6), D(1, 2, 3, 4, 5))).toBeGreaterThan(0);
  });
  it("big-straight < full-house", () => {
    expect(cmp(D(1, 1, 1, 2, 2), D(2, 3, 4, 5, 6))).toBeGreaterThan(0);
  });
  it("full-house < four", () => {
    expect(cmp(D(2, 2, 2, 2, 1), D(6, 6, 6, 5, 5))).toBeGreaterThan(0);
  });
  it("four < five", () => {
    expect(cmp(D(1, 1, 1, 1, 1), D(6, 6, 6, 6, 5))).toBeGreaterThan(0);
  });
});

// ─── Within-class tie-breaking ────────────────────────────────────────────────

describe("compareHands: pair tie-breaking", () => {
  it("higher pair value wins", () => {
    expect(cmp(D(5, 5, 1, 2, 3), D(3, 3, 6, 5, 4))).toBeGreaterThan(0);
  });
  it("same pair: higher first kicker wins", () => {
    expect(cmp(D(5, 5, 6, 2, 1), D(5, 5, 4, 3, 2))).toBeGreaterThan(0);
  });
  it("same pair and first kicker: higher second kicker wins", () => {
    expect(cmp(D(5, 5, 6, 4, 1), D(5, 5, 6, 3, 2))).toBeGreaterThan(0);
  });
  it("same pair and first two kickers: higher third kicker wins", () => {
    expect(cmp(D(5, 5, 6, 4, 3), D(5, 5, 6, 4, 2))).toBeGreaterThan(0);
  });
  it("identical hands tie", () => {
    expect(cmp(D(5, 5, 6, 4, 3), D(5, 5, 6, 4, 3))).toBe(0);
  });
});

describe("compareHands: two-pairs tie-breaking", () => {
  it("higher top pair wins regardless of low pair", () => {
    expect(cmp(D(6, 6, 2, 2, 1), D(5, 5, 4, 4, 3))).toBeGreaterThan(0);
  });
  it("same top pair: higher low pair wins", () => {
    expect(cmp(D(6, 6, 4, 4, 1), D(6, 6, 3, 3, 5))).toBeGreaterThan(0);
  });
  it("same pairs: higher kicker wins", () => {
    expect(cmp(D(6, 6, 3, 3, 5), D(6, 6, 3, 3, 4))).toBeGreaterThan(0);
  });
});

describe("compareHands: threes tie-breaking", () => {
  it("higher triple wins", () => {
    expect(cmp(D(5, 5, 5, 1, 2), D(3, 3, 3, 6, 4))).toBeGreaterThan(0);
  });
  it("same triple: higher first kicker wins", () => {
    expect(cmp(D(5, 5, 5, 6, 1), D(5, 5, 5, 4, 2))).toBeGreaterThan(0);
  });
  it("same triple and first kicker: higher second kicker wins", () => {
    expect(cmp(D(5, 5, 5, 6, 2), D(5, 5, 5, 6, 1))).toBeGreaterThan(0);
  });
});

describe("compareHands: straights", () => {
  it("any small-straight ties any small-straight", () => {
    expect(cmp(D(1, 2, 3, 4, 5), D(5, 4, 3, 2, 1))).toBe(0);
  });
  it("any big-straight ties any big-straight", () => {
    expect(cmp(D(2, 3, 4, 5, 6), D(6, 5, 4, 3, 2))).toBe(0);
  });
});

describe("compareHands: full-house tie-breaking", () => {
  it("higher triple wins", () => {
    expect(cmp(D(5, 5, 5, 1, 1), D(4, 4, 4, 6, 6))).toBeGreaterThan(0);
  });
  it("same triple: higher pair wins", () => {
    expect(cmp(D(5, 5, 5, 6, 6), D(5, 5, 5, 2, 2))).toBeGreaterThan(0);
  });
});

describe("compareHands: four tie-breaking", () => {
  it("higher quad wins", () => {
    expect(cmp(D(6, 6, 6, 6, 1), D(5, 5, 5, 5, 6))).toBeGreaterThan(0);
  });
  it("same quad: higher kicker wins", () => {
    expect(cmp(D(5, 5, 5, 5, 6), D(5, 5, 5, 5, 4))).toBeGreaterThan(0);
  });
});

describe("compareHands: five", () => {
  it("higher five wins", () => {
    expect(cmp(D(6, 6, 6, 6, 6), D(5, 5, 5, 5, 5))).toBeGreaterThan(0);
  });
  it("same five ties", () => {
    expect(cmp(D(4, 4, 4, 4, 4), D(4, 4, 4, 4, 4))).toBe(0);
  });
});

describe("compareHands: nothing tie-breaking", () => {
  // Note: every "nothing" hand has top die = 6, because 5 unique dice with
  // max <= 5 must be {1,2,3,4,5} which is a small-straight. So tie-breaking
  // among "nothing" hands is decided from the second element onward.
  it("same top, higher second wins", () => {
    expect(cmp(D(6, 5, 4, 3, 1), D(6, 4, 3, 2, 1))).toBeGreaterThan(0);
  });
  it("same top and second, higher third wins", () => {
    expect(cmp(D(6, 5, 4, 2, 1), D(6, 5, 3, 2, 1))).toBeGreaterThan(0);
  });
  it("identical 'nothing' hands tie", () => {
    expect(cmp(D(6, 5, 3, 2, 1), D(1, 2, 3, 5, 6))).toBe(0);
  });
});
