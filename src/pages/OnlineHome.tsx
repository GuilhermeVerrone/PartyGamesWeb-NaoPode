import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { generateCode } from '../online/protocol'
import { clearState, loadMe, saveMe } from '../online/storage'

export default function OnlineHome() {
  const navigate = useNavigate()
  const me = loadMe()
  const hosted = me?.role === 'host' ? me : null
  const [name, setName] = useState(me?.name ?? '')

  const create = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    // o link do anfitrião é sempre o mesmo
    const code = hosted?.code ?? generateCode()
    if (!hosted) clearState()
    saveMe({ name: trimmed, role: 'host', code })
    navigate(`/on/${code}`)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="font-display text-4xl font-bold">Duelo online</h1>
      <p className="opacity-80">
        Crie uma sala e mande o link para quem vai jogar com você. Em 1x1, vence quem mais fizer o
        outro acertar.
      </p>
      <label className="block">
        <span className="mb-1 block text-sm opacity-80">Seu nome</span>
        <input
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          className="min-h-12 w-full rounded-xl bg-white/10 px-3 text-base"
        />
      </label>
      <button
        type="button"
        disabled={!name.trim()}
        onClick={create}
        className="min-h-14 rounded-2xl bg-orange-500 px-6 text-xl font-bold text-slate-900 disabled:opacity-40"
      >
        {hosted ? 'Abrir minha sala' : 'Criar sala'}
      </button>
      <Link
        to="/"
        className="flex min-h-12 items-center justify-center rounded-2xl bg-white/10 font-bold"
      >
        Voltar
      </Link>
    </main>
  )
}
