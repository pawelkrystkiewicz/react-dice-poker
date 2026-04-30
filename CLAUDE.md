<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.

<!--VITE PLUS END-->

## react-dice-poker

A browser implementation of the **dice poker minigame from The Witcher 1**, used by the owner as a personal exercise for the hand-evaluation algorithm. Read [README.md](README.md) first for the rules and layout — this file adds agent-specific context.

### Stack quick-ref

- **Vite+** on **bun**, invoked via `vp` (e.g. `vp dev`, `vp test run`, `vp test bench --run`, `vp check`, `vp check --fix`).
- **React 19** + **TypeScript**, **Tailwind v4** (via `@tailwindcss/vite`), **chunks-ui** components.
- **vitest** for tests and benchmarks. Run with `vp test run` and `vp test bench --run`.

Always prefer `vp check src` over `vp check` — the repo has a `.playwright-mcp/` cache that confuses the formatter.

### Owner workflow conventions

The owner is treating this repo as a leetcode-style puzzle layered on top of a real app. Two non-obvious working agreements:

1. **Do not implement `evaluateHand()` in [src/evaluator.ts](src/evaluator.ts).** It is intentionally a stub the owner is solving themselves. When asked for help, give *directional* hints (general approach, complexity tradeoffs, allocation patterns) — never the full algorithm or code. The same rule applies to `greedyHolds()` in [src/ai.ts](src/ai.ts) once the evaluator exists, and to the Stage 2 speed optimization of `evaluateHand` itself.
2. **`compareHands()` and the test suites are owner-facing tools.** Treat them as a stable contract:
   - [src/evaluator.test.ts](src/evaluator.test.ts) — 44 tests; classification + cross-class + within-class tie-breaks.
   - [src/compareHands.test.ts](src/compareHands.test.ts) — 34 tests for the comparator alone, independent of `evaluateHand`.
   - [src/evaluator.bench.ts](src/evaluator.bench.ts) — per-class + aggregate (7776 ordered combos) + random-roll benches; the aggregate is the headline number.

   Don't loosen tests to make broken code pass. If a test seems wrong, prove it (with a fixture-level explanation) before changing it.

### Architecture in 30 seconds

- **State machine**: `setup → rolled → revealed → match-over`. All in [src/game.ts](src/game.ts) as a single `useReducer`.
- **Best-of-3 match**, no betting, no AI forfeit. Match resets via `RESET_MATCH`. Best-of-3 logic lives in `resolveOutcome()`.
- **Evaluator robustness**: the reducer wraps `evaluateHand` in a `try/catch` so the UI keeps working while the function is unimplemented or throws. `lastGameOutcome` becomes `null` instead of crashing.
- **AI difficulties** (in [src/ai.ts](src/ai.ts)): `random` (working), `naive` (working — keep most-frequent value), `greedy` (TODO — falls back to `naive`).
- **Betting** is fully stubbed in [src/betting.ts](src/betting.ts) with three `TODO[betting]:` comments inside [src/game.ts](src/game.ts) showing where the calls would slot in.

### Tie-breaker conventions

The format `evaluateHand` should return for `tieBreakers` is documented in the [src/evaluator.ts](src/evaluator.ts) docstring and pinned by [src/compareHands.test.ts](src/compareHands.test.ts) under "documented format examples". Don't change these without updating both.

A non-obvious fact about `nothing` hands: they always have top die = 6, because any 5 unique dice with max ≤ 5 must be `{1,2,3,4,5}` (small-straight). Tests assume this.

### chunks-ui notes

- React 19 + Tailwind v4 are required peer deps.
- Setup: `import "chunks-ui/theme.css"` in [src/index.css](src/index.css), plus `@import "tailwindcss"`.
- Components are compound where applicable: `Card.Root / Card.Header / Card.Title / Card.Content / Card.Footer`, `ToggleGroup.Root / ToggleGroup.Item`, etc.
- `ToggleGroup` value is `string[]` even in single-select mode (Base UI behavior). The `DifficultyPicker` wraps a single `Difficulty` value in/out of an array.
- Library exports are listed in `node_modules/chunks-ui/dist/index.d.ts` — grep there if unsure whether a component exists.

### Browser verification

For UI changes: `vp dev` then verify with playwright MCP. The dev server defaults to 5173 but falls through to 5174+ if occupied.

### What "done" looks like

- `vp check src` passes (format + lint + types).
- `vp test run` passes (all 78 tests across both test files), unless changes are explicitly leaving tests red while iterating on `evaluateHand`.
- The dev server renders without console errors.
