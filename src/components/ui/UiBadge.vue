<script setup lang="ts">
import { computed } from 'vue'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type BadgeVariant = 'default' | 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'teal'
type BadgeSize = 'sm' | 'md'

interface Props {
  variant?: BadgeVariant
  size?: BadgeSize
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md'
})

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 border border-gray-200',
  blue: 'bg-blue-50 text-[#1E40AF] border border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border border-orange-200',
  green: 'bg-green-50 text-green-700 border border-green-200',
  red: 'bg-red-50 text-red-700 border border-red-200',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  teal: 'bg-teal-50 text-teal-700 border border-teal-200'
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs'
}

const computedClasses = computed(() =>
  cn('inline-flex items-center font-medium rounded-full', variantClasses[props.variant], sizeClasses[props.size])
)
</script>

<template>
  <span :class="computedClasses">
    <slot />
  </span>
</template>
