import type { DiceSet, HandResult } from './types'
const desc = (a: number, b: number) => b - a
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
 *   four (Kareta)   4 of a kind                     [3,3,3,3,2]
 *   five (Poker)    5 of a kind                     [2,2,2,2,2]
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
export function evaluateHand(_dice: DiceSet): HandResult {
  const counts = new Map<number, number>()
  for (const d of _dice) counts.set(d, (counts.get(d) ?? 0) + 1)

  const tieBreakers = [..._dice].sort(desc)
  const entries = [...counts.entries()].sort()
  const uniqueValues = [...new Set(_dice)].sort(desc)

  const pairs = []
  const threes = []
  const fours = []
  const fives = []

  for (const [diceValue, count] of entries) {
    switch (count) {
      case 2:
        pairs.push(diceValue)
        break
      case 3:
        threes.push(diceValue)
        break
      case 4:
        fours.push(diceValue)
        return {
          class: 'four',
          tieBreakers: [diceValue, ...uniqueValues.filter(v => v !== diceValue)],
        }
      case 5:
        fives.push(diceValue)
        return {
          class: 'five',
          tieBreakers: [diceValue],
        }
    }
  }

  if (pairs.length === 2) {
    const [p1, p2] = pairs.sort(desc)
    return {
      class: 'two-pairs',
      tieBreakers: [p1, p2, ...uniqueValues.filter(v => v !== p1 && v !== p2)],
    }
  }

  if (threes.length === 1 && pairs.length === 1) {
    const [tripleValue] = threes
    const [pairValue] = pairs
    return {
      class: 'full-house',
      tieBreakers: [tripleValue, pairValue],
    }
  }

  if (threes.length === 1) {
    const [tripleValue] = threes
    return {
      class: 'threes',
      tieBreakers: [tripleValue, ...uniqueValues.filter(v => v !== tripleValue)],
    }
  }

  if (pairs.length === 1) {
    const [pairValue] = pairs
    return {
      class: 'pair',
      tieBreakers: [pairValue, ...uniqueValues.filter(v => v !== pairValue)],
    }
  }

  const isSmallStraight = [1, 2, 3, 4, 5].every(v => counts.has(v))

  if (isSmallStraight) {
    return {
      class: 'small-straight',
      tieBreakers: [5],
    }
  }

  const isBigStraight = [2, 3, 4, 5, 6].every(v => counts.has(v))

  if (isBigStraight) {
    return {
      class: 'big-straight',
      tieBreakers: [6],
    }
  }
  
  return {
    class: 'nothing',
    tieBreakers,
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
