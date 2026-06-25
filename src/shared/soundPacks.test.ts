import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BUILT_IN_SOUND_PACKS,
  getSoundPackById,
  resolveSoundCommand,
} from './soundPacks'

test('provides multiple deterministic sound packs with stable ids', () => {
  assert.ok(BUILT_IN_SOUND_PACKS.length > 1)
  assert.deepEqual(BUILT_IN_SOUND_PACKS.map(pack => pack.id), [
    'mute',
    'blip',
    'chime',
  ])
})

test('each sound pack has a label and event-to-tone metadata', () => {
  for (const pack of BUILT_IN_SOUND_PACKS) {
    assert.match(pack.label, /\S/)
    for (const eventName of ['click', 'switch', 'explode', 'reminder'] as const) {
      const tone = pack.events[eventName]
      assert.ok(tone.durationMs >= 0)
      assert.ok(tone.gain >= 0)
      assert.ok(tone.frequencyHz >= 0)
    }
  }
})

test('resolves pack ids with safe fallback', () => {
  assert.equal(getSoundPackById('chime').id, 'chime')
  assert.equal(getSoundPackById('missing').id, 'mute')
})

test('resolves deterministic tone command for pack and event', () => {
  const first = resolveSoundCommand('blip', 'explode')
  const second = resolveSoundCommand('blip', 'explode')

  assert.deepEqual(first, second)
  assert.equal(first.enabled, true)
  assert.equal(first.frequencyHz, getSoundPackById('blip').events.explode.frequencyHz)
})

test('mute pack resolves to disabled commands', () => {
  const command = resolveSoundCommand('mute', 'click')

  assert.equal(command.enabled, false)
  assert.equal(command.gain, 0)
  assert.equal(command.durationMs, 0)
})
