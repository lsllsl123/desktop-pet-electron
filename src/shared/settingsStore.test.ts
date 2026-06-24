import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { SettingsStore, PetSettings } from './settingsStore'

void describe('SettingsStore', () => {
  let store: SettingsStore
  let map: Map<string, string>

  beforeEach(() => {
    map = new Map<string, string>()
    const backend = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => { map.set(k, v) },
      removeItem: (k: string) => { map.delete(k) },
    }
    store = new SettingsStore(backend)
  })

  void it('returns default charIndex of 0', () => {
    assert.strictEqual(store.get('charIndex'), 0)
  })

  void it('returns default windowX of null', () => {
    assert.strictEqual(store.get('windowX'), null)
  })

  void it('returns default windowY of null', () => {
    assert.strictEqual(store.get('windowY'), null)
  })

  void it('set and get a value', () => {
    store.set('charIndex', 3)
    assert.strictEqual(store.get('charIndex'), 3)
  })

  void it('persists to backend after set', () => {
    store.set('charIndex', 2)
    const raw = map.get('desktop-pet-settings')
    assert.ok(raw)
    const parsed = JSON.parse(raw)
    assert.strictEqual(parsed.charIndex, 2)
  })

  void it('loads persisted data from backend', () => {
    map.set('desktop-pet-settings', JSON.stringify({ charIndex: 4 }))
    const store2 = new SettingsStore({
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => { map.set(k, v) },
      removeItem: (k: string) => { map.delete(k) },
    })
    assert.strictEqual(store2.get('charIndex'), 4)
  })

  void it('resets all values to defaults', () => {
    store.set('charIndex', 4)
    store.set('windowX', 500)
    store.reset()
    assert.strictEqual(store.get('charIndex'), 0)
    assert.strictEqual(store.get('windowX'), null)
    assert.strictEqual(store.get('windowY'), null)
  })

  void it('returns full settings snapshot via getAll', () => {
    store.set('charIndex', 1)
    store.set('windowX', 200)
    const all = store.getAll()
    assert.deepStrictEqual(all, { charIndex: 1, windowX: 200, windowY: null })
  })

  void it('handles corrupted JSON gracefully', () => {
    map.set('desktop-pet-settings', '{corrupted')
    const store2 = new SettingsStore({
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => { map.set(k, v) },
      removeItem: (k: string) => { map.delete(k) },
    })
    assert.strictEqual(store2.get('charIndex'), 0)
  })

  void it('uses a working in-memory backend when no backend is supplied', () => {
    const storeWithoutBackend = new SettingsStore()
    storeWithoutBackend.set('charIndex', 2)
    assert.strictEqual(storeWithoutBackend.get('charIndex'), 2)
  })
})
