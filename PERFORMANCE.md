# Performance — `evaluateHand()`

A log of how `evaluateHand()` in [src/evaluator.ts](src/evaluator.ts) went from **140 hz** to **2,958 hz** on the aggregate benchmark — a **21.1× speedup** — across 11 iterations over ~24 hours.

The function classifies a 5-die hand into one of 9 Witcher-1 dice-poker classes and produces tie-breaker values for the comparator. Inputs are bounded (`1..6`, fixed length 5), so this is the kind of problem where every allocation and every loop shape matters.

This document is the autopsy: what each version did, what it bought, what surprised us, and where we stopped.

## Inspiration

This exercise was inspired by Casey Muratori's [**"Clean" Code, Horrible Performance**](https://www.computerenhance.com/p/clean-code-horrible-performance) — the argument that following common "clean code" rules (small functions, polymorphism, abstraction layers, defensive allocation) routinely costs an order of magnitude or more on modern hardware, and that much of that performance is recoverable just by *not* writing code that way.

The biggest single-class result here — `big-straight` going from 0.81M to 22.1M ops/s, a **27× speedup** — lands almost exactly in the range Muratori demonstrates. None of the changes that bought it required exotic tricks; they all reduced to "stop allocating things you don't need" and "let the JIT see a tight loop." The thesis holds up cleanly on this problem.

## TL;DR

| metric | start (v1) | end (v11) | speedup |
|---|---|---|---|
| Aggregate (7776 ordered combos) | 140 hz | **2,958 hz** | **21.1×** |
| Uniform random roll (single) | 1.03M ops/s | **10.85M ops/s** | **10.5×** |
| Worst class | 0.81M (big-straight) | 17.74M (pair) | 21.9× |
| Best class | 4.89M (five) | 26.91M (five) | 5.5× |
| Class spread (best ÷ worst) | 6.0× | 1.5× | flattened |

## Setup

- **Bench framework**: [vitest](https://vitest.dev) `bench` (Tinybench under the hood). See [src/evaluator.bench.ts](src/evaluator.bench.ts).
- **Three benches**:
  - **Per-class** — one fixed input per class. Useful for spotting which classifier branches are slow.
  - **Aggregate (7776 combos)** — every ordered dice tuple `(a,b,c,d,e)` with `1 ≤ a,b,c,d,e ≤ 6`. The headline number, since it weights all combinations uniformly.
  - **Uniform random roll** — a single fresh random hand per iteration. Closest to real-game distribution (dominated by `nothing` and `pair`).
- **Caveats**: numbers are from a single machine (Apple Silicon, macOS) under `vp test bench --run`. Absolute hz will vary, but ratios between versions are stable across runs.
- All raw bench output is preserved in [`src/perf/`](src/perf/).

## The journey

| ver | name | aggregate | Δ vs prev | random roll | what changed |
|---|---|---|---|---|---|
| 1 | `solution-1` | 140 hz | — | 1.03M | `Map` for counts, `Set` for unique values, `[...dice].sort()` copies, `.filter()` for kickers |
| 2 | `uint8` | 365 hz | **+161%** | 2.54M | replaced Map/Set with module-scope `Uint8Array(7)` |
| 3 | `bit-masked` | 445 hz | +22% | 3.08M | bitmask straights — `mask === 31` instead of `[1,2,3,4,5].every(v => counts.has(v))` |
| 4 | `optimized-hoisted-kickers` | 735 hz | **+65%** | 4.42M | fused count + max + kickers into one loop over sorted dice |
| 5 | `no-spread` | 748 hz | +2% | 4.59M | explicit `[a, k0, k1, k2]` instead of `[a, ...kickers]` for pair |
| 6 | `stable-for` | 1,446 hz | **+93%** | 7.87M | `for (let i = 0; i < 5; i++)` instead of `for...of` |
| 7 | `kickers-after-3s` | 1,742 hz | +20% | 8.68M | derive kickers post-loop, only in branches that need them |
| 8 | `shared-mask` | 1,684 hz | **−3%** | 8.60M | the only regression — wrong restructuring direction |
| 9 | `loop-after-3` | 2,137 hz | +27% | 9.90M | rearranged the kicker walk to run after the threes check |
| 10 | `loop-before-3` | 2,919 hz | **+37%** | 10.95M | moved straight detection earlier in the dispatch |
| 11 | `no-index-of` | 2,958 hz | +1% | 10.85M | replaced remaining `counts.indexOf(N)` lookups — at the floor |

### v1 → v2: kill the allocations (+161% aggregate)

The single biggest jump in the project came from replacing `new Map`, `new Set`, and `[...dice].sort()` with a module-scope `Uint8Array(7)` reused across calls. Dice values are bounded `1..6`, so a 7-slot integer array (slot 0 unused) is a perfect drop-in for the count map. No hashing, no GC pressure, no allocation per call beyond the result object.

The `Uint8Array` is reset with `counts.fill(0)` at the top of each call. It's safe because `evaluateHand` is synchronous and not re-entrant.

**Lesson**: at this scale, allocations dominate. Algorithmic cleverness barely registers compared to keeping the GC quiet.

### v2 → v3: bitmask straights (+22%)

The straight check in v2 was:

```ts
[1, 2, 3, 4, 5].every(v => counts.has(v))
```

This allocates an array literal AND a closure on every call, then does 5 hash lookups. Replaced with:

```ts
let mask = 0
for (const d of dice) mask |= 1 << (d - 1)
// small-straight: mask === 0b011111 (31)
// big-straight:   mask === 0b111110 (62)
```

One integer compare each.

### v3 → v4: fused loop with eager kickers (+65%)

v3 was still doing `Math.max(...counts)` (which allocates the spread) and a `.filter()` + `.sort()` for the pair branch's kickers. v4 collapsed everything into a single pass over the dice (after sorting them descending):

- Count up `counts[d]++`.
- Track `max` inline.
- Maintain a `kickers` array eagerly: when a die's count goes from 0 to 1, push it; when it goes from 1 to 2, splice it back out.

Counter-intuitive at first — `splice` and `indexOf` on an array sound expensive. But for arrays of length ≤ 4, V8's packed-elements path makes them nearly free, and fusing everything into one hot loop gives the JIT a single straight-line block to optimize.

### v4 → v5: explicit pair tieBreakers (+2%)

`tieBreakers: [pairValue, ...kickers]` allocates a new array via spread even when `kickers` is right there. Switching to `tieBreakers: [pairValue, kickers[0], kickers[1], kickers[2]]` writes directly into the result. Tiny win, lands on the `pair` class only.

### v5 → v6: indexed `for` (+93%) — the surprise of the project

A one-line change: `for (const d of sorted)` → `for (let i = 0; i < 5; i++)` nearly doubled aggregate throughput.

V8's iterator-protocol path for `for...of` over a regular `Array` introduces a megamorphic call site (the iterator's `next()`) that prevents the inner loop from being compiled to the tight integer-indexing machine code the JIT can produce when the loop bound is a literal `5`. With an indexed `for`, the whole inner loop inlines into one straight-line block.

