import { describe, expect, it } from 'vitest'
import { CARDS } from './cards'
import {
  createDuel,
  currentCardId,
  duelReducer,
  rematch,
  splitDecks,
  toPublicState,
  winner,
  type DuelAction,
  type DuelState,
} from './duel'

const NOW = 1_000_000

function lobby(): DuelState {
  let s = createDuel('Ana', CARDS)
  s = duelReducer(s, { type: 'join', name: 'Beto' })
  s = duelReducer(s, { type: 'ready', by: 'a' })
  return duelReducer(s, { type: 'ready', by: 'b' })
}

function started(): DuelState {
  return duelReducer(lobby(), { type: 'start', now: NOW })
}

const run = (s: DuelState, ...actions: DuelAction[]) => actions.reduce(duelReducer, s)

describe('splitDecks', () => {
  it('gera baralhos sem cartas em comum que cobrem todas as cartas', () => {
    const { a, b } = splitDecks(CARDS)
    expect(a.length).toBeGreaterThan(0)
    expect(b.length).toBeGreaterThan(0)
    expect(a.filter((id) => b.includes(id))).toEqual([])
    expect(new Set([...a, ...b]).size).toBe(new Set(CARDS.map((c) => c.id)).size)
  })

  it('não repete ids dentro de um baralho', () => {
    const { a, b } = splitDecks(CARDS)
    expect(new Set(a).size).toBe(a.length)
    expect(new Set(b).size).toBe(b.length)
  })
})

describe('lobby', () => {
  it('só inicia com os dois conectados e prontos', () => {
    const solo = createDuel('Ana', CARDS)
    expect(duelReducer(solo, { type: 'start', now: NOW }).phase).toBe('lobby')

    let s = duelReducer(solo, { type: 'join', name: 'Beto' })
    s = duelReducer(s, { type: 'ready', by: 'a' })
    expect(duelReducer(s, { type: 'start', now: NOW }).phase).toBe('lobby')
    expect(started().phase).toBe('turn')
  })

  it('convidado não pode ficar pronto antes de entrar', () => {
    const s = duelReducer(createDuel('Ana', CARDS), { type: 'ready', by: 'b' })
    expect(s.ready.b).toBe(false)
  })

  it('só o anfitrião muda opções, o que zera os "prontos"', () => {
    const s = lobby()
    expect(duelReducer(s, { type: 'settings', by: 'b', settings: { turnSeconds: 30 } })).toBe(s)
    const next = duelReducer(s, { type: 'settings', by: 'a', settings: { turnSeconds: 30 } })
    expect(next.settings.turnSeconds).toBe(30)
    expect(next.ready).toEqual({ a: false, b: false })
  })

  it('a vez de A começa com o cronômetro configurado', () => {
    const s = started()
    expect(s.turn).toMatchObject({ index: 0, describer: 'a', endsAt: NOW + 45_000 })
  })
})

