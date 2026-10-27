import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { Scoreboard } from '../components/Scoreboard'
import { TurnSummary } from '../components/TurnSummary'
import { CARDS } from '../game/cards'
import { useGameStore } from '../game/store'
import { useFeedback } from '../hooks/useFeedback'
import { useSwipe } from '../hooks/useSwipe'
import { useTimer } from '../hooks/useTimer'
import { useWakeLock } from '../hooks/useWakeLock'
import { unlockAudio } from '../lib/sound'

const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]))
const bigBtn = 'min-h-14 w-full rounded-2xl px-6 py-4 text-xl font-bold text-slate-900'

function Handoff() {
  const game = useGameStore((s) => s.game)!
  const dispatch = useGameStore((s) => s.dispatch)
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (count === null) return
    if (count === 0) {
      dispatch({ type: 'beginTurn', now: Date.now() })
      return
    }
    const id = setTimeout(() => setCount(count - 1), 1000)
    return () => clearTimeout(id)
  }, [count, dispatch])

  const team = game.teams[game.currentTeamIdx]
  const other = game.teams[game.currentTeamIdx === 0 ? 1 : 0]
  const player = team.players[team.nextPlayerIdx % team.players.length]

  if (count !== null) {
    return (
      <div className="flex flex-1 items-center justify-center" aria-live="assertive">
        <span className="font-display text-9xl font-bold">{count}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <p className="opacity-70">
        {game.tiebreak ? 'Desempate' : `Rodada ${game.round} de ${game.settings.roundsPerTeam}`}
      </p>
      <h1 className="font-display text-4xl font-bold" style={{ color: team.color }}>
        {team.name}
      </h1>
      <p className="text-xl">
        <strong>{player.name}</strong>, pegue o aparelho. {team.name}, fiquem de frente para ele;{' '}
        {other.name} fiscaliza.
      </p>
      <button
        type="button"
        onClick={() => {
          unlockAudio()
          setCount(3)
        }}
        className={`${bigBtn} max-w-xs bg-orange-500`}
      >
        Estou pronto
      </button>
    </div>
  )
}

function Playing() {
  const game = useGameStore((s) => s.game)!
  const dispatch = useGameStore((s) => s.dispatch)
  const feedback = useFeedback()
  const [stamp, setStamp] = useState(false)
  const stampTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const lastTick = useRef<number | null>(null)

  const onExpire = useCallback(() => {
    feedback('timeup')
    dispatch({ type: 'timeout' })
  }, [feedback, dispatch])
  const remaining = useTimer(game.turnEndsAt, onExpire)
  useWakeLock(true)
  useEffect(() => () => clearTimeout(stampTimer.current), [])

  const card = game.currentCardId ? CARD_BY_ID.get(game.currentCardId) : undefined
  const team = game.teams[game.currentTeamIdx]
  const seconds = Math.ceil(remaining / 1000)

  useEffect(() => {
    if (seconds > 0 && seconds <= 5 && lastTick.current !== seconds) feedback('tick')
    lastTick.current = seconds
  }, [seconds, feedback])

  const hit = () => {
    feedback('hit')
    dispatch({ type: 'hit' })
  }
  const skip = () => {
    feedback('skip')
    dispatch({ type: 'skip' })
  }
  const naoPode = () => {
    if (stamp) return
    feedback('naopode')
    setStamp(true)
    // no clássico a vez acaba: deixa o carimbo aparecer antes de trocar de tela
    const delay = game.settings.naoPodeMode === 'classic' ? 700 : 0
    stampTimer.current = setTimeout(() => {
      dispatch({ type: 'naopode' })
      setTimeout(() => setStamp(false), 700 - delay)
    }, delay)
  }

  const { dx, handlers } = useSwipe(hit, skip)

  return (
    <div className="flex flex-1 flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between">
        <span className="font-display text-xl font-bold" style={{ color: team.color }}>
          {team.name}
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
      <Scoreboard teams={game.teams} activeId={team.id} />
      <div
        className="relative flex w-full flex-1 touch-pan-y items-center justify-center select-none"
        {...handlers}
      >
        {card && (
          <div
            key={game.currentCardId}
            className="card-in flex w-full justify-center"
            style={{
              transform: dx ? `translateX(${dx}px) rotate(${dx / 20}deg)` : undefined,
              transition: dx ? 'none' : 'transform 0.2s',
            }}
          >
            <Card card={card} />
          </div>
        )}
        {stamp && (
          <div
            aria-hidden
            className="stamp font-display pointer-events-none absolute rounded-xl border-8 border-red-500 px-4 py-2 text-5xl font-bold text-red-500 uppercase"
          >
            Não pode!
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {stamp ? 'Não pode!' : ''}
        </span>
      </div>
      <p className="text-xs opacity-60">Deslize a carta: → acertou · ← pular</p>
      {game.canUndo && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'undo' })}
          className="min-h-12 rounded-xl bg-white/10 px-4 font-semibold"
        >
          ↩ Desfazer
        </button>
      )}
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <button type="button" onClick={hit} className={`${bigBtn} bg-green-400`}>
          ✅ Acertou
        </button>
        <button type="button" onClick={skip} className={`${bigBtn} bg-slate-300`}>
          ⏭️ Pular
        </button>
        <button
          type="button"
          onClick={naoPode}
          className={`${bigBtn} font-display col-span-2 bg-red-500 text-white`}
        >
          🚫 NÃO PODE!
        </button>
      </div>
    </div>
  )
}

function Summary() {
  const game = useGameStore((s) => s.game)!
  const dispatch = useGameStore((s) => s.dispatch)
  return (
    <div className="flex flex-1 flex-col items-center gap-4">
      <h1 className="font-display text-3xl font-bold">Fim da vez</h1>
      <TurnSummary
        state={game}
        onCorrect={(entryIdx, result) => dispatch({ type: 'correct', entryIdx, result })}
      />
      <button
        type="button"
        onClick={() => dispatch({ type: 'confirmSummary' })}
        className={`${bigBtn} max-w-md bg-orange-500`}
      >
        Confirmar e continuar
      </button>
    </div>
  )
}

function Between() {
  const game = useGameStore((s) => s.game)!
  const dispatch = useGameStore((s) => s.dispatch)
  const team = game.teams[game.currentTeamIdx]
  const player = team.players[team.nextPlayerIdx % team.players.length]
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <h1 className="font-display text-3xl font-bold">
        {game.phase === 'tiebreak' ? 'Empate! Rodada de desempate' : 'Placar'}
      </h1>
      <div className="w-full max-w-md">
        <Scoreboard teams={game.teams} />
      </div>
      <p className="opacity-80">
        Próxima vez: <strong style={{ color: team.color }}>{team.name}</strong> com {player.name}
      </p>
      <button
        type="button"
        onClick={() => dispatch({ type: 'continue' })}
        className={`${bigBtn} max-w-xs bg-orange-500`}
      >
        Continuar
      </button>
    </div>
  )
}

export default function Play() {
  const phase = useGameStore((s) => s.game?.phase)
  if (!phase) return <Navigate to="/" replace />
  if (phase === 'finished') return <Navigate to="/result" replace />
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col p-4">
      {phase === 'handoff' && <Handoff />}
      {phase === 'playing' && <Playing />}
      {phase === 'turnSummary' && <Summary />}
      {(phase === 'scoreboard' || phase === 'tiebreak') && <Between />}
    </main>
  )
}
