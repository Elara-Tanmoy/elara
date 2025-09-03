
const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('elara', {
  scanClipboard: (apiBase) => ipcRenderer.invoke('scan-clipboard', apiBase)
})
