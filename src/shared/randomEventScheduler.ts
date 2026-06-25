// Phase 2 deterministic random event scheduler.
// Pure functions + state; seeded PRNG for reproducible sequences.

export interface RandomEvent {
  id: string
  text: string
  moodEffect: number
}

export interface BehaviorSettingsSnapshot {
  randomEventIntervalMs: number
  lowResourceMode: boolean
}

export interface BlockState {
  randomEventBlocked: boolean
}

export interface RecentEvent {
  eventTime: number
  eventId: string
}

export interface EventScheduler {
  currentSeed: number
  nextSeed: number
  shouldFire: (
    now: number,
    settings: BehaviorSettingsSnapshot,
    recentEvents: RecentEvent[],
    blockState: BlockState,
  ) => boolean
  pickEvent: (events: RandomEvent[]) => RandomEvent
}

/** Simple LCG PRNG: returns next integer in [0, 2^31). Advances state. */
function lcg(seed: number): number {
  return (seed * 1664525 + 1013904223) & 0x7fffffff
}

export function createRandomEventScheduler(seed: number): EventScheduler {
  let currentSeed = Math.floor(seed) || 1

  return {
    get currentSeed() {
      return currentSeed
    },
    get nextSeed() {
      return lcg(currentSeed)
    },

    shouldFire(
      now: number,
      settings: BehaviorSettingsSnapshot,
      recentEvents: RecentEvent[],
      blockState: BlockState,
    ): boolean {
      if (blockState.randomEventBlocked) return false

      const effectiveInterval = settings.lowResourceMode
        ? settings.randomEventIntervalMs * 3
        : settings.randomEventIntervalMs

      if (recentEvents.length === 0) {
        // No recent events: use seeded jitter so the first event is not immediate.
        const r = lcg(currentSeed) % effectiveInterval
        return (r % 100) < 30
      }

      // Find the most recent event time
      const latest = recentEvents.reduce((max, e) => Math.max(max, e.eventTime), 0)
      return now - latest >= effectiveInterval
    },

    pickEvent(events: RandomEvent[]): RandomEvent {
      if (events.length === 0) {
        throw new Error('Cannot pick a random event from an empty event pool.')
      }
      currentSeed = lcg(currentSeed)
      const idx = currentSeed % events.length
      return events[idx]
    },
  }
}
