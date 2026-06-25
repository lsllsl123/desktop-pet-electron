import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createReminderStore,
  deserializeReminders,
  serializeReminders,
} from './reminderStore'

test('adds a pending reminder with deterministic id and due time', () => {
  const store = createReminderStore([], { seed: 'r' })

  const reminder = store.addReminder('Drink water', 1_000)

  assert.equal(reminder.id, 'r-1')
  assert.equal(reminder.text, 'Drink water')
  assert.equal(reminder.dueAtMs, 1_000)
  assert.equal(reminder.completed, false)
  assert.deepEqual(store.getPending().map(item => item.id), ['r-1'])
})

test('uses an independent id sequence for each store instance', () => {
  const firstStore = createReminderStore([], { seed: 'r' })
  const secondStore = createReminderStore([], { seed: 'r' })

  firstStore.addReminder('First', 1_000)
  const reminder = secondStore.addReminder('Second', 2_000)

  assert.equal(reminder.id, 'r-1')
})

test('rejects empty reminder text', () => {
  const store = createReminderStore([], { seed: 'r' })

  assert.throws(() => store.addReminder('   ', 1_000), /text is required/)
})

test('rejects non-finite due time', () => {
  const store = createReminderStore([], { seed: 'r' })

  assert.throws(() => store.addReminder('Stretch', Number.NaN), /due time must be finite/)
})

test('returns due reminders in due-time order', () => {
  const store = createReminderStore([], { seed: 'r' })
  store.addReminder('Later', 5_000)
  store.addReminder('Now', 1_000)

  const due = store.getDue(2_000)

  assert.deepEqual(due.map(item => item.text), ['Now'])
})

test('markComplete removes reminder from pending and due lists', () => {
  const store = createReminderStore([], { seed: 'r' })
  const reminder = store.addReminder('Stand up', 1_000)

  assert.equal(store.markComplete(reminder.id), true)

  assert.deepEqual(store.getPending(), [])
  assert.deepEqual(store.getDue(2_000), [])
})

test('markComplete returns false for unknown reminder id', () => {
  const store = createReminderStore([], { seed: 'r' })

  assert.equal(store.markComplete('missing'), false)
})

test('serializes and deserializes reminders safely', () => {
  const store = createReminderStore([], { seed: 'r' })
  const first = store.addReminder('Review notes', 2_000)
  store.markComplete(first.id)
  store.addReminder('Walk', 3_000)

  const serialized = serializeReminders(store.getAll())
  const restored = deserializeReminders(serialized)

  assert.deepEqual(restored, store.getAll())
})

test('deserializes corrupted reminder data to an empty list', () => {
  assert.deepEqual(deserializeReminders('{bad json'), [])
})
