import type { Card as CardData } from '../game/types'

export function Card({ card }: { card: CardData }) {
  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center text-slate-900 shadow-2xl">
      <h2 className="font-display text-4xl font-bold tracking-tight break-words uppercase">
        {card.word}
      </h2>
      <ul className="mt-5 space-y-2">
        {card.forbidden.map((w) => (
          <li key={w} className="rounded-xl bg-red-100 px-3 py-2 text-lg font-bold text-red-700">
            {w}
          </li>
        ))}
      </ul>
    </div>
  )
}
