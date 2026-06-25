# Phase 3 Deferred Slice 4 Maker Prompt

You are the maker for Phase 3 Deferred Slice 4 of the Windows Electron pixel-art desktop pet.

## Authorized Scope

Implement the smallest verifiable local custom character import/export slice:

- Add a deterministic versioned custom character export package format.
- Export custom character records to a local JSON string.
- Import custom character records from a local JSON string using existing validation.
- Deduplicate imported records by stable id.
- Integrate minimally in the renderer using text copy/paste only.

Prefer pure shared helpers with tests, plus small renderer integration.

## Required TDD Flow

- Start from the existing failing tests for this slice.
- Add or adjust tests before production code when new behavior is needed.
- Make the smallest implementation that passes the tests.

## Required Files

- Add `src/shared/customCharacterTransfer.ts`.
- Add or update `src/shared/customCharacterTransfer.test.ts`.
- Integrate minimally in `src/App.tsx`.
- Write `loop/reports/phase-3-deferred4-acceptance.md`.

## Forbidden In This Slice

Do not implement:

- Hotkeys.
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
