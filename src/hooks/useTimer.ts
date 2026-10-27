import { useEffect, useRef, useState } from 'react'

/** Milissegundos restantes, calculados por timestamp (sobrevive a troca de aba). */
export function useTimer(endsAt: number | null, onExpire: () => void): number {
  const [now, setNow] = useState(() => Date.now())
  const expire = useRef(onExpire)
  useEffect(() => {
    expire.current = onExpire
  })

  useEffect(() => {
    if (endsAt === null) return
    const tick = () => {
      const t = Date.now()
      setNow(t)
      if (t >= endsAt) {
        clearInterval(id)
        expire.current()
      }
    }
    const id = setInterval(tick, 100)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [endsAt])

  return endsAt === null ? 0 : Math.max(0, endsAt - now)
}
