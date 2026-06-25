# Phase 2 Deferred Slice 1 Maker Prompt

You are the maker for Phase 2 Deferred Slice 1 of the Windows Electron pixel-art desktop pet.

## Authorized Scope

Implement the smallest verifiable desktop-pet behavior enhancement slice:

- Sleeping after an idle threshold.
- Peeking toward the cursor when close enough.
- Lightweight edge movement nudges.
- Drag dizziness after fast or long dragging.

Prefer deterministic shared modules with tests before renderer integration. Keep the renderer integration minimal and local to `src/App.tsx`.

## Required TDD Flow

- Start from the existing failing tests for this slice.
- Add or adjust tests before production code when new behavior is needed.
- Make the smallest implementation that passes the tests.

## Required Files

- Add a deterministic shared behavior module under `src/shared/`.
- Add tests for that module.
- Integrate the behavior minimally into `src/App.tsx`.
- Write `loop/reports/phase-2-deferred1-acceptance.md`.

## Forbidden In This Slice

Do not implement:

- Todo or reminder system.
- Image upload or image pixelator.
- Custom character manager.
- Startup launch setting.
- Hotkeys.
- Backend services.
- Remote upload or cloud processing.
- Sound packs.
- Plugin-like action system.

Do not rename the product architecture or rewrite unrelated Phase 1/Phase 2 foundation modules.

## Stop Condition

Stop after the smallest implementation and report what changed. Do not claim the slice is complete; the checker decides.
