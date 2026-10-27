import { describe, expect, it } from 'vitest'
import { CARDS } from './cards'
import { buildDeck, drawCard, shuffle } from './deck'

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

describe('shuffle', () => {
  it('keeps the same items and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const out = shuffle(input, seeded(1))
    expect([...out].sort()).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('is deterministic for a given rng', () => {
    expect(shuffle([1, 2, 3, 4, 5], seeded(7))).toEqual(shuffle([1, 2, 3, 4, 5], seeded(7)))
  })
})

describe('buildDeck', () => {
  it('only includes enabled categories, without repeated ids (RF-04)', () => {
    const deck = buildDeck(CARDS, ['comida', 'animais'], seeded(3))
    const byId = new Map(CARDS.map((c) => [c.id, c]))
    expect(new Set(deck).size).toBe(deck.length)
    expect(deck.length).toBe(CARDS.filter((c) => ['comida', 'animais'].includes(c.category)).length)
    expect(deck.every((id) => ['comida', 'animais'].includes(byId.get(id)!.category))).toBe(true)
  })

  it('is empty with no categories', () => {
    expect(buildDeck(CARDS, [])).toEqual([])
  })
})

describe('drawCard', () => {
  it('takes from the top and returns null when empty', () => {
    expect(drawCard(['a', 'b'])).toEqual({ cardId: 'a', deck: ['b'] })
    expect(drawCard([])).toEqual({ cardId: null, deck: [] })
  })
})
