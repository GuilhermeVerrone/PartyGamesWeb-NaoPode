import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import DuelFinished from '../components/DuelFinished'
import DuelLobby from '../components/DuelLobby'
import DuelTurn from '../components/DuelTurn'
import { toPublicState, type DuelState, type PublicState } from '../game/duel'
import { startGuest, type Guest, type GuestStatus } from '../online/guest'
import { startHost, type Host, type HostStatus } from '../online/host'
import { isValidCode } from '../online/protocol'
import { loadMe, loadState, saveMe } from '../online/storage'
import { useWakeLock } from '../hooks/useWakeLock'
import { unlockAudio } from '../lib/sound'

const btn = 'flex min-h-12 items-center justify-center rounded-2xl px-6 font-bold'

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6">
      <h1 className="font-display text-3xl font-bold">Duelo online</h1>
      {children}
      <Link to="/" className={`${btn} mt-auto bg-white/10`}>
        Sair
      </Link>
    </main>
  )
}

function ShareLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const url = `${location.origin}/on/${code}`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // sem permissão de área de transferência: o link está visível para copiar à mão
    }
  }
  const share = () => void navigator.share({ url, title: 'Não Pode — duelo' }).catch(() => {})
  return (
    <div className="space-y-2 rounded-2xl bg-white/10 p-4">
      <p className="text-sm opacity-80">Mande este link para quem vai jogar:</p>
      <p className="font-mono text-sm break-all select-all">{url}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void copy()}
          className={`${btn} flex-1 bg-white text-slate-900`}
        >
          {copied ? 'Copiado!' : 'Copiar link'}
        </button>
        {'share' in navigator && (
          <button type="button" onClick={share} className={`${btn} flex-1 bg-white/10`}>
            Compartilhar
          </button>
        )}
      </div>
    </div>
  )
}

const HOST_STATUS: Record<HostStatus, string> = {
  connecting: 'Abrindo a sala…',
  open: 'Sala aberta',
  retrying: 'Reconectando ao servidor…',
  error: 'Não foi possível abrir a sala. Verifique sua conexão e recarregue.',
}

function HostRoom({ code, name }: { code: string; name: string }) {
  const [state, setState] = useState<DuelState | null>(null)
  const [status, setStatus] = useState<HostStatus>('connecting')
  const [guestOn, setGuestOn] = useState(false)
  const host = useRef<Host | null>(null)
  useWakeLock(state?.phase === 'turn')

  useEffect(() => {
    const saved = loadState()
    host.current = startHost({
      code,
      name,
      initial: saved && saved.names.a === name ? saved : null,
      onState: setState,
      onStatus: setStatus,
      onGuest: setGuestOn,
    })
    return () => host.current?.stop()
  }, [code, name])

  if (!state) return <Shell>{HOST_STATUS.connecting}</Shell>
  const view = toPublicState(state, 'a', 0) // lobby não usa o relógio
  return (
    <Shell>
      <p role="status" className={status === 'open' ? 'text-teal-300' : 'text-orange-300'}>
        {HOST_STATUS[status]}
        {status === 'open' && !guestOn && state.names.b && ` · ${state.names.b} desconectado`}
      </p>
      {view.phase === 'lobby' && <ShareLink code={code} />}
      {view.phase === 'lobby' ? (
        <DuelLobby
          state={view}
          me="a"
          onReady={() => {
            unlockAudio()
            host.current?.dispatch({ type: 'ready', by: 'a' })
          }}
          onSettings={(settings) => host.current?.dispatch({ type: 'settings', by: 'a', settings })}
        />
      ) : view.phase === 'turn' ? (
        <DuelTurn
          state={view}
          me="a"
          endsAt={state.turn.endsAt}
          onAction={(type) => host.current?.dispatch({ type, by: 'a', now: Date.now() })}
        />
      ) : (
        <DuelFinished
          state={view}
          me="a"
          onRematch={() => host.current?.dispatch({ type: 'rematch' })}
        />
      )}
    </Shell>
  )
}

const GUEST_STATUS: Record<GuestStatus, string> = {
  connecting: 'Conectando…',
  connected: 'Conectado',
  reconnecting: 'Reconectando…',
  'not-found': 'Sala não encontrada. Peça para quem criou abrir a sala.',
  full: 'Sala cheia.',
  version: 'Versão diferente do jogo. Recarregue a página e tente de novo.',
  error: 'Erro de conexão.',
}

function GuestRoom({ code, name }: { code: string; name: string }) {
  const [view, setView] = useState<{ state: PublicState; endsAt: number | null } | null>(null)
  const [status, setStatus] = useState<GuestStatus>('connecting')
  const guest = useRef<Guest | null>(null)
  const state = view?.state ?? null
  useWakeLock(state?.phase === 'turn')

  useEffect(() => {
    guest.current = startGuest({
      code,
      name,
      // o cronômetro roda local e se corrige a cada mensagem do anfitrião
      onState: (s) =>
        setView({
          state: s,
          endsAt: s.turn.remainingMs === null ? null : Date.now() + s.turn.remainingMs,
        }),
      onStatus: setStatus,
    })
    return () => guest.current?.stop()
  }, [code, name])

  const failed = status === 'not-found' || status === 'error' || status === 'reconnecting'
  return (
    <Shell>
      <p role="status" className={status === 'connected' ? 'text-teal-300' : 'text-orange-300'}>
        {GUEST_STATUS[status]}
      </p>
      {failed && (
        <button
          type="button"
          onClick={() => guest.current?.retry()}
          className={`${btn} bg-orange-500 text-slate-900`}
        >
          Tentar de novo
        </button>
      )}
      {state &&
        (state.phase === 'lobby' ? (
          <DuelLobby
            state={state}
            me="b"
            onReady={() => {
              unlockAudio()
              guest.current?.send('ready')
            }}
          />
        ) : state.phase === 'turn' ? (
          <DuelTurn
            state={state}
            me="b"
            endsAt={view?.endsAt ?? null}
            onAction={(type) => guest.current?.send(type)}
          />
        ) : (
          <DuelFinished state={state} me="b" onRematch={() => guest.current?.send('rematch')} />
        ))}
    </Shell>
  )
}

function JoinForm({
  code,
  initial,
  onJoin,
}: {
  code: string
  initial: string
  onJoin: (name: string) => void
}) {
  const [name, setName] = useState(initial)
  return (
    <Shell>
      <p className="opacity-80">Você foi convidado para um duelo. Como quer ser chamado?</p>
      <input
        value={name}
        maxLength={20}
        aria-label="Seu nome"
        onChange={(e) => setName(e.target.value)}
        className="min-h-12 w-full rounded-xl bg-white/10 px-3 text-base"
      />
      <button
        type="button"
        disabled={!name.trim()}
        onClick={() => {
          const trimmed = name.trim()
          saveMe({ name: trimmed, role: 'guest', code })
          onJoin(trimmed)
        }}
        className={`${btn} min-h-14 bg-orange-500 text-xl text-slate-900 disabled:opacity-40`}
      >
        Entrar
      </button>
    </Shell>
  )
}

export default function OnlineRoom() {
  const { code = '' } = useParams()
  const me = loadMe()
  const [guestName, setGuestName] = useState<string | null>(
    me?.role === 'guest' && me.code === code ? me.name : null,
  )

  if (!isValidCode(code)) return <Shell>Link inválido.</Shell>
  if (me?.role === 'host' && me.code === code) return <HostRoom code={code} name={me.name} />
  if (guestName) return <GuestRoom code={code} name={guestName} />
  return <JoinForm code={code} initial={me?.name ?? ''} onJoin={setGuestName} />
}
