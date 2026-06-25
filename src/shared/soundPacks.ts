// Phase 3 Deferred Slice 3: deterministic shared built-in sound pack catalog.
// Pure module: no DOM, no timers, no side effects.

export type PetEvent = 'click' | 'switch' | 'explode' | 'reminder'

export interface ToneMetadata {
  frequencyHz: number
  gain: number
  durationMs: number
}

export interface ToneCommand {
  enabled: boolean
  frequencyHz: number
  gain: number
  durationMs: number
}

export interface SoundPack {
  id: string
  label: string
  events: Record<PetEvent, ToneMetadata>
}

export const BUILT_IN_SOUND_PACKS: SoundPack[] = [
  {
    id: 'mute',
    label: 'Mute',
    events: {
      click: { frequencyHz: 0, gain: 0, durationMs: 0 },
      switch: { frequencyHz: 0, gain: 0, durationMs: 0 },
      explode: { frequencyHz: 0, gain: 0, durationMs: 0 },
      reminder: { frequencyHz: 0, gain: 0, durationMs: 0 },
    },
  },
  {
    id: 'blip',
    label: 'Blip',
    events: {
      click: { frequencyHz: 880, gain: 0.15, durationMs: 60 },
      switch: { frequencyHz: 660, gain: 0.12, durationMs: 80 },
      explode: { frequencyHz: 220, gain: 0.2, durationMs: 150 },
      reminder: { frequencyHz: 440, gain: 0.1, durationMs: 200 },
    },
  },
  {
    id: 'chime',
    label: 'Chime',
    events: {
      click: { frequencyHz: 1047, gain: 0.12, durationMs: 100 },
      switch: { frequencyHz: 784, gain: 0.1, durationMs: 120 },
      explode: { frequencyHz: 262, gain: 0.18, durationMs: 200 },
      reminder: { frequencyHz: 523, gain: 0.14, durationMs: 300 },
    },
  },
]

/** Return the sound pack with the given id, or the mute pack as fallback. */
export function getSoundPackById(id: string): SoundPack {
  return BUILT_IN_SOUND_PACKS.find(p => p.id === id) ?? BUILT_IN_SOUND_PACKS[0]
}

/** Resolve a deterministic tone command for a pack id and pet event. */
export function resolveSoundCommand(packId: string, event: PetEvent): ToneCommand {
  const pack = getSoundPackById(packId)
  const meta = pack.events[event]
  return {
    enabled: pack.id !== 'mute',
    frequencyHz: meta.frequencyHz,
    gain: meta.gain,
    durationMs: meta.durationMs,
  }
}
