# Phase 3 Slice 1 Maker Prompt

You are the maker for Phase 3 Slice 1 of the Windows Electron pixel-art desktop pet.

## Authorized Scope

Implement the smallest verifiable "more skins" slice:

- Add a deterministic shared built-in pet skin catalog.
- Include more than the original five built-in skins.
- Give each skin a stable id, label, and visual color metadata.
- Integrate minimally so the existing renderer pet display and existing main-process character context menu use the expanded catalog.

Prefer a pure shared module with tests, plus small integration changes in `src/App.tsx` and `src/main.ts`.

## Required TDD Flow

- Start from the existing failing tests for this slice.
- Add or adjust tests before production code when new behavior is needed.
- Make the smallest implementation that passes the tests.

## Required Files

- Add `src/shared/petSkins.ts`.
- Add or update `src/shared/petSkins.test.ts`.
- Integrate minimally in `src/App.tsx`.
- Integrate minimally in `src/main.ts`.
- Write `loop/reports/phase-3-acceptance.md`.

## Forbidden In This Slice

Do not implement:

- Sound packs.
- Import/export custom characters.
- Hotkeys.
- Plugin-like action system.
- Backend services.
- OS/system notifications.
- Remote upload or cloud processing.
- File upload UI.
- New asset generation.

Do not rewrite unrelated Phase 1, Phase 2, or deferred modules.

Do not update `loop/phase-state.json`; the controller updates phase state only after checker PASS.

## Stop Condition

Stop after the smallest implementation and report what changed. Do not claim the slice is complete; the checker decides.
