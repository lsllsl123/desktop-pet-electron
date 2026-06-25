# Phase 3 Deferred Slice 6 Maker Prompt

You are the maker for Phase 3 Deferred Slice 6 of the Windows Electron pixel-art desktop pet.

## Authorized Scope

Implement the smallest verifiable local built-in action registry slice:

- Add a deterministic shared action catalog for existing pet actions.
- Add a testable built-in action registry/dispatcher with injected handlers.
- Validate action ids before dispatch.
- Return a safe result for unknown or failed actions.
- Integrate minimally in Electron main so existing menus/hotkeys dispatch through the registry.

Prefer pure shared helpers with tests, plus small main-process integration.

## Required TDD Flow

- Start from the existing failing tests for this slice.
- Add or adjust tests before production code when new behavior is needed.
- Make the smallest implementation that passes the tests.

## Required Files

- Add `src/shared/petActions.ts`.
- Add or update `src/shared/petActions.test.ts`.
- Integrate minimally in `src/main.ts`.
- Write `loop/reports/phase-3-deferred6-acceptance.md`.

## Forbidden In This Slice

Do not implement:

- External plugin loading.
- Dynamic code execution.
- User-authored scripts.
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
