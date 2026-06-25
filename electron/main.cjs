const { app } = require('electron')
const { registerAppScheme, registerRendererProtocol } = require('./app-protocol.cjs')
const {
  createMainWindow,
  getMainWindow,
  hasOpenWindows,
  sendToMainWindow,
  setWindowsAppId
} = require('./main-window.cjs')
const { registerIpcHandlers } = require('./ipc-handlers.cjs')

registerAppScheme()
setWindowsAppId()

registerIpcHandlers({
  getMainWindow,
  sendProgress: (progress) => sendToMainWindow('convert:progress', progress)
})

app.whenReady().then(() => {
  registerRendererProtocol()
  createMainWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (!hasOpenWindows()) createMainWindow()
})
