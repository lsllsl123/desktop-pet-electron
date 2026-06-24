# Desktop Pet Phase Plan

## Phase 1: Automatic MVP Goal

The loop may implement only:

- Electron project structure.
- Transparent frameless desktop pet window.
- Drag movement and position memory.
- Five built-in programmatic pixel placeholder characters.
- Character switching.
- Animation state machine: `idle`, `clicked`, `dragging`, `dragRecover`, `exploding`.
- Right-click menu with an "explode" item.
- Basic Canvas pixel-block explosion effect.
- Simple speech bubble.
- Basic settings persistence.
- Tray show, hide, and quit.

Phase 1 must stop after writing `loop/reports/phase-1-acceptance.md`.

## Phase 1 Explicit Non-Goals

The Phase 1 maker must not implement:

- random event system
- hidden mood system
- todo and reminder system
- image upload or image pixelator
- custom character manager
- low-resource mode beyond simple configuration placeholders
- startup auto-launch behavior
- sound packs
- hotkeys
- plugin action system
- backend services
- remote upload or cloud processing

Small interfaces that make Phase 2 easier are allowed only when they do not add user-facing Phase 2 behavior.

## Phase 2: Planned Queue

Requires human approval after Phase 1.

- Random event system.
- Hidden mood system.
- Sleeping, peeking at cursor, edge movement, drag dizziness.
- Lightweight todo reminders.
- Local image-to-pixel-art processing.
- Custom character management.
- Low-resource mode.
- Startup launch setting.

## Phase 3: Backlog

Requires human approval after Phase 2.

- More skins.
- More explosion styles.
- Sound packs.
- Import/export custom characters.
- Hotkeys.
- Plugin-like action system.

## Phase Gate

No phase starts automatically after the previous phase. The runner must set `requiresHumanApproval` to `true` at every phase stop.
