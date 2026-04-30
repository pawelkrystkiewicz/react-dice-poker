# react-dice-poker

A browser implementation of the **dice poker minigame from The Witcher 1**, used as a personal exercise for the hand-evaluation algorithm.

The UI, AI scaffolding, and game flow are implemented. `evaluateHand()` in [src/evaluator.ts](src/evaluator.ts) is intentionally left for the project owner to write — first for correctness against a fixed test suite, then for speed against a benchmark.

## Stack

- **Vite+** (bun, `vp` CLI) — toolchain, dev server, formatter, linter, vitest
- **React 19** + **TypeScript**
- **Tailwind v4** + **[chunks-ui](https://ui-kit.chunk-creations.com)** for components
- **vitest** for tests and benchmarks

## Run

```bash
vp install            # install deps
vp dev                # dev server
vp test run           # run tests
vp test bench --run   # run benchmarks
vp check              # format + lint + type-check (use --fix to auto-correct)
```

## Game rules (canonical Witcher 1)

- 5 six-sided dice per player.
- One re-roll per game: roll all 5, choose any subset to hold, re-roll the rest. Hands are then compared.
- Match is **best-of-3** (first to 2 wins; ties possible if 3 games split).
- Hand ranking, low → high:
  - **Nothing** — no combination (5 unique dice that don't form a straight; always has top die 6)
  - **Pair** — 2 of a kind
  - **Two Pairs** — two distinct pairs
  - **Threes** — 3 of a kind
  - **Small Straight** — 1..5
  - **Big Straight** — 2..6
  - **Full House** — 3 + 2
  - **Kareta** — 4 of a kind
  - **Poker** — 5 of a kind
- Tie-break: higher matching-die value wins, then kickers in descending order.

Differences from the original game intentionally skipped in v1:

- **No betting** — anteing/raise/call/fold is stubbed in [src/betting.ts](src/betting.ts) with TODOs marking where it would slot into the reducer.
- **No AI forfeit** — the AI does not fold on a strong opponent's initial roll.

## Architecture

```text
src/
  types.ts              # DieValue, DiceSet, HandClass, HandResult, GameState, Phase, Difficulty
  evaluator.ts          # evaluateHand() — owner's puzzle; compareHands() — provided
  evaluator.test.ts     # 44 tests covering classification + cross-class + tie-breaks
  evaluator.bench.ts    # per-class + aggregate (7776 combos) + random-roll benches
  compareHands.test.ts  # 34 tests for the comparator alone (don't depend on evaluator)
  ai.ts                 # chooseHolds() with three difficulties — greedy is a TODO
  betting.ts            # placeAnte/openBettingRound/settle stubs (v2)
  game.ts               # reducer + actions + initial state + Math.random rolls
  App.tsx               # main shell
  components/
    Die.tsx             # die with pip layout
    PlayerHand.tsx      # 5-die row + hand-label chip on reveal
    Scoreboard.tsx
    DifficultyPicker.tsx  # ToggleGroup, disabled while a game is in progress
```

### Game flow

`setup → rolled → revealed → match-over` (single state machine in [src/game.ts](src/game.ts)).

The reducer guards against `evaluateHand` throwing, so the UI stays usable while the evaluator is incomplete — winners just don't get detected.

### AI difficulties (in [src/ai.ts](src/ai.ts))

- **Easy / `random`** — re-rolls a random subset.
- **Medium / `naive`** — keeps the most-frequent value, re-rolls everything else. Implemented.
- **Hard / `greedy`** — should hold whatever contributes to the best achievable upgrade; currently falls back to `naive` because it depends on a working evaluator. Marked `TODO`.

## Owner workflow on the evaluator

1. **Correctness** — fill in `evaluateHand()` until `vp test run` is green (44 tests).
2. **Speed** — re-baseline `vp test bench --run`, optimize, re-run. The aggregate "all 7776 ordered dice combinations" benchmark is the headline number.
