export type CategoryId =
  | 'comida'
  | 'lugares'
  | 'objetos'
  | 'profissoes'
  | 'animais'
  | 'esportes'
  | 'cultura'
  | 'acoes'
  | 'festas'
  | 'tecnologia'
  | 'natureza'
  | 'pessoas'

export type Card = {
  id: string
  word: string
  forbidden: [string, string, string, string, string]
  category: CategoryId
  difficulty: 1 | 2 | 3
}

export type TeamId = 'A' | 'B'

export type Player = { id: string; name: string; hits: number }

export type Team = {
  id: TeamId
  name: string
  color: string
  players: Player[]
  score: number
  nextPlayerIdx: number
}

export type Settings = {
  turnSeconds: 30 | 45 | 60 | 90
  roundsPerTeam: number
  naoPodeMode: 'classic' | 'soft'
  skipPenalty: 0 | 1
  targetScore: number | null
  categories: CategoryId[]
  sound: boolean
  vibration: boolean
}

export type CardResult = 'hit' | 'skip' | 'naopode' | 'timeout'

export type TurnEntry = { cardId: string; result: CardResult }

export type TurnLog = {
  teamId: TeamId
  playerId: string
  round: number
  entries: TurnEntry[]
}

export type Phase =
  'setup' | 'handoff' | 'playing' | 'turnSummary' | 'scoreboard' | 'tiebreak' | 'finished'

export type GameState = {
  phase: Phase
  settings: Settings
  teams: [Team, Team]
  currentTeamIdx: 0 | 1
  round: number
  deck: string[]
  currentCardId: string | null
  turnEndsAt: number | null
  history: TurnLog[]
  /** true quando a partida está na(s) rodada(s) de desempate */
  tiebreak: boolean
  /** permite desfazer a última carta (1 passo) durante a vez */
  canUndo: boolean
  /** time vencedor; preenchido quando phase === 'finished' */
  winner: TeamId | null
}
