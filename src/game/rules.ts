import { buildDeck, drawCard, type Rng } from './deck'
import type { Card, CardResult, GameState, Player, Settings, Team, TeamId, TurnLog } from './types'

export const TIEBREAK_SECONDS = 60

export type TeamInput = { name: string; color: string; players: string[] }

export type GameAction =
  | { type: 'beginTurn'; now: number }
  | { type: 'hit' }
  | { type: 'skip' }
  | { type: 'naopode' }
  | { type: 'timeout' }
  | { type: 'undo' }
  | { type: 'correct'; entryIdx: number; result: CardResult }
  | { type: 'confirmSummary' }
  | { type: 'continue' }

export function createGame(
  settings: Settings,
  teams: [TeamInput, TeamInput],
  cards: readonly Card[],
  rng?: Rng,
): GameState {
  const ids: TeamId[] = ['A', 'B']
  const built = teams.map((t, i): Team => {
    const players: Player[] = t.players.map((name, p) => ({
      id: `${ids[i]}-${p}`,
      name,
      hits: 0,
    }))
    return { id: ids[i], name: t.name, color: t.color, players, score: 0, nextPlayerIdx: 0 }
  }) as [Team, Team]

  return {
    phase: 'handoff',
    settings,
    teams: built,
    currentTeamIdx: 0,
    round: 1,
    deck: buildDeck(cards, settings.categories, rng),
    currentCardId: null,
    turnEndsAt: null,
    history: [],
    tiebreak: false,
    canUndo: false,
    winner: null,
  }
}

/** Pontos de um resultado: [time do passador, time adversário]. */
export function pointsFor(result: CardResult, settings: Settings): [number, number] {
  switch (result) {
    case 'hit':
      return [1, 0]
    case 'skip':
      return [-settings.skipPenalty, 0]
    case 'naopode':
      return [0, 1]
    case 'timeout':
      return [0, 0]
  }
}

/** Recalcula placar e acertos por jogador a partir do histórico (fonte única). */
export function withTotals(state: GameState): GameState {
  const score: Record<TeamId, number> = { A: 0, B: 0 }
  const hits = new Map<string, number>()
  for (const turn of state.history) {
    const other: TeamId = turn.teamId === 'A' ? 'B' : 'A'
    for (const { result } of turn.entries) {
      const [own, opp] = pointsFor(result, state.settings)
      score[turn.teamId] += own
      score[other] += opp
      if (result === 'hit') hits.set(turn.playerId, (hits.get(turn.playerId) ?? 0) + 1)
    }
  }
  const teams = state.teams.map((t) => ({
    ...t,
    score: score[t.id],
    players: t.players.map((p) => ({ ...p, hits: hits.get(p.id) ?? 0 })),
  })) as [Team, Team]
  return { ...state, teams }
}

export function getCurrentTurn(state: GameState): TurnLog | undefined {
  return state.history[state.history.length - 1]
}

function turnSeconds(state: GameState): number {
  return state.tiebreak ? TIEBREAK_SECONDS : state.settings.turnSeconds
}

function pushEntry(state: GameState, result: CardResult): GameState {
  const turn = getCurrentTurn(state)
  if (!turn || state.currentCardId === null) return state
  const history = [
    ...state.history.slice(0, -1),
    { ...turn, entries: [...turn.entries, { cardId: state.currentCardId, result }] },
  ]
  return { ...state, history }
}

/** Compra a próxima carta; sem cartas, a vez termina. */
function nextCard(state: GameState): GameState {
  const { cardId, deck } = drawCard(state.deck)
  if (cardId === null) return endTurn({ ...state, deck, currentCardId: null })
  return { ...state, deck, currentCardId: cardId }
}

function endTurn(state: GameState): GameState {
  return withTotals({
    ...state,
    phase: 'turnSummary',
    currentCardId: null,
    turnEndsAt: null,
    canUndo: false,
  })
}

