export function useElectronBridge() {
  const isElectron = computed(() => typeof window !== 'undefined' && Boolean(window.dolphin))

  return {
    isElectron
  }
}
