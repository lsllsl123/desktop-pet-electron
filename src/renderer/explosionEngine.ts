// Phase 1 deterministic particle explosion engine.
// Generates an array of particles: no randomness, no side effects.

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  maxLife: number
}

export interface ExplosionConfig {
  centerX: number
  centerY: number
  count: number
  speed: number
  size: number
  lifetime: number
  hueStart: number
  hueEnd: number
}

const DEFAULT_CONFIG: ExplosionConfig = {
  centerX: 0,
  centerY: 0,
  count: 24,
  speed: 4,
  size: 6,
  lifetime: 30,
  hueStart: 0,
  hueEnd: 360,
}

export function createExplosion(config: Partial<ExplosionConfig> = {}): Particle[] {
  const cfg: ExplosionConfig = { ...DEFAULT_CONFIG, ...config }
  const particles: Particle[] = []

  for (let i = 0; i < cfg.count; i++) {
    const angle = (i / cfg.count) * Math.PI * 2
    const speedVariation = 0.5 + ((i * 7 + 13) % 100) / 100
    const particleSpeed = cfg.speed * speedVariation
    const t = i / Math.max(cfg.count - 1, 1)
    const hue = Math.round(cfg.hueStart + (cfg.hueEnd - cfg.hueStart) * t)

    particles.push({
      x: cfg.centerX,
      y: cfg.centerY,
      vx: Math.cos(angle) * particleSpeed,
      vy: Math.sin(angle) * particleSpeed,
      size: cfg.size,
      color: `hsl(${hue}, 100%, 60%)`,
      life: cfg.lifetime,
      maxLife: cfg.lifetime,
    })
  }

  return particles
}

export function tickParticles(particles: readonly Particle[]): Particle[] {
  const result: Particle[] = []
  for (const particle of particles) {
    if (particle.life <= 0) continue
    result.push({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vy: particle.vy + 0.15,
      life: particle.life - 1,
    })
  }
  return result
}
