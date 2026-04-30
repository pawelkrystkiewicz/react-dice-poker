/**
 * Placeholder module for the betting layer.
 *
 * In Witcher 1 dice poker each game is preceded by an ante and (optionally) a
 * raise/call/fold loop *before* the re-roll. We intentionally skip betting in
 * v1 and just compare hands — these stubs mark where the logic would slot in.
 *
 * Suggested wiring:
 *   - placeAnte(): called when transitioning from "setup" -> first roll of a game.
 *   - openBettingRound(): called between initial roll and re-roll (raise/call/fold).
 *   - settle(outcome): called from the reducer's REVEAL action to award the pot.
 */

export type BettingAction = "check" | "raise" | "call" | "fold";

export type BettingState = {
  pot: number;
  userBalance: number;
  aiBalance: number;
  // history: BettingAction[];
};

export function placeAnte(_state: BettingState, _amount: number): BettingState {
  // TODO
  throw new Error("placeAnte: not implemented");
}

export function openBettingRound(_state: BettingState): BettingState {
  // TODO: prompt the user, ask the AI for a decision based on its hand
  throw new Error("openBettingRound: not implemented");
}

export function settle(_state: BettingState, _outcome: "user" | "ai" | "draw"): BettingState {
  // TODO: split pot on draw, otherwise transfer to winner
  throw new Error("settle: not implemented");
}
