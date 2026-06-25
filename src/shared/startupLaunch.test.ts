import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createStartupLaunchController,
  type StartupLaunchAdapter,
} from './startupLaunch'

function createAdapter(initialEnabled = false): StartupLaunchAdapter & { writes: boolean[] } {
  let enabled = initialEnabled
  const writes: boolean[] = []
  return {
    writes,
    getOpenAtLogin: () => enabled,
    setOpenAtLogin: (nextEnabled: boolean) => {
      writes.push(nextEnabled)
      enabled = nextEnabled
    },
  }
}

test('reads current launch-at-login state from the adapter', () => {
  const adapter = createAdapter(true)
  const controller = createStartupLaunchController(adapter)

  assert.equal(controller.getEnabled(), true)
  assert.deepEqual(adapter.writes, [])
})

test('enables and disables launch-at-login through the adapter', () => {
  const adapter = createAdapter(false)
  const controller = createStartupLaunchController(adapter)

  assert.equal(controller.setEnabled(true), true)
  assert.equal(controller.getEnabled(), true)
  assert.equal(controller.setEnabled(false), false)
  assert.equal(controller.getEnabled(), false)
  assert.deepEqual(adapter.writes, [true, false])
})

test('toggles launch-at-login state', () => {
  const adapter = createAdapter(false)
  const controller = createStartupLaunchController(adapter)

  assert.equal(controller.toggle(), true)
  assert.equal(controller.toggle(), false)
  assert.deepEqual(adapter.writes, [true, false])
})

test('avoids redundant adapter writes when requested state already matches', () => {
  const adapter = createAdapter(true)
  const controller = createStartupLaunchController(adapter)

  assert.equal(controller.setEnabled(true), true)

  assert.deepEqual(adapter.writes, [])
})

test('uses current adapter state before set and toggle operations', () => {
  let enabled = false
  const writes: boolean[] = []
  const adapter: StartupLaunchAdapter = {
    getOpenAtLogin: () => enabled,
    setOpenAtLogin: (nextEnabled: boolean) => {
      writes.push(nextEnabled)
      enabled = nextEnabled
    },
  }
  const controller = createStartupLaunchController(adapter)

  enabled = true
  assert.equal(controller.setEnabled(true), true)
  assert.deepEqual(writes, [])

  assert.equal(controller.toggle(), false)
  assert.deepEqual(writes, [false])
})

test('propagates adapter failures and keeps later reads delegated', () => {
  let enabled = false
  const adapter: StartupLaunchAdapter = {
    getOpenAtLogin: () => enabled,
    setOpenAtLogin: () => {
      throw new Error('adapter failed')
    },
  }
  const controller = createStartupLaunchController(adapter)

  assert.throws(() => controller.setEnabled(true), /adapter failed/)
  enabled = true
  assert.equal(controller.getEnabled(), true)
})
