# Phase 2 Deferred Slice 3 Maker Prompt

You are the maker for Phase 2 Deferred Slice 3 of the Windows Electron pixel-art desktop pet.

## Authorized Scope

Implement the smallest verifiable local image-to-pixel-art processing slice:

- Deterministic shared image pixelator module.
- Convert local RGBA image buffers into blocky pixel-art output.
- Average source pixels per block.
- Optional palette quantization to nearest palette color.
- Validate image dimensions, buffer length, pixel size, and palette entries.

Prefer a shared pure module with tests. Do not integrate file input or character management in this slice unless the existing RED tests explicitly require it.

## Required TDD Flow

- Start from the existing failing tests for this slice.
- Add or adjust tests before production code when new behavior is needed.
- Make the smallest implementation that passes the tests.

## Required Files

- Add `src/shared/imagePixelator.ts`.
- Add or update `src/shared/imagePixelator.test.ts`.
- Write `loop/reports/phase-2-deferred3-acceptance.md`.

## Forbidden In This Slice

Do not implement:

- Custom character manager.
- File upload UI.
- Import/export custom characters.
- Startup launch setting.
- Hotkeys.
- Backend services.
- OS/system notifications.
- Remote upload or cloud processing.
- Sound packs.
- Plugin-like action system.

Do not rewrite unrelated Phase 1, Phase 2 foundation, or deferred slice 1/2 modules.

Do not update `loop/phase-state.json`; the controller updates phase state only after checker PASS.

## Stop Condition

Stop after the smallest implementation and report what changed. Do not claim the slice is complete; the checker decides.
