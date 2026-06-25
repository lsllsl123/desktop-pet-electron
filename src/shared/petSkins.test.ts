import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BUILT_IN_PET_SKINS,
  getPetSkinByIndex,
  normalizePetSkinIndex,
} from './petSkins'

test('provides more than the original five built-in skins with stable ids', () => {
  assert.ok(BUILT_IN_PET_SKINS.length > 5)

  const ids = BUILT_IN_PET_SKINS.map(skin => skin.id)
  assert.deepEqual(ids.slice(0, 5), [
    'pixel-cat',
    'pixel-dog',
    'pixel-frog',
    'pixel-panda',
    'pixel-bot',
  ])
  assert.equal(new Set(ids).size, ids.length)
})

test('each built-in skin has a label and visual color metadata', () => {
  for (const skin of BUILT_IN_PET_SKINS) {
    assert.match(skin.label, /\S/)
    assert.match(skin.primaryColor, /^#[0-9a-fA-F]{6}$/)
    assert.match(skin.accentColor, /^#[0-9a-fA-F]{6}$/)
    assert.match(skin.textColor, /^#[0-9a-fA-F]{6}$/)
  }
})

test('gets and normalizes skin indexes safely', () => {
  assert.equal(getPetSkinByIndex(0).id, 'pixel-cat')
  assert.equal(getPetSkinByIndex(BUILT_IN_PET_SKINS.length).id, 'pixel-cat')
  assert.equal(getPetSkinByIndex(-1).id, 'pixel-cat')
  assert.equal(normalizePetSkinIndex(-1), 0)
  assert.equal(normalizePetSkinIndex(999), 0)
  assert.equal(normalizePetSkinIndex(2), 2)
})
