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

## Phase 2: Approved Current Goal

Approved by human after Phase 1 acceptance.

The first Phase 2 loop may implement only the shared behavior foundation:

- Random event system.
- Hidden mood system.
- Low-resource mode.

The first Phase 2 loop must stop after writing `loop/reports/phase-2-acceptance.md`.

## Phase 2 Deferred Queue

Requires another human approval after the Phase 2 foundation.

- Sleeping, peeking at cursor, edge movement, drag dizziness.
- Lightweight todo reminders.
- Local image-to-pixel-art processing.
- Custom character management.
- Startup launch setting.

## Phase 2 Deferred Slice 1: Approved Current Goal

Approved by human after Phase 2 foundation acceptance.

This loop may implement only deterministic desktop-pet behavior enhancements:

- Sleeping after an idle threshold.
- Peeking toward the cursor when close enough.
- Lightweight edge movement nudges.
- Drag dizziness after fast or long dragging.

This slice must stop after writing `loop/reports/phase-2-deferred1-acceptance.md`.

This slice must not implement todo reminders, image pixelator, custom character management, startup launch, hotkeys, backend services, remote upload, sound packs, or plugin-like actions.

## Phase 2 Deferred Slice 2: Approved Current Goal

Approved by human after Phase 2 Deferred Slice 1 acceptance.

This loop may implement only lightweight local todo reminders:

- A deterministic local reminder/todo store.
- Adding a reminder with text and due time.
- Listing pending reminders.
- Detecting due reminders.
- Marking reminders complete after they are shown.
- Minimal renderer UI for local reminder entry and due reminder speech.

This slice must stop after writing `loop/reports/phase-2-deferred2-acceptance.md`.

This slice must not implement image pixelator, custom character management, startup launch, hotkeys, backend services, OS/system notifications, remote upload, sound packs, or plugin-like actions.

## Phase 2 Deferred Slice 3: Approved Current Goal

Approved by human after Phase 2 Deferred Slice 2 acceptance.

This loop may implement only local image-to-pixel-art processing:

- A deterministic shared image pixelator module.
- Converting local RGBA image buffers into blocky pixel-art output.
- Averaging source pixels per block.
- Optional palette quantization for pixel-art colors.
- Input validation for image dimensions, buffer length, pixel size, and palette entries.

This slice must stop after writing `loop/reports/phase-2-deferred3-acceptance.md`.

This slice must not implement custom character management, file upload UI, import/export, startup launch, hotkeys, backend services, OS/system notifications, remote upload, cloud processing, sound packs, or plugin-like actions.

## Phase 2 Deferred Slice 4: Approved Current Goal

Approved by human after Phase 2 Deferred Slice 3 acceptance.

This loop may implement only local custom character management:

- A deterministic shared custom character manager module.
- Adding validated custom characters from already-local data.
- Listing built-in and custom characters together.
- Selecting a character by stable id.
- Removing custom characters while protecting built-ins.
- Internal persistence serialization/deserialization for custom character records.

This slice must stop after writing `loop/reports/phase-2-deferred4-acceptance.md`.

This slice must not implement file upload UI, import/export UI, startup launch, hotkeys, backend services, OS/system notifications, remote upload, cloud processing, sound packs, plugin-like actions, or new asset generation.

## Phase 2 Deferred Slice 5: Approved Current Goal

Approved by human after Phase 2 Deferred Slice 4 acceptance.

This loop may implement only the startup launch setting:

- A testable startup launch controller with an injected OS/Electron adapter.
- Reading whether launch-at-login is enabled.
- Enabling and disabling launch-at-login through the adapter.
- Avoiding redundant adapter writes when the requested state already matches.
- Minimal Electron main-process integration through the tray/menu.

This slice must stop after writing `loop/reports/phase-2-deferred5-acceptance.md`.

This slice must not implement hotkeys, backend services, OS/system notifications, remote upload, cloud processing, sound packs, plugin-like actions, file upload UI, import/export UI, or new asset generation.

## Phase 3: Backlog

Requires human approval after Phase 2.

- More skins.
- More explosion styles.
- Sound packs.
- Import/export custom characters.
- Hotkeys.
- Plugin-like action system.

## Phase 3 Slice 1: Approved Current Goal

Approved by human after Phase 2 Deferred Slice 5 acceptance.

This loop may implement only more built-in skins:

- A deterministic shared built-in pet skin catalog.
- More than the original five built-in skins.
- Stable skin ids, labels, and visual color metadata.
- Minimal renderer/main-process integration so the existing character menu uses the expanded skin catalog.

This slice must stop after writing `loop/reports/phase-3-acceptance.md`.

