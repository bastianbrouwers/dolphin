<script setup lang="ts">
const {
  status,
  resultPath = '',
  canOpenResult = false,
  isOpeningResult = false
} = defineProps<{
  status: ConvertProgress
  resultPath?: string
  canOpenResult?: boolean
  isOpeningResult?: boolean
}>()

const emit = defineEmits<{
  'open-result': []
}>()
</script>

<template>
  <div class="space-y-3 rounded-lg border bg-card p-5 shadow-sm">
    <div class="flex items-center justify-between gap-4">
      <div class="min-w-0">
        <p class="text-sm font-medium">Status</p>
        <p class="truncate text-sm text-muted-foreground">{{ status.text }}</p>
      </div>
      <UiButton
        v-if="resultPath"
        class="shrink-0"
        :disabled="!canOpenResult || isOpeningResult"
        size="icon"
        title="Play downloaded file"
        variant="secondary"
        @click="emit('open-result')"
      >
        <Icon v-if="isOpeningResult" class="h-4 w-4 animate-spin" name="lucide:loader-2" />
        <Icon v-else class="h-4 w-4" name="lucide:play" />
      </UiButton>
    </div>
    <UiProgress :model-value="status.percent" />
    <p v-if="resultPath" class="truncate text-xs text-muted-foreground">
      {{ resultPath }}
    </p>
  </div>
</template>
