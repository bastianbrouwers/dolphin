<script setup lang="ts">
type ConverterTab = 'link' | 'search'

const {
  url,
  outputDir,
  searchQuery,
  searchResults,
  searchError = '',
  isConverting = false,
  isSearching = false,
  canConvert = false,
  canSearch = false
} = defineProps<{
  url: string
  outputDir: string
  searchQuery: string
  searchResults: YouTubeSearchItem[]
  searchError?: string
  isConverting?: boolean
  isSearching?: boolean
  canConvert?: boolean
  canSearch?: boolean
}>()

const activeTab = ref<ConverterTab>('link')

const emit = defineEmits<{
  convert: []
  'choose-directory': []
  'download-search-result': [item: YouTubeSearchItem]
  search: []
  'update:outputDir': [value: string]
  'update:searchQuery': [value: string]
  'update:url': [value: string]
}>()
</script>

<template>
  <div class="space-y-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
    <ConverterCardPagination v-model:active-tab="activeTab" />

    <div v-if="activeTab === 'link'" class="space-y-2">
      <label class="text-sm font-medium" for="youtube-url">YouTube URL</label>
      <UiInput
        id="youtube-url"
        :disabled="isConverting"
        :model-value="url"
        placeholder="https://www.youtube.com/watch?v=..."
        type="url"
        @update:model-value="emit('update:url', $event)"
      />
    </div>

    <SearchPanel
      v-else
      :can-search="canSearch"
      :is-converting="isConverting"
      :is-searching="isSearching"
      :output-dir="outputDir"
      :search-error="searchError"
      :search-query="searchQuery"
      :search-results="searchResults"
      @download="emit('download-search-result', $event)"
      @search="emit('search')"
      @update:search-query="emit('update:searchQuery', $event)"
    />

    <OutputFolderField
      :is-converting="isConverting"
      :output-dir="outputDir"
      @choose-directory="emit('choose-directory')"
      @update:output-dir="emit('update:outputDir', $event)"
    />

    <UiButton
      v-if="activeTab === 'link'"
      class="w-full"
      :disabled="!canConvert"
      @click="emit('convert')"
    >
      <Icon v-if="isConverting" class="h-4 w-4 animate-spin" name="lucide:loader-2" />
      <Icon v-else class="h-4 w-4" name="lucide:download" />
      Convert / Download Audio
    </UiButton>
  </div>
</template>
