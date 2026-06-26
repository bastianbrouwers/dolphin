export function useYouTubeSearch() {
  const searchQuery = ref('')
  const searchResults = ref<YouTubeSearchItem[]>([])
  const searchError = ref('')
  const isSearching = ref(false)
  const canSearch = computed(() => searchQuery.value.trim().length > 0 && !isSearching.value)

  async function search() {
    if (!window.dolphin || !canSearch.value) return

    isSearching.value = true
    searchError.value = ''

    try {
      const result = await window.dolphin.search({
        query: searchQuery.value.trim()
      })

      if (result.ok) {
        searchResults.value = result.items || []
        if (searchResults.value.length === 0) searchError.value = 'No videos found.'
        return
      }

      searchResults.value = []
      searchError.value = result.error || 'Search failed.'
    } catch (error) {
      searchResults.value = []
      searchError.value = error instanceof Error ? error.message : 'Search failed.'
    } finally {
      isSearching.value = false
    }
  }

  return {
    searchQuery,
    searchResults,
    searchError,
    isSearching,

    canSearch,

    search
  }
}

