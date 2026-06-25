import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen, globalShortcut } from 'electron'
import { join } from 'path'
import {
  createStartupLaunchController,
  type StartupLaunchAdapter,
} from './shared/startupLaunch'
import { BUILT_IN_PET_SKINS } from './shared/petSkins'
import { EXPLOSION_STYLES } from './renderer/explosionStyles'
import { BUILT_IN_SOUND_PACKS } from './shared/soundPacks'
import {
  createHotkeyController,
  HOTKEYS,
  type HotkeyAction,
  type HotkeyAdapter,
} from './shared/hotkeys'
import { createPetActionRegistry } from './shared/petActions'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let currentCharIndex = 0

const PRELOAD_PATH = join(__dirname, '../preload/preload.js')
const PET_CHARS = BUILT_IN_PET_SKINS.map(skin => skin.label)

function createWindow() {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: 200,
    height: 200,
    x: Math.round((screenWidth - 200) / 2),
    y: 100,
    type: 'toolbar',
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  mainWindow.on('closed', () => { mainWindow = null })
}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('Desktop Pet')

  const startupLaunchAdapter: StartupLaunchAdapter = {
    getOpenAtLogin: () => app.getLoginItemSettings().openAtLogin,
    setOpenAtLogin: (enabled: boolean) => app.setLoginItemSettings({ openAtLogin: enabled }),
  }
  const startupController = createStartupLaunchController(startupLaunchAdapter)

  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow?.show() },
    { label: 'Hide', click: () => mainWindow?.hide() },
    { type: 'separator' },
    {
      label: 'Launch at Login',
      type: 'checkbox',
      checked: startupController.getEnabled(),
      click: (menuItem) => {
        menuItem.checked = startupController.setEnabled(menuItem.checked)
      },
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]))
  tray.on('double-click', () => mainWindow?.show())
}

// --- Phase 3 Deferred Slice 6: built-in action registry ---

const petActionRegistry = createPetActionRegistry({
  'toggle-window': () => {
    if (!mainWindow) return
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  },
  'explode': () => {
    if (!mainWindow) return
    mainWindow.webContents.send('menu:explode', EXPLOSION_STYLES[0]?.id ?? 'burst')
  },
  'next-character': () => {
    currentCharIndex = (currentCharIndex + 1) % PET_CHARS.length
    mainWindow?.webContents.send('menu:switchCharacter', currentCharIndex)
  },
})

// --- Phase 3 Deferred Slice 5: fixed local hotkeys ---

/** globalShortcut-backed adapter for the hotkey controller. */
const hotkeyAdapter: HotkeyAdapter = {
  register(accelerator: string, callback: () => void): boolean {
    return globalShortcut.register(accelerator, callback)
  },
  unregister(accelerator: string): void {
    globalShortcut.unregister(accelerator)
  },
}

/** Dispatch a hotkey action through the built-in action registry. */
function dispatchHotkey(action: HotkeyAction): void {
  petActionRegistry.dispatch(action)
}

const hotkeyController = createHotkeyController(hotkeyAdapter, dispatchHotkey)

ipcMain.handle('window:setPosition', (_event, x: number, y: number) => {
  mainWindow?.setPosition(Math.round(x), Math.round(y))
})

ipcMain.handle('menu:showContextMenu', (_event, currentIndex: number, currentPackId: string) => {
  const template: Electron.MenuItemConstructorOptions[] = PET_CHARS.map((char, i) => ({
    label: `${i === currentIndex ? 'Current: ' : 'Switch to '}${char}`,
    enabled: i !== currentIndex,
    click: () => {
      currentCharIndex = i
      mainWindow?.webContents.send('menu:switchCharacter', i)
    },
  }))

  template.push({ type: 'separator' })
  template.push({
    label: 'Sound Pack',
    submenu: BUILT_IN_SOUND_PACKS.map(pack => ({
      label: pack.label,
      type: 'checkbox',
      checked: pack.id === currentPackId,
      click: () => mainWindow?.webContents.send('menu:setSoundPack', pack.id),
    })),
  })

  template.push({ type: 'separator' })
  template.push({
    label: 'Explosion Style',
    submenu: EXPLOSION_STYLES.map(style => ({
      label: style.label,
      click: () => mainWindow?.webContents.send('menu:explode', style.id),
    })),
  })

  if (mainWindow) {
    Menu.buildFromTemplate(template).popup({ window: mainWindow })
  }
})

app.whenReady().then(() => {
  createWindow()
  createTray()
  hotkeyController.registerAll(HOTKEYS)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  hotkeyController.unregisterAll()
})
