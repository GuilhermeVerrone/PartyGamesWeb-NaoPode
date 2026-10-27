import type { DataConnection, Peer } from 'peerjs'
import { CARDS } from '../game/cards'
import {
  createDuel,
  duelReducer,
  rematch,
  toPublicState,
  type DuelAction,
  type DuelState,
} from '../game/duel'
import { PROTOCOL_VERSION, backoffMs, msg, parseMsg, peerIdFor, type Msg } from './protocol'
import { loadSettings, saveSettings, saveState } from './storage'

export type HostStatus = 'connecting' | 'open' | 'retrying' | 'error'

export type HostOptions = {
  code: string
  name: string
  /** estado restaurado de `duel:state` (recarga do anfitrião) */
  initial?: DuelState | null
  onState: (state: DuelState) => void
  onStatus: (status: HostStatus) => void
  onGuest: (connected: boolean) => void
}

export type HostAction = DuelAction | { type: 'rematch' }

export type Host = {
  dispatch: (action: HostAction) => void
  stop: () => void
}

export function startHost(opts: HostOptions): Host {
  let state: DuelState = opts.initial ?? createDuel(opts.name, CARDS, loadSettings())
  let peer: Peer | null = null
  let guest: DataConnection | null = null
  let attempt = 0
  let stopped = false
  let timer: ReturnType<typeof setTimeout> | undefined

  /** Os dois prontos no lobby começam a partida sozinhos. */
  const settle = (next: DuelState): DuelState =>
    next.phase === 'lobby' && next.ready.a && next.ready.b && next.names.b
      ? duelReducer(next, { type: 'start', now: Date.now() })
      : next

  const apply = (action: HostAction) => {
    if (action.type === 'rematch') {
      if (state.phase === 'finished') commit(rematch(state, CARDS))
    } else {
      commit(settle(duelReducer(state, action)))
    }
  }

  const commit = (next: DuelState) => {
    if (next === state) return
    if (next.settings !== state.settings) saveSettings(next.settings)
    state = next
    saveState(state)
    opts.onState(state)
    broadcast()
  }

  const send = (conn: DataConnection, m: Msg) => {
    if (conn.open) conn.send(m)
  }

  function broadcast() {
    if (guest) send(guest, msg.state(toPublicState(state, 'b', Date.now())))
  }

  function onData(conn: DataConnection, raw: unknown) {
    const m = parseMsg(raw)
    if (!m) return
    if (m.v !== PROTOCOL_VERSION) {
      send(conn, msg.reject('version'))
      return
    }
    if (m.t === 'hello') {
      // outro aparelho com a sala ocupada: só aceita o mesmo convidado (reconexão)
      const taken = guest && guest !== conn && guest.open && state.names.b !== m.name
      if (taken) {
        send(conn, msg.reject('full'))
        setTimeout(() => conn.close(), 200)
        return
      }
      if (guest && guest !== conn) guest.close()
      guest = conn
      opts.onGuest(true)
      commit(duelReducer(state, { type: 'join', name: m.name }))
      broadcast()
    } else if (m.t === 'action' && conn === guest) {
      const now = Date.now()
      if (m.type === 'rematch') apply({ type: 'rematch' })
      else if (m.type === 'ready') apply({ type: 'ready', by: 'b' })
      else apply({ type: m.type, by: 'b', now })
    }
  }

  function onConnection(conn: DataConnection) {
    conn.on('data', (raw) => onData(conn, raw))
    const drop = () => {
      if (guest !== conn) return
      guest = null
      opts.onGuest(false)
    }
    conn.on('close', drop)
    conn.on('error', drop)
  }

  function retry() {
    if (stopped) return
    opts.onStatus('retrying')
    clearTimeout(timer)
    timer = setTimeout(() => void connect(), backoffMs(attempt++))
  }

  async function connect() {
    if (stopped) return
    opts.onStatus('connecting')
    const { Peer } = await import('peerjs')
    if (stopped) return
    peer?.destroy()
    const p = new Peer(peerIdFor(opts.code))
    peer = p
    p.on('open', () => {
      attempt = 0
      opts.onStatus('open')
    })
    p.on('connection', onConnection)
    // broker caiu ou id ainda preso da sessão anterior: tenta de novo
    p.on('disconnected', retry)
    p.on('error', (err) => {
      if (peer !== p) return
      if (err.type === 'unavailable-id' || err.type === 'network' || err.type === 'server-error') {
        retry()
      } else if (err.type === 'socket-error' || err.type === 'socket-closed') {
        retry()
      } else {
        opts.onStatus('error')
      }
    })
  }

  // vence o tempo da vez e reenvia o tempo restante para o convidado se corrigir
  let ticks = 0
  const clock = setInterval(() => {
    if (state.phase !== 'turn') return
    const before = state
    commit(duelReducer(state, { type: 'timeout', now: Date.now() }))
    if (state === before && ++ticks % 3 === 0) broadcast()
  }, 1000)
  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      commit(duelReducer(state, { type: 'timeout', now: Date.now() }))
      broadcast()
    }
  }
  document.addEventListener('visibilitychange', onVisible)

  opts.onState(state)
  saveState(state)
  void connect().catch(() => retry())

  return {
    dispatch: apply,
    stop: () => {
      stopped = true
      clearTimeout(timer)
      clearInterval(clock)
      document.removeEventListener('visibilitychange', onVisible)
      guest?.close()
      peer?.destroy()
    },
  }
}
