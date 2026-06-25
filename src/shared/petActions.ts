// Phase 3 Deferred Slice 6: deterministic shared action catalog and
// testable built-in action registry/dispatcher with injected handlers.

export type PetActionId = 'toggle-window' | 'explode' | 'next-character'

export interface PetActionDefinition {
  id: PetActionId
  label: string
}

/**
 * Deterministic built-in action catalog for existing pet actions.
 * Returned as an Object.freeze'd array of frozen definition objects.
 */
export const PET_ACTIONS: readonly PetActionDefinition[] = Object.freeze([
  Object.freeze({ id: 'toggle-window', label: 'Toggle Window' }),
  Object.freeze({ id: 'explode', label: 'Explode' }),
  Object.freeze({ id: 'next-character', label: 'Next Character' }),
])

const BUILT_IN_ACTION_IDS = new Set(PET_ACTIONS.map(action => action.id))

/** Map of action id → no-arg void handler, for injection into the registry. */
export interface PetActionHandlerMap {
  [id: string]: () => void
}

export interface PetActionResult {
  ok: boolean
  actionId: string
  reason?: string
}

export interface PetActionRegistry {
  listActions: () => PetActionDefinition[]
  dispatch: (actionId: string) => PetActionResult
}

/**
 * Create a built-in action registry with injected handlers.
 *
 * @param handlers - A map of action id to no-arg void handler.
 * @returns A registry object with listActions and dispatch.
 */
export function createPetActionRegistry(
  handlers: PetActionHandlerMap,
): PetActionRegistry {
  return {
    /** Return defensive copies of the built-in action catalog in stable order. */
    listActions(): PetActionDefinition[] {
      return PET_ACTIONS.map(action => ({ ...action }))
    },

    /**
     * Dispatch an action by id through the injected handlers.
     *
     * For known action ids, runs the handler and returns { ok: true, actionId }.
     * If the handler throws, returns { ok: false, actionId, reason: 'handler_failed' }.
     * For unknown action ids, returns { ok: false, actionId, reason: 'unknown_action' }.
     */
    dispatch(actionId: string): PetActionResult {
      if (!BUILT_IN_ACTION_IDS.has(actionId as PetActionId)) {
        return { ok: false, actionId, reason: 'unknown_action' }
      }
      const handler = handlers[actionId]
      if (!handler) {
        return { ok: false, actionId, reason: 'handler_failed' }
      }
      try {
        handler()
        return { ok: true, actionId }
      } catch {
        return { ok: false, actionId, reason: 'handler_failed' }
      }
    },
  }
}
