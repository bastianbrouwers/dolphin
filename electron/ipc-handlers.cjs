const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { convertYouTubeToAudio, searchYouTube } = require('./youtube.cjs')

function registerIpcHandlers({ getMainWindow, sendProgress }) {
  const completedDownloads = new Set()

  ipcMain.handle('dialog:chooseDirectory', async () => {
    const result = await dialog.showOpenDialog(getMainWindow(), {
      properties: ['openDirectory', 'createDirectory']
    })

    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('app:getDefaultDownloads', () => app.getPath('downloads'))

  ipcMain.handle('file:open', async (_event, filePath) => {
    const requestedPath = String(filePath || '').trim()
    const targetPath = requestedPath ? path.resolve(requestedPath) : ''

    if (!targetPath || !completedDownloads.has(targetPath)) {
      return { ok: false, error: 'No downloaded file is available to play.' }
    }

    if (!fs.existsSync(targetPath)) {
      completedDownloads.delete(targetPath)
      return { ok: false, error: 'The downloaded file could not be found.' }
    }

    const error = await shell.openPath(targetPath)
    return error ? { ok: false, error } : { ok: true }
  })

  ipcMain.handle('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.handle('window:toggleMaximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return

    if (window.isMaximized()) {
      window.unmaximize()
      return
    }

    window.maximize()
  })

  ipcMain.handle('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.handle('search:youtube', (_event, payload) => searchYouTube(payload))

  ipcMain.handle('convert:start', async (_event, payload) => {
    const result = await convertYouTubeToAudio(payload, { onProgress: sendProgress })

    if (result.ok && result.filePath) {
      completedDownloads.add(path.resolve(result.filePath))
    }

    return result
  })
}

module.exports = {
  registerIpcHandlers
}
