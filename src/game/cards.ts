import cardsJson from '../data/cards.json'
import type { Card } from './types'

export const CARDS = cardsJson as unknown as Card[]
