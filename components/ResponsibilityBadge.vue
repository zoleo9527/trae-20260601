<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="badgeClass"
  >
    {{ getResponsibilityText(flag) }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormat } from '../composables/useFormat'
import type { ResponsibilityFlag } from '../types'

interface Props {
  flag: ResponsibilityFlag
}

const props = defineProps<Props>()

const { getResponsibilityText } = useFormat()

const badgeClass = computed(() => {
  const classes: Record<ResponsibilityFlag, string> = {
    none: 'bg-gray-100 text-gray-800',
    pending_confirm: 'bg-yellow-100 text-yellow-800',
    operation: 'bg-blue-100 text-blue-800',
    customs: 'bg-purple-100 text-purple-800'
  }
  return classes[props.flag] || 'bg-gray-100 text-gray-800'
})
</script>
