import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createMoodSystem } from './moodSystem'

void describe('moodSystem', () => {
  void describe('createMoodSystem', () => {
    void it('starts with neutral mood (0)', () => {
      const m = createMoodSystem()
      assert.strictEqual(m.getMood(), 0)
    })

    void it('applyMoodEffect changes mood within bounds', () => {
      const m = createMoodSystem()
      m.applyMoodEffect(5)
      assert.strictEqual(m.getMood(), 5)
      m.applyMoodEffect(-3)
      assert.strictEqual(m.getMood(), 2)
    })

    void it('mood is clamped to [-10, 10]', () => {
      const m = createMoodSystem()
      m.applyMoodEffect(20)
      assert.strictEqual(m.getMood(), 10)
      m.applyMoodEffect(-30)
      assert.strictEqual(m.getMood(), -10)
    })

    void it('tick moves mood toward neutral by driftPerTick when positive', () => {
      const m = createMoodSystem()
      m.applyMoodEffect(6) // mood = 6
      m.tick(Date.now(), 1) // drift 1 toward 0
      assert.strictEqual(m.getMood(), 5)
    })

    void it('tick moves mood toward neutral by driftPerTick when negative', () => {
      const m = createMoodSystem()
      m.applyMoodEffect(-6) // mood = -6
      m.tick(Date.now(), 1) // drift 1 toward 0
      assert.strictEqual(m.getMood(), -5)
    })

    void it('tick does not cross zero', () => {
      const m = createMoodSystem()
      m.applyMoodEffect(1) // mood = 1
      m.tick(Date.now(), 3) // would drift to -2 but should stop at 0
      assert.strictEqual(m.getMood(), 0)
    })

    void it('tick with zero drift does not change mood', () => {
      const m = createMoodSystem()
      m.applyMoodEffect(4)
      m.tick(Date.now(), 0)
      assert.strictEqual(m.getMood(), 4)
    })

    void it('getMoodCategory returns expected categories', () => {
      const m = createMoodSystem()

      // happy = mood >= 5
      m.applyMoodEffect(10)
      assert.strictEqual(m.getMoodCategory(), 'happy')

      // neutral = -4..4
      // reset by creating fresh
      const m2 = createMoodSystem()
      assert.strictEqual(m2.getMoodCategory(), 'neutral')

      // sad = mood <= -5
      const m3 = createMoodSystem()
      m3.applyMoodEffect(-10)
      assert.strictEqual(m3.getMoodCategory(), 'sad')
    })

    void it('reset restores mood to 0', () => {
      const m = createMoodSystem()
      m.applyMoodEffect(8)
      assert.notStrictEqual(m.getMood(), 0)
      m.reset()
      assert.strictEqual(m.getMood(), 0)
    })
  })
})
