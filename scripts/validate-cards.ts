import { readFileSync } from 'node:fs'
import { validateCards } from '../src/game/validateCards.ts'
import type { Card } from '../src/game/types.ts'

const path = new URL('../src/data/cards.json', import.meta.url)
const cards = JSON.parse(readFileSync(path, 'utf8')) as Card[]
const errors = validateCards(cards)

if (errors.length > 0) {
  console.error(`${errors.length} problema(s) em cards.json:`)
  for (const e of errors) console.error(` - ${e}`)
  process.exit(1)
}
console.log(`ok: ${cards.length} cartas válidas`)
