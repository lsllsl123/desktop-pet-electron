// Phase 3 Slice 1: deterministic shared built-in pet skin catalog.
// Pure module: no DOM, no timers, no side effects.

export interface PetSkin {
  id: string
  label: string
  primaryColor: string
  accentColor: string
  textColor: string
}

export const BUILT_IN_PET_SKINS: PetSkin[] = [
  {
    id: 'pixel-cat',
    label: 'Pixel Cat',
    primaryColor: '#ff8fab',
    accentColor: '#ff6b8f',
    textColor: '#ffffff',
  },
  {
    id: 'pixel-dog',
    label: 'Pixel Dog',
    primaryColor: '#74c0fc',
    accentColor: '#4dabf7',
    textColor: '#ffffff',
  },
  {
    id: 'pixel-frog',
    label: 'Pixel Frog',
    primaryColor: '#69db7c',
    accentColor: '#51cf66',
    textColor: '#ffffff',
  },
  {
    id: 'pixel-panda',
    label: 'Pixel Panda',
    primaryColor: '#ffd43b',
    accentColor: '#fcc419',
    textColor: '#111111',
  },
  {
    id: 'pixel-bot',
    label: 'Pixel Bot',
    primaryColor: '#b197fc',
    accentColor: '#9775fa',
    textColor: '#ffffff',
  },
  {
    id: 'pixel-ghost',
    label: 'Pixel Ghost',
    primaryColor: '#e0e0e0',
    accentColor: '#c0c0c0',
    textColor: '#333333',
  },
  {
    id: 'pixel-alien',
    label: 'Pixel Alien',
    primaryColor: '#95e1d3',
    accentColor: '#7bc8b8',
    textColor: '#111111',
  },
]

/** Return the skin at the given index, wrapping around on overflow. */
export function getPetSkinByIndex(index: number): PetSkin {
  return BUILT_IN_PET_SKINS[normalizePetSkinIndex(index)]
}

/**
 * Normalize an index to a valid skin index.
 * Returns 0 if the index is out of the valid range.
 */
export function normalizePetSkinIndex(index: number): number {
  if (Number.isInteger(index) && index >= 0 && index < BUILT_IN_PET_SKINS.length) {
    return index
  }
  return 0
}
