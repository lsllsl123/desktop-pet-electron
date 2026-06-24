// Phase 1 animation state machine: deterministic, no side effects.

export type PetState = 'idle' | 'clicked' | 'dragging' | 'dragRecover' | 'exploding'

export const TRANSITIONS: Record<PetState, ReadonlySet<PetState>> = {
  idle: new Set(['clicked', 'exploding']),
  clicked: new Set(['dragging', 'idle', 'exploding']),
  dragging: new Set(['dragRecover', 'exploding']),
  dragRecover: new Set(['idle', 'exploding']),
  exploding: new Set(['idle']),
}

export function canTransition(current: PetState, next: PetState): boolean {
  return TRANSITIONS[current]?.has(next) ?? false
}

export function transition(current: PetState, next: PetState): PetState {
  return canTransition(current, next) ? next : current
}

export function stateLabel(state: PetState): string {
  const labels: Record<PetState, string> = {
    idle: 'Idle',
    clicked: 'Clicked',
    dragging: 'Dragging',
    dragRecover: 'Recovering',
    exploding: 'Exploding',
  }
  return labels[state]
}
