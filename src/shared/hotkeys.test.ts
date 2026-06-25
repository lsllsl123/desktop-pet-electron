import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createHotkeyController,
  HOTKEYS,
  type HotkeyAdapter,
  type HotkeyAction,
} from './hotkeys'

function createAdapter(failingAccelerators = new Set<string>()): HotkeyAdapter & {
  registrations: string[]
  unregistrations: string[]
  trigger: (accelerator: string) => void
} {
  const callbacks = new Map<string, () => void>()
  return {
    registrations: [],
    unregistrations: [],
    register(accelerator: string, callback: () => void): boolean {
      this.registrations.push(accelerator)
      if (failingAccelerators.has(accelerator)) return false
      callbacks.set(accelerator, callback)
      return true
    },
    unregister(accelerator: string): void {
      this.unregistrations.push(accelerator)
      callbacks.delete(accelerator)
    },
    trigger(accelerator: string): void {
      callbacks.get(accelerator)?.()
    },
  }
}

test('defines a deterministic fixed hotkey catalog for existing pet actions', () => {
  assert.deepEqual(
    HOTKEYS.map(hotkey => hotkey.action),
    ['toggle-window', 'explode', 'next-character'],
  )
  assert.deepEqual(
    HOTKEYS.map(hotkey => hotkey.accelerator),
    ['CommandOrControl+Alt+P', 'CommandOrControl+Alt+E', 'CommandOrControl+Alt+Right'],
  )
})

test('registers known hotkeys and dispatches their actions', () => {
  const adapter = createAdapter()
  const actions: HotkeyAction[] = []
  const controller = createHotkeyController(adapter, action => actions.push(action))

  const result = controller.registerAll(HOTKEYS)
  adapter.trigger('CommandOrControl+Alt+P')
  adapter.trigger('CommandOrControl+Alt+E')

  assert.deepEqual(result, { registered: ['CommandOrControl+Alt+P', 'CommandOrControl+Alt+E', 'CommandOrControl+Alt+Right'], failed: [] })
  assert.deepEqual(adapter.registrations, ['CommandOrControl+Alt+P', 'CommandOrControl+Alt+E', 'CommandOrControl+Alt+Right'])
  assert.deepEqual(actions, ['toggle-window', 'explode'])
})

test('avoids duplicate registration work for already registered accelerators', () => {
  const adapter = createAdapter()
  const controller = createHotkeyController(adapter, () => {})

  controller.registerAll(HOTKEYS)
  const secondResult = controller.registerAll(HOTKEYS)

  assert.deepEqual(secondResult, { registered: [], failed: [] })
  assert.deepEqual(adapter.registrations, ['CommandOrControl+Alt+P', 'CommandOrControl+Alt+E', 'CommandOrControl+Alt+Right'])
})

test('unregisters only accelerators that were successfully registered', () => {
  const adapter = createAdapter(new Set(['CommandOrControl+Alt+E']))
  const controller = createHotkeyController(adapter, () => {})

  const result = controller.registerAll(HOTKEYS)
  controller.unregisterAll()

  assert.deepEqual(result, { registered: ['CommandOrControl+Alt+P', 'CommandOrControl+Alt+Right'], failed: ['CommandOrControl+Alt+E'] })
  assert.deepEqual(adapter.unregistrations, ['CommandOrControl+Alt+P', 'CommandOrControl+Alt+Right'])
})

test('keeps failed adapter registrations out of the active hotkey set', () => {
  const adapter = createAdapter(new Set(['CommandOrControl+Alt+P']))
  const actions: HotkeyAction[] = []
  const controller = createHotkeyController(adapter, action => actions.push(action))

  controller.registerAll(HOTKEYS)
  adapter.trigger('CommandOrControl+Alt+P')
  adapter.trigger('CommandOrControl+Alt+E')

  assert.deepEqual(controller.getRegisteredAccelerators(), ['CommandOrControl+Alt+E', 'CommandOrControl+Alt+Right'])
  assert.deepEqual(actions, ['explode'])
})
