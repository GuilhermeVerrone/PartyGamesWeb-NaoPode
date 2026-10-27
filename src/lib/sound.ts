export type SoundName = 'hit' | 'skip' | 'naopode' | 'tick' | 'timeup' | 'win'

type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number }

const SOUNDS: Record<SoundName, Note[]> = {
  hit: [
    { freq: 660, at: 0, dur: 0.1 },
    { freq: 880, at: 0.09, dur: 0.18 },
  ],
  skip: [{ freq: 330, at: 0, dur: 0.12, type: 'triangle' }],
  naopode: [
    { freq: 220, at: 0, dur: 0.25, type: 'sawtooth', gain: 0.6 },
    { freq: 150, at: 0.2, dur: 0.4, type: 'sawtooth', gain: 0.6 },
  ],
  tick: [{ freq: 1000, at: 0, dur: 0.05, type: 'square', gain: 0.25 }],
  timeup: [
    { freq: 520, at: 0, dur: 0.15, type: 'square', gain: 0.4 },
    { freq: 520, at: 0.2, dur: 0.15, type: 'square', gain: 0.4 },
    { freq: 390, at: 0.4, dur: 0.4, type: 'square', gain: 0.4 },
  ],
  win: [523, 659, 784, 1047].map((freq, i) => ({ freq, at: i * 0.12, dur: 0.22 })),
}

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx ??= new Ctor()
  return ctx
}

/** Destrava o áudio em iOS/Safari; chamar dentro de um gesto do usuário. */
export function unlockAudio() {
  const c = getContext()
  if (c?.state === 'suspended') void c.resume()
}

export function playSound(name: SoundName) {
  const c = getContext()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  const t0 = c.currentTime
  for (const n of SOUNDS[name]) {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = n.type ?? 'sine'
    osc.frequency.value = n.freq
    const peak = n.gain ?? 0.5
    const start = t0 + n.at
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(peak, start + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, start + n.dur)
    osc.connect(g).connect(c.destination)
    osc.start(start)
    osc.stop(start + n.dur + 0.02)
  }
}
