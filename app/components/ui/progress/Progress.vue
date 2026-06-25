<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const { class: className, modelValue = 0 } = defineProps<{
  class?: HTMLAttributes['class']
  modelValue?: number
}>()

const normalizedValue = computed(() => Math.min(100, Math.max(0, modelValue || 0)))
</script>

<template>
  <div
    data-slot="progress"
    role="progressbar"
    :aria-valuenow="normalizedValue"
    aria-valuemin="0"
    aria-valuemax="100"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)"
  >
    <div
      data-slot="progress-indicator"
      class="h-full w-full flex-1 bg-primary transition-transform"
      :style="{ transform: `translateX(-${100 - normalizedValue}%)` }"
    />
  </div>
</template>
