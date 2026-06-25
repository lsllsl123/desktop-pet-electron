// Phase 2 hidden mood system.
// Mood is an integer in [-10, 10]. Drifts toward 0 over time.
// Not exposed as raw numeric UI.

export type MoodCategory = 'happy' | 'neutral' | 'sad'

export interface MoodSystem {
  getMood: () => number
  applyMoodEffect: (delta: number) => void
  tick: (now: number, driftPerTick: number) => void
  getMoodCategory: () => MoodCategory
  reset: () => void
}

export function createMoodSystem(): MoodSystem {
  let mood = 0

  return {
    getMood(): number {
      return mood
    },

    applyMoodEffect(delta: number): void {
      mood = Math.max(-10, Math.min(10, mood + delta))
    },

    tick(_now: number, driftPerTick: number): void {
      if (mood > 0) {
        mood = Math.max(0, mood - driftPerTick)
      } else if (mood < 0) {
        mood = Math.min(0, mood + driftPerTick)
      }
    },

    getMoodCategory(): MoodCategory {
      if (mood >= 5) return 'happy'
      if (mood <= -5) return 'sad'
      return 'neutral'
    },

    reset(): void {
      mood = 0
    },
  }
}