describe('vez', () => {
  it('acertou: +1 para quem descreve e avança a carta', () => {
    const s = started()
    const first = currentCardId(s)
    const next = duelReducer(s, { type: 'hit', by: 'b', now: NOW })
    expect(next.score).toEqual({ a: 1, b: 0 })
    expect(currentCardId(next)).not.toBe(first)
  })

  it('não pode: penalidade para quem descreve', () => {
    const s = duelReducer(started(), { type: 'naopode', by: 'b', now: NOW })
    expect(s.score).toEqual({ a: -1, b: 0 })
  })

  it('penalidade 0 não tira pontos', () => {
    let s = duelReducer(lobby(), { type: 'settings', by: 'a', settings: { naoPodePenalty: 0 } })
    s = run(
      s,
      { type: 'ready', by: 'a' },
      { type: 'ready', by: 'b' },
      { type: 'start', now: NOW },
      { type: 'naopode', by: 'b', now: NOW },
    )
    expect(s.score.a).toBe(0)
  })

  it('pular não pontua e só quem descreve pula', () => {
    const s = started()
    expect(duelReducer(s, { type: 'skip', by: 'b', now: NOW })).toBe(s)
    const next = duelReducer(s, { type: 'skip', by: 'a', now: NOW })
    expect(next.score).toEqual({ a: 0, b: 0 })
    expect(currentCardId(next)).not.toBe(currentCardId(s))
  })

  it('quem descreve não marca acerto nem não pode', () => {
    const s = started()
    expect(duelReducer(s, { type: 'hit', by: 'a', now: NOW })).toBe(s)
    expect(duelReducer(s, { type: 'naopode', by: 'a', now: NOW })).toBe(s)
  })

  it('cada lado só recebe cartas do próprio baralho', () => {
    let s = started()
    const seenA = new Set<string>()
    for (let i = 0; i < 5; i++) {
      seenA.add(currentCardId(s)!)
      s = duelReducer(s, { type: 'hit', by: 'b', now: NOW })
    }
    s = duelReducer(s, { type: 'timeout', now: NOW + 45_000 })
    expect(s.turn.describer).toBe('b')
    const first = currentCardId(s)!
    expect(s.decks.b).toContain(first)
    expect(seenA.has(first)).toBe(false)
  })

  it('timeout antes da hora é ignorado; depois passa a vez', () => {
    const s = started()
    expect(duelReducer(s, { type: 'timeout', now: NOW + 44_999 })).toBe(s)
    const next = duelReducer(s, { type: 'timeout', now: NOW + 45_000 })
    expect(next.turn).toMatchObject({ index: 1, describer: 'b', endsAt: NOW + 90_000 })
  })

  it('termina após turnsEach vezes de cada um e define o vencedor', () => {
    let s = started()
    s = duelReducer(s, { type: 'hit', by: 'b', now: NOW })
    let now = NOW
    for (let i = 0; i < 6; i++) {
      now += 45_000
      s = duelReducer(s, { type: 'timeout', now })
    }
    expect(s.phase).toBe('finished')
    expect(s.turn.endsAt).toBeNull()
    expect(winner(s)).toBe('a')
    expect(duelReducer(s, { type: 'hit', by: 'b', now })).toBe(s)
  })

  it('empate gera "draw"', () => {
    let s = started()
    let now = NOW
    for (let i = 0; i < 6; i++) {
      now += 45_000
      s = duelReducer(s, { type: 'timeout', now })
    }
    expect(winner(s)).toBe('draw')
  })
})

describe('revanche', () => {
  it('volta ao lobby com placar zerado, mesmos nomes e novos baralhos', () => {
    let s = started()
    s = duelReducer(s, { type: 'hit', by: 'b', now: NOW })
    const again = rematch(s, CARDS)
    expect(again.phase).toBe('lobby')
    expect(again.score).toEqual({ a: 0, b: 0 })
    expect(again.cursor).toEqual({ a: 0, b: 0 })
    expect(again.ready).toEqual({ a: false, b: false })
    expect(again.names).toEqual(s.names)
    expect(again.settings).toEqual(s.settings)
    expect(again.decks.a.filter((id) => again.decks.b.includes(id))).toEqual([])
  })
})

describe('toPublicState', () => {
  it('a carta só vai para quem descreve', () => {
    const s = started()
    const card = currentCardId(s)
    expect(toPublicState(s, 'a', NOW).cardId).toBe(card)
    expect(toPublicState(s, 'b', NOW).cardId).toBeNull()
  })

  it('a carta troca de dono quando a vez muda', () => {
    const s = duelReducer(started(), { type: 'timeout', now: NOW + 45_000 })
    expect(toPublicState(s, 'a', NOW).cardId).toBeNull()
    expect(toPublicState(s, 'b', NOW).cardId).toBe(currentCardId(s))
  })

  it('não vaza baralhos nem cursor em nenhum dos lados', () => {
    const s = started()
    for (const side of ['a', 'b'] as const) {
      const pub = toPublicState(s, side, NOW)
      expect(pub).not.toHaveProperty('decks')
      expect(pub).not.toHaveProperty('cursor')
      const json = JSON.stringify(pub)
      const hidden = side === 'a' ? s.decks.b : s.decks.a
      expect(hidden.slice(0, 20).some((id) => json.includes(`"${id}"`))).toBe(false)
    }
  })

  it('envia o tempo restante, nunca negativo', () => {
    const s = started()
    expect(toPublicState(s, 'b', NOW + 5_000).turn.remainingMs).toBe(40_000)
    expect(toPublicState(s, 'b', NOW + 99_000).turn.remainingMs).toBe(0)
    expect(toPublicState(lobby(), 'a', NOW).turn.remainingMs).toBeNull()
  })

  it('no lobby e no fim ninguém vê carta', () => {
    expect(toPublicState(lobby(), 'a', NOW).cardId).toBeNull()
  })
})
