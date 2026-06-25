const { app, BrowserWindow } = require('electron')
const path = require('node:path')

const darkBackgroundColor = '#12151c'
let mainWindow

function setWindowsAppId() {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.local.dolphin')
  }
}

function getWindowIcon() {
  return path.join(__dirname, '..', 'app', 'assets', 'images', 'icon.ico')
}

function bindDevToolsShortcut(window) {
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || input.key !== 'F12') return

    event.preventDefault()

    if (window.webContents.isDevToolsOpened()) {
      window.webContents.closeDevTools()
      return
    }

    window.webContents.openDevTools({ mode: 'detach' })
  })
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 920,
    height: 680,
    minWidth: 720,
    minHeight: 560,
    title: 'Dolphin',
    icon: getWindowIcon(),
    backgroundColor: darkBackgroundColor,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow = window
  bindDevToolsShortcut(window)

  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null
  })

  const startUrl = process.env.ELECTRON_START_URL
  if (startUrl) {
    window.loadURL(startUrl)
    return window
  }

  window.loadURL('app://local/index.html')
  return window
}

function getMainWindow() {
  return mainWindow
}

function hasOpenWindows() {
  return BrowserWindow.getAllWindows().length > 0
}

function sendToMainWindow(channel, payload) {
  mainWindow?.webContents.send(channel, payload)
}

module.exports = {
  createMainWindow,
  getMainWindow,
  hasOpenWindows,
  sendToMainWindow,
  setWindowsAppId
}
