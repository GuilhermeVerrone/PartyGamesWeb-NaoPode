import type { DataConnection, Peer } from 'peerjs'
import type { PublicState } from '../game/duel'
import {
  PROTOCOL_VERSION,
  backoffMs,
  msg,
  parseMsg,
  peerIdFor,
  type GuestActionType,
} from './protocol'

export type GuestStatus =
  'connecting' | 'connected' | 'reconnecting' | 'not-found' | 'full' | 'version' | 'error'

export type GuestOptions = {
  code: string
  name: string
  onState: (state: PublicState) => void
  onStatus: (status: GuestStatus) => void
}

export type Guest = {
  send: (type: GuestActionType) => void
  /** botão "Tentar de novo" */
  retry: () => void
  stop: () => void
}

/** Falhas definitivas: não adianta insistir sozinho. */
const FINAL: GuestStatus[] = ['not-found', 'full', 'version']

export function startGuest(opts: GuestOptions): Guest {
  let peer: Peer | null = null
  let conn: DataConnection | null = null
  let attempt = 0
  let stopped = false
  let hasConnected = false
  let status: GuestStatus = 'connecting'
  let timer: ReturnType<typeof setTimeout> | undefined

  const setStatus = (s: GuestStatus) => {
    status = s
    opts.onStatus(s)
  }

  function lost() {
    if (stopped || FINAL.includes(status)) return
    // nunca conectou e a sala não existe: mensagem própria; senão, reconectando
    setStatus(hasConnected ? 'reconnecting' : 'connecting')
    clearTimeout(timer)
    timer = setTimeout(() => void connect(), backoffMs(attempt++))
  }

  async function connect() {
    if (stopped) return
    const { Peer } = await import('peerjs')
    if (stopped) return
    clearTimeout(timer)
    peer?.destroy()
    const p = new Peer()
    peer = p
    p.on('open', () => {
      if (peer !== p) return
      const c = p.connect(peerIdFor(opts.code), { reliable: true })
      conn = c
      c.on('open', () => {
        c.send(msg.hello(opts.name))
      })
      c.on('data', (raw) => {
        const m = parseMsg(raw)
        if (!m) return
        if (m.t === 'reject') {
          setStatus(m.reason)
        } else if (m.t === 'state') {
          if (m.v !== PROTOCOL_VERSION) return setStatus('version')
          attempt = 0
          hasConnected = true
          if (status !== 'connected') setStatus('connected')
          opts.onState(m.state)
        } else if (m.v !== PROTOCOL_VERSION) {
          setStatus('version')
        }
      })
      c.on('close', () => {
        if (conn === c) lost()
      })
      c.on('error', () => {
        if (conn === c) lost()
      })
    })
    p.on('disconnected', () => {
      // só o broker caiu; a conexão de dados segue viva
    })
    p.on('error', (err) => {
      if (peer !== p) return
      if (err.type === 'peer-unavailable') {
        if (hasConnected) lost()
        else setStatus('not-found')
      } else if (
        err.type === 'network' ||
        err.type === 'server-error' ||
        err.type === 'socket-error'
      ) {
        lost()
      } else {
        setStatus('error')
      }
    })
  }

  void connect().catch(() => lost())

  return {
    send: (type) => {
      if (conn?.open) conn.send(msg.action(type))
    },
    retry: () => {
      attempt = 0
      setStatus(hasConnected ? 'reconnecting' : 'connecting')
      void connect()
    },
    stop: () => {
      stopped = true
      clearTimeout(timer)
      conn?.close()
      peer?.destroy()
    },
  }
}
