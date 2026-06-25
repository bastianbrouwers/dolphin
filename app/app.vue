<script setup lang="ts">
import appIcon from './assets/images/icon-app.png'

const {
  isElectron
} = useElectronBridge()

const {
  activeTab
} = useConverterTabs()

const {
  canConvert,
  chooseDirectory,
  convert,
  isConverting,
  outputDir,
  resultPath,
  runConvert,
  status,
  url
} = useAudioConverter()

const {
  canSearch,
  isSearching,
  searchError,
  searchQuery,
  searchResults,
  searchVideos
} = useYouTubeSearch()

const {
  canOpenResult,
  isOpeningResult,
  openResult
} = useConversionResult({
  isConverting,
  isElectron,
  resultPath,
  status
})

async function downloadSearchResult(item: YouTubeSearchItem) {
  url.value = item.url
  await runConvert(item.url)
}

const {
  isLightMode,
  toggleTheme
} = useThemeMode()

const {
  closeWindow,
  minimizeWindow,
  toggleMaximizeWindow
} = useWindowControls()
</script>

<template>
  <main class="min-h-[100dvh] bg-background">
    <AppTitleBar
      :app-icon="appIcon"
      :is-light-mode="isLightMode"
      @close="closeWindow"
      @minimize="minimizeWindow"
      @toggle-maximize="toggleMaximizeWindow"
      @toggle-theme="toggleTheme"
    />

    <section class="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-3xl flex-col justify-center px-6 py-10">
      <div class="space-y-8">
        <div class="space-y-3">
          <div class="inline-flex items-center rounded-md border px-2.5 py-1 text-xs text-muted-foreground">
            Desktop converter
          </div>
          <div class="space-y-2">
            <h1 class="text-3xl font-semibold tracking-normal sm:text-4xl">
              Convert your favorite Videos to MP3
            </h1>
            <p class="max-w-2xl text-sm leading-6 text-muted-foreground">
              Paste a URL, choose a folder, and keep the finished audio file on your machine.
            </p>
          </div>
        </div>

        <ConverterCard
          v-model:active-tab="activeTab"
          v-model:output-dir="outputDir"
          v-model:search-query="searchQuery"
          v-model:url="url"
          :can-convert="canConvert"
          :can-search="canSearch"
          :is-converting="isConverting"
          :is-electron="isElectron"
          :is-searching="isSearching"
          :search-error="searchError"
          :search-results="searchResults"
          @choose-directory="chooseDirectory"
          @convert="convert"
          @download-search-result="downloadSearchResult"
          @search="searchVideos"
        />

        <ConversionStatus
          :can-open-result="canOpenResult"
          :is-opening-result="isOpeningResult"
          :result-path="resultPath"
          :status="status"
          @open-result="openResult"
        />
      </div>
    </section>
  </main>
</template>
