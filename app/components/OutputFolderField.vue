<script setup lang="ts">
const { outputDir, isConverting = false } = defineProps<{
  outputDir: string
  isConverting?: boolean
}>()

const emit = defineEmits<{
  'choose-directory': []
  'update:outputDir': [value: string]
}>()
</script>

<template>
  <div class="space-y-2">
    <label class="text-sm font-medium" for="output-folder">Output folder</label>
    <div class="flex gap-2">
      <UiInput
        id="output-folder"
        :disabled="isConverting"
        :model-value="outputDir"
        placeholder="Choose a folder"
        @update:model-value="emit('update:outputDir', $event)"
      />
      <UiButton
        class="shrink-0"
        :disabled="isConverting"
        size="icon"
        title="Choose folder"
        variant="secondary"
        @click="emit('choose-directory')"
      >
        <Icon class="h-4 w-4" name="lucide:folder-open" />
      </UiButton>
    </div>
  </div>
</template>
