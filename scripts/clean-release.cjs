const fs = require('node:fs')
const path = require('node:path')

const mode = process.argv[2] || 'portable'
const releaseDir = path.join(__dirname, '..', 'release')
const packageJson = require('../package.json')
const productName = packageJson.build?.productName || packageJson.productName || packageJson.name
const version = packageJson.version
const expectedPortable = `${productName} ${version}.exe`
const expectedInstaller = `${productName} Setup ${version}.exe`

function removePath(filePath) {
  if (!fs.existsSync(filePath)) return
  fs.rmSync(filePath, { recursive: true, force: true })
}

if (fs.existsSync(releaseDir)) {
  for (const entry of fs.readdirSync(releaseDir, { withFileTypes: true })) {
    const fullPath = path.join(releaseDir, entry.name)

    if (entry.isDirectory() && /^win-.+-unpacked$/.test(entry.name)) {
      removePath(fullPath)
      continue
    }

    if (!entry.isFile()) continue

    if (
      entry.name === 'builder-debug.yml' ||
      entry.name === 'builder-effective-config.yaml' ||
      entry.name.endsWith('.blockmap') ||
      (mode === 'portable' && entry.name.endsWith('.exe') && entry.name !== expectedPortable) ||
      (mode === 'installer' && entry.name.endsWith('.exe') && entry.name !== expectedInstaller)
    ) {
      removePath(fullPath)
    }
  }
}
