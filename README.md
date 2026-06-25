# Desktop Pet

A pixel-art desktop pet built with Electron + React + TypeScript, developed using [awesome-loop-engineering](https://github.com/invincible04/awesome-loop-engineering) methodology.

The pet sits on your desktop, responds to clicks and drags, and comes with optional behaviors, reminders, sound packs, and hotkeys.

## Tech Stack

- **Electron 33** ！ desktop runtime
- **React 18** ！ UI layer
- **TypeScript** ！ strict typing throughout
- **Vite 6** ！ build tooling
- **Node test runner + tsx** ！ 139 unit tests

## Quick Start

\\\ash
git clone https://github.com/lsllsl123/desktop-pet-electron.git
cd desktop-pet-electron
npm install
npm run dev
\\\

The pet window appears centered near the top of the screen.

## NPM scripts

| Command | Does |
|---|---|
| \
pm run dev\ | Start dev server with hot reload |
| \
pm run build\ | Production build for renderer + main + preload |
| \
pm test\ | Run all 139 tests |
| \
pm run typecheck\ | TypeScript type check (no emit) |

## Features

### Interaction

- Click the pet to interact (speech bubble)
- Drag the pet to move it around the desktop ！ position is remembered across restarts
- Right-click for context menu: switch character, change sound pack, pick explosion style

### Characters

- Multiple built-in pixel art skins
- Local custom character import/export via text copy/paste

### Animations & states

- State machine: \idle\ / \clicked\ / \dragging\ / \dragRecover\ / \exploding\
- Canvas-based particle explosion effects with selectable styles

### Behaviors

- Random idle events (stretch, dance, yawn, look around)
- Sleeping after a period of inactivity
- Peeking toward the cursor when nearby
- Edge nudge ！ moves away from screen bounds
- Drag dizziness after fast or long drags

### Sound packs

- **Blip** ！ short beep tones for clicks, switches, explosions, and reminders
- **Chime** ！ melodic chime variations
- **Mute** ！ no sound

### Reminders

- Lightweight local todo reminders with customizable delay (10s, 30s, 1m, 5m)

### Hotkeys

| Shortcut | Action |
|---|---|
| \Ctrl+Alt+P\ | Toggle show/hide |
| \Ctrl+Alt+E\ | Explode |
| \Ctrl+Alt+Right\ | Next character |

### System tray

- Show / Hide
- Launch at Login toggle
- Quit

## Development

### TDD + loop-engineering

The project follows [awesome-loop-engineering](https://github.com/invincible04/awesome-loop-engineering) with maker/checker separation and TDD-first workflow.

- \loop/LOOP_PROGRESS.md\ ！ full development log across all phases
- \loop/prompts/\ ！ maker and checker prompts per phase/slice
- \loop/reports/\ ！ acceptance reports and checker verdicts per slice
- \scripts/\ ！ per-phase verification scripts
- \docs/loop-engineering/\ ！ phase plan

### Project structure

\\\
src/
|-- App.tsx                        # Renderer root ！ UI, handlers, integration
|-- main.ts                        # Electron main process
|-- preload.ts                     # Context bridge
|-- renderer/
|   |-- explosionEngine.ts         # Particle physics
|   |-- explosionStyles.ts         # Explosion style catalog
|   [verification-before-completion]-- soundPlayer.ts               # WebAudio tone player
|-- shared/
    |-- animationStateMachine.ts    # Pet state transitions
    |-- behaviorSettings.ts        # Low-resource / interval
    |-- customCharacterManager.ts  # Custom character CRUD + validation
    |-- customCharacterTransfer.ts # Import/export custom characters
    |-- deferredPetBehavior.ts     # Sleep, peek, edge nudge, dizziness
    |-- hotkeys.ts                 # Fixed hotkey catalog + controller
    |-- imagePixelator.ts          # Image to pixel-art conversion
    |-- moodSystem.ts              # Hidden mood system
    |-- petActions.ts              # Built-in action registry
    |-- petSkins.ts                # Built-in skin catalog
    |-- randomEventScheduler.ts    # Random idle event system
    |-- reminderStore.ts           # Local todo reminders
    |-- settingsStore.ts           # Persistent settings
    |-- soundPacks.ts              # Sound pack catalog
    [verification-before-completion]-- startupLaunch.ts             # Launch-at-login controller
\\\

Each module has a corresponding \.test.ts\ file.

## License

Private project.