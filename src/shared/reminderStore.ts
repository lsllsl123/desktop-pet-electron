// Phase 2 Deferred Slice 2: lightweight local todo reminder store.
// Pure deterministic module: no DOM, no timers, no side effects.

export interface Reminder {
  id: string
  text: string
  dueAtMs: number
  completed: boolean
}

export interface ReminderStore {
  addReminder: (text: string, dueAtMs: number) => Reminder
  getPending: () => Reminder[]
  getDue: (nowMs: number) => Reminder[]
  markComplete: (id: string) => boolean
  getAll: () => Reminder[]
}

interface ReminderStoreOptions {
  seed: string
}

export function createReminderStore(
  initial: Reminder[] = [],
  options?: ReminderStoreOptions,
): ReminderStore {
  const seed = options?.seed ?? 'r'
  const reminders: Reminder[] = initial.map(r => ({ ...r }))
  let counter = 0

  function nextId(): string {
    counter += 1
    return `${seed}-${counter}`
  }

  function addReminder(text: string, dueAtMs: number): Reminder {
    const trimmed = text.trim()
    if (trimmed.length === 0) {
      throw new Error('text is required')
    }
    if (!Number.isFinite(dueAtMs)) {
      throw new Error('due time must be finite')
    }

    const reminder: Reminder = {
      id: nextId(),
      text: trimmed,
      dueAtMs,
      completed: false,
    }
    reminders.push(reminder)
    return { ...reminder }
  }

  function getPending(): Reminder[] {
    return reminders
      .filter(r => !r.completed)
      .map(r => ({ ...r }))
  }

  function getDue(nowMs: number): Reminder[] {
    return reminders
      .filter(r => !r.completed && r.dueAtMs <= nowMs)
      .sort((a, b) => a.dueAtMs - b.dueAtMs)
      .map(r => ({ ...r }))
  }

  function markComplete(id: string): boolean {
    const found = reminders.find(r => r.id === id)
    if (!found) return false
    found.completed = true
    return true
  }

  function getAll(): Reminder[] {
    return reminders.map(r => ({ ...r }))
  }

  return { addReminder, getPending, getDue, markComplete, getAll }
}

export function serializeReminders(reminders: Reminder[]): string {
  return JSON.stringify(reminders)
}

export function deserializeReminders(raw: string): Reminder[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Validate each item is a proper Reminder.
    return parsed.filter(
      (item: unknown) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Reminder).id === 'string' &&
        typeof (item as Reminder).text === 'string' &&
        typeof (item as Reminder).dueAtMs === 'number' &&
        typeof (item as Reminder).completed === 'boolean',
    ) as Reminder[]
  } catch {
    return []
  }
}
