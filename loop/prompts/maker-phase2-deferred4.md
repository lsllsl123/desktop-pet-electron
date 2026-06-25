# Phase 2 Deferred Slice 4 Maker Prompt

You are the maker for Phase 2 Deferred Slice 4 of the Windows Electron pixel-art desktop pet.

## Authorized Scope

Implement the smallest verifiable local custom character management slice:

- Deterministic shared custom character manager module.
- Add validated custom characters from already-local data.
- List built-in and custom characters together.
- Select a character by stable id.
- Remove custom characters while protecting built-ins.
- Internal persistence serialization/deserialization for custom character records.

Prefer a shared pure module with tests. Do not add file input UI or user-facing import/export in this slice.

## Required TDD Flow

- Start from the existing failing tests for this slice.
- Add or adjust tests before production code when new behavior is needed.
- Make the smallest implementation that passes the tests.

## Required Files

- Add `src/shared/customCharacterManager.ts`.
- Add or update `src/shared/customCharacterManager.test.ts`.
- Write `loop/reports/phase-2-deferred4-acceptance.md`.

## Forbidden In This Slice

Do not implement:

- File upload UI.
- Import/export UI for custom characters.
- Startup launch setting.
- Hotkeys.
- Backend services.
- OS/system notifications.
- Remote upload or cloud processing.
- Sound packs.
- Plugin-like action system.
- New asset generation.

Do not rewrite unrelated Phase 1, Phase 2 foundation, or deferred slice 1/2/3 modules.

Do not update `loop/phase-state.json`; the controller updates phase state only after checker PASS.

## Stop Condition

Stop after the smallest implementation and report what changed. Do not claim the slice is complete; the checker decides.
