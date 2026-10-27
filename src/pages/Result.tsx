import { useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Confetti } from '../components/Confetti'
import { Scoreboard } from '../components/Scoreboard'
import { useFeedback } from '../hooks/useFeedback'
import { useGameStore } from '../game/store'

export default function Result() {
  const game = useGameStore((s) => s.game)
  const restart = useGameStore((s) => s.restart)
  const quit = useGameStore((s) => s.quit)
  const navigate = useNavigate()
  const feedback = useFeedback()
  const finished = game?.phase === 'finished'
  useEffect(() => {
    if (finished) feedback('win')
  }, [finished, feedback])
  if (!game || game.phase !== 'finished') return <Navigate to="/" replace />

  const winner = game.teams.find((t) => t.id === game.winner)!
  const players = game.teams.flatMap((t) => t.players)
  const top = Math.max(...players.map((p) => p.hits))
  const mvps = top > 0 ? players.filter((p) => p.hits === top) : []

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <Confetti />
      <p className="text-xl">🏆 Vencedor</p>
      <h1 className="font-display text-5xl font-bold" style={{ color: winner.color }}>
        {winner.name}
      </h1>
      <Scoreboard teams={game.teams} activeId={winner.id} />
      {mvps.length > 0 && (
        <p>
          ⭐ MVP: <strong>{mvps.map((p) => p.name).join(', ')}</strong> ({top} acertos)
        </p>
      )}
      <div className="w-full space-y-3">
        <button
          type="button"
          onClick={() => {
            restart()
            navigate('/play')
          }}
          className="min-h-14 w-full rounded-2xl bg-orange-500 text-xl font-bold text-slate-900"
        >
          Jogar de novo
        </button>
        <Link
          to="/setup"
          onClick={quit}
          className="block min-h-14 w-full rounded-2xl bg-white/10 py-3.5 text-xl font-bold"
        >
          Novo jogo
        </Link>
      </div>
    </main>
  )
}
