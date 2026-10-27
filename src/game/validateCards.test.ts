import { describe, expect, it } from 'vitest'
import { CARDS } from './cards'
import { sharesRoot, validateCards } from './validateCards'

describe('sharesRoot', () => {
  it('detects shared roots ignoring accents and case', () => {
    expect(sharesRoot('Feijoada', 'feijão')).toBe(true)
    expect(sharesRoot('Terremoto', 'Terra')).toBe(true)
    expect(sharesRoot('Churrasco', 'carne')).toBe(false)
    expect(sharesRoot('Pão de queijo', 'queijo')).toBe(true)
  })
})

describe('validateCards', () => {
  it('accepts the shipped deck', () => {
    expect(validateCards(CARDS)).toEqual([])
  })

  it('reports duplicates and wrong forbidden count', () => {
    const a = { ...CARDS[0] }
    const b = { ...CARDS[1], word: a.word, forbidden: ['x', 'y'] as never }
    const errors = validateCards([a, b])
    expect(errors.some((e) => e.includes('duplicada'))).toBe(true)
    expect(errors.some((e) => e.includes('exatamente 5'))).toBe(true)
  })
})