This slice must not implement sound packs, import/export custom characters, hotkeys, plugin-like action system, backend services, OS/system notifications, remote upload, cloud processing, file upload UI, or new asset generation.

## Phase 3 Deferred Slice 2: Approved Current Goal

Approved by human after Phase 3 Slice 1 acceptance.

This loop may implement only more explosion styles:

- A deterministic shared explosion style catalog.
- More than the original default explosion style.
- Stable style ids, labels, and particle config metadata.
- A pure helper to resolve an explosion config from a style id.
- Minimal renderer/main-process integration so the existing character context menu can trigger at least two explosion styles.

This slice must stop after writing `loop/reports/phase-3-deferred2-acceptance.md`.

This slice must not implement sound packs, import/export custom characters, hotkeys, plugin-like action system, backend services, OS/system notifications, remote upload, cloud processing, file upload UI, or new asset generation.

## Phase 3 Deferred Slice 3: Approved Current Goal

Approved by human after Phase 3 Deferred Slice 2 acceptance.

This loop may implement only local synthesized sound packs:

- A deterministic shared sound pack catalog.
- More than one built-in sound pack.
- Stable pack ids, labels, and event-to-tone metadata.
- A pure helper to resolve a tone command for a pet event and pack id.
- Minimal renderer/main-process integration so the existing context menu can select a sound pack and existing pet events can play synthesized tones.

This slice must stop after writing `loop/reports/phase-3-deferred3-acceptance.md`.

This slice must not implement import/export custom characters, hotkeys, plugin-like action system, backend services, OS/system notifications, remote upload, cloud processing, file upload UI, external audio files, or new asset generation.

## Phase 3 Deferred Slice 4: Approved Current Goal

Approved by human after Phase 3 Deferred Slice 3 acceptance.

This loop may implement only local custom character import/export:

- A deterministic versioned custom character export package format.
- Exporting custom character records to a local JSON string.
- Importing custom character records from a local JSON string using existing validation.
- Deduplicating imported records by stable id.
- Minimal renderer integration using text copy/paste only.

This slice must stop after writing `loop/reports/phase-3-deferred4-acceptance.md`.

This slice must not implement hotkeys, plugin-like action system, backend services, OS/system notifications, remote upload, cloud processing, file upload UI, native file dialogs, external assets, or new asset generation.

## Phase 3 Deferred Slice 5: Approved Current Goal

Approved by human after Phase 3 Deferred Slice 4 acceptance.

This loop may implement only fixed local hotkeys:

- A deterministic shared hotkey catalog for a small fixed set of existing pet actions.
- A testable hotkey registration controller with an injected Electron/globalShortcut-style adapter.
- Registering and unregistering known accelerators.
- Avoiding duplicate registration work for the same accelerator.
- Minimal Electron main-process integration that maps hotkeys to existing pet events.

This slice must stop after writing `loop/reports/phase-3-deferred5-acceptance.md`.

This slice must not implement user-editable hotkeys, plugin-like action system, backend services, OS/system notifications, remote upload, cloud processing, file upload UI, native file dialogs, external assets, or new asset generation.

## Phase 3 Deferred Slice 6: Approved Current Goal

Approved by human after Phase 3 Deferred Slice 5 acceptance.

This loop may implement only a local built-in action registry:

- A deterministic shared action catalog for existing pet actions.
- A testable built-in action registry/dispatcher with injected handlers.
- Validating action ids before dispatch.
- Returning a safe result for unknown or failed actions.
- Minimal Electron main-process integration so existing menus/hotkeys dispatch through the registry.

This slice must stop after writing `loop/reports/phase-3-deferred6-acceptance.md`.

This slice must not implement external plugin loading, dynamic code execution, user-authored scripts, backend services, OS/system notifications, remote upload, cloud processing, file upload UI, native file dialogs, external assets, or new asset generation.

## Phase 3 Closeout: Approved Current Goal

Approved by human after Phase 3 Deferred Slice 6 acceptance.

This loop may implement no new product behavior. It may only:

- Verify all Phase 3 backlog slices have PASS checker reports.
- Run full automated verification.
- Write a Phase 3 closeout report summarizing implemented scope and remaining manual checks.
- Stop at a final Phase 3 manual gate.

This closeout must stop after writing `loop/reports/phase-3-closeout.md`.

This closeout must not implement new app features, refactor production behavior, add external plugin loading, backend services, OS/system notifications, remote upload, cloud processing, file upload UI, native file dialogs, external assets, or new asset generation.

## Phase Gate

No phase starts automatically after the previous phase. The runner must set `requiresHumanApproval` to `true` at every phase stop.
