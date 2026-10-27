import { useEffect } from 'react'
import { Confetti } from './Confetti'
import type { PublicState, Side } from '../game/duel'
import { playSound } from '../lib/sound'

function verdict(state: PublicState): Side | 'draw' {
  if (state.score.a === state.score.b) return 'draw'
  return state.score.a > state.score.b ? 'a' : 'b'
}

export default function DuelFinished({
  state,
  me,
  onRematch,
}: {
  state: PublicState
  me: Side
  onRematch: () => void
}) {
  const result = verdict(state)
  const won = result === me
  useEffect(() => {
    if (won) playSound('win')
  }, [won])

  const title = result === 'draw' ? 'Empate!' : `${state.names[result] ?? '?'} venceu!`
  return (
    <div className="flex flex-1 flex-col items-center gap-6 text-center">
      {won && <Confetti />}
      <h2 className="font-display text-4xl font-bold">{title}</h2>
      <div className="grid w-full grid-cols-2 gap-3">
        {(['a', 'b'] as const).map((side) => (
          <div key={side} className="rounded-2xl bg-white/10 p-4">
            <div className="truncate text-sm font-semibold">
              {state.names[side]}
              {side === me && ' (você)'}
            </div>
            <div className="font-display text-5xl font-bold">{state.score[side]}</div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onRematch}
        className="min-h-14 w-full rounded-2xl bg-orange-500 px-6 text-xl font-bold text-slate-900"
      >
        Revanche
      </button>
    </div>
  )
}
