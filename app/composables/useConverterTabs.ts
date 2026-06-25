type ConverterTab = 'link' | 'search'

export function useConverterTabs() {
  const activeTab = ref<ConverterTab>('link')

  return {
    activeTab
  }
}
