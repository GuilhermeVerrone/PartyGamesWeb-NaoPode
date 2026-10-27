import { Link } from 'react-router-dom'
import { useGameStore } from '../game/store'

export default function Home() {
  const canContinue = useGameStore((s) => s.game !== null && s.game.phase !== 'finished')
  const btn = 'block min-h-14 w-full rounded-2xl px-6 py-4 text-center text-xl font-bold'
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
      <h1 className="font-display mb-6 text-6xl font-bold">Não Pode</h1>
      <div className="w-full max-w-xs space-y-3">
        <Link to="/setup" className={`${btn} bg-orange-500 text-slate-900`}>
          Novo Jogo
        </Link>
        {canContinue && (
          <Link to="/play" className={`${btn} bg-teal-400 text-slate-900`}>
            Continuar
          </Link>
        )}
        <Link to="/on" className={`${btn} bg-white/10 text-base`}>
          Duelo online
        </Link>
        <Link to="/about" className={`${btn} bg-white/10 text-base`}>
          Sobre
        </Link>
      </div>
    </main>
  )
}
