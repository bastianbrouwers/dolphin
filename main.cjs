const { app, BrowserWindow, dialog, ipcMain, net, protocol } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const { pathToFileURL } = require('node:url')

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

const packagedYtDlpDir = path.join(
  process.resourcesPath || '',
  'app.asar.unpacked',
  'node_modules',
  'youtube-dl-exec',
  'bin'
)

if (!process.env.YOUTUBE_DL_DIR && fs.existsSync(packagedYtDlpDir)) {
  process.env.YOUTUBE_DL_DIR = packagedYtDlpDir
}

const youtubeDl = require('youtube-dl-exec')

const execFileAsync = promisify(execFile)
let mainWindow

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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 680,
    minWidth: 720,
    minHeight: 560,
    title: 'Dolphin',
    backgroundColor: '#020817',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const startUrl = process.env.ELECTRON_START_URL
  if (startUrl) {
    mainWindow.loadURL(startUrl)
    return
  }

  mainWindow.loadURL('app://local/index.html')
}

function sendProgress(progress) {
  mainWindow?.webContents.send('convert:progress', progress)
}

function safeTemplate() {
  return '%(title).180B [%(id)s].%(ext)s'
}

const audioExtensions = new Set(['.mp3', '.webm', '.m4a', '.opus', '.ogg', '.aac', '.wav', '.flac'])

function listAudioFiles(outputDir) {
  try {
    return fs.readdirSync(outputDir)
      .filter((file) => audioExtensions.has(path.extname(file).toLowerCase()))
      .map((file) => {
        const filePath = path.join(outputDir, file)
        const stats = fs.statSync(filePath)
        return {
          filePath,
          extension: path.extname(file).toLowerCase(),
          modifiedAt: stats.mtimeMs,
          size: stats.size
        }
      })
  } catch {
    return []
  }
}

function snapshotAudioFiles(outputDir) {
  return new Map(listAudioFiles(outputDir).map((file) => [file.filePath, file]))
}

function findCompletedAudio(outputDir, beforeFiles, fallbackPath, preferredExtension) {
  const cleanFallbackPath = String(fallbackPath || '').replace(/^"|"$/g, '')
  if (cleanFallbackPath && fs.existsSync(cleanFallbackPath)) return cleanFallbackPath

  const changedFiles = listAudioFiles(outputDir)
    .filter((file) => {
      const previous = beforeFiles.get(file.filePath)
      return !previous || previous.modifiedAt !== file.modifiedAt || previous.size !== file.size
    })
    .sort((a, b) => {
      if (preferredExtension && a.extension === preferredExtension && b.extension !== preferredExtension) return -1
      if (preferredExtension && b.extension === preferredExtension && a.extension !== preferredExtension) return 1
      return b.modifiedAt - a.modifiedAt
    })

  if (changedFiles[0]) return changedFiles[0].filePath
  return ''
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function findExecutable(command) {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execFileAsync('where.exe', [command], { windowsHide: true })
      return stdout.split(/\r?\n/).find(Boolean) || ''
    }

    const { stdout } = await execFileAsync('sh', ['-c', `command -v ${command}`])
    return stdout.trim().split(/\r?\n/).find(Boolean) || ''
  } catch {
    return ''
  }
}

async function getFfmpegTools() {
  const [ffmpegPath, ffprobePath] = await Promise.all([
    findExecutable(process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'),
    findExecutable(process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe')
  ])

  return {
    ffmpegPath,
    ffprobePath,
    ffmpegLocation: ffmpegPath ? path.dirname(ffmpegPath) : ''
  }
}

async function waitForCompletedAudio(outputDir, beforeFiles, fallbackPath, preferredExtension) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const completedPath = findCompletedAudio(outputDir, beforeFiles, fallbackPath, preferredExtension)
    if (completedPath) return completedPath
    await wait(250)
  }

  return ''
}

function formatConversionError(error) {
  const rawMessage = String(error.stderr || error.message || 'Conversion failed.')
  return rawMessage.includes('\n') ? rawMessage.split('\n').filter(Boolean).at(-1) : rawMessage
}

