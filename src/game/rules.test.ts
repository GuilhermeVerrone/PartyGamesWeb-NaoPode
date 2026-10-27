import { beforeEach, describe, expect, it } from 'vitest'
import { CARDS } from './cards'
import {
  createGame,
  getCurrentTurn,
  reducer,
  restoreGame,
  TIEBREAK_SECONDS,
  type GameAction,
} from './rules'
import type { GameState, Settings } from './types'

const baseSettings: Settings = {
  turnSeconds: 60,
  roundsPerTeam: 2,
  naoPodeMode: 'classic',
  skipPenalty: 0,
  targetScore: null,
  categories: ['comida', 'lugares', 'objetos', 'animais'],
  sound: true,
  vibration: true,
}

const teams = [
  { name: 'Laranja', color: 'orange', players: ['Ana', 'Bia', 'Caio'] },
  { name: 'Turquesa', color: 'teal', players: ['Duda', 'Edu'] },
] as [
  { name: string; color: string; players: string[] },
  { name: string; color: string; players: string[] },
]

const identity = () => 0.5

function newGame(over: Partial<Settings> = {}): GameState {
  return createGame({ ...baseSettings, ...over }, teams, CARDS, identity)
}

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(reducer, state)
}

const begin: GameAction = { type: 'beginTurn', now: 1000 }

/** joga uma vez inteira: começa, aplica ações, termina por tempo e confirma */
function playTurn(state: GameState, ...actions: GameAction[]): GameState {
  let s = run(state, begin, ...actions)
  if (s.phase === 'playing') s = run(s, { type: 'timeout' })
  return run(s, { type: 'confirmSummary' })
}

function score(s: GameState) {
  return [s.teams[0].score, s.teams[1].score]
}

describe('createGame', () => {
  it('starts at handoff with team A and an untouched deck', () => {
    const s = newGame()
    expect(s.phase).toBe('handoff')
    expect(s.currentTeamIdx).toBe(0)
    expect(s.round).toBe(1)
    expect(s.currentCardId).toBeNull()
    expect(s.deck.length).toBeGreaterThan(100)
  })
})

describe('scoring table (§8)', () => {
  let s: GameState
  beforeEach(() => {
    s = run(newGame(), begin)
  })

  it('hit: +1 for the describer team and draws a new card', () => {
    const first = s.currentCardId
    const r = run(s, { type: 'hit' })
    expect(score(r)).toEqual([1, 0])
    expect(r.currentCardId).not.toBe(first)
    expect(r.phase).toBe('playing')
  })

  it('skip: 0 by default, −1 with penalty', () => {
    expect(score(run(s, { type: 'skip' }))).toEqual([0, 0])
    const p = run(newGame({ skipPenalty: 1 }), begin, { type: 'skip' })
    expect(score(p)).toEqual([-1, 0])
  })

  it('naopode classic: +1 opponent and ends the turn', () => {
    const r = run(s, { type: 'naopode' })
    expect(score(r)).toEqual([0, 1])
    expect(r.phase).toBe('turnSummary')
    expect(r.turnEndsAt).toBeNull()
  })

  it('naopode soft: +1 opponent and the turn continues', () => {
    const r = run(newGame({ naoPodeMode: 'soft' }), begin, { type: 'naopode' })
    expect(score(r)).toEqual([0, 1])
    expect(r.phase).toBe('playing')
    expect(r.currentCardId).not.toBeNull()
  })

  it('timeout: no points, discards the current card, ends the turn', () => {
    const r = run(s, { type: 'timeout' })
    expect(score(r)).toEqual([0, 0])
    expect(r.phase).toBe('turnSummary')
    expect(getCurrentTurn(r)!.entries.at(-1)!.result).toBe('timeout')
  })

  it('sets turnEndsAt from the given timestamp', () => {
    expect(s.turnEndsAt).toBe(1000 + 60_000)
  })

  it('ignores answers outside the playing phase', () => {
    expect(run(newGame(), { type: 'hit' })).toEqual(newGame())
  })
})

