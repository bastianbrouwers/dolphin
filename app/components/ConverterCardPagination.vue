<script setup lang="ts">
type ConverterTab = 'link' | 'search'

const { activeTab } = defineProps<{
  activeTab: ConverterTab
}>()

const emit = defineEmits<{
  'update:activeTab': [value: ConverterTab]
}>()
</script>

<template>
  <div aria-label="Converter mode" class="grid grid-cols-2 rounded-md bg-secondary p-1" role="tablist">
    <button
      :aria-selected="activeTab === 'link'"
      class="h-8 rounded-sm text-sm font-medium transition-colors"
      :class="activeTab === 'link' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
      role="tab"
      type="button"
      @click="emit('update:activeTab', 'link')"
    >
      Link
    </button>
    <button
      :aria-selected="activeTab === 'search'"
      class="h-8 rounded-sm text-sm font-medium transition-colors"
      :class="activeTab === 'search' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
      role="tab"
      type="button"
      @click="emit('update:activeTab', 'search')"
    >
      Search
    </button>
  </div>
</template>
