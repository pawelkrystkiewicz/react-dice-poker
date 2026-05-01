import type { DiceSet, HandResult } from './types'
const desc = (a: number, b: number) => b - a

const counts = new Uint8Array(7) // module scope, indices 0..6, slot 0 unused

/**
 * STUB — implement this yourself.
 *
 * Given a sorted/unsorted set of 5 dice, classify the hand and return the
 * tie-breaking ordered values (see HandResult).
 *
 * Rules (Witcher 1 dice poker):
 *   nothing         no combination
 *   pair            2 of a kind                     [5,5,1,3,4]
 *   two-pairs       two distinct pairs              [1,1,3,2,2]
 *   threes          3 of a kind                     [1,2,4,4,4]
 *   small-straight  1..5, no repeats                [5,3,1,4,2]
 *   big-straight    2..6, no repeats                [5,2,4,1,6]
 *   full-house      pair + threes                   [1,1,1,5,5]
 *   four            4 of a kind                     [3,3,3,3,2]
 *   five            5 of a kind                     [2,2,2,2,2]
 *
 * Tie-breaker conventions (used by the comparator):
 *   - Higher hand class wins outright.
 *   - Within a class, compare `tieBreakers` lexicographically:
 *       pair        -> [pairValue, kicker1, kicker2, kicker3]   (kickers desc)
 *       two-pairs   -> [highPair, lowPair, kicker]
 *       threes      -> [tripleValue, kicker1, kicker2]
 *       full-house  -> [tripleValue, pairValue]
 *       four        -> [quadValue, kicker]
 *       five        -> [fiveValue]
 *       straights   -> [highestDie]  (or [] — they only differ by class)
 *       nothing     -> dice values sorted descending
 */
export function evaluateHand(dice: DiceSet): HandResult {
  // reset counts for this hand, reuse module-scope array to avoid allocations
  counts.fill(0)

  const sorted = [...dice].sort(desc)

  let max = 0
  const kickers: number[] = []

  for (const d of sorted) {
    counts[d]++

    const count = counts[d]

    if (count > max) max = count

    const exists = kickers.indexOf(d)

    if (exists > -1) {
      kickers.splice(exists, 1)
    }

    if (count === 1) {
      kickers.push(d)
    }
  }

  switch (max) {
    case 5: {
      return {
        class: 'five',
        tieBreakers: [counts.indexOf(5)], // which value is repeated 5 times
      }
    }
    case 4: {
      return {
        class: 'four',
        tieBreakers: [counts.indexOf(4), counts.indexOf(1)], // which value is repeated 4 times, then kicker
      }
    }
    case 3: {
      const v = counts.indexOf(3)
      const p = counts.indexOf(2)

      if (p !== -1) {
        return {
          class: 'full-house',
          tieBreakers: [v, p],
        }
      } else {
        return {
          class: 'threes',
          tieBreakers: [v, kickers[0], kickers[1]],
        }
      }
    }
    case 2: {
      // only 1 or 2 pairs possible, so we can just loop once and check counts
      const highestIdx = counts.lastIndexOf(2) //higher value idx
      const lowestIdx = counts.indexOf(2)

      // if we are already in pairs branch
      // both can't be -1
      if (lowestIdx !== highestIdx) {
        return {
          class: 'two-pairs',
          tieBreakers: [highestIdx, lowestIdx, kickers[0]],
        }
      }

      return {
        class: 'pair',
        tieBreakers: [highestIdx, ...kickers],
      }
    }
    case 1:
      {
        let mask = 0
        for (const d of dice) {
          mask |= 1 << (d - 1)

          if (mask === 0b011111) {
            return { class: 'small-straight', tieBreakers: [] }
          }

          if (mask === 0b111110) {
            return { class: 'big-straight', tieBreakers: [] }
          }
        }
      }
      break
  }

  return {
    class: 'nothing',
    tieBreakers: sorted,
  }
}

/**
 * Compares two evaluated hands.
 * Returns >0 if `a` beats `b`, <0 if `b` beats `a`, 0 if tied.
 *
 * Provided for you so the AI and reveal logic can wire up immediately —
 * you only need to write `evaluateHand`.
 */
export function compareHands(a: HandResult, b: HandResult): number {
  const ra = handRank(a.class)
  const rb = handRank(b.class)
  if (ra !== rb) return ra - rb
  for (let i = 0; i < Math.max(a.tieBreakers.length, b.tieBreakers.length); i++) {
    const av = a.tieBreakers[i] ?? 0
    const bv = b.tieBreakers[i] ?? 0
    if (av !== bv) return av - bv
  }
  return 0
}

function handRank(c: HandResult['class']): number {
  const ranks: Record<HandResult['class'], number> = {
    nothing: 0,
    pair: 1,
    'two-pairs': 2,
    threes: 3,
    'small-straight': 4,
    'big-straight': 5,
    'full-house': 6,
    four: 7,
    five: 8,
  }
  return ranks[c]
}
