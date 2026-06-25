<script setup lang="ts">
const { appIcon, isLightMode = false } = defineProps<{
  appIcon: string
  isLightMode?: boolean
}>()

const emit = defineEmits<{
  close: []
  minimize: []
  'toggle-maximize': []
  'toggle-theme': []
}>()
</script>

<template>
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
      <UiButton
        size="icon"
        :title="isLightMode ? 'Switch to dark mode' : 'Switch to light mode'"
        variant="ghost"
        @click="emit('toggle-theme')"
      >
        <Icon v-if="isLightMode" class="h-4 w-4" name="lucide:moon" />
        <Icon v-else class="h-4 w-4" name="lucide:sun" />
      </UiButton>
      <UiButton
        size="icon"
        title="Minimize"
        variant="ghost"
        @click="emit('minimize')"
      >
        <Icon class="h-4 w-4" name="lucide:minus" />
      </UiButton>
      <UiButton
        size="icon"
        title="Fullscreen"
        variant="ghost"
        @click="emit('toggle-maximize')"
      >
        <Icon class="h-4 w-4" name="lucide:maximize-2" />
      </UiButton>
      <UiButton
        size="icon"
        title="Close"
        variant="ghost"
        @click="emit('close')"
      >
        <Icon class="h-4 w-4" name="lucide:x" />
      </UiButton>
    </div>
  </div>
</template>
