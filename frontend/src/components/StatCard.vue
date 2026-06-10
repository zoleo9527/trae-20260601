<script setup lang="ts">
import { cn } from '../lib/utils'

interface Props {
  title: string
  value: number | string
  variant?: 'default' | 'warning' | 'danger' | 'success'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  default: 'bg-white border-gray-200',
  warning: 'bg-orange-50 border-orange-400',
  danger: 'bg-red-50 border-red-400',
  success: 'bg-green-50 border-green-400',
}
</script>

<template>
  <div
    :class="cn(
      'flex flex-col items-center justify-center border p-4',
      variantClasses[props.variant]
    )"
  >
    <span class="text-3xl font-bold text-gray-900">{{ props.value }}</span>
    <span class="mt-1 text-sm text-gray-600">{{ props.title }}</span>
  </div>
</template>
