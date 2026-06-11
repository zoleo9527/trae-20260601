<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button'
})

defineEmits<{
  click: [e: MouseEvent]
}>()

const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-[4px]'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#1E40AF] text-white hover:bg-[#1e3a8a] hover:shadow-lg focus:ring-[#1E40AF]/50 active:bg-[#1e3a8a]',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md focus:ring-gray-400/50',
  danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg focus:ring-red-500/50 active:bg-red-700',
  success: 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg focus:ring-green-500/50 active:bg-green-700',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400/50'
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5'
}

const computedClasses = computed(() =>
  cn(baseClasses, variantClasses[props.variant], sizeClasses[props.size])
)
</script>

<template>
  <button
    :type="type"
    :class="computedClasses"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <Loader2 v-if="loading" class="animate-spin shrink-0" :class="size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'" />
    <slot name="icon" v-if="!loading" />
    <span><slot /></span>
  </button>
</template>
