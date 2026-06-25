const fs = require('node:fs')
const path = require('node:path')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')

function configureYtDlpEnvironment() {
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
}

configureYtDlpEnvironment()

const youtubeDl = require('youtube-dl-exec')
const execFileAsync = promisify(execFile)

const audioExtensions = new Set(['.mp3', '.webm', '.m4a', '.opus', '.ogg', '.aac', '.wav', '.flac'])
const youtubeSearchResultLimit = 8
const youtubeVideoIdPattern = /^[a-zA-Z0-9_-]{11}$/

function safeTemplate() {
  return '%(title).180B [%(id)s].%(ext)s'
}

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

function getValidYouTubeVideoId(value) {
  const id = String(value || '').trim()
  return youtubeVideoIdPattern.test(id) ? id : ''
}

function extractYouTubeVideoId(value) {
  const input = String(value || '').trim()
  const rawId = getValidYouTubeVideoId(input)
  if (rawId) return rawId

  let url
  try {
    url = new URL(input)
  } catch {
    return ''
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
  const pathParts = url.pathname.split('/').filter(Boolean)

  if (hostname === 'youtu.be') {
    return getValidYouTubeVideoId(pathParts[0])
  }

  if (hostname !== 'youtube.com' && !hostname.endsWith('.youtube.com')) {
    return ''
  }

  if (url.pathname === '/watch') {
    return getValidYouTubeVideoId(url.searchParams.get('v'))
  }

  if (['embed', 'live', 'shorts'].includes(pathParts[0])) {
    return getValidYouTubeVideoId(pathParts[1])
  }

  return ''
}

function toSingleYouTubeVideoUrl(value) {
  const videoId = extractYouTubeVideoId(value)
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : ''
}

function normalizeSearchEntry(entry) {
  const videoId = extractYouTubeVideoId(entry?.id) || extractYouTubeVideoId(entry?.webpage_url) || extractYouTubeVideoId(entry?.url)
  if (!videoId) return null

  const url = toSingleYouTubeVideoUrl(videoId)
  const thumbnails = Array.isArray(entry?.thumbnails) ? entry.thumbnails : []
  const thumbnail = entry?.thumbnail || thumbnails.at(-1)?.url || ''

  return {
    id: videoId,
    title: String(entry?.title || 'Untitled video'),
    url,
    channel: entry?.channel || entry?.uploader || '',
    duration: formatDuration(entry?.duration),
    thumbnail
  }
}

function emitProgress(onProgress, progress) {
  if (typeof onProgress === 'function') {
    onProgress(progress)
  }
}

async function searchYouTube(payload) {
  const query = String(payload?.query || '').trim()
  if (!query) return { ok: false, error: 'Type a search term first.' }

  try {
    const result = await youtubeDl(`ytsearch${youtubeSearchResultLimit * 2}:${query}`, {
      dumpSingleJson: true,
      flatPlaylist: true,
      skipDownload: true,
      noWarnings: true
    })
    const entries = Array.isArray(result?.entries) ? result.entries : []
    const items = entries
      .map(normalizeSearchEntry)
      .filter(Boolean)
      .slice(0, youtubeSearchResultLimit)

    return { ok: true, items }
  } catch (error) {
    return { ok: false, error: formatConversionError(error) }
  }
}

async function convertYouTubeToAudio(payload, { onProgress } = {}) {
  const url = String(payload?.url || '').trim()
  const outputDir = String(payload?.outputDir || '').trim()
  const videoUrl = toSingleYouTubeVideoUrl(url)

  if (!url) return { ok: false, error: 'Paste a YouTube URL first.' }
  if (!videoUrl) return { ok: false, error: 'Paste a single YouTube video URL, not a channel or playlist.' }
  if (!outputDir) return { ok: false, error: 'Choose an output folder first.' }

  try {
    fs.mkdirSync(outputDir, { recursive: true })
  } catch (error) {
    return { ok: false, error: `Cannot use that output folder: ${error.message}` }
  }

  emitProgress(onProgress, { phase: 'starting', percent: 3, text: 'Checking audio tools...' })
  const ffmpegTools = await getFfmpegTools()
  const canConvertToMp3 = Boolean(ffmpegTools.ffmpegPath && ffmpegTools.ffprobePath)
  const outputFormat = canConvertToMp3 ? 'mp3' : 'audio'
  const preferredExtension = canConvertToMp3 ? '.mp3' : ''

  const outputTemplate = path.join(outputDir, safeTemplate())
  const beforeFiles = snapshotAudioFiles(outputDir)
  let finalPath = ''

  try {
    emitProgress(onProgress, {
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

    const subprocess = youtubeDl.exec(videoUrl, options)

    const handleOutput = (chunk) => {
      const text = chunk.toString()
      const percentMatch = text.match(/\[download\]\s+(\d+(?:\.\d+)?)%/)
      const destinationMatch = text.match(/\[ExtractAudio\] Destination: (.+)$/m)

      if (destinationMatch) finalPath = destinationMatch[1].trim()

      if (percentMatch) {
        const percent = Math.min(94, Math.max(8, Number(percentMatch[1])))
        emitProgress(onProgress, {
          phase: 'downloading',
          percent,
          text: `Downloading... ${percent.toFixed(1)}%`,
          outputFormat
        })
        return
      }

      if (text.includes('[ExtractAudio]')) {
        emitProgress(onProgress, {
          phase: 'converting',
          percent: 96,
          text: 'Converting audio to MP3...',
          outputFormat
        })
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
    emitProgress(onProgress, { phase: 'done', percent: 100, text: doneText, outputFormat })
    return { ok: true, filePath: finalPath, outputFormat }
  } catch (error) {
    const completedPath = await waitForCompletedAudio(outputDir, beforeFiles, finalPath, preferredExtension)
    if (completedPath) {
      const doneText = canConvertToMp3 ? 'MP3 saved successfully.' : 'Source audio saved successfully.'
      emitProgress(onProgress, { phase: 'done', percent: 100, text: doneText, outputFormat })
      return { ok: true, filePath: completedPath, outputFormat }
    }

    const message = formatConversionError(error)
    emitProgress(onProgress, { phase: 'error', percent: 0, text: message })
    return { ok: false, error: message }
  }
}

module.exports = {
  convertYouTubeToAudio,
  searchYouTube
}
