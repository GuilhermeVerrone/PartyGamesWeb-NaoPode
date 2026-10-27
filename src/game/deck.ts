import type { Card, CategoryId } from './types'

export type Rng = () => number

/** Fisher–Yates; não altera o array original. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function filterByCategories(
  cards: readonly Card[],
  categories: readonly CategoryId[],
): Card[] {
  const allowed = new Set(categories)
  return cards.filter((c) => allowed.has(c.category))
}

/** Baralho embaralhado (ids únicos) com apenas as categorias habilitadas. */
export function buildDeck(
  cards: readonly Card[],
  categories: readonly CategoryId[],
  rng: Rng = Math.random,
): string[] {
  const ids = [...new Set(filterByCategories(cards, categories).map((c) => c.id))]
  return shuffle(ids, rng)
}

/** Tira a carta do topo; devolve null se o baralho acabou. */
export function drawCard(deck: readonly string[]): {
  cardId: string | null
  deck: string[]
} {
  if (deck.length === 0) return { cardId: null, deck: [] }
  return { cardId: deck[0], deck: deck.slice(1) }
}
