import type { ComputedRef, Ref } from 'vue'

interface UseConversionResultOptions {
  isConverting: Ref<boolean>
  isElectron: ComputedRef<boolean>
  resultPath: Ref<string>
  status: Ref<ConvertProgress>
}

export function useConversionResult({ isConverting, isElectron, resultPath, status }: UseConversionResultOptions) {
  const isOpeningResult = ref(false)
  const canOpenResult = computed(() => Boolean(isElectron.value && resultPath.value && !isConverting.value))

  watch(isConverting, (converting) => {
    if (converting) isOpeningResult.value = false
  })

  async function openResult() {
    if (!window.dolphin || !canOpenResult.value || isOpeningResult.value) return

    isOpeningResult.value = true

    try {
      const result = await window.dolphin.openFile(resultPath.value)
      if (result.ok) return

      status.value = {
        phase: 'error',
        text: result.error || 'Could not open downloaded file.',
        percent: status.value.percent || 100,
        outputFormat: status.value.outputFormat
      }
    } catch (error) {
      status.value = {
        phase: 'error',
        text: error instanceof Error ? error.message : 'Could not open downloaded file.',
        percent: status.value.percent || 100,
        outputFormat: status.value.outputFormat
      }
    } finally {
      isOpeningResult.value = false
    }
  }

  return {
    canOpenResult,
    isOpeningResult,
    openResult
  }
}
