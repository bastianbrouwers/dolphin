<script setup lang="ts">
type ConverterTab = 'link' | 'search'

const {
  activeTab,
  url,
  outputDir,
  searchQuery,
  searchResults,
  searchError = '',
  isConverting = false,
  isSearching = false,
  isElectron = false,
  canConvert = false,
  canSearch = false
} = defineProps<{
  activeTab: ConverterTab
  url: string
  outputDir: string
  searchQuery: string
  searchResults: YouTubeSearchItem[]
  searchError?: string
  isConverting?: boolean
  isSearching?: boolean
  isElectron?: boolean
  canConvert?: boolean
  canSearch?: boolean
}>()

const emit = defineEmits<{
  convert: []
  'choose-directory': []
  'download-search-result': [item: YouTubeSearchItem]
  search: []
  'update:activeTab': [value: ConverterTab]
  'update:outputDir': [value: string]
  'update:searchQuery': [value: string]
  'update:url': [value: string]
}>()
</script>

<template>
  <div class="space-y-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
    <div class="grid grid-cols-2 rounded-md bg-secondary p-1">
      <button
        class="h-8 rounded-sm text-sm font-medium transition-colors"
        :class="activeTab === 'link' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        type="button"
        @click="emit('update:activeTab', 'link')"
      >
        Link
      </button>
      <button
        class="h-8 rounded-sm text-sm font-medium transition-colors"
        :class="activeTab === 'search' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        type="button"
        @click="emit('update:activeTab', 'search')"
      >
        Search
      </button>
    </div>

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
      :is-electron="isElectron"
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
      :is-electron="isElectron"
      :output-dir="outputDir"
      @choose-directory="emit('choose-directory')"
      @update:output-dir="emit('update:outputDir', $event)"
    />

    <UiButton
      v-if="activeTab === 'link'"
      class="w-full"
      :disabled="!canConvert || !isElectron"
      @click="emit('convert')"
    >
      <Icon v-if="isConverting" class="h-4 w-4 animate-spin" name="lucide:loader-2" />
      <Icon v-else class="h-4 w-4" name="lucide:download" />
      Convert / Download Audio
    </UiButton>

    <div v-if="!isElectron" class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      Open this app in Electron to enable local conversion.
    </div>
  </div>
</template>
