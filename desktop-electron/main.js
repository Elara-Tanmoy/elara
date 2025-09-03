
const { app, BrowserWindow, ipcMain, clipboard } = require('electron')
const path = require('path')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

function createWindow () {
  const win = new BrowserWindow({
    width: 520, height: 520,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  })
  win.loadFile('index.html')
}

ipcMain.handle('scan-clipboard', async (evt, apiBase) => {
  const url = clipboard.readText()
  const r = await fetch(`${apiBase}/scan-link`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({url}) })
  return await r.json()
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
