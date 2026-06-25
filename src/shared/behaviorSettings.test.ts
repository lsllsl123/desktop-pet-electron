import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createBehaviorSettings, LOW_RESOURCE_MULTIPLIER, DEFAULT_EVENT_INTERVAL_MS } from './behaviorSettings'

void describe('behaviorSettings', () => {
  void describe('createBehaviorSettings', () => {
    void it('returns default lowResourceMode as false', () => {
      const b = createBehaviorSettings()
      assert.strictEqual(b.getLowResourceMode(), false)
    })

    void it('returns default randomEventIntervalMs as DEFAULT_EVENT_INTERVAL_MS', () => {
      const b = createBehaviorSettings()
      assert.strictEqual(b.getRandomEventIntervalMs(), DEFAULT_EVENT_INTERVAL_MS)
    })

    void it('setLowResourceMode toggles the flag', () => {
      const b = createBehaviorSettings()
      b.setLowResourceMode(true)
      assert.strictEqual(b.getLowResourceMode(), true)
      b.setLowResourceMode(false)
      assert.strictEqual(b.getLowResourceMode(), false)
    })

    void it('setRandomEventIntervalMs overrides the interval', () => {
      const b = createBehaviorSettings()
      b.setRandomEventIntervalMs(5000)
      assert.strictEqual(b.getRandomEventIntervalMs(), 5000)
    })

    void it('getEffectiveInterval multiplies interval in low-resource mode', () => {
      const b = createBehaviorSettings()
      b.setRandomEventIntervalMs(1000)
      const normal = b.getEffectiveInterval()
      assert.strictEqual(normal, 1000)

      b.setLowResourceMode(true)
      const lowRes = b.getEffectiveInterval()
      assert.strictEqual(lowRes, 1000 * LOW_RESOURCE_MULTIPLIER)

      b.setLowResourceMode(false)
      const backToNormal = b.getEffectiveInterval()
      assert.strictEqual(backToNormal, 1000)
    })

    void it('reset restores defaults', () => {
      const b = createBehaviorSettings()
      b.setLowResourceMode(true)
      b.setRandomEventIntervalMs(999)
      b.reset()
      assert.strictEqual(b.getLowResourceMode(), false)
      assert.strictEqual(b.getRandomEventIntervalMs(), DEFAULT_EVENT_INTERVAL_MS)
    })
  })
})
