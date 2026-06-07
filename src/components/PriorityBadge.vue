<template>
  <span 
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
    :class="badgeClass"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  priority: 'low' | 'medium' | 'high' | 'urgent'
}>()

const label = computed(() => {
  const map = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return map[props.priority]
})

const badgeClass = computed(() => {
  const map = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  }
  return map[props.priority]
})
</script>
