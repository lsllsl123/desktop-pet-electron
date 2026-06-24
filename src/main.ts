import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen } from 'electron'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const PRELOAD_PATH = join(__dirname, '../preload/preload.js')
const PET_CHARS = ['Pixel Cat', 'Pixel Dog', 'Pixel Frog', 'Pixel Panda', 'Pixel Bot']

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
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow?.show() },
    { label: 'Hide', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]))
  tray.on('double-click', () => mainWindow?.show())
}

ipcMain.handle('window:setPosition', (_event, x: number, y: number) => {
  mainWindow?.setPosition(Math.round(x), Math.round(y))
})

ipcMain.handle('menu:showContextMenu', (_event, currentIndex: number) => {
  const template: Electron.MenuItemConstructorOptions[] = PET_CHARS.map((char, i) => ({
    label: `${i === currentIndex ? 'Current: ' : 'Switch to '}${char}`,
    enabled: i !== currentIndex,
    click: () => mainWindow?.webContents.send('menu:switchCharacter', i),
  }))

  template.push({ type: 'separator' })
  template.push({
    label: 'Explode',
    click: () => mainWindow?.webContents.send('menu:explode'),
  })

  if (mainWindow) {
    Menu.buildFromTemplate(template).popup({ window: mainWindow })
  }
})

app.whenReady().then(() => {
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
