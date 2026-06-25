// Phase 3 Deferred Slice 2: deterministic shared explosion style catalog.
// Pure module: no DOM, no timers, no side effects.
// Each style has a stable id, label, and particle config metadata.

export interface ExplosionStyle {
  id: string
  label: string
  config: {
    count: number
    speed: number
    size: number
    lifetime: number
    hueStart: number
    hueEnd: number
  }
}

export const EXPLOSION_STYLES: ExplosionStyle[] = [
  {
    id: 'burst',
    label: 'Burst',
    config: {
      count: 24,
      speed: 4,
      size: 6,
      lifetime: 30,
      hueStart: 0,
      hueEnd: 360,
    },
  },
  {
    id: 'sparkle',
    label: 'Sparkle',
    config: {
      count: 40,
      speed: 2.5,
      size: 3,
      lifetime: 45,
      hueStart: 180,
      hueEnd: 300,
    },
  },
  {
    id: 'nova',
    label: 'Nova',
    config: {
      count: 60,
      speed: 6,
      size: 8,
      lifetime: 50,
      hueStart: 0,
      hueEnd: 60,
    },
  },
]

export interface ExplosionConfigInput {
  centerX: number
  centerY: number
}

/** Resolve an explosion style by id, falling back to the first style ('burst'). */
export function getExplosionStyleById(id: string): ExplosionStyle {
  return EXPLOSION_STYLES.find(style => style.id === id) ?? EXPLOSION_STYLES[0]
}

/**
 * Resolve a deterministic ExplosionConfig-compatible object from a style id and center point.
 * Returns a new object each call with the same inputs (deterministic).
 */
export function resolveExplosionConfig(
  styleId: string,
  center: ExplosionConfigInput,
): {
  centerX: number
  centerY: number
  count: number
  speed: number
  size: number
  lifetime: number
  hueStart: number
  hueEnd: number
} {
  const style = getExplosionStyleById(styleId)
  return {
    centerX: center.centerX,
    centerY: center.centerY,
    count: style.config.count,
    speed: style.config.speed,
    size: style.config.size,
    lifetime: style.config.lifetime,
    hueStart: style.config.hueStart,
    hueEnd: style.config.hueEnd,
  }
}
