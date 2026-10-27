import { useCallback } from 'react'
import { useGameStore } from '../game/store'
import { HAPTIC, vibrate } from '../lib/haptics'
import { playSound, type SoundName } from '../lib/sound'

/** Toca som e vibra conforme as opções da partida. */
export function useFeedback() {
  const sound = useGameStore((s) => s.game?.settings.sound ?? s.setup.settings.sound)
  const vibration = useGameStore((s) => s.game?.settings.vibration ?? s.setup.settings.vibration)

  return useCallback(
    (name: SoundName) => {
      if (sound) playSound(name)
      if (vibration && name in HAPTIC) vibrate(HAPTIC[name as keyof typeof HAPTIC])
    },
    [sound, vibration],
  )
}