**Lesson**: in hot inner loops, indexed `for` over typed arrays or short fixed arrays is not just a style choice — it's a compiler hint.

### v6 → v7: post-loop kicker derivation (+20%)

In v4 we made eager kickers a win because v3's pipeline was paying for `Math.max(...counts)` and `.filter().sort()`. By v6 those costs were gone, and the eager kicker tracking was now the most expensive thing left for classes that don't *use* kickers (`five`, `four`, `full-house`, both straights, `nothing` — five hand classes total).

v7 dropped eager tracking and walks `counts` from 6 down to 1 in only the branches that need it. Result: `five` jumped from 15M to 22.6M, `four` from 12M to 19.5M, `full-house` from 11M to 19.5M.

**Lesson**: eager work pays when the post-pass would do something *worse*; lazy work pays once you've made the post-pass cheap. As you optimize, the right answer flips. You couldn't have known to skip eager kickers in v3 — at that point the post-pass would have been slow.

### v7 → v8: shared-mask regression (−3%)

The only step in the project that lost ground. Without the v8 datapoint, you wouldn't have known the "shared mask" rearrangement was the wrong shape — you might have built v9 on top of it. The bench protected against compounding the mistake.

**Lesson**: not every restructuring is a win. Bench every change.

### v8 → v9: kicker walk after the threes check (+27%)

Reordering the dispatch so the kicker walk only runs after the threes check means `full-house` (which uses no kickers) skips it entirely. `nothing` more than doubled (8M → 18.6M) once the kicker logic stopped running on it.

### v9 → v10: straight detection moved earlier (+37%)

Putting the cheap-to-detect class earlier in the dispatch saves the cost of doing more expensive checks first. Same pattern as branch-frequency ordering for a CPU, applied to code structure.

### v10 → v11: floor (+1%)

Replacing remaining `counts.indexOf(N)` lookups with manual scans. Essentially flat — within run-to-run noise. The bench is telling you it's the floor. Further wins would need to change what `evaluateHand` *returns* (e.g., mutate a pooled object instead of allocating a fresh `{class, tieBreakers}`), which changes the API contract for the rest of the codebase.

## Per-class transformation

All numbers in M ops/s. Sorted by total speedup.

| class | v1 | v11 | total | notes |
|---|---|---|---|---|
| **big-straight** | 0.81 | 22.10 | **27.3×** | worst class in v1 (full pipeline + closure-laden straight check) |
| **small-straight** | 0.82 | 18.64 | **22.7×** | same story as big-straight |
| **nothing** | 1.29 | 22.64 | **17.5×** | largest class in random rolls (~46%); biggest user-visible win |
| **pair** | 1.02 | 17.74 | 17.4× | other ~46% of random rolls |
| **two-pairs** | 1.27 | 18.32 | 14.4× | |
| **threes** | 1.79 | 19.98 | 11.2× | |
| **four** | 2.41 | 26.12 | 10.8× | |
| **full-house** | 2.34 | 21.28 | 9.1× | |
| **five** | 4.89 | 26.91 | 5.5× | smallest gain — was already fastest in v1 thanks to early-return cheat |

