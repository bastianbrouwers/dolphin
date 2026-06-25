<script setup lang="ts">
const {
  searchQuery,
  searchResults,
  searchError = '',
  isSearching = false,
  isConverting = false,
  canSearch = false,
  isElectron = false,
  outputDir = ''
} = defineProps<{
  searchQuery: string
  searchResults: YouTubeSearchItem[]
  searchError?: string
  isSearching?: boolean
  isConverting?: boolean
  canSearch?: boolean
  isElectron?: boolean
  outputDir?: string
}>()

const emit = defineEmits<{
  download: [item: YouTubeSearchItem]
  search: []
  'update:searchQuery': [value: string]
}>()
</script>

<template>
  <div class="space-y-3">
    <label class="text-sm font-medium" for="youtube-search">Search YouTube</label>
    <form class="flex gap-2" @submit.prevent="emit('search')">
      <UiInput
        id="youtube-search"
        :disabled="isSearching || isConverting"
        :model-value="searchQuery"
        placeholder="Search for a song, artist, or video"
        type="search"
        @update:model-value="emit('update:searchQuery', $event)"
      />
      <UiButton
        class="shrink-0"
        :disabled="!canSearch || isConverting || !isElectron"
        size="icon"
        title="Search"
        type="submit"
        variant="secondary"
      >
        <Icon v-if="isSearching" class="h-4 w-4 animate-spin" name="lucide:loader-2" />
        <Icon v-else class="h-4 w-4" name="lucide:search" />
      </UiButton>
    </form>

    <div v-if="searchError" class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {{ searchError }}
    </div>

    <div v-if="searchResults.length > 0" class="scrollbar-stable max-h-80 space-y-2 overflow-y-auto pr-1">
      <SearchResultItem
        v-for="item in searchResults"
        :key="item.id"
        :is-disabled="isConverting || !outputDir || !isElectron"
        :item="item"
        @download="emit('download', $event)"
      />
    </div>
  </div>
</template>
