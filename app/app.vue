<script setup lang="ts">
import { Download, FolderOpen, Loader2, Maximize2, Minus, Moon, Music2, Play, Search, Sun, X } from 'lucide-vue-next'
import appIcon from './assets/images/icon-app.png'

const url = ref('')
const outputDir = ref('')
const activeTab = ref<'link' | 'search'>('link')
const searchQuery = ref('')
const searchResults = ref<YouTubeSearchItem[]>([])
const searchError = ref('')
const status = ref<ConvertProgress>({
  phase: 'starting',
  text: 'Ready when you are.',
  percent: 0
})
const resultPath = ref('')
const isConverting = ref(false)
const isSearching = ref(false)
const isOpeningResult = ref(false)
const isLightMode = ref(false)
const isElectron = computed(() => Boolean(window.ytmp3))
const canConvert = computed(() => url.value.trim().length > 0 && outputDir.value.trim().length > 0 && !isConverting.value)
const canSearch = computed(() => searchQuery.value.trim().length > 0 && !isSearching.value)
const canOpenResult = computed(() => Boolean(isElectron.value && resultPath.value && !isConverting.value))

onMounted(async () => {
  document.documentElement.classList.add('dark')

  if (!window.ytmp3) return

  outputDir.value = await window.ytmp3.getDefaultDownloads()
  window.ytmp3.onProgress((event) => {
    status.value = event
  })
})

async function chooseDirectory() {
  if (!window.ytmp3) return
  const selected = await window.ytmp3.chooseDirectory()
  if (selected) outputDir.value = selected
}

async function runConvert(targetUrl: string) {
  if (!window.ytmp3 || !targetUrl.trim() || !outputDir.value.trim() || isConverting.value) return

  isConverting.value = true
  isOpeningResult.value = false
  resultPath.value = ''
  status.value = {
    phase: 'starting',
    text: 'Preparing conversion...',
    percent: 4
  }

  const result = await window.ytmp3.convert({
    url: targetUrl.trim(),
    outputDir: outputDir.value
  })

  isConverting.value = false

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
}

async function convert() {
  await runConvert(url.value)
}

async function searchVideos() {
  if (!window.ytmp3 || !canSearch.value) return

  isSearching.value = true
  searchError.value = ''

  const result = await window.ytmp3.search({
    query: searchQuery.value.trim()
  })

  isSearching.value = false

  if (result.ok) {
    searchResults.value = result.items || []
    if (searchResults.value.length === 0) searchError.value = 'No videos found.'
    return
  }

  searchResults.value = []
  searchError.value = result.error || 'Search failed.'
}

async function downloadSearchResult(item: YouTubeSearchItem) {
  url.value = item.url
  await runConvert(item.url)
}

