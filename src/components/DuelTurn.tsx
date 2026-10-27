import { useEffect, useRef } from 'react'
import { Card } from './Card'
import { CARDS } from '../game/cards'
import { type PublicState, type Side } from '../game/duel'
import { useFeedback } from '../hooks/useFeedback'
import { useTimer } from '../hooks/useTimer'

const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]))
const bigBtn = 'min-h-14 w-full rounded-2xl px-6 py-4 text-xl font-bold text-slate-900'
const noop = () => {}

export type DuelActionName = 'hit' | 'naopode' | 'skip'

function Score({ state, me }: { state: PublicState; me: Side }) {
  return (
    <div className="grid w-full grid-cols-2 gap-3" aria-live="polite">
      {(['a', 'b'] as const).map((side) => (
        <div
          key={side}
          className={`rounded-2xl p-3 text-center ${
            state.turn.describer === side ? 'bg-white/15' : 'bg-white/5'
          }`}
        >
          <div className="truncate text-sm font-semibold">
            {state.names[side]}
            {side === me && ' (você)'}
          </div>
          <div className="font-display text-4xl font-bold">{state.score[side]}</div>
        </div>
      ))}
    </div>
  )
}

/** Tela da vez: quem descreve vê a carta; quem adivinha vê os botões. */
export default function DuelTurn({
  state,
  me,
  endsAt,
  onAction,
}: {
  state: PublicState
  me: Side
  /** timestamp local do fim da vez */
  endsAt: number | null
  onAction: (type: DuelActionName) => void
}) {
  const feedback = useFeedback()
  const remaining = useTimer(endsAt, noop)
  const seconds = Math.ceil(remaining / 1000)
  const describing = state.turn.describer === me
  const describer = state.names[state.turn.describer]
  const card = state.cardId ? CARD_BY_ID.get(state.cardId) : undefined

  // sons e vibração a partir do estado, iguais nos dois aparelhos
  const prev = useRef<{ score: PublicState['score']; index: number } | null>(null)
  const lastTick = useRef<number | null>(null)
  useEffect(() => {
    const p = prev.current
    if (p) {
      const side = state.turn.describer
      const sameTurn = p.index === state.turn.index
      const delta = state.score[side] - p.score[side]
      if (sameTurn && delta > 0) feedback('hit')
      else if (sameTurn && delta < 0) feedback('naopode')
      else if (!sameTurn) feedback('timeup')
    }
    prev.current = { score: state.score, index: state.turn.index }
  }, [state.score, state.turn, feedback])
  useEffect(() => {
    if (seconds > 0 && seconds <= 5 && lastTick.current !== seconds) feedback('tick')
    lastTick.current = seconds
  }, [seconds, feedback])

  return (
    <div className="flex flex-1 flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between">
        <span className="font-display text-xl font-bold">
          {describing ? 'Você descreve' : `${describer} descreve`}
        </span>
        <span
          className={`font-display text-5xl font-bold tabular-nums ${
            seconds <= 10 ? 'pulse-warn text-red-400' : ''
          }`}
          role="timer"
          aria-label={`${seconds} segundos restantes`}
        >
          {seconds}s
        </span>
      </div>
      <Score state={state} me={me} />
      <div className="flex w-full flex-1 items-center justify-center">
        {describing ? (
          card && (
            <div key={card.id} className="card-in flex w-full justify-center">
              <Card card={card} />
            </div>
          )
        ) : (
          <p className="text-center text-xl">
            Escute {describer} e adivinhe a palavra!
            <br />
            <span className="text-sm opacity-70">
              Se {describer} falar uma palavra proibida, toque em NÃO PODE.
            </span>
          </p>
        )}
      </div>
      {describing ? (
        <button
          type="button"
          onClick={() => {
            feedback('skip')
            onAction('skip')
          }}
          className={`${bigBtn} max-w-md bg-slate-300`}
        >
          ⏭️ Pular
        </button>
      ) : (
        <div className="grid w-full max-w-md grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => onAction('hit')}
            className={`${bigBtn} bg-green-400`}
          >
            ✅ Acertou!
          </button>
          <button
            type="button"
            onClick={() => onAction('naopode')}
            className={`${bigBtn} font-display bg-red-500 text-white`}
          >
            🚫 NÃO PODE!
          </button>
        </div>
      )}
    </div>
  )
}
