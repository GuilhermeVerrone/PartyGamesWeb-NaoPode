import { CARDS } from '../game/cards'
import { pointsFor } from '../game/rules'
import type { CardResult, GameState } from '../game/types'

const OPTIONS: { result: CardResult; icon: string; label: string }[] = [
  { result: 'hit', icon: '✅', label: 'Acertou' },
  { result: 'skip', icon: '⏭️', label: 'Pulou' },
  { result: 'naopode', icon: '🚫', label: 'Não Pode' },
  { result: 'timeout', icon: '⏱️', label: 'Tempo' },
]

const WORD_BY_ID = new Map(CARDS.map((c) => [c.id, c.word]))

type Props = {
  state: GameState
  onCorrect: (entryIdx: number, result: CardResult) => void
}

export function TurnSummary({ state, onCorrect }: Props) {
  const turn = state.history[state.history.length - 1]
  if (!turn) return null
  let own = 0
  let opp = 0
  for (const { result } of turn.entries) {
    const [a, b] = pointsFor(result, state.settings)
    own += a
    opp += b
  }
  const team = state.teams.find((t) => t.id === turn.teamId)!
  const other = state.teams.find((t) => t.id !== turn.teamId)!

  return (
    <div className="w-full max-w-md space-y-4">
      <p className="text-center text-lg">
        <strong style={{ color: team.color }}>{team.name}</strong>: {own >= 0 ? '+' : ''}
        {own} · <strong style={{ color: other.color }}>{other.name}</strong>: +{opp}
      </p>
      <ul className="space-y-2">
        {turn.entries.map((e, i) => (
          <li key={i} className="rounded-xl bg-white/10 p-3">
            <div className="mb-2 font-bold uppercase">{WORD_BY_ID.get(e.cardId)}</div>
            <div className="grid grid-cols-4 gap-1" role="group" aria-label="Resultado da carta">
              {OPTIONS.map((o) => (
                <button
                  key={o.result}
                  type="button"
                  aria-pressed={e.result === o.result}
                  onClick={() => onCorrect(i, o.result)}
                  className={`min-h-12 rounded-lg px-1 text-xs font-semibold ${
                    e.result === o.result ? 'bg-white text-slate-900' : 'bg-white/10'
                  }`}
                >
                  <span aria-hidden>{o.icon}</span>
                  <br />
                  {o.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {turn.entries.length === 0 && (
        <p className="text-center opacity-70">Nenhuma carta nesta vez.</p>
      )}
    </div>
  )
}
