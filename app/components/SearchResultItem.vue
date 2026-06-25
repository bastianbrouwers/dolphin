<script setup lang="ts">
const { item, isDisabled = false } = defineProps<{
  item: YouTubeSearchItem
  isDisabled?: boolean
}>()

const emit = defineEmits<{
  download: [item: YouTubeSearchItem]
}>()
</script>

<template>
  <div class="flex items-center gap-3 rounded-md border bg-background p-2">
    <a
      class="group/image block h-14 w-24 shrink-0 overflow-hidden rounded-sm transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      :href="item.url"
      rel="noopener noreferrer"
      target="_blank"
    >
      <img
        v-if="item.thumbnail"
        :alt="item.title"
        class="h-full w-full object-cover transition-transform group-hover/image:scale-105"
        :src="item.thumbnail"
      >
      <div v-else class="flex h-full w-full items-center justify-center bg-secondary transition-colors group-hover/image:bg-secondary/80">
        <Icon class="h-4 w-4 text-muted-foreground" name="lucide:music-2" />
      </div>
    </a>
    <div class="min-w-0 flex-1">
      <a
        class="inline-block max-w-full truncate align-bottom text-sm font-medium transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:text-white"
        :href="item.url"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ item.title }}
      </a>
      <p class="truncate text-xs text-muted-foreground">
        {{ [item.channel, item.duration].filter(Boolean).join(' - ') }}
      </p>
    </div>
    <UiButton
      class="shrink-0"
      :disabled="isDisabled"
      size="icon"
      title="Download as MP3"
      variant="ghost"
      @click="emit('download', item)"
    >
      <Icon class="h-4 w-4" name="lucide:download" />
    </UiButton>
  </div>
</template>
