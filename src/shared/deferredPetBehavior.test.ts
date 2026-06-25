import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateDeferredPetBehavior,
  recoverDizziness,
  type DeferredPetBehaviorInput,
} from './deferredPetBehavior'

const baseInput: DeferredPetBehaviorInput = {
  nowMs: 10_000,
  lastInteractionAtMs: 0,
  petState: 'idle',
  petCenter: { x: 120, y: 120 },
  cursor: { x: 160, y: 120 },
  viewport: { width: 300, height: 240 },
  drag: null,
  lowResourceMode: false,
}

test('sleeps after idle threshold when not blocked', () => {
  const behavior = calculateDeferredPetBehavior({
    ...baseInput,
    sleepAfterMs: 8_000,
  })

  assert.equal(behavior.sleeping, true)
  assert.equal(behavior.speech, 'Zzz')
})

test('does not sleep while dragging or exploding', () => {
  const behavior = calculateDeferredPetBehavior({
    ...baseInput,
    sleepAfterMs: 8_000,
    petState: 'dragging',
  })

  assert.equal(behavior.sleeping, false)
})

test('peeks toward a nearby cursor while awake', () => {
  const behavior = calculateDeferredPetBehavior({
    ...baseInput,
    lastInteractionAtMs: 9_500,
    cursorPeekRadius: 80,
  })

  assert.equal(behavior.peekDirection, 'right')
})

test('suppresses cursor peeking in low-resource mode', () => {
  const behavior = calculateDeferredPetBehavior({
    ...baseInput,
    lastInteractionAtMs: 9_500,
    cursorPeekRadius: 80,
    lowResourceMode: true,
  })

  assert.equal(behavior.peekDirection, 'none')
})

test('nudges away from viewport edges', () => {
  const behavior = calculateDeferredPetBehavior({
    ...baseInput,
    petCenter: { x: 8, y: 230 },
    edgeMarginPx: 16,
    edgeNudgePx: 6,
  })

  assert.deepEqual(behavior.edgeNudge, { x: 6, y: -6 })
})

test('converts fast drag into bounded dizziness', () => {
  const behavior = calculateDeferredPetBehavior({
    ...baseInput,
    drag: {
      distancePx: 300,
      durationMs: 500,
    },
  })

  assert.equal(behavior.dizziness, 10)
  assert.equal(behavior.speech, 'Whoa...')
})

test('dizziness recovery moves toward zero without crossing it', () => {
  assert.equal(recoverDizziness(8, 3), 5)
  assert.equal(recoverDizziness(2, 3), 0)
  assert.equal(recoverDizziness(0, 3), 0)
})
