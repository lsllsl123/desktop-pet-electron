// Phase 1 settings store: deterministic key-value persistence.
// In the renderer process this uses localStorage. A plain object fallback
// makes it testable in node without a DOM.

type StorageBackend = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function createLocalStorageBackend(): StorageBackend | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage
    }
  } catch {
    // localStorage unavailable in node tests.
  }
  return null
}

function createMemoryStorageBackend(): StorageBackend {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
  }
}

export interface PetSettings {
  charIndex: number
  windowX: number | null
  windowY: number | null
}

const DEFAULT_SETTINGS: PetSettings = {
  charIndex: 0,
  windowX: null,
  windowY: null,
}

const STORAGE_KEY = 'desktop-pet-settings'

export class SettingsStore {
  private backend: StorageBackend
  private cache: PetSettings

  constructor(backend?: StorageBackend) {
    this.backend = backend ?? createLocalStorageBackend() ?? createMemoryStorageBackend()
    this.cache = this.load()
  }

  private load(): PetSettings {
    try {
      const raw = this.backend.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PetSettings>
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
    } catch {
      // Corrupted data resets to defaults.
    }
    return { ...DEFAULT_SETTINGS }
  }

  private persist(): void {
    this.backend.setItem(STORAGE_KEY, JSON.stringify(this.cache))
  }

  get<K extends keyof PetSettings>(key: K): PetSettings[K] {
    return this.cache[key]
  }

  set<K extends keyof PetSettings>(key: K, value: PetSettings[K]): void {
    this.cache[key] = value
    this.persist()
  }

  getAll(): PetSettings {
    return { ...this.cache }
  }

  reset(): void {
    this.cache = { ...DEFAULT_SETTINGS }
    this.persist()
  }
}

export const settingsStore = new SettingsStore()
