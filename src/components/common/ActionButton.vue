<template>
  <button
    :class="[
      'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      variantClass,
      sizeClass,
      { 'opacity-50 cursor-not-allowed': disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <component
      v-if="icon"
      :is="icon"
      :class="iconSizeClass"
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  icon?: Component
  disabled?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const variantClass = computed(() => {
  const classes = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 border border-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
    warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500',
  }
  return classes[props.variant || 'primary']
})

const sizeClass = computed(() => {
  const classes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg px-6 py-3',
  }
  return classes[props.size || 'md']
})

const iconSizeClass = computed(() => {
  const classes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }
  return classes[props.size || 'md']
})
</script>