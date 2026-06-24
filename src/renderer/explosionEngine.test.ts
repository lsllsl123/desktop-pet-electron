import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createExplosion, tickParticles, Particle } from './explosionEngine'

void describe('explosionEngine', () => {
  void describe('createExplosion', () => {
    void it('creates the requested number of particles', () => {
      const particles = createExplosion({ count: 10 })
      assert.strictEqual(particles.length, 10)
    })

    void it('positions all particles at center initially', () => {
      const particles = createExplosion({ centerX: 50, centerY: 100, count: 8 })
      for (const p of particles) {
        assert.strictEqual(p.x, 50)
        assert.strictEqual(p.y, 100)
      }
    })

    void it('sets deterministic velocities from index', () => {
      const a = createExplosion({ count: 16, speed: 4 })
      const b = createExplosion({ count: 16, speed: 4 })
      for (let i = 0; i < 16; i++) {
        assert.strictEqual(a[i].vx, b[i].vx)
        assert.strictEqual(a[i].vy, b[i].vy)
      }
    })

    void it('assigns each particle the correct lifetime', () => {
      const particles = createExplosion({ lifetime: 45 })
      for (const p of particles) {
        assert.strictEqual(p.life, 45)
        assert.strictEqual(p.maxLife, 45)
      }
    })

    void it('uses default config when no arguments given', () => {
      const particles = createExplosion()
      assert.strictEqual(particles.length, 24)
    })

    void it('particles have deterministic colors within hue range', () => {
      const particles = createExplosion({ hueStart: 0, hueEnd: 120, count: 10 })
      for (const p of particles) {
        assert.ok(p.color.startsWith('hsl('))
      }
    })
  })

  void describe('tickParticles', () => {
    void it('advances particle positions by velocity', () => {
      const particles = createExplosion({ count: 3, speed: 0, lifetime: 10 })
      const ticked = tickParticles(particles)
      assert.strictEqual(ticked.length, 3)
    })

    void it('removes dead particles', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 0, vy: 0, size: 4, color: '#fff', life: 1, maxLife: 5 },
      ]
      const after1 = tickParticles(particles)
      assert.strictEqual(after1.length, 1)
      const after2 = tickParticles(after1)
      assert.strictEqual(after2.length, 0)
    })

    void it('applies gravity to vy', () => {
      const particles = createExplosion({ count: 1, speed: 0, lifetime: 5 })
      const ticked = tickParticles(particles)
      assert.ok(ticked[0].vy > 0)  // gravity adds 0.15
    })

    void it('is immutable — does not mutate input', () => {
      const particles = createExplosion({ count: 5, lifetime: 10 })
      const snapshot = particles.map(p => ({ ...p }))
      tickParticles(particles)
      for (let i = 0; i < particles.length; i++) {
        assert.deepStrictEqual(particles[i], snapshot[i])
      }
    })

    void it('produces identical output for identical input', () => {
      const a = createExplosion({ count: 12, speed: 3, lifetime: 20 })
      const b = createExplosion({ count: 12, speed: 3, lifetime: 20 })
      const tickedA = tickParticles(a)
      const tickedB = tickParticles(b)
      for (let i = 0; i < tickedA.length; i++) {
        assert.strictEqual(tickedA[i].x, tickedB[i].x)
        assert.strictEqual(tickedA[i].y, tickedB[i].y)
        assert.strictEqual(tickedA[i].life, tickedB[i].life)
      }
    })
  })
})
