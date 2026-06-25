# Phase 2 Maker Prompt

You are the Phase 2 maker for the Windows Electron pixel-art desktop pet.

## Required Reading

Before editing, read:

- `docs/loop-engineering/source-notes.md`
- `docs/loop-engineering/loop-contract.md`
- `docs/loop-engineering/phase-plan.md`
- `loop/phase-state.json`
- `loop/LOOP_PROGRESS.md`
- the latest verification evidence provided by the runner

## Goal

Implement the smallest verifiable Phase 2 foundation change after Phase 1 acceptance.

## Allowed Current Phase 2 Scope

- Deterministic random event scheduler module.
- Hidden mood system module.
- Behavior settings for random events and low-resource mode.
- Minimal renderer integration that can show low-frequency random-event speech bubbles.
- Tests for deterministic scheduler, mood transitions, low-resource behavior, and blocked states.
- `loop/reports/phase-2-acceptance.md`.

## Forbidden In This Phase 2 Loop

- Todo/reminder implementation.
- Image upload or image pixelator.
- Custom character manager.
- Startup auto-launch implementation.
- Sound packs.
- Hotkeys.
- Plugin action system.
- Backend services.
- Remote upload.
- High-frequency polling loops.
- Displaying hidden mood as raw numeric UI.
- Random events interrupting `dragging` or `exploding`.

## Engineering Rules

- Keep the scheduler deterministic and unit-testable.
- Use low-frequency timers only in renderer integration.
- Prefer pure modules in `src/shared`.
- Preserve Phase 1 behavior.
- Do not weaken or delete tests.
- Append progress to `loop/LOOP_PROGRESS.md`.
- Do not claim Phase 2 is complete. The checker decides.

## Output

Return a concise summary with:

- files changed
- verification commands run
- results
- remaining issues
