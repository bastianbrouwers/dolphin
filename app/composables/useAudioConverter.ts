export function useAudioConverter() {
  const url = ref('')
  const outputDir = ref('')
  const status = ref<ConvertProgress>({
    phase: 'starting',
    text: 'Ready when you are.',
    percent: 0
  })
  const resultPath = ref('')
  const isConverting = ref(false)
  const canConvert = computed(() => url.value.trim().length > 0 && outputDir.value.trim().length > 0 && !isConverting.value)

  let removeProgressListener: (() => void) | undefined

  async function chooseDirectory() {
    if (!window.ytmp3) return

    const selected = await window.ytmp3.chooseDirectory()
    if (selected) outputDir.value = selected
  }

  async function runConvert(targetUrl: string) {
    const trimmedUrl = targetUrl.trim()

    if (!window.ytmp3 || !trimmedUrl || !outputDir.value.trim() || isConverting.value) return

    isConverting.value = true
    resultPath.value = ''
    status.value = {
      phase: 'starting',
      text: 'Preparing conversion...',
      percent: 4
    }

    try {
      const result = await window.ytmp3.convert({
        url: trimmedUrl,
        outputDir: outputDir.value
      })

      if (result.ok) {
        resultPath.value = result.filePath || ''
        status.value = {
          phase: 'done',
          text: result.outputFormat === 'audio' ? 'Source audio saved successfully.' : 'MP3 saved successfully.',
          percent: 100,
          outputFormat: result.outputFormat
        }
        return
      }

      status.value = {
        phase: 'error',
        text: result.error || 'Conversion failed.',
        percent: status.value.percent || 0
      }
    } catch (error) {
      status.value = {
        phase: 'error',
        text: error instanceof Error ? error.message : 'Conversion failed.',
        percent: status.value.percent || 0
      }
    } finally {
      isConverting.value = false
    }
  }

  async function convert() {
    await runConvert(url.value)
  }

  onMounted(async () => {
    if (!window.ytmp3) return

    outputDir.value = await window.ytmp3.getDefaultDownloads()
    removeProgressListener = window.ytmp3.onProgress((event) => {
      status.value = event
    })
  })

  onUnmounted(() => {
    removeProgressListener?.()
  })

  return {
    canConvert,
    chooseDirectory,
    convert,
    isConverting,
    outputDir,
    resultPath,
    runConvert,
    status,
    url
  }
}
