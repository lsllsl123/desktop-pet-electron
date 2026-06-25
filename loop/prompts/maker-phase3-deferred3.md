# Phase 3 Deferred Slice 3 Maker Prompt

You are the maker for Phase 3 Deferred Slice 3 of the Windows Electron pixel-art desktop pet.

## Authorized Scope

Implement the smallest verifiable local synthesized sound packs slice:

- Add a deterministic shared sound pack catalog.
- Include more than one built-in sound pack.
- Give each pack stable id, label, and event-to-tone metadata.
- Add a pure helper to resolve a tone command for a pet event and sound pack id.
- Add a minimal browser/WebAudio adapter that can play a resolved tone command.
- Integrate minimally so the existing context menu can select a sound pack and existing pet events can trigger synthesized tones.

Prefer pure shared modules with tests, plus small integration changes in `src/App.tsx`, `src/main.ts`, and `src/preload.ts`.

## Required TDD Flow

- Start from the existing failing tests for this slice.
- Add or adjust tests before production code when new behavior is needed.
- Make the smallest implementation that passes the tests.

## Required Files

- Add `src/shared/soundPacks.ts`.
- Add or update `src/shared/soundPacks.test.ts`.
- Add `src/renderer/soundPlayer.ts` if needed for the WebAudio adapter.
- Integrate minimally in `src/App.tsx`, `src/main.ts`, and `src/preload.ts` if the menu event needs a pack id.
- Write `loop/reports/phase-3-deferred3-acceptance.md`.

## Forbidden In This Slice

Do not implement:

- Import/export custom characters.
- Hotkeys.
- Plugin-like action system.
- Backend services.
- OS/system notifications.
- Remote upload or cloud processing.
- File upload UI.
- External audio files.
- New asset generation.

Do not rewrite unrelated Phase 1, Phase 2, deferred, or previous Phase 3 modules.

Do not update `loop/phase-state.json`; the controller updates phase state only after checker PASS.

## Stop Condition

Stop after the smallest implementation and report what changed. Do not claim the slice is complete; the checker decides.
