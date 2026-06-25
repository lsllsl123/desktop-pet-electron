# Phase 3 Deferred Slice 5 Maker Prompt

You are the maker for Phase 3 Deferred Slice 5 of the Windows Electron pixel-art desktop pet.

## Authorized Scope

Implement the smallest verifiable fixed local hotkeys slice:

- Add a deterministic shared hotkey catalog for a small fixed set of existing pet actions.
- Add a testable hotkey registration controller with an injected Electron/globalShortcut-style adapter.
- Register and unregister known accelerators.
- Avoid duplicate registration work for the same accelerator.
- Integrate minimally in Electron main so hotkeys trigger existing pet events.

Prefer pure shared helpers with tests, plus small main-process integration.

## Required TDD Flow

- Start from the existing failing tests for this slice.
- Add or adjust tests before production code when new behavior is needed.
- Make the smallest implementation that passes the tests.

## Required Files

- Add `src/shared/hotkeys.ts`.
- Add or update `src/shared/hotkeys.test.ts`.
- Integrate minimally in `src/main.ts`.
- Write `loop/reports/phase-3-deferred5-acceptance.md`.

## Forbidden In This Slice

Do not implement:

- User-editable hotkeys.
- Plugin-like action system.
- Backend services.
- OS/system notifications.
- Remote upload or cloud processing.
- File upload UI.
- Native file dialogs.
- External assets.
- New asset generation.

Do not rewrite unrelated Phase 1, Phase 2, deferred, or previous Phase 3 modules.

Do not update `loop/phase-state.json`; the controller updates phase state only after checker PASS.

## Stop Condition

Stop after the smallest implementation and report what changed. Do not claim the slice is complete; the checker decides.
