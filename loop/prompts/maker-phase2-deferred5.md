# Phase 2 Deferred Slice 5 Maker Prompt

You are the maker for Phase 2 Deferred Slice 5 of the Windows Electron pixel-art desktop pet.

## Authorized Scope

Implement the smallest verifiable startup launch setting slice:

- Testable startup launch controller with an injected OS/Electron adapter.
- Read whether launch-at-login is enabled.
- Enable and disable launch-at-login through the adapter.
- Avoid redundant adapter writes when requested state already matches.
- Minimal Electron main-process integration through the tray/menu.

Prefer a pure shared module with tests, plus a small Electron main-process adapter/integration.

## Required TDD Flow

- Start from the existing failing tests for this slice.
- Add or adjust tests before production code when new behavior is needed.
- Make the smallest implementation that passes the tests.

## Required Files

- Add `src/shared/startupLaunch.ts`.
- Add or update `src/shared/startupLaunch.test.ts`.
- Integrate minimally in `src/main.ts`.
- Write `loop/reports/phase-2-deferred5-acceptance.md`.

## Forbidden In This Slice

Do not implement:

- Hotkeys.
- Backend services.
- OS/system notifications.
- Remote upload or cloud processing.
- Sound packs.
- Plugin-like action system.
- File upload UI.
- Import/export UI.
- New asset generation.

Do not rewrite unrelated Phase 1, Phase 2 foundation, or deferred slice 1/2/3/4 modules.

Do not update `loop/phase-state.json`; the controller updates phase state only after checker PASS.

## Stop Condition

Stop after the smallest implementation and report what changed. Do not claim the slice is complete; the checker decides.
