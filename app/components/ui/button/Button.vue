<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const buttonBaseClasses =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0'

const buttonVariantClasses = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  destructive:
    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  outline:
    'border border-input bg-background shadow-sm hover:bg-secondary hover:text-secondary-foreground',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  ghost: 'hover:bg-secondary hover:text-secondary-foreground',
  link: 'text-primary underline-offset-4 hover:underline'
} as const

const buttonSizeClasses = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-10 rounded-md px-8',
  icon: 'h-9 w-9'
} as const

type ButtonVariant = keyof typeof buttonVariantClasses
type ButtonSize = keyof typeof buttonSizeClasses

const {
  as = 'button',
  type,
  variant,
  size,
  class: className,
  disabled
} = defineProps<{
  as?: string
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
  size?: ButtonSize
  class?: HTMLAttributes['class']
  disabled?: boolean
}>()

function buttonClasses(variant: ButtonVariant = 'default', size: ButtonSize = 'default') {
  return [
    buttonBaseClasses,
    buttonVariantClasses[variant],
    buttonSizeClasses[size]
  ].join(' ')
}
</script>

<template>
  <component
    :is="as"
    data-slot="button"
    :class="cn(buttonClasses(variant, size), className)"
    :disabled="disabled"
    :type="type"
  >
    <slot />
  </component>
</template>
