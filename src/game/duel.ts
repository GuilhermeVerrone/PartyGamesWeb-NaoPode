import { shuffle, type Rng } from './deck'
import type { Card } from './types'

export type Side = 'a' | 'b'

export type DuelSettings = {
  turnSeconds: 30 | 45 | 60
  turnsEach: number
  naoPodePenalty: 0 | 1
}

export type DuelState = {
  settings: DuelSettings
  names: { a: string; b?: string }
  ready: { a: boolean; b: boolean }
  phase: 'lobby' | 'turn' | 'finished'
  turn: { index: number; describer: Side; endsAt: number | null }
  /** ids sem cartas em comum entre os dois baralhos */
  decks: { a: string[]; b: string[] }
  cursor: { a: number; b: number }
  score: { a: number; b: number }
}

export type DuelAction =
  | { type: 'join'; name: string }
  | { type: 'ready'; by: Side }
  | { type: 'settings'; by: Side; settings: Partial<DuelSettings> }
  | { type: 'start'; now: number }
  | { type: 'hit'; by: Side; now: number }
  | { type: 'naopode'; by: Side; now: number }
  | { type: 'skip'; by: Side; now: number }
  | { type: 'timeout'; now: number }

/** O que cada lado enxerga; a carta só existe para quem descreve. */
export type PublicState = {
  settings: DuelSettings
  names: { a: string; b?: string }
  ready: { a: boolean; b: boolean }
  phase: DuelState['phase']
  turn: { index: number; describer: Side; remainingMs: number | null }
  score: { a: number; b: number }
  /** id da carta atual; null para quem adivinha */
  cardId: string | null
}

export const DEFAULT_DUEL_SETTINGS: DuelSettings = {
  turnSeconds: 45,
  turnsEach: 3,
  naoPodePenalty: 1,
}

export const other = (side: Side): Side => (side === 'a' ? 'b' : 'a')

/** Embaralha e reparte alternadamente: os dois baralhos nunca compartilham ids. */
export function splitDecks(cards: readonly Card[], rng?: Rng): { a: string[]; b: string[] } {
  const ids = shuffle([...new Set(cards.map((c) => c.id))], rng)
  return {
    a: ids.filter((_, i) => i % 2 === 0),
    b: ids.filter((_, i) => i % 2 === 1),
  }
}

export function createDuel(
  hostName: string,
  cards: readonly Card[],
  settings: DuelSettings = DEFAULT_DUEL_SETTINGS,
  rng?: Rng,
): DuelState {
  return {
    settings,
    names: { a: hostName },
    ready: { a: false, b: false },
    phase: 'lobby',
    turn: { index: 0, describer: 'a', endsAt: null },
    decks: splitDecks(cards, rng),
    cursor: { a: 0, b: 0 },
    score: { a: 0, b: 0 },
  }
}

export function currentCardId(state: DuelState): string | null {
  if (state.phase !== 'turn') return null
  const side = state.turn.describer
  return state.decks[side][state.cursor[side]] ?? null
}

export function totalTurns(settings: DuelSettings): number {
  return settings.turnsEach * 2
}

export function winner(state: DuelState): Side | 'draw' | null {
  if (state.phase !== 'finished') return null
  if (state.score.a === state.score.b) return 'draw'
  return state.score.a > state.score.b ? 'a' : 'b'
}

function advanceCard(state: DuelState): DuelState {
  const side = state.turn.describer
  return { ...state, cursor: { ...state.cursor, [side]: state.cursor[side] + 1 } }
}

function nextTurn(state: DuelState, now: number): DuelState {
  const index = state.turn.index + 1
  if (index >= totalTurns(state.settings)) {
    return {
      ...state,
      phase: 'finished',
      turn: { ...state.turn, index, endsAt: null },
    }
  }
  return {
    ...state,
    turn: {
      index,
      describer: index % 2 === 0 ? 'a' : 'b',
      endsAt: now + state.settings.turnSeconds * 1000,
    },
  }
}

/** Baralho esgotado no meio da vez encerra a vez. */
function afterCard(state: DuelState, now: number): DuelState {
  return currentCardId(state) === null ? nextTurn(state, now) : state
}

function addScore(state: DuelState, side: Side, delta: number): DuelState {
  return { ...state, score: { ...state.score, [side]: state.score[side] + delta } }
}

export function duelReducer(state: DuelState, action: DuelAction): DuelState {
  switch (action.type) {
    case 'join':
      if (state.phase !== 'lobby') return state
      return { ...state, names: { ...state.names, b: action.name } }

    case 'ready':
      if (state.phase !== 'lobby') return state
      if (action.by === 'b' && !state.names.b) return state
      return { ...state, ready: { ...state.ready, [action.by]: !state.ready[action.by] } }

    case 'settings':
      // só o anfitrião edita as opções, e só no lobby
      if (state.phase !== 'lobby' || action.by !== 'a') return state
      return {
        ...state,
        settings: { ...state.settings, ...action.settings },
        ready: { a: false, b: false },
      }

    case 'start':
      if (state.phase !== 'lobby' || !state.names.b) return state
      if (!state.ready.a || !state.ready.b) return state
      return {
        ...state,
        phase: 'turn',
        turn: {
          index: 0,
          describer: 'a',
          endsAt: action.now + state.settings.turnSeconds * 1000,
        },
      }

    case 'hit': {
      if (state.phase !== 'turn' || action.by === state.turn.describer) return state
      const side = state.turn.describer
      return afterCard(advanceCard(addScore(state, side, 1)), action.now)
    }

    case 'naopode': {
      if (state.phase !== 'turn' || action.by === state.turn.describer) return state
      const side = state.turn.describer
      return afterCard(
        advanceCard(addScore(state, side, -state.settings.naoPodePenalty)),
        action.now,
      )
    }

    case 'skip':
      if (state.phase !== 'turn' || action.by !== state.turn.describer) return state
      return afterCard(advanceCard(state), action.now)

    case 'timeout':
      if (state.phase !== 'turn') return state
      if (state.turn.endsAt === null || action.now < state.turn.endsAt) return state
      return nextTurn(state, action.now)
  }
}

/** Revanche: recomeça a partida com novos baralhos, mantendo nomes e opções. */
export function rematch(state: DuelState, cards: readonly Card[], rng?: Rng): DuelState {
  return {
    ...state,
    phase: 'lobby',
    ready: { a: false, b: false },
    turn: { index: 0, describer: 'a', endsAt: null },
    decks: splitDecks(cards, rng),
    cursor: { a: 0, b: 0 },
    score: { a: 0, b: 0 },
  }
}

export function toPublicState(state: DuelState, viewer: Side, now: number): PublicState {
  const { turn } = state
  return {
    settings: state.settings,
    names: state.names,
    ready: state.ready,
    phase: state.phase,
    turn: {
      index: turn.index,
      describer: turn.describer,
      remainingMs: turn.endsAt === null ? null : Math.max(0, turn.endsAt - now),
    },
    score: state.score,
    cardId: viewer === turn.describer ? currentCardId(state) : null,
  }
}
