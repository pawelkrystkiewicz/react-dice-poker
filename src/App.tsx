import { Button, Card } from "chunks-ui";
import { useReducer } from "react";
import { DifficultyPicker } from "./components/DifficultyPicker";
import { PlayerHand } from "./components/PlayerHand";
import { Scoreboard } from "./components/Scoreboard";
import { initialState, reducer } from "./game";

function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState("naive"));

  const isSetup = state.phase === "setup";
  const isRolled = state.phase === "rolled";
  const isRevealed = state.phase === "revealed";
  const isMatchOver = state.phase === "match-over";
  const userCanInteract = isRolled && !state.user.hasRerolled;

  return (
    <main className="min-h-screen w-full max-w-3xl mx-auto p-6 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dice Poker</h1>
          <p className="text-sm text-muted-foreground">Witcher 1 rules — best of 3</p>
        </div>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => dispatch({ type: "RESET_MATCH" })}
        >
          New match
        </Button>
      </header>

      <Scoreboard
        userWins={state.matchWins.user}
        aiWins={state.matchWins.ai}
        gamesPlayed={state.gamesPlayed}
      />

      <Card.Root className="p-4 flex flex-col gap-3">
        <DifficultyPicker
          value={state.difficulty}
          disabled={!isSetup}
          onChange={(value) => dispatch({ type: "SET_DIFFICULTY", value })}
        />
        {isSetup ? (
          <Button color="primary" onClick={() => dispatch({ type: "ROLL_INITIAL" })}>
            {state.gamesPlayed === 0 ? "Roll dice" : "Start next game"}
          </Button>
        ) : null}
      </Card.Root>

      <PlayerHand
        title="You"
        player={state.user}
        reveal={isRevealed || isMatchOver}
        interactive={userCanInteract}
        onToggleHold={(index) => dispatch({ type: "TOGGLE_HOLD", index })}
      />

      <PlayerHand
        title="Opponent"
        player={state.ai}
        reveal={isRevealed || isMatchOver}
        interactive={false}
      />

      {isRolled ? (
        <Card.Root className="p-4 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Tap dice to mark them as <strong>held</strong>; the rest will be re-rolled.
          </p>
          <div className="flex gap-2">
            <Button color="primary" onClick={() => dispatch({ type: "REROLL" })}>
              Re-roll unheld
            </Button>
            <Button variant="outlined" onClick={() => dispatch({ type: "KEEP_ALL" })}>
              Keep all
            </Button>
          </div>
        </Card.Root>
      ) : null}

      {isRevealed ? (
        <Card.Root className="p-4 flex flex-col gap-3">
          <RevealMessage outcome={state.lastGameOutcome} />
          <Button color="primary" onClick={() => dispatch({ type: "NEXT_GAME" })}>
            Next game
          </Button>
        </Card.Root>
      ) : null}

      {isMatchOver ? (
        <Card.Root className="p-4 flex flex-col gap-3">
          <p className="text-lg">
            {state.matchWinner === "user"
              ? "You won the match."
              : state.matchWinner === "ai"
                ? "The opponent won the match."
                : "Match drawn."}
          </p>
          <Button color="primary" onClick={() => dispatch({ type: "RESET_MATCH" })}>
            Start a new match
          </Button>
        </Card.Root>
      ) : null}

      <footer className="text-xs text-muted-foreground mt-auto pt-4">
        Hand evaluator is unimplemented — winners won't be detected until you write{" "}
        <code>evaluateHand()</code> in <code>src/evaluator.ts</code>.
      </footer>
    </main>
  );
}

function RevealMessage({ outcome }: { outcome: "user" | "ai" | "draw" | null }) {
  if (outcome === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Hands rolled. Implement <code>evaluateHand()</code> to compare them.
      </p>
    );
  }
  if (outcome === "draw") return <p>Draw — hands tied.</p>;
  if (outcome === "user") return <p>You won this round.</p>;
  return <p>The opponent won this round.</p>;
}

export default App;
