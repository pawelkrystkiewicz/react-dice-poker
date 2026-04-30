import { chooseHolds } from "./ai";
import { compareHands, evaluateHand } from "./evaluator";
import {
  type DiceSet,
  type DieValue,
  type Difficulty,
  type GameState,
  MATCH_MAX_GAMES,
  MATCH_TARGET,
  type PlayerState,
} from "./types";

const FRESH_HOLDS: PlayerState["held"] = [false, false, false, false, false];

const emptyPlayer = (): PlayerState => ({
  dice: null,
  held: [...FRESH_HOLDS] as PlayerState["held"],
  hasRerolled: false,
});

export const initialState = (difficulty: Difficulty = "naive"): GameState => ({
  phase: "setup",
  difficulty,
  user: emptyPlayer(),
  ai: emptyPlayer(),
  lastGameOutcome: null,
  matchWins: { user: 0, ai: 0 },
  gamesPlayed: 0,
  matchWinner: null,
});

export type Action =
  | { type: "SET_DIFFICULTY"; value: Difficulty }
  | { type: "ROLL_INITIAL" }
  | { type: "TOGGLE_HOLD"; index: number }
  | { type: "REROLL" }
  | { type: "KEEP_ALL" }
  | { type: "NEXT_GAME" }
  | { type: "RESET_MATCH" };

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SET_DIFFICULTY":
      if (state.phase !== "setup") return state;
      return { ...state, difficulty: action.value };

    case "ROLL_INITIAL": {
      if (state.phase !== "setup") return state;
      // TODO[betting]: placeAnte() would happen here before the first roll.
      const userDice = rollFive();
      const aiDice = rollFive();
      return {
        ...state,
        phase: "rolled",
        user: { dice: userDice, held: [...FRESH_HOLDS] as PlayerState["held"], hasRerolled: false },
        ai: { dice: aiDice, held: [...FRESH_HOLDS] as PlayerState["held"], hasRerolled: false },
      };
    }

    case "TOGGLE_HOLD": {
      if (state.phase !== "rolled" || state.user.hasRerolled) return state;
      const held = [...state.user.held] as PlayerState["held"];
      held[action.index] = !held[action.index];
      return { ...state, user: { ...state.user, held } };
    }

    case "REROLL":
    case "KEEP_ALL": {
      if (state.phase !== "rolled") return state;
      if (!state.user.dice || !state.ai.dice) return state;

      // TODO[betting]: openBettingRound() would happen between rolled -> reroll.

      const userHeld =
        action.type === "KEEP_ALL"
          ? ([true, true, true, true, true] as PlayerState["held"])
          : state.user.held;
      const userDice = applyReroll(state.user.dice, userHeld);

      const aiHeld = chooseHolds(state.ai.dice, state.difficulty);
      const aiDice = applyReroll(state.ai.dice, aiHeld);

      const next: GameState = {
        ...state,
        phase: "revealed",
        user: { dice: userDice, held: userHeld, hasRerolled: true },
        ai: { dice: aiDice, held: aiHeld, hasRerolled: true },
      };
      return resolveOutcome(next);
    }

    case "NEXT_GAME": {
      if (state.phase !== "revealed") return state;
      if (state.matchWinner !== null) return state;
      return {
        ...state,
        phase: "setup",
        user: emptyPlayer(),
        ai: emptyPlayer(),
      };
    }

    case "RESET_MATCH":
      return initialState(state.difficulty);

    default:
      return state;
  }
}

function rollDie(): DieValue {
  return (Math.floor(Math.random() * 6) + 1) as DieValue;
}

function rollFive(): DiceSet {
  return [rollDie(), rollDie(), rollDie(), rollDie(), rollDie()];
}

function applyReroll(dice: DiceSet, held: PlayerState["held"]): DiceSet {
  return dice.map((d, i) => (held[i] ? d : rollDie())) as DiceSet;
}

function resolveOutcome(state: GameState): GameState {
  if (!state.user.dice || !state.ai.dice) return state;

  // The evaluator is a stub the user is implementing — guard against it
  // throwing so the UI can still render the dice while it's incomplete.
  let comparison: number | null = null;
  try {
    const u = evaluateHand(state.user.dice);
    const a = evaluateHand(state.ai.dice);
    comparison = compareHands(u, a);
  } catch {
    return { ...state, lastGameOutcome: null };
  }

  const outcome = comparison > 0 ? "user" : comparison < 0 ? "ai" : "draw";

  // TODO[betting]: settle(outcome) would happen here.

  const matchWins = {
    user: state.matchWins.user + (outcome === "user" ? 1 : 0),
    ai: state.matchWins.ai + (outcome === "ai" ? 1 : 0),
  };
  const gamesPlayed = state.gamesPlayed + 1;

  let matchWinner: GameState["matchWinner"] = null;
  if (matchWins.user >= MATCH_TARGET) matchWinner = "user";
  else if (matchWins.ai >= MATCH_TARGET) matchWinner = "ai";
  else if (gamesPlayed >= MATCH_MAX_GAMES) {
    matchWinner =
      matchWins.user > matchWins.ai ? "user" : matchWins.ai > matchWins.user ? "ai" : null;
  }

  return {
    ...state,
    lastGameOutcome: outcome,
    matchWins,
    gamesPlayed,
    matchWinner,
    phase: matchWinner !== null ? "match-over" : "revealed",
  };
}
