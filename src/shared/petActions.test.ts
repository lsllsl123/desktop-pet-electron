import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPetActionRegistry,
  PET_ACTIONS,
  type PetActionHandlerMap,
  type PetActionId,
} from './petActions'

function createHandlers(calls: PetActionId[] = []): PetActionHandlerMap {
  return {
    'toggle-window': () => { calls.push('toggle-window') },
    explode: () => { calls.push('explode') },
    'next-character': () => { calls.push('next-character') },
  }
}

test('defines a deterministic built-in action catalog for existing pet actions', () => {
  assert.deepEqual(
    PET_ACTIONS.map(action => action.id),
    ['toggle-window', 'explode', 'next-character'],
  )
  assert.deepEqual(
    PET_ACTIONS.map(action => action.label),
    ['Toggle Window', 'Explode', 'Next Character'],
  )
})

test('lists built-in actions as defensive copies in stable order', () => {
  const registry = createPetActionRegistry(createHandlers())

  const first = registry.listActions()
  first[0].label = 'Changed'

  assert.deepEqual(
    registry.listActions().map(action => action.label),
    ['Toggle Window', 'Explode', 'Next Character'],
  )
})

test('dispatches known actions through injected handlers', () => {
  const calls: PetActionId[] = []
  const registry = createPetActionRegistry(createHandlers(calls))

  assert.deepEqual(registry.dispatch('toggle-window'), { ok: true, actionId: 'toggle-window' })
  assert.deepEqual(registry.dispatch('explode'), { ok: true, actionId: 'explode' })

  assert.deepEqual(calls, ['toggle-window', 'explode'])
})

test('returns a safe result for unknown action ids', () => {
  const calls: PetActionId[] = []
  const registry = createPetActionRegistry(createHandlers(calls))

  assert.deepEqual(registry.dispatch('missing-action'), {
    ok: false,
    actionId: 'missing-action',
    reason: 'unknown_action',
  })
  assert.deepEqual(calls, [])
})

test('rejects handler keys that are not in the built-in action catalog', () => {
  const calls: string[] = []
  const registry = createPetActionRegistry({
    ...createHandlers(),
    'external-action': () => { calls.push('external-action') },
  })

  assert.deepEqual(registry.dispatch('external-action'), {
    ok: false,
    actionId: 'external-action',
    reason: 'unknown_action',
  })
  assert.deepEqual(calls, [])
})

test('returns a safe result when a known action handler fails', () => {
  const registry = createPetActionRegistry({
    ...createHandlers(),
    explode: () => { throw new Error('boom') },
  })

  assert.deepEqual(registry.dispatch('explode'), {
    ok: false,
    actionId: 'explode',
    reason: 'handler_failed',
  })
})
