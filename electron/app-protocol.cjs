const { net, protocol } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

function registerAppScheme() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true
      }
    }
  ])
}

function getRendererRoot() {
  return path.join(__dirname, '..', '.output', 'public')
}

function registerRendererProtocol() {
  protocol.handle('app', (request) => {
    const url = new URL(request.url)
    const pathname = decodeURIComponent(url.pathname)
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
    const filePath = path.join(getRendererRoot(), relativePath)

    return net.fetch(pathToFileURL(filePath).toString())
  })
}

module.exports = {
  registerAppScheme,
  registerRendererProtocol
}
