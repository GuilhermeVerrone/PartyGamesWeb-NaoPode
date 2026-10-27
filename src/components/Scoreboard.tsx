import type { Team } from '../game/types'

export function Scoreboard({ teams, activeId }: { teams: readonly Team[]; activeId?: string }) {
  return (
    <div className="grid w-full grid-cols-2 gap-3" aria-live="polite">
      {teams.map((t) => (
        <div
          key={t.id}
          className={`rounded-2xl border-2 p-3 text-center ${t.id === activeId ? 'bg-white/15' : 'bg-white/5'}`}
          style={{ borderColor: t.color }}
        >
          <div className="truncate text-sm font-semibold" style={{ color: t.color }}>
            {t.name}
          </div>
          <div className="font-display text-4xl font-bold">{t.score}</div>
        </div>
      ))}
    </div>
  )
}
