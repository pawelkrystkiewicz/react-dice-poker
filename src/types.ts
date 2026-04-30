export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;
export type DiceSet = [DieValue, DieValue, DieValue, DieValue, DieValue];

export type HandClass =
  | "nothing"
  | "pair"
  | "two-pairs"
  | "threes"
  | "small-straight"
  | "big-straight"
  | "full-house"
  | "four"
  | "five";

export const HAND_RANK: Record<HandClass, number> = {
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

export const HAND_LABEL: Record<HandClass, string> = {
  nothing: "Nothing",
  pair: "Pair",
  "two-pairs": "Two Pairs",
  threes: "Threes",
  "small-straight": "Small Straight",
  "big-straight": "Big Straight",
  "full-house": "Full House",
  four: "Kareta",
  five: "Poker",
};

export type HandResult = {
  class: HandClass;
  /**
   * Ordered values for tie-breaking within the same class.
   * Highest matching-die value first, then kickers in descending order.
   * Example: pair of 5s with [3,2,1] kickers -> [5, 3, 2, 1].
   */
  tieBreakers: number[];
};

export type Player = "user" | "ai";
export type Outcome = Player | "draw";

export type Difficulty = "naive" | "greedy" | "random";

export type Phase = "setup" | "rolled" | "rerolled" | "revealed" | "match-over";

export type PlayerState = {
  dice: DiceSet | null;
  held: [boolean, boolean, boolean, boolean, boolean];
  hasRerolled: boolean;
};

export type GameState = {
  phase: Phase;
  difficulty: Difficulty;
  user: PlayerState;
  ai: PlayerState;
  lastGameOutcome: Outcome | null;
  matchWins: { user: number; ai: number };
  gamesPlayed: number;
  matchWinner: Player | null;
};

export const MATCH_TARGET = 2;
export const MATCH_MAX_GAMES = 3;
