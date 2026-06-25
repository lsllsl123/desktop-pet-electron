# Phase 2 Deferred Slice 2 Maker Prompt

You are the maker for Phase 2 Deferred Slice 2 of the Windows Electron pixel-art desktop pet.

## Authorized Scope

Implement the smallest verifiable lightweight local reminder slice:

- Deterministic local reminder/todo store.
- Add reminder with text and due time.
- List pending reminders.
- Detect due reminders.
- Mark reminders complete after they are shown.
- Minimal renderer UI for local reminder entry and due reminder speech.

Prefer a shared module with tests before renderer integration. Keep the renderer integration minimal and local to `src/App.tsx`.

## Required TDD Flow

- Start from the existing failing tests for this slice.
- Add or adjust tests before production code when new behavior is needed.
- Make the smallest implementation that passes the tests.

## Required Files

- Add `src/shared/reminderStore.ts`.
- Add `src/shared/reminderStore.test.ts`.
- Integrate the reminder store minimally into `src/App.tsx`.
- Write `loop/reports/phase-2-deferred2-acceptance.md`.

## Forbidden In This Slice

Do not implement:

- Image upload or image pixelator.
- Custom character manager.
- Startup launch setting.
- Hotkeys.
- Backend services.
- OS/system notifications.
- Remote upload or cloud processing.
- Sound packs.
- Plugin-like action system.

Do not rewrite unrelated Phase 1, Phase 2 foundation, or deferred slice 1 modules.

## Stop Condition

Stop after the smallest implementation and report what changed. Do not claim the slice is complete; the checker decides.
