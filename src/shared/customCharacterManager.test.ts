import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createCustomCharacterManager,
  deserializeCustomCharacters,
  serializeCustomCharacters,
  type BuiltInCharacter,
  type CustomCharacterInput,
} from './customCharacterManager'

const builtIns: BuiltInCharacter[] = [
  { id: 'builtin-cat', name: 'Pixel Cat', color: '#ff8fab', glyph: '1' },
  { id: 'builtin-dog', name: 'Pixel Dog', color: '#74c0fc', glyph: '2' },
]

const customInput: CustomCharacterInput = {
  name: 'Mint Sprite',
  color: '#66d9a3',
  glyph: 'M',
  pixelArt: {
    width: 2,
    height: 1,
    data: [102, 217, 163, 255, 30, 120, 80, 255],
  },
}

test('lists built-in and custom characters together with deterministic custom ids', () => {
  const manager = createCustomCharacterManager(builtIns, [], { seed: 'char' })

  const custom = manager.addCustomCharacter(customInput)

  assert.equal(custom.id, 'char-1')
  assert.equal(custom.kind, 'custom')
  assert.deepEqual(
    manager.listCharacters().map(character => character.id),
    ['builtin-cat', 'builtin-dog', 'char-1'],
  )
})

test('continues deterministic ids after initial custom records', () => {
  const initialManager = createCustomCharacterManager(builtIns, [], { seed: 'char' })
  const initialCustom = initialManager.addCustomCharacter(customInput)
  const manager = createCustomCharacterManager(builtIns, [initialCustom], { seed: 'char' })

  const nextCustom = manager.addCustomCharacter({ ...customInput, name: 'Blue Sprite' })

  assert.equal(nextCustom.id, 'char-2')
  assert.deepEqual(
    manager.listCustomCharacters().map(character => character.id),
    ['char-1', 'char-2'],
  )
})

test('selects built-in and custom characters by stable id', () => {
  const manager = createCustomCharacterManager(builtIns, [], { seed: 'char' })
  const custom = manager.addCustomCharacter(customInput)

  assert.equal(manager.selectCharacter('builtin-dog'), true)
  assert.equal(manager.getSelectedCharacter()?.id, 'builtin-dog')

  assert.equal(manager.selectCharacter(custom.id), true)
  assert.equal(manager.getSelectedCharacter()?.id, custom.id)
  assert.equal(manager.selectCharacter('missing'), false)
})

test('removes custom characters and protects built-ins from removal', () => {
  const manager = createCustomCharacterManager(builtIns, [], { seed: 'char' })
  const custom = manager.addCustomCharacter(customInput)
  manager.selectCharacter(custom.id)

  assert.equal(manager.removeCustomCharacter('builtin-cat'), false)
  assert.equal(manager.removeCustomCharacter(custom.id), true)

  assert.deepEqual(manager.listCharacters().map(character => character.id), ['builtin-cat', 'builtin-dog'])
  assert.equal(manager.getSelectedCharacter()?.id, 'builtin-cat')
})

test('returns defensive copies of built-in and custom character records', () => {
  const manager = createCustomCharacterManager(builtIns, [], { seed: 'char' })
  const custom = manager.addCustomCharacter(customInput)

  const listed = manager.listCharacters()
  listed[0].name = 'Changed Cat'
  const listedCustom = listed.find(character => character.id === custom.id)
  assert.ok(listedCustom && 'pixelArt' in listedCustom)
  listedCustom.pixelArt.data[0] = 0

  const fresh = manager.listCharacters()
  assert.equal(fresh[0].name, 'Pixel Cat')
  const freshCustom = manager.listCustomCharacters()[0]
  assert.equal(freshCustom.pixelArt.data[0], 102)
})

test('serializes and deserializes custom character records safely', () => {
  const manager = createCustomCharacterManager(builtIns, [], { seed: 'char' })
  const custom = manager.addCustomCharacter(customInput)

  const serialized = serializeCustomCharacters(manager.listCustomCharacters())
  const restored = deserializeCustomCharacters(serialized)

  assert.deepEqual(restored, [custom])
})

test('rejects invalid custom character input and corrupted serialized data', () => {
  const manager = createCustomCharacterManager(builtIns, [], { seed: 'char' })

  assert.throws(
    () => manager.addCustomCharacter({ ...customInput, name: '   ' }),
    /name is required/,
  )
  assert.throws(
    () => manager.addCustomCharacter({ ...customInput, color: 'mint' }),
    /color must be a hex color/,
  )
  assert.throws(
    () => manager.addCustomCharacter({ ...customInput, glyph: 'AB' }),
    /glyph must be a single printable character/,
  )
  assert.throws(
    () => manager.addCustomCharacter({
      ...customInput,
      pixelArt: { width: 2, height: 1, data: [0, 0, 0, 255] },
    }),
    /pixelArt data length must equal width \* height \* 4/,
  )
  assert.throws(
    () => manager.addCustomCharacter({
      ...customInput,
      pixelArt: { width: 0, height: 1, data: [] },
    }),
    /pixelArt width and height must be positive integers/,
  )
  assert.throws(
    () => manager.addCustomCharacter({
      ...customInput,
      pixelArt: { width: 1, height: 1, data: [0, 0, 0, 300] },
    }),
    /pixelArt channels must be integer values from 0 to 255/,
  )
  assert.deepEqual(deserializeCustomCharacters('{bad json'), [])
  assert.deepEqual(
    deserializeCustomCharacters(JSON.stringify([
      { id: 'bad', kind: 'custom', name: '', color: 'mint', glyph: 'AB', pixelArt: { width: 1, height: 1, data: [0] } },
    ])),
    [],
  )
})
