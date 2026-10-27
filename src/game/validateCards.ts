import type { Card } from './types'

export const MIN_CARDS = 350
export const MIN_PER_CATEGORY = 25

const BLOCKLIST = ['porra', 'caralho', 'puta', 'merda', 'buceta', 'viado', 'cacete']

export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function commonPrefix(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

/** Mesma palavra ou mesmo radical (prefixo comum longo), ignorando acento/caixa. */
export function sharesRoot(target: string, forbidden: string): boolean {
  for (const t of tokens(target)) {
    for (const f of tokens(forbidden)) {
      if (t === f) return true
      const min = Math.min(t.length, f.length)
      if (min >= 4 && commonPrefix(t, f) >= Math.max(4, min - 2)) return true
    }
  }
  return false
}

export function validateCards(cards: readonly Card[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const words = new Set<string>()
  const perCategory = new Map<string, number>()

  for (const card of cards) {
    const at = `${card.id} (${card.word})`
    if (ids.has(card.id)) errors.push(`${at}: id duplicado`)
    ids.add(card.id)

    const key = normalize(card.word)
    if (words.has(key)) errors.push(`${at}: palavra-alvo duplicada`)
    words.add(key)

    perCategory.set(card.category, (perCategory.get(card.category) ?? 0) + 1)

    if (!Array.isArray(card.forbidden) || card.forbidden.length !== 5) {
      errors.push(`${at}: precisa ter exatamente 5 proibidas`)
      continue
    }
    const seen = new Set<string>()
    for (const f of card.forbidden) {
      const nf = normalize(f)
      if (!nf) errors.push(`${at}: proibida vazia`)
      if (seen.has(nf)) errors.push(`${at}: proibida repetida "${f}"`)
      seen.add(nf)
      if (sharesRoot(card.word, f)) errors.push(`${at}: "${f}" tem o radical da palavra-alvo`)
    }
    for (const w of [card.word, ...card.forbidden]) {
      if (tokens(w).some((t) => BLOCKLIST.includes(t))) {
        errors.push(`${at}: termo bloqueado em "${w}"`)
      }
    }
  }

  if (cards.length < MIN_CARDS) {
    errors.push(`total de ${cards.length} cartas, mínimo ${MIN_CARDS}`)
  }
  for (const [category, n] of perCategory) {
    if (n < MIN_PER_CATEGORY) {
      errors.push(`categoria ${category} tem ${n} cartas, mínimo ${MIN_PER_CATEGORY}`)
    }
  }
  return errors
}
