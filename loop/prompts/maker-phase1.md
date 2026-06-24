# Phase 1 Maker Prompt

You are the Phase 1 maker for a Windows Electron pixel-art desktop pet.

## Required Reading

Before editing, read:

- `docs/loop-engineering/source-notes.md`
- `docs/loop-engineering/loop-contract.md`
- `docs/loop-engineering/phase-plan.md`
- `loop/phase-state.json`
- `loop/LOOP_PROGRESS.md`
- `C:/Users/13174/Documents/boost-prompt/prompts/final/desktop-pet-electron-final.md`
- the latest verification evidence provided by the runner

## Goal

Make the smallest verifiable change toward Phase 1 MVP.

If the repository does not yet contain an Electron app, first create only the
minimum Phase 1 skeleton needed for `scripts/verify-phase1.ps1` to observe
progress:

- `package.json` with deterministic `test` and `build` scripts.
- Electron main entry under `src/main.ts`.
- React renderer entry under `src/App.tsx` or `src/renderer`.
- Animation state machine module.
- Explosion engine module.
- Settings store module.
- Focused tests for deterministic modules.

Do not attempt to finish the whole MVP in one maker turn. Leave GUI polish and
manual desktop verification for later turns.

## Allowed Phase 1 Scope

- Electron project structure.
- Transparent frameless desktop pet window.
- Drag movement and position memory.
- Five built-in programmatic pixel placeholder characters.
- Character switching.
- State machine: `idle`, `clicked`, `dragging`, `dragRecover`, `exploding`.
- Right-click menu with "explode".
- Basic Canvas pixel-block explosion effect.
- Simple speech bubble.
- Basic settings persistence.
- Tray show, hide, and quit.

## Forbidden During Phase 1

- Random event system.
- Hidden mood system.
- Todo/reminder implementation.
- Image upload or image pixelator.
- Custom character management.
- Backend service.
- Remote upload.
- Sound pack.
- Hotkeys.
- Plugin action system.
- Complex nurture/game system.
- Test deletion or test weakening.
- Bypassing the animation state machine.
- High-frequency `setInterval` animation loops.

## Engineering Rules

- Use TypeScript + React + Electron unless impossible.
- Prefer programmatic pixel placeholders over blocking on art assets.
- Use `requestAnimationFrame` for visual animation.
- Keep module boundaries clear.
- Add tests for deterministic modules before or alongside implementation.
- Write the smallest useful diff.
- Run relevant verification commands.
- Append progress to `loop/LOOP_PROGRESS.md`.
- Do not claim Phase 1 is complete. The checker decides.

## Output

Return a concise summary with:

- files changed
- verification commands run
- results
- remaining issues
