export function useElectronBridge() {
  const isElectron = computed(() => typeof window !== 'undefined' && Boolean(window.ytmp3))

  return {
    isElectron
  }
}
