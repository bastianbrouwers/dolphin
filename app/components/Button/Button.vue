<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { buttonVariants, type ButtonVariants } from '.'

interface Props {
  as?: string
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button'
})
</script>

<template>
  <component
    :is="as"
    data-slot="button"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    :disabled="disabled"
    :type="type"
  >
    <slot />
  </component>
</template>
