const COLORS = ['#fb923c', '#2dd4bf', '#facc15', '#a78bfa', '#f472b6', '#4ade80']

const PIECES = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 53) % 100) / 100,
  duration: 2.5 + ((i * 29) % 15) / 10,
  color: COLORS[i % COLORS.length],
  rotate: (i * 47) % 360,
}))

/** Confete leve em CSS; some com prefers-reduced-motion. */
export function Confetti() {
  return (
    <div aria-hidden className="confetti pointer-events-none fixed inset-0 overflow-hidden">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            rotate: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  )
}