The biggest absolute speedups landed on the worst-performing classes. The smallest speedup landed on `five` (5.5×), but that's not a failure — `five` was already the fastest class in v1 because of its early-return cheat. As variance flattened, `five` lost its relative advantage; its absolute throughput still jumped from 4.9M to 26.9M.

## Variance flattening

| ver | fastest | slowest | spread |
|---|---|---|---|
| v1 | 4.89 (five) | 0.81 (big-straight) | **6.0×** |
| v4 | 8.77 (nothing) | 5.97 (two-pairs) | 1.47× |
| v7 | 22.63 (five) | 8.67 (nothing) | 2.6× |
| v11 | 26.91 (five) | 17.74 (pair) | **1.5×** |

Class spread shrank from 6× to 1.5×. The "luck of which hand class you got" cost is gone — every class now resolves in roughly comparable time. This is what eliminating allocation variance buys you: deterministic per-call cost.

## Aggregate vs random-roll: why they differ

| metric | start | end | total |
|---|---|---|---|
| Aggregate (7776 combos) | 140 hz | 2,958 hz | **21.1×** |
| Random roll | 1.03M | 10.85M | **10.5×** |

The aggregate weights all 7776 combinations uniformly, so it amplifies wins on rare classes (straights, four, five). Random rolls follow the natural dice distribution — dominated by `nothing` (~46%) and `pair` (~46%) — and those got 17.5× and 17.4× respectively, almost identical, which is why the random number sits between them.

If a real game ever fires `evaluateHand`, it does so on random rolls. **The 10.5× random-roll speedup is the number that matters** for AI search depth. At 10.85M evaluations/sec, an AI exploring all 32 hold subsets × hundreds of reroll outcomes per turn is essentially free.

## Lessons (in order of how much they cost to learn)

1. **Allocations dominate at this scale.** v1 → v2 was +161% from "stop allocating Maps and Sets." Algorithmic cleverness barely matters if the GC is busy.

2. **The JIT-friendly loop shape was worth almost as much as everything else combined.** v5 → v6 was +93% from `for...of` → indexed `for`. Predicted "5–10%." Off by 10×. The iterator protocol on a regular `Array` introduces a megamorphic call site that prevents V8 from compiling the inner loop tight.

3. **Eager vs lazy is a moving target.** Eager kickers won in v3 → v4 (+65%); post-loop kickers won in v6 → v7 (+20%). Both true. Eager work pays when the post-pass would do something *worse*; lazy work pays once you've made the post-pass cheap. As the surrounding code changes, the right answer flips.

4. **Wrong restructuring loses real ground.** v7 → v8 was the only regression. Without it, the project might have built v9 on a worse foundation. Bench every change — not just the ones you expect to win.

5. **`loop before 3` (v10) is the structural insight from the late stage.** Putting the cheap-to-detect class earlier in dispatch saves the cost of doing more expensive work first. Branch-frequency ordering applied to code structure, not just the CPU.

6. **Diminishing returns are physical, not narrative.** v11 was flat vs v10 within noise. Further gains would require API changes (pooled result objects). Stopping at the floor is correct.

## What was deliberately not done

A few optimizations were explored and rejected on cost-vs-benefit grounds:

- **Inline pair-index tracking.** Maintaining a `pairValue` register during the count loop would save the `counts.indexOf(2)` lookup, but requires eviction logic across the full transition graph (1→2→3→4→5, plus pair→full-house when a different value reaches 2 and then 3). Complexity scales fast; the post-loop `indexOf` over 6 entries is already nearly free.
- **Lookup-table dispatch on count signature.** With only 7 possible signature shapes for 5 dice, you could precompute a perfect-hash table from signature → class id. Would close the remaining variance, but at a meaningful source-code complexity cost for marginal throughput gain.
- **Pooled result objects.** `evaluateHand` allocates a fresh `{class, tieBreakers}` per call. Mutating a module-scope object would eliminate the last per-call allocation, but breaks the API contract for callers that store results (the comparator, the game state, the AI).

## Reproducing

```bash
vp install
vp test bench --run  # runs all benches in src/evaluator.bench.ts
```

Raw output for every version is in [`src/perf/`](src/perf/).

## Credits

Written by [Paweł Krystkiewicz](https://github.com/paweltrue). Inspired by Casey Muratori's [*"Clean" Code, Horrible Performance*](https://www.computerenhance.com/p/clean-code-horrible-performance) — the project exists to test his thesis on a small, contained problem. The optimization journey was an iterative dialogue with Claude (Anthropic) — directional advice on patterns and pitfalls; all implementation by hand. The implementation of `evaluateHand` itself is intentionally an owner-only puzzle; this document describes what changed at each step rather than reproducing the algorithm.
