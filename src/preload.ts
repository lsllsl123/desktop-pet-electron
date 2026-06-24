import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('petAPI', {
  setPosition: (x: number, y: number) => ipcRenderer.invoke('window:setPosition', x, y),
  showContextMenu: (currentIndex: number) => ipcRenderer.invoke('menu:showContextMenu', currentIndex),
  onSwitchCharacter: (callback: (index: number) => void) => {
    ipcRenderer.on('menu:switchCharacter', (_event, index) => callback(index))
  },
  onExplode: (callback: () => void) => {
    ipcRenderer.on('menu:explode', () => callback())
  },
})
