import { useRef, useState, type PointerEvent } from 'react'

const THRESHOLD = 90

/** Gesto horizontal: direita = onRight, esquerda = onLeft. Devolve o deslocamento para animar. */
export function useSwipe(onRight: () => void, onLeft: () => void) {
  const startX = useRef<number | null>(null)
  const [dx, setDx] = useState(0)

  const end = () => {
    if (startX.current === null) return
    startX.current = null
    if (dx > THRESHOLD) onRight()
    else if (dx < -THRESHOLD) onLeft()
    setDx(0)
  }

  return {
    dx,
    handlers: {
      onPointerDown: (e: PointerEvent) => {
        startX.current = e.clientX
        e.currentTarget.setPointerCapture(e.pointerId)
      },
      onPointerMove: (e: PointerEvent) => {
        if (startX.current !== null) setDx(e.clientX - startX.current)
      },
      onPointerUp: end,
      onPointerCancel: () => {
        startX.current = null
        setDx(0)
      },
    },
  }
}