function formatDuration(duration) {
  const totalSeconds = Number(duration || 0)
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return ''

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function normalizeSearchEntry(entry) {
  const id = String(entry?.id || '')
  const url = entry?.webpage_url || entry?.url || (id ? `https://www.youtube.com/watch?v=${id}` : '')
  const thumbnails = Array.isArray(entry?.thumbnails) ? entry.thumbnails : []
  const thumbnail = entry?.thumbnail || thumbnails.at(-1)?.url || ''

  return {
    id: id || url,
    title: String(entry?.title || 'Untitled video'),
    url,
    channel: entry?.channel || entry?.uploader || '',
    duration: formatDuration(entry?.duration),
    thumbnail
  }
}

ipcMain.handle('dialog:chooseDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  })

  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('app:getDefaultDownloads', () => app.getPath('downloads'))

ipcMain.handle('search:youtube', async (_event, payload) => {
  const query = String(payload?.query || '').trim()
  if (!query) return { ok: false, error: 'Type a search term first.' }

  try {
    const result = await youtubeDl(`ytsearch8:${query}`, {
      dumpSingleJson: true,
      flatPlaylist: true,
      skipDownload: true,
      noWarnings: true
    })
    const entries = Array.isArray(result?.entries) ? result.entries : []
    const items = entries
      .map(normalizeSearchEntry)
      .filter((item) => item.url)

    return { ok: true, items }
  } catch (error) {
    return { ok: false, error: formatConversionError(error) }
  }
})

ipcMain.handle('convert:start', async (_event, payload) => {
  const url = String(payload?.url || '').trim()
  const outputDir = String(payload?.outputDir || '').trim()

  if (!url) return { ok: false, error: 'Paste a YouTube URL first.' }
  if (!outputDir) return { ok: false, error: 'Choose an output folder first.' }

  try {
    fs.mkdirSync(outputDir, { recursive: true })
  } catch (error) {
    return { ok: false, error: `Cannot use that output folder: ${error.message}` }
  }

  sendProgress({ phase: 'starting', percent: 3, text: 'Checking audio tools...' })
  const ffmpegTools = await getFfmpegTools()
  const canConvertToMp3 = Boolean(ffmpegTools.ffmpegPath && ffmpegTools.ffprobePath)
  const outputFormat = canConvertToMp3 ? 'mp3' : 'audio'
  const preferredExtension = canConvertToMp3 ? '.mp3' : ''

  const outputTemplate = path.join(outputDir, safeTemplate())
  const beforeFiles = snapshotAudioFiles(outputDir)
  let finalPath = ''

  try {
    sendProgress({
      phase: 'starting',
      percent: 5,
      text: canConvertToMp3
        ? 'Checking video metadata...'
        : 'ffmpeg not found. Downloading source audio instead...',
      outputFormat
    })

    const options = {
      output: outputTemplate,
      noPlaylist: true,
      restrictFilenames: true,
      newline: true,
      progress: true
    }

    if (canConvertToMp3) {
      Object.assign(options, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: 0,
        ffmpegLocation: ffmpegTools.ffmpegLocation
      })
    } else {
      Object.assign(options, {
        format: 'bestaudio/best'
      })
    }

    const subprocess = youtubeDl.exec(url, options)

    const handleOutput = (chunk) => {
      const text = chunk.toString()
      const percentMatch = text.match(/\[download\]\s+(\d+(?:\.\d+)?)%/)
      const destinationMatch = text.match(/\[ExtractAudio\] Destination: (.+)$/m)

      if (destinationMatch) finalPath = destinationMatch[1].trim()

      if (percentMatch) {
        const percent = Math.min(94, Math.max(8, Number(percentMatch[1])))
        sendProgress({ phase: 'downloading', percent, text: `Downloading... ${percent.toFixed(1)}%`, outputFormat })
        return
      }

      if (text.includes('[ExtractAudio]')) {
        sendProgress({ phase: 'converting', percent: 96, text: 'Converting audio to MP3...', outputFormat })
      }
    }

    subprocess.stdout?.on('data', handleOutput)
    subprocess.stderr?.on('data', handleOutput)

    await subprocess

    finalPath = await waitForCompletedAudio(outputDir, beforeFiles, finalPath, preferredExtension)
    if (!finalPath) {
      throw new Error('Download finished, but no audio file was created.')
    }

    const doneText = canConvertToMp3 ? 'MP3 saved successfully.' : 'Source audio saved successfully.'
    sendProgress({ phase: 'done', percent: 100, text: doneText, outputFormat })
    return { ok: true, filePath: finalPath, outputFormat }
  } catch (error) {
    const completedPath = await waitForCompletedAudio(outputDir, beforeFiles, finalPath, preferredExtension)
    if (completedPath) {
      const doneText = canConvertToMp3 ? 'MP3 saved successfully.' : 'Source audio saved successfully.'
      sendProgress({ phase: 'done', percent: 100, text: doneText, outputFormat })
      return { ok: true, filePath: completedPath, outputFormat }
    }

    const message = formatConversionError(error)
    sendProgress({ phase: 'error', percent: 0, text: message })
    return { ok: false, error: message }
  }
})

app.whenReady().then(() => {
  registerRendererProtocol()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