describe('no repeated cards (RF-04)', () => {
  it('never repeats a card across a whole game', () => {
    let s = newGame({ roundsPerTeam: 3 })
    while (s.phase !== 'finished') {
      s = run(s, begin)
      for (let i = 0; i < 8; i++) s = run(s, { type: 'hit' })
      s = run(s, { type: 'timeout' }, { type: 'confirmSummary' })
      if (s.phase === 'scoreboard' || s.phase === 'tiebreak') s = run(s, { type: 'continue' })
    }
    const seen = s.history.flatMap((h) => h.entries.map((e) => e.cardId))
    expect(seen.length).toBeGreaterThan(50)
    expect(new Set(seen).size).toBe(seen.length)
  })

  it('ends the turn when the deck runs out', () => {
    const s = newGame({ categories: ['pessoas'] })
    let r = run({ ...s, deck: s.deck.slice(0, 2) }, begin)
    r = run(r, { type: 'hit' }, { type: 'hit' })
    expect(r.phase).toBe('turnSummary')
    expect(score(r)).toEqual([2, 0])
  })
})

describe('rotation (RF-02)', () => {
  it('rotates describers inside each team and alternates teams', () => {
    let s = newGame({ roundsPerTeam: 3 })
    const order: string[] = []
    while (s.phase === 'handoff') {
      s = run(s, begin)
      order.push(getCurrentTurn(s)!.playerId)
      s = run(s, { type: 'timeout' }, { type: 'confirmSummary' })
      if (s.phase === 'scoreboard') s = run(s, { type: 'continue' })
    }
    expect(order).toEqual(['A-0', 'B-0', 'A-1', 'B-1', 'A-2', 'B-0'])
  })

  it('gives every player in a team the same number of turns (±1)', () => {
    let s = newGame({ roundsPerTeam: 5 })
    while (s.phase === 'handoff') {
      s = playTurn(s)
      if (s.phase === 'scoreboard') s = run(s, { type: 'continue' })
    }
    for (const team of s.teams) {
      const counts = team.players.map((p) => s.history.filter((h) => h.playerId === p.id).length)
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1)
    }
  })
})

describe('game flow', () => {
  it('goes summary → scoreboard → handoff, switching team and counting rounds', () => {
    let s = run(newGame(), begin, { type: 'timeout' })
    expect(s.phase).toBe('turnSummary')
    s = run(s, { type: 'confirmSummary' })
    expect(s.phase).toBe('scoreboard')
    expect(s.currentTeamIdx).toBe(1)
    expect(s.round).toBe(1)
    s = run(s, { type: 'continue' })
    expect(s.phase).toBe('handoff')
    s = playTurn(s)
    expect(s.currentTeamIdx).toBe(0)
    expect(s.round).toBe(2)
  })

  it('finishes after N rounds with the higher score as winner', () => {
    let s = newGame({ roundsPerTeam: 2 })
    s = playTurn(s, { type: 'hit' }, { type: 'hit' }) // A: 2
    s = run(s, { type: 'continue' })
    s = playTurn(s, { type: 'hit' }) // B: 1
    s = run(s, { type: 'continue' })
    s = playTurn(s)
    s = run(s, { type: 'continue' })
    s = playTurn(s)
    expect(s.phase).toBe('finished')
    expect(s.winner).toBe('A')
  })

  it('ends immediately when the target score is reached', () => {
    const s = playTurn(newGame({ targetScore: 2 }), { type: 'hit' }, { type: 'hit' })
    expect(s.phase).toBe('finished')
    expect(s.winner).toBe('A')
  })

  it('tracks hits per player', () => {
    const s = run(newGame(), begin, { type: 'hit' }, { type: 'hit' }, { type: 'skip' })
    expect(s.teams[0].players[0].hits).toBe(2)
    expect(s.teams[0].players[1].hits).toBe(0)
  })
})

