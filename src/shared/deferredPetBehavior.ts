// Phase 2 Deferred Slice 1: deterministic desktop-pet behavior enhancements.
// Pure functions with no side effects.

export type PetState = 'idle' | 'clicked' | 'dragging' | 'dragRecover' | 'exploding'

export interface DeferredPetBehaviorInput {
  nowMs: number
  lastInteractionAtMs: number
  petState: PetState
  petCenter: { x: number; y: number }
  cursor: { x: number; y: number }
  viewport: { width: number; height: number }
  drag: { distancePx: number; durationMs: number } | null
  lowResourceMode: boolean
  sleepAfterMs?: number
  cursorPeekRadius?: number
  edgeMarginPx?: number
  edgeNudgePx?: number
}

export interface DeferredPetBehaviorOutput {
  sleeping: boolean
  speech: string | null
  peekDirection: 'left' | 'right' | 'none'
  edgeNudge: { x: number; y: number }
  dizziness: number
}

export function calculateDeferredPetBehavior(
  input: DeferredPetBehaviorInput,
): DeferredPetBehaviorOutput {
  const {
    nowMs,
    lastInteractionAtMs,
    petState,
    petCenter,
    cursor,
    viewport,
    drag,
    lowResourceMode,
    sleepAfterMs,
    cursorPeekRadius,
    edgeMarginPx,
    edgeNudgePx,
  } = input

  // --- Sleep detection ---
  const idleDurationMs = nowMs - lastInteractionAtMs
  const sleeping =
    sleepAfterMs !== undefined &&
    idleDurationMs >= sleepAfterMs &&
    petState !== 'dragging' &&
    petState !== 'exploding'

  // --- Speech ---
  let speech: string | null = null
  if (sleeping) {
    speech = 'Zzz'
  }

  // --- Cursor peeking (only when awake and not low-resource) ---
  let peekDirection: 'left' | 'right' | 'none' = 'none'
  if (!sleeping && !lowResourceMode && cursorPeekRadius !== undefined) {
    const dx = cursor.x - petCenter.x
    const dy = cursor.y - petCenter.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance <= cursorPeekRadius) {
      peekDirection = dx >= 0 ? 'right' : 'left'
    }
  }

  // --- Edge nudges ---
  let edgeNudgeX = 0
  let edgeNudgeY = 0
  if (edgeMarginPx !== undefined && edgeNudgePx !== undefined) {
    if (petCenter.x < edgeMarginPx) {
      edgeNudgeX = edgeNudgePx
    } else if (petCenter.x > viewport.width - edgeMarginPx) {
      edgeNudgeX = -edgeNudgePx
    }
    if (petCenter.y < edgeMarginPx) {
      edgeNudgeY = edgeNudgePx
    } else if (petCenter.y > viewport.height - edgeMarginPx) {
      edgeNudgeY = -edgeNudgePx
    }
  }

  // --- Drag dizziness ---
  let dizziness = 0
  if (drag && !sleeping) {
    const speedPxPerMs = drag.distancePx / drag.durationMs
    dizziness = Math.min(50, Math.max(0, Math.floor((speedPxPerMs * 50) / 3)))
    if (dizziness > 0) {
      speech = 'Whoa...'
    }
  }

  return {
    sleeping,
    speech,
    peekDirection,
    edgeNudge: { x: edgeNudgeX, y: edgeNudgeY },
    dizziness,
  }
}

/** Reduce dizziness towards zero by the given recovery rate, clamped at zero. */
export function recoverDizziness(current: number, recoveryRate: number): number {
  return Math.max(0, current - recoveryRate)
}
