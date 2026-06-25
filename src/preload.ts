import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('petAPI', {
  setPosition: (x: number, y: number) => ipcRenderer.invoke('window:setPosition', x, y),
  showContextMenu: (currentIndex: number, currentPackId?: string) => (
    ipcRenderer.invoke('menu:showContextMenu', currentIndex, currentPackId)
  ),
  onSwitchCharacter: (callback: (index: number) => void) => {
    ipcRenderer.on('menu:switchCharacter', (_event, index) => callback(index))
  },
  onExplode: (callback: (styleId: string) => void) => {
    ipcRenderer.on('menu:explode', (_event, styleId) => callback(styleId))
  },
  onSetSoundPack: (callback: (packId: string) => void) => {
    ipcRenderer.on('menu:setSoundPack', (_event, packId) => callback(packId))
  },
})
