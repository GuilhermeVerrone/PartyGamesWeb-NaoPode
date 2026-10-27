import { DEFAULT_DUEL_SETTINGS, type DuelSettings, type DuelState, type Side } from '../game/duel'

export type DuelMe = { name: string; role: 'host' | 'guest'; code: string }

const KEYS = { me: 'duel:me', settings: 'duel:settings', state: 'duel:state' } as const

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // armazenamento cheio ou bloqueado: segue só em memória
  }
}

export const loadMe = (): DuelMe | null => {
  const me = read<DuelMe>(KEYS.me)
  return me && typeof me.name === 'string' && typeof me.code === 'string' ? me : null
}
export const saveMe = (me: DuelMe) => write(KEYS.me, me)

export const loadSettings = (): DuelSettings => ({
  ...DEFAULT_DUEL_SETTINGS,
  ...read<Partial<DuelSettings>>(KEYS.settings),
})
export const saveSettings = (settings: DuelSettings) => write(KEYS.settings, settings)

export const loadState = (): DuelState | null => read<DuelState>(KEYS.state)
export const saveState = (state: DuelState) => write(KEYS.state, state)
export const clearState = () => {
  try {
    localStorage.removeItem(KEYS.state)
  } catch {
    // ignora
  }
}

export const SIDE_OF_ROLE: Record<DuelMe['role'], Side> = { host: 'a', guest: 'b' }
