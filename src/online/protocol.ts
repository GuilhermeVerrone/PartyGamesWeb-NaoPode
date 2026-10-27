import type { PublicState } from '../game/duel'

export const PROTOCOL_VERSION = 1

export type RejectReason = 'full' | 'version'
export const GUEST_ACTIONS = ['ready', 'hit', 'naopode', 'skip', 'rematch'] as const
export type GuestActionType = (typeof GUEST_ACTIONS)[number]

export type Msg =
  | { v: number; t: 'hello'; name: string }
  | { v: number; t: 'action'; type: GuestActionType }
  | { v: number; t: 'state'; state: PublicState }
  | { v: number; t: 'reject'; reason: RejectReason }

export const ROOM_PREFIX = 'nao-pode-'
const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

export const peerIdFor = (code: string) => ROOM_PREFIX + code

export function generateCode(random: () => number = Math.random, length = 6): string {
  let code = ''
  for (let i = 0; i < length; i++)
    code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]
  return code
}

export const isValidCode = (code: string) => /^[a-z0-9]{4,12}$/.test(code)

/** Valida o que chega pela rede; qualquer coisa fora do formato vira null. */
export function parseMsg(raw: unknown): Msg | null {
  if (typeof raw !== 'object' || raw === null) return null
  const m = raw as Record<string, unknown>
  if (typeof m.v !== 'number') return null
  switch (m.t) {
    case 'hello':
      return typeof m.name === 'string' ? (m as Msg) : null
    case 'action':
      return GUEST_ACTIONS.includes(m.type as GuestActionType) ? (m as Msg) : null
    case 'state':
      return typeof m.state === 'object' && m.state !== null ? (m as Msg) : null
    case 'reject':
      return m.reason === 'full' || m.reason === 'version' ? (m as Msg) : null
    default:
      return null
  }
}

export const msg = {
  hello: (name: string): Msg => ({ v: PROTOCOL_VERSION, t: 'hello', name }),
  action: (type: GuestActionType): Msg => ({ v: PROTOCOL_VERSION, t: 'action', type }),
  state: (state: PublicState): Msg => ({ v: PROTOCOL_VERSION, t: 'state', state }),
  reject: (reason: RejectReason): Msg => ({ v: PROTOCOL_VERSION, t: 'reject', reason }),
}

/** Espera 1s, 2s, 4s… até 10s. */
export const backoffMs = (attempt: number) => Math.min(10_000, 1000 * 2 ** attempt)
