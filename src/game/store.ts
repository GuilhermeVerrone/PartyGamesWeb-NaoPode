import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ALL_CATEGORY_IDS } from './categories'
import { CARDS } from './cards'
import { createGame, reducer, restoreGame, type GameAction, type TeamInput } from './rules'
import type { GameState, Settings } from './types'

export type SetupData = {
  settings: Settings
  teams: [TeamInput, TeamInput]
}

export const DEFAULT_SETUP: SetupData = {
  settings: {
    turnSeconds: 60,
    roundsPerTeam: 4,
    naoPodeMode: 'classic',
    skipPenalty: 0,
    targetScore: null,
    categories: ALL_CATEGORY_IDS,
    sound: true,
    vibration: true,
  },
  teams: [
    { name: 'Time Laranja', color: '#fb923c', players: ['', ''] },
    { name: 'Time Turquesa', color: '#2dd4bf', players: ['', ''] },
  ],
}

type Store = {
  game: GameState | null
  setup: SetupData
  setSetup: (setup: SetupData) => void
  start: (setup: SetupData) => void
  /** nova partida com os mesmos times e opções */
  restart: () => void
  dispatch: (action: GameAction) => void
  quit: () => void
}

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      game: null,
      setup: DEFAULT_SETUP,
      setSetup: (setup) => set({ setup }),
      start: (setup) => set({ setup, game: createGame(setup.settings, setup.teams, CARDS) }),
      restart: () => {
        const { settings, teams } = get().setup
        set({ game: createGame(settings, teams, CARDS) })
      },
      dispatch: (action) => {
        const { game } = get()
        if (game) set({ game: reducer(game, action) })
      },
      quit: () => set({ game: null }),
    }),
    {
      name: 'np:game',
      version: 1,
      partialize: (s) => ({ game: s.game, setup: s.setup }),
      merge: (persisted, current) => {
        const p = persisted as Partial<Pick<Store, 'game' | 'setup'>> | undefined
        return {
          ...current,
          setup: p?.setup ?? current.setup,
          game: p?.game ? restoreGame(p.game) : null,
        }
      },
    },
  ),
)