async function openResult() {
  if (!window.ytmp3 || !canOpenResult.value || isOpeningResult.value) return

  isOpeningResult.value = true

  try {
    const result = await window.ytmp3.openFile(resultPath.value)
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

function toggleTheme() {
  isLightMode.value = !isLightMode.value
  document.documentElement.classList.toggle('dark', !isLightMode.value)
}

function minimizeWindow() {
  window.ytmp3?.minimizeWindow()
}

function toggleMaximizeWindow() {
  window.ytmp3?.toggleMaximizeWindow()
}

function closeWindow() {
  window.ytmp3?.closeWindow()
}
</script>

<template>
  <main class="min-h-screen bg-background">
    <div class="drag-region flex h-12 items-center justify-between border-b px-5">
      <div class="flex items-center gap-2 text-sm font-medium">
        <img
          alt=""
          class="h-5 w-5 rounded-[4px]"
          :src="appIcon"
        >
        Dolphin
      </div>
      <div class="no-drag flex items-center gap-1">
        <Button
          size="icon"
          :title="isLightMode ? 'Switch to dark mode' : 'Switch to light mode'"
          variant="ghost"
          @click="toggleTheme"
        >
          <Moon v-if="isLightMode" class="h-4 w-4" />
          <Sun v-else class="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          title="Minimize"
          variant="ghost"
          @click="minimizeWindow"
        >
          <Minus class="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          title="Fullscreen"
          variant="ghost"
          @click="toggleMaximizeWindow"
        >
          <Maximize2 class="h-4 w-4" />
        </Button>
        <Button
          class="hover:bg-destructive hover:text-destructive-foreground"
          size="icon"
          title="Close"
          variant="ghost"
          @click="closeWindow"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <section class="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col justify-center px-6 py-10">
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

        <div class="space-y-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <div class="grid grid-cols-2 rounded-md bg-secondary p-1">
            <button
              class="h-8 rounded-sm text-sm font-medium transition-colors"
              :class="activeTab === 'link' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
              type="button"
              @click="activeTab = 'link'"
            >
              Link
            </button>
            <button
              class="h-8 rounded-sm text-sm font-medium transition-colors"
              :class="activeTab === 'search' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
              type="button"
              @click="activeTab = 'search'"
            >
              Search
            </button>
          </div>

          <div v-if="activeTab === 'link'" class="space-y-2">
            <label class="text-sm font-medium" for="youtube-url">YouTube URL</label>
            <Input
              id="youtube-url"
              v-model="url"
              :disabled="isConverting"
              placeholder="https://www.youtube.com/watch?v=..."
              type="url"
            />
          </div>

          <div v-else class="space-y-3">
            <label class="text-sm font-medium" for="youtube-search">Search YouTube</label>
            <form class="flex gap-2" @submit.prevent="searchVideos">
              <Input
                id="youtube-search"
                v-model="searchQuery"
                :disabled="isSearching || isConverting"
                placeholder="Search for a song, artist, or video"
                type="search"
              />
              <Button
                class="shrink-0"
                :disabled="!canSearch || isConverting || !isElectron"
                size="icon"
                title="Search"
                type="submit"
                variant="secondary"
              >
                <Loader2 v-if="isSearching" class="h-4 w-4 animate-spin" />
                <Search v-else class="h-4 w-4" />
              </Button>
            </form>

            <div v-if="searchError" class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {{ searchError }}
            </div>

            <div v-if="searchResults.length > 0" class="max-h-80 space-y-2 overflow-y-auto pr-1">
              <div
                v-for="item in searchResults"
                :key="item.id"
                class="flex items-center gap-3 rounded-md border bg-background p-2"
              >
                <img
                  v-if="item.thumbnail"
                  :alt="item.title"
                  class="h-14 w-24 shrink-0 rounded-sm object-cover"
                  :src="item.thumbnail"
                >
                <div v-else class="flex h-14 w-24 shrink-0 items-center justify-center rounded-sm bg-secondary">
                  <Music2 class="h-4 w-4 text-muted-foreground" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ item.title }}</p>
                  <p class="truncate text-xs text-muted-foreground">
                    {{ [item.channel, item.duration].filter(Boolean).join(' - ') }}
                  </p>
                </div>
                <UiButton
                  class="shrink-0"
                  :disabled="isConverting || !outputDir || !isElectron"
                  size="icon"
                  title="Download as MP3"
                  variant="ghost"
                  @click="downloadSearchResult(item)"
                >
                  <Download class="h-4 w-4" />
                </UiButton>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium" for="output-folder">Output folder</label>
            <div class="flex gap-2">
              <Input
                id="output-folder"
                v-model="outputDir"
                :disabled="isConverting"
                placeholder="Choose a folder"
              />
              <Button
                class="shrink-0"
                :disabled="isConverting || !isElectron"
                size="icon"
                title="Choose folder"
                variant="secondary"
                @click="chooseDirectory"
              >
                <FolderOpen class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            v-if="activeTab === 'link'"
            class="w-full gap-2"
            :disabled="!canConvert || !isElectron"
            @click="convert"
          >
            <Loader2 v-if="isConverting" class="h-4 w-4 animate-spin" />
            <Download v-else class="h-4 w-4" />
            Convert / Download Audio
          </Button>

          <div v-if="!isElectron" class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Open this app in Electron to enable local conversion.
          </div>
        </div>

        <div class="space-y-3 rounded-lg border bg-card p-5 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0">
              <p class="text-sm font-medium">Status</p>
              <p class="truncate text-sm text-muted-foreground">{{ status.text }}</p>
            </div>
            <Button
              v-if="resultPath"
              class="shrink-0"
              :disabled="!canOpenResult || isOpeningResult"
              size="icon"
              title="Play downloaded file"
              variant="secondary"
              @click="openResult"
            >
              <Loader2 v-if="isOpeningResult" class="h-4 w-4 animate-spin" />
              <Play v-else class="h-4 w-4" />
            </Button>
          </div>
          <Progress :model-value="status.percent" />
          <p v-if="resultPath" class="truncate text-xs text-muted-foreground">
            {{ resultPath }}
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
