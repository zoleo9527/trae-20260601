<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      colorClasses
    ]"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { VehicleStatus } from '@/types'
import { useStatusTransition } from '@/composables/useStatusTransition'

const props = defineProps<{
  status: VehicleStatus
}>()

const { getStatusLabel, getStatusColor } = useStatusTransition()

const label = computed(() => getStatusLabel(props.status))
const color = computed(() => getStatusColor(props.status))

const colorClasses = computed(() => {
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-100 text-orange-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    green: 'bg-green-100 text-green-800',
    cyan: 'bg-cyan-100 text-cyan-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    gray: 'bg-gray-100 text-gray-800',
    red: 'bg-red-100 text-red-800'
  }
  return colorMap[color.value] || 'bg-gray-100 text-gray-800'
})
</script>
