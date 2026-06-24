const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ytmp3', {
  chooseDirectory: () => ipcRenderer.invoke('dialog:chooseDirectory'),
  getDefaultDownloads: () => ipcRenderer.invoke('app:getDefaultDownloads'),
  convert: (payload) => ipcRenderer.invoke('convert:start', payload),
  search: (payload) => ipcRenderer.invoke('search:youtube', payload),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggleMaximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  onProgress: (callback) => {
    const listener = (_event, progress) => callback(progress)
    ipcRenderer.on('convert:progress', listener)
    return () => ipcRenderer.removeListener('convert:progress', listener)
  }
})
