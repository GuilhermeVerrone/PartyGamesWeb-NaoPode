export function vibrate(pattern: number | readonly number[]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(typeof pattern === 'number' ? pattern : [...pattern])
  }
}

export const HAPTIC = {
  hit: 40,
  skip: 20,
  naopode: [200, 60, 200],
  timeup: [120, 60, 120, 60, 300],
} as const
