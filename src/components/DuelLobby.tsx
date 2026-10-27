import type { DuelSettings, PublicState, Side } from '../game/duel'

const SECONDS: DuelSettings['turnSeconds'][] = [30, 45, 60]
const TURNS = [1, 2, 3, 5]
const chip = 'min-h-12 rounded-xl px-4 font-semibold'

function Option<T extends number>({
  label,
  value,
  options,
  format = String,
  disabled,
  onChange,
}: {
  label: string
  value: T
  options: T[]
  format?: (v: T) => string
  disabled: boolean
  onChange: (v: T) => void
}) {
  return (
    <fieldset disabled={disabled} className="disabled:opacity-70">
      <legend className="mb-1 text-sm opacity-80">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={o === value}
            onClick={() => onChange(o)}
            className={`${chip} ${o === value ? 'bg-white text-slate-900' : 'bg-white/10'}`}
          >
            {format(o)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export default function DuelLobby({
  state,
  me,
  onReady,
  onSettings,
}: {
  state: PublicState
  me: Side
  onReady: () => void
  /** só o anfitrião passa isto */
  onSettings?: (patch: Partial<DuelSettings>) => void
}) {
  const { names, ready, settings } = state
  const players: { side: Side; name?: string }[] = [
    { side: 'a', name: names.a },
    { side: 'b', name: names.b },
  ]
  const canEdit = !!onSettings

  return (
    <div className="space-y-5">
      <ul className="space-y-2" aria-live="polite">
        {players.map((p) => (
          <li
            key={p.side}
            className="flex min-h-12 items-center justify-between rounded-xl bg-white/10 px-4"
          >
            <span className="font-semibold">
              {p.name ?? 'Esperando jogador…'}
              {p.side === me && ' (você)'}
            </span>
            <span className={ready[p.side] ? 'text-teal-300' : 'opacity-60'}>
              {p.name ? (ready[p.side] ? 'Pronto' : 'Aguardando') : ''}
            </span>
          </li>
        ))}
      </ul>

      <Option
        label="Segundos por vez"
        value={settings.turnSeconds}
        options={SECONDS}
        disabled={!canEdit}
        onChange={(turnSeconds) => onSettings?.({ turnSeconds })}
      />
      <Option
        label="Vezes de cada um"
        value={settings.turnsEach}
        options={TURNS}
        disabled={!canEdit}
        onChange={(turnsEach) => onSettings?.({ turnsEach })}
      />
      <Option
        label="Penalidade do Não Pode"
        value={settings.naoPodePenalty}
        options={[0, 1]}
        format={(v) => (v === 0 ? '0' : '−1')}
        disabled={!canEdit}
        onChange={(naoPodePenalty) => onSettings?.({ naoPodePenalty: naoPodePenalty as 0 | 1 })}
      />

      <button
        type="button"
        disabled={!names.b}
        aria-pressed={ready[me]}
        onClick={onReady}
        className={`min-h-14 w-full rounded-2xl px-6 text-xl font-bold disabled:opacity-40 ${
          ready[me] ? 'bg-teal-400 text-slate-900' : 'bg-orange-500 text-slate-900'
        }`}
      >
        {ready[me] ? 'Pronto!' : 'Estou pronto'}
      </button>
    </div>
  )
}
