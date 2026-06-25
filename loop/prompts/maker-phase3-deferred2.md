# Phase 3 Deferred Slice 2 Maker Prompt

You are the maker for Phase 3 Deferred Slice 2 of the Windows Electron pixel-art desktop pet.

## Authorized Scope

Implement the smallest verifiable "more explosion styles" slice:

- Add a deterministic shared explosion style catalog.
- Include more than the original default explosion style.
- Give each style a stable id, label, and particle config metadata.
- Add a pure helper to resolve an `ExplosionConfig`-compatible object from a style id and center point.
- Integrate minimally so the existing renderer/main-process context menu can trigger at least two explosion styles.

Prefer pure shared/renderer modules with tests, plus small integration changes in `src/App.tsx` and `src/main.ts`.

## Required TDD Flow

- Start from the existing failing tests for this slice.
- Add or adjust tests before production code when new behavior is needed.
- Make the smallest implementation that passes the tests.

## Required Files

- Add `src/renderer/explosionStyles.ts`.
- Add or update `src/renderer/explosionStyles.test.ts`.
- Integrate minimally in `src/App.tsx`.
- Integrate minimally in `src/main.ts` and `src/preload.ts` if the menu event needs a style id.
- Write `loop/reports/phase-3-deferred2-acceptance.md`.

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

Do not rewrite unrelated Phase 1, Phase 2, deferred, or Phase 3 Slice 1 modules.

Do not update `loop/phase-state.json`; the controller updates phase state only after checker PASS.

## Stop Condition

Stop after the smallest implementation and report what changed. Do not claim the slice is complete; the checker decides.
