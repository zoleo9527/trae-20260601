<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type TagVariant = 'default' | 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'teal'
type TagSize = 'sm' | 'md'

interface Props {
  variant?: TagVariant
  size?: TagSize
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  closable: false
})

const emit = defineEmits<{
  close: []
}>()

const variantClasses: Record<TagVariant, string> = {
  default: 'bg-gray-100 text-gray-700 border border-gray-300',
  blue: 'bg-blue-50 text-[#1E40AF] border border-blue-300',
  orange: 'bg-orange-50 text-orange-700 border border-orange-300',
  green: 'bg-green-50 text-green-700 border border-green-300',
  red: 'bg-red-50 text-red-700 border border-red-300',
  purple: 'bg-purple-50 text-purple-700 border border-purple-300',
  teal: 'bg-teal-50 text-teal-700 border border-teal-300'
}

const sizeClasses: Record<TagSize, string> = {
  sm: 'px-2 py-1 text-xs gap-1',
  md: 'px-2.5 py-1.5 text-sm gap-1.5'
}

const closeSizeClasses: Record<TagSize, string> = {
  sm: 'w-3 h-3 p-0.5',
  md: 'w-3.5 h-3.5 p-0.5'
}

const computedClasses = computed(() =>
  cn('inline-flex items-center font-medium rounded-[4px]', variantClasses[props.variant], sizeClasses[props.size])
)

function handleClose(e: MouseEvent) {
  e.stopPropagation()
  emit('close')
}
</script>

<template>
  <span :class="computedClasses">
    <slot />
    <button
      v-if="closable"
      type="button"
      class="inline-flex items-center justify-center rounded-sm opacity-60 hover:opacity-100 hover:bg-black/10 transition-opacity shrink-0"
      :class="closeSizeClasses[size]"
      @click="handleClose"
    >
      <X class="w-full h-full" />
    </button>
  </span>
</template>