function answer(state: GameState, result: CardResult): GameState {
  if (state.phase !== 'playing' || state.currentCardId === null) return state
  const next = withTotals({ ...pushEntry(state, result), canUndo: true })
  if (result === 'naopode' && state.settings.naoPodeMode === 'classic') {
    return endTurn({ ...next, canUndo: true })
  }
  return nextCard(next)
}

function resolveEnd(state: GameState): GameState {
  const [a, b] = state.teams
  if (a.score === b.score) {
    return { ...state, phase: 'tiebreak', tiebreak: true, currentTeamIdx: 0, winner: null }
  }
  return { ...state, phase: 'finished', winner: a.score > b.score ? 'A' : 'B' }
}

function confirmSummary(state: GameState): GameState {
  if (state.phase !== 'turnSummary') return state
  const roundEnded = state.currentTeamIdx === 1
  const round = roundEnded ? state.round + 1 : state.round
  const currentTeamIdx = (roundEnded ? 0 : 1) as 0 | 1
  const next = { ...state, round, currentTeamIdx, canUndo: false }

  const targetHit =
    state.settings.targetScore !== null &&
    state.teams.some((t) => t.score >= state.settings.targetScore!)
  const over = state.tiebreak
    ? roundEnded
    : targetHit || (roundEnded && round > state.settings.roundsPerTeam)

  if (over) return resolveEnd({ ...next, tiebreak: false })
  return { ...next, phase: 'scoreboard' }
}

function beginTurn(state: GameState, now: number): GameState {
  if (state.phase !== 'handoff') return state
  const team = state.teams[state.currentTeamIdx]
  const player = team.players[team.nextPlayerIdx % team.players.length]
  const teams = state.teams.map((t) =>
    t.id === team.id ? { ...t, nextPlayerIdx: (t.nextPlayerIdx + 1) % t.players.length } : t,
  ) as [Team, Team]
  const log: TurnLog = { teamId: team.id, playerId: player.id, round: state.round, entries: [] }
  return nextCard({
    ...state,
    teams,
    phase: 'playing',
    turnEndsAt: now + turnSeconds(state) * 1000,
    history: [...state.history, log],
    canUndo: false,
  })
}

function undo(state: GameState): GameState {
  const turn = getCurrentTurn(state)
  if (state.phase !== 'playing' || !state.canUndo || !turn || turn.entries.length === 0) {
    return state
  }
  const last = turn.entries[turn.entries.length - 1]
  const deck = state.currentCardId === null ? state.deck : [state.currentCardId, ...state.deck]
  const history = [...state.history.slice(0, -1), { ...turn, entries: turn.entries.slice(0, -1) }]
  return withTotals({ ...state, history, deck, currentCardId: last.cardId, canUndo: false })
}

function correct(state: GameState, entryIdx: number, result: CardResult): GameState {
  const turn = getCurrentTurn(state)
  if (state.phase !== 'turnSummary' || !turn || !turn.entries[entryIdx]) return state
  const entries = turn.entries.map((e, i) => (i === entryIdx ? { ...e, result } : e))
  return withTotals({ ...state, history: [...state.history.slice(0, -1), { ...turn, entries }] })
}

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'beginTurn':
      return beginTurn(state, action.now)
    case 'hit':
      return answer(state, 'hit')
    case 'skip':
      return answer(state, 'skip')
    case 'naopode':
      return answer(state, 'naopode')
    case 'timeout':
      if (state.phase !== 'playing') return state
      return endTurn(withTotals(pushEntry(state, 'timeout')))
    case 'undo':
      return undo(state)
    case 'correct':
      return correct(state, action.entryIdx, action.result)
    case 'confirmSummary':
      return confirmSummary(state)
    case 'continue':
      return state.phase === 'scoreboard' || state.phase === 'tiebreak'
        ? { ...state, phase: 'handoff' }
        : state
  }
}