describe('tiebreak (RF-11)', () => {
  function tiedAfterRegular() {
    let s = newGame({ roundsPerTeam: 1 })
    s = playTurn(s, { type: 'hit' })
    s = run(s, { type: 'continue' })
    s = playTurn(s, { type: 'hit' })
    return s
  }

  it('enters tiebreak on a tie, with 60s turns, one per team', () => {
    let s = tiedAfterRegular()
    expect(s.phase).toBe('tiebreak')
    expect(s.tiebreak).toBe(true)
    expect(s.currentTeamIdx).toBe(0)
    s = run(s, { type: 'continue' }, { type: 'beginTurn', now: 0 })
    expect(s.turnEndsAt).toBe(TIEBREAK_SECONDS * 1000)
  })

  it('declares the winner after the tiebreak round', () => {
    let s = tiedAfterRegular()
    s = run(s, { type: 'continue' })
    s = playTurn(s) // A: 0
    s = run(s, { type: 'continue' })
    s = playTurn(s, { type: 'hit' }) // B: +1
    expect(s.phase).toBe('finished')
    expect(s.winner).toBe('B')
  })

  it('repeats the tiebreak while still tied', () => {
    let s = tiedAfterRegular()
    s = run(s, { type: 'continue' })
    s = playTurn(s)
    s = run(s, { type: 'continue' })
    s = playTurn(s)
    expect(s.phase).toBe('tiebreak')
    expect(s.winner).toBeNull()
  })
})

describe('undo (RF-06) and correction', () => {
  it('undoes one step: restores score and brings the card back', () => {
    let s = run(newGame(), begin)
    const first = s.currentCardId
    s = run(s, { type: 'hit' })
    const second = s.currentCardId
    s = run(s, { type: 'undo' })
    expect(score(s)).toEqual([0, 0])
    expect(s.currentCardId).toBe(first)
    expect(s.deck[0]).toBe(second)
    expect(getCurrentTurn(s)!.entries).toHaveLength(0)
  })

  it('allows only one undo in a row', () => {
    let s = run(newGame(), begin, { type: 'hit' }, { type: 'hit' })
    s = run(s, { type: 'undo' })
    const again = run(s, { type: 'undo' })
    expect(again).toEqual(s)
    expect(getCurrentTurn(again)!.entries).toHaveLength(1)
  })

  it('corrects a result in the summary and recomputes scores', () => {
    let s = run(newGame(), begin, { type: 'hit' }, { type: 'naopode' })
    expect(score(s)).toEqual([1, 1])
    s = run(s, { type: 'correct', entryIdx: 1, result: 'hit' })
    expect(score(s)).toEqual([2, 0])
    expect(s.teams[0].players[0].hits).toBe(2)
    s = run(s, { type: 'correct', entryIdx: 0, result: 'skip' })
    expect(score(s)).toEqual([1, 0])
  })

  it('does not correct outside the summary', () => {
    const s = run(newGame(), begin, { type: 'hit' })
    expect(run(s, { type: 'correct', entryIdx: 0, result: 'skip' })).toEqual(s)
  })
})

describe('restoreGame', () => {
  it('desfaz a vez em andamento e volta para o handoff com as cartas no baralho', () => {
    const fresh = newGame()
    const mid = run(fresh, begin, { type: 'hit' }, { type: 'skip' })
    const restored = restoreGame(mid)
    expect(restored.phase).toBe('handoff')
    expect(restored.history).toHaveLength(0)
    expect(restored.deck).toEqual(fresh.deck)
    expect(restored.teams[0].nextPlayerIdx).toBe(0)
    expect(restored.teams[0].score).toBe(0)
  })

  it('não mexe em outras fases', () => {
    const s = run(newGame(), begin, { type: 'timeout' })
    expect(restoreGame(s)).toBe(s)
  })
})
