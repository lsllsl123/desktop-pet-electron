import assert from 'node:assert/strict'
import test from 'node:test'
import {
  EXPLOSION_STYLES,
  getExplosionStyleById,
  resolveExplosionConfig,
} from './explosionStyles'

test('provides multiple deterministic explosion styles with stable ids', () => {
  assert.ok(EXPLOSION_STYLES.length > 1)
  assert.deepEqual(EXPLOSION_STYLES.map(style => style.id), [
    'burst',
    'sparkle',
    'nova',
  ])
})

test('each explosion style has a label and particle config metadata', () => {
  for (const style of EXPLOSION_STYLES) {
    assert.match(style.label, /\S/)
    assert.ok(style.config.count > 0)
    assert.ok(style.config.speed > 0)
    assert.ok(style.config.size > 0)
    assert.ok(style.config.lifetime > 0)
    assert.ok(style.config.hueStart >= 0)
    assert.ok(style.config.hueEnd >= style.config.hueStart)
  }
})

test('resolves style ids with safe fallback', () => {
  assert.equal(getExplosionStyleById('sparkle').id, 'sparkle')
  assert.equal(getExplosionStyleById('missing').id, 'burst')
})

test('resolves deterministic explosion config with requested center point', () => {
  const first = resolveExplosionConfig('nova', { centerX: 12, centerY: 34 })
  const second = resolveExplosionConfig('nova', { centerX: 12, centerY: 34 })

  assert.deepEqual(first, second)
  assert.equal(first.centerX, 12)
  assert.equal(first.centerY, 34)
  assert.equal(first.count, getExplosionStyleById('nova').config.count)
})
