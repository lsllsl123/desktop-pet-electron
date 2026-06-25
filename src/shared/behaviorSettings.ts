// Phase 2 behavior settings: random event frequency and low-resource mode.
// Pure module with default constants.

export const DEFAULT_EVENT_INTERVAL_MS = 8000

/** Multiplier applied to event interval when low-resource mode is active. */
export const LOW_RESOURCE_MULTIPLIER = 3

export interface BehaviorSettings {
  getLowResourceMode: () => boolean
  setLowResourceMode: (v: boolean) => void
  getRandomEventIntervalMs: () => number
  setRandomEventIntervalMs: (ms: number) => void
  getEffectiveInterval: () => number
  reset: () => void
}

export function createBehaviorSettings(): BehaviorSettings {
  let lowResourceMode = false
  let randomEventIntervalMs = DEFAULT_EVENT_INTERVAL_MS

  return {
    getLowResourceMode(): boolean {
      return lowResourceMode
    },
    setLowResourceMode(v: boolean): void {
      lowResourceMode = v
    },
    getRandomEventIntervalMs(): number {
      return randomEventIntervalMs
    },
    setRandomEventIntervalMs(ms: number): void {
      randomEventIntervalMs = ms
    },
    getEffectiveInterval(): number {
      return lowResourceMode
        ? randomEventIntervalMs * LOW_RESOURCE_MULTIPLIER
        : randomEventIntervalMs
    },
    reset(): void {
      lowResourceMode = false
      randomEventIntervalMs = DEFAULT_EVENT_INTERVAL_MS
    },
  }
}
