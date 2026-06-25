// Phase 3 Deferred Slice 5: deterministic fixed hotkey catalog with
// testable injected-adapter registration controller.

export type HotkeyAction = 'toggle-window' | 'explode' | 'next-character'

export interface HotkeyDefinition {
  action: HotkeyAction
  accelerator: string
}

/** Deterministic fixed hotkey catalog mapping existing pet actions. */
export const HOTKEYS: readonly HotkeyDefinition[] = Object.freeze([
  { action: 'toggle-window', accelerator: 'CommandOrControl+Alt+P' },
  { action: 'explode', accelerator: 'CommandOrControl+Alt+E' },
  { action: 'next-character', accelerator: 'CommandOrControl+Alt+Right' },
])

/** Injected Electron/globalShortcut-style adapter. */
export interface HotkeyAdapter {
  register: (accelerator: string, callback: () => void) => boolean
  unregister: (accelerator: string) => void
}

export interface RegisterAllResult {
  registered: string[]
  failed: string[]
}

export interface HotkeyController {
  registerAll: (defs: readonly HotkeyDefinition[]) => RegisterAllResult
  unregisterAll: () => void
  getRegisteredAccelerators: () => string[]
}

/**
 * Create a hotkey controller backed by the given adapter.
 *
 * @param adapter - Injected adapter mirroring Electron's globalShortcut interface.
 * @param dispatch - Called when an accelerator fires, with the corresponding action.
 */
export function createHotkeyController(
  adapter: HotkeyAdapter,
  dispatch: (action: HotkeyAction) => void,
): HotkeyController {
  // Track which accelerators are currently registered.
  const active = new Set<string>()
  // Lookup: action name keyed by accelerator (for clean dispatch).
  const actionByAccelerator = new Map<string, HotkeyAction>()

  return {
    registerAll(defs: readonly HotkeyDefinition[]): RegisterAllResult {
      const registered: string[] = []
      const failed: string[] = []

      for (const { action, accelerator } of defs) {
        if (active.has(accelerator)) continue // avoid duplicate work
        const ok = adapter.register(accelerator, () => {
          dispatch(action)
        })
        if (ok) {
          active.add(accelerator)
          actionByAccelerator.set(accelerator, action)
          registered.push(accelerator)
        } else {
          failed.push(accelerator)
        }
      }

      return { registered, failed }
    },

    unregisterAll(): void {
      for (const accel of active) {
        adapter.unregister(accel)
        actionByAccelerator.delete(accel)
      }
      active.clear()
    },

    getRegisteredAccelerators(): string[] {
      return [...active]
    },
  }
}
