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

  for (const d of dice) {
    // dice [index] is assigned value
    // array[1] = count 1s
    // array[2] = count 2s
    counts[d]++
  }

  switch (Math.max(...counts)) {
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
        const kickers = []
        for (let i = 6; i > 0; i--) {
          if (counts[i] === 1) kickers.push(i)
        }
        return {
          class: 'threes',
          tieBreakers: [v, ...kickers],
        }
      }
    }
    case 2: {
      // only 1 or 2 pairs possible, so we can just loop once and check counts
      const indexes = counts.filter(c => c === 2)

      if (indexes[1]) {
        const pairs: number[] = []
        let kicker = -1

        for (let i = 6; i > 0; i--) {
          if (counts[i] === 2) pairs.push(i)
          else if (counts[i] === 1) kicker = i
        }
        return {
          class: 'two-pairs',
          tieBreakers: [pairs[0], pairs[1], kicker],
        }
      }

      return {
        class: 'pair',
        tieBreakers: [
          //
          counts.indexOf(2),
          ...dice.filter(d => d !== counts.indexOf(2)).sort(desc),
        ],
      }
    }
    case 1:
      {
        let mask = 0
        for (const d of dice) {
          mask |= 1 << (d - 1)
          // small-straight: mask === 0b011111 (31)
          // big-straight:   mask === 0b111110 (62)}

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
    tieBreakers: [...dice].sort(desc),
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
