import assert from 'node:assert/strict'
import test from 'node:test'
import type { CustomCharacterRecord } from './customCharacterManager'
import {
  CUSTOM_CHARACTER_EXPORT_VERSION,
  exportCustomCharactersPackage,
  importCustomCharactersPackage,
  mergeImportedCustomCharacters,
} from './customCharacterTransfer'

const customA: CustomCharacterRecord = {
  id: 'char-1',
  kind: 'custom',
  name: 'Mint Sprite',
  color: '#66d9a3',
  glyph: 'M',
  pixelArt: {
    width: 1,
    height: 1,
    data: [102, 217, 163, 255],
  },
}

const customB: CustomCharacterRecord = {
  id: 'char-2',
  kind: 'custom',
  name: 'Blue Sprite',
  color: '#74c0fc',
  glyph: 'B',
  pixelArt: {
    width: 1,
    height: 1,
    data: [116, 192, 252, 255],
  },
}

test('exports a deterministic versioned custom character package', () => {
  const exported = exportCustomCharactersPackage([customA])
  const parsed = JSON.parse(exported)

  assert.equal(parsed.version, CUSTOM_CHARACTER_EXPORT_VERSION)
  assert.deepEqual(parsed.characters, [customA])
  assert.equal(exported, exportCustomCharactersPackage([customA]))
})

test('imports valid custom character packages using existing validation', () => {
  const exported = exportCustomCharactersPackage([customA, customB])
  const imported = importCustomCharactersPackage(exported)

  assert.deepEqual(imported, [customA, customB])
})

test('returns an empty list for corrupted, unsupported, or invalid packages', () => {
  assert.deepEqual(importCustomCharactersPackage('{bad json'), [])
  assert.deepEqual(importCustomCharactersPackage(JSON.stringify({ version: 999, characters: [customA] })), [])
  assert.deepEqual(importCustomCharactersPackage(JSON.stringify({ version: 1, characters: [{ ...customA, color: 'mint' }] })), [])
})

test('deduplicates imported custom characters by stable id', () => {
  const merged = mergeImportedCustomCharacters([customA], [customA, customB])

  assert.deepEqual(merged.map(character => character.id), ['char-1', 'char-2'])
})
