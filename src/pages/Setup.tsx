import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../game/categories'
import { shuffle } from '../game/deck'
import { useGameStore, type SetupData } from '../game/store'
import type { CategoryId, Settings } from '../game/types'

const MAX_PLAYERS = 4
const field = 'min-h-12 w-full rounded-xl bg-white/10 px-3 text-base'

function Choice<T extends string | number | boolean | null>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm opacity-80">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className={`min-h-12 rounded-xl px-4 font-semibold ${
              o.value === value ? 'bg-white text-slate-900' : 'bg-white/10'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export default function Setup() {
  const navigate = useNavigate()
  const start = useGameStore((s) => s.start)
  const [setup, setSetup] = useState<SetupData>(() => useGameStore.getState().setup)

  const setSettings = (patch: Partial<Settings>) =>
    setSetup((s) => ({ ...s, settings: { ...s.settings, ...patch } }))

  const patchTeam = (i: 0 | 1, patch: Partial<SetupData['teams'][0]>) =>
    setSetup((s) => {
      const teams = [...s.teams] as SetupData['teams']
      teams[i] = { ...teams[i], ...patch }
      return { ...s, teams }
    })

  const setPlayer = (t: 0 | 1, p: number, name: string) =>
    patchTeam(t, { players: setup.teams[t].players.map((n, i) => (i === p ? name : n)) })

  const draw = () => {
    const names = shuffle(
      setup.teams.flatMap((t) => t.players.map((n) => n.trim()).filter(Boolean)),
    )
    const half = Math.ceil(names.length / 2)
    const pad = (list: string[]) =>
      list.length < 2 ? [...list, ...Array(2 - list.length).fill('')] : list
    setSetup((s) => ({
      ...s,
      teams: [
        { ...s.teams[0], players: pad(names.slice(0, half)) },
        { ...s.teams[1], players: pad(names.slice(half)) },
      ],
    }))
  }

  const cleaned = setup.teams.map((t) => ({
    ...t,
    name: t.name.trim() || 'Time',
    players: t.players.map((n) => n.trim()).filter(Boolean),
  })) as SetupData['teams']

  const error = cleaned.some((t) => t.players.length < 2)
    ? 'Cada time precisa de pelo menos 2 jogadores.'
    : setup.settings.categories.length === 0
      ? 'Escolha ao menos uma categoria.'
      : null

  const toggleCategory = (id: CategoryId) => {
    const cats = setup.settings.categories
    setSettings({ categories: cats.includes(id) ? cats.filter((c) => c !== id) : [...cats, id] })
  }

  const submit = () => {
    if (error) return
    start({ ...setup, teams: cleaned })
    navigate('/play')
  }

  const s = setup.settings
  return (
    <main className="mx-auto max-w-md space-y-6 p-4 pb-28">
      <h1 className="font-display text-3xl font-bold">Nova partida</h1>

      {setup.teams.map((team, t) => (
        <section
          key={t}
          className="space-y-2 rounded-2xl border-2 p-3"
          style={{ borderColor: team.color }}
        >
          <input
            aria-label={`Nome do time ${t + 1}`}
            className={`${field} font-bold`}
            value={team.name}
            maxLength={20}
            onChange={(e) => patchTeam(t as 0 | 1, { name: e.target.value })}
          />
          {team.players.map((name, p) => (
            <div key={p} className="flex gap-2">
              <input
                aria-label={`Jogador ${p + 1} do ${team.name}`}
                placeholder={`Jogador ${p + 1}`}
                className={field}
                value={name}
                maxLength={16}
                onChange={(e) => setPlayer(t as 0 | 1, p, e.target.value)}
              />
              {team.players.length > 2 && (
                <button
                  type="button"
                  aria-label="Remover jogador"
                  className="min-h-12 min-w-12 rounded-xl bg-white/10"
                  onClick={() =>
                    patchTeam(t as 0 | 1, { players: team.players.filter((_, i) => i !== p) })
                  }
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {team.players.length < MAX_PLAYERS && (
            <button
              type="button"
              className="min-h-12 w-full rounded-xl bg-white/10 font-semibold"
              onClick={() => patchTeam(t as 0 | 1, { players: [...team.players, ''] })}
            >
              + Jogador
            </button>
          )}
        </section>
      ))}

      <button
        type="button"
        onClick={draw}
        className="min-h-12 w-full rounded-xl bg-white/10 font-semibold"
      >
        🎲 Sortear times
      </button>

      <Choice
        label="Duração da vez"
        value={s.turnSeconds}
        options={[30, 45, 60, 90].map((v) => ({
          value: v as Settings['turnSeconds'],
          label: `${v}s`,
        }))}
        onChange={(turnSeconds) => setSettings({ turnSeconds })}
      />
      <Choice
        label="Rodadas por time"
        value={s.roundsPerTeam}
        options={[2, 3, 4, 5, 6, 8, 10].map((v) => ({ value: v, label: String(v) }))}
        onChange={(roundsPerTeam) => setSettings({ roundsPerTeam })}
      />
      <Choice
        label="Regra do Não Pode"
        value={s.naoPodeMode}
        options={[
          { value: 'classic', label: 'Clássico (encerra a vez)' },
          { value: 'soft', label: 'Suave (continua)' },
        ]}
        onChange={(naoPodeMode) => setSettings({ naoPodeMode })}
      />
      <Choice
        label="Pular custa ponto?"
        value={s.skipPenalty}
        options={[
          { value: 0, label: 'Não' },
          { value: 1, label: '−1' },
        ]}
        onChange={(skipPenalty) => setSettings({ skipPenalty })}
      />
      <Choice
        label="Pontuação-alvo"
        value={s.targetScore}
        options={[
          { value: null, label: 'Desligada' },
          { value: 10, label: '10' },
          { value: 15, label: '15' },
          { value: 20, label: '20' },
        ]}
        onChange={(targetScore) => setSettings({ targetScore })}
      />

      <Choice
        label="Sons"
        value={s.sound}
        options={[
          { value: true, label: 'Ligados' },
          { value: false, label: 'Desligados' },
        ]}
        onChange={(sound) => setSettings({ sound })}
      />
      <Choice
        label="Vibração"
        value={s.vibration}
        options={[
          { value: true, label: 'Ligada' },
          { value: false, label: 'Desligada' },
        ]}
        onChange={(vibration) => setSettings({ vibration })}
      />

      <fieldset>
        <legend className="mb-1 text-sm opacity-80">Categorias</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={s.categories.includes(c.id)}
              onClick={() => toggleCategory(c.id)}
              className={`min-h-12 rounded-xl px-3 font-semibold ${
                s.categories.includes(c.id) ? 'bg-white text-slate-900' : 'bg-white/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="fixed inset-x-0 bottom-0 bg-slate-950/90 p-4">
        <div className="mx-auto max-w-md">
          {error && (
            <p role="alert" className="mb-2 text-center text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={error !== null}
            onClick={submit}
            className="min-h-14 w-full rounded-2xl bg-orange-500 text-xl font-bold text-slate-900 disabled:opacity-40"
          >
            Começar
          </button>
        </div>
      </div>
    </main>
  )
}
