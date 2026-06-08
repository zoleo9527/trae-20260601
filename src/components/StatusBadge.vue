<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-heading"
    :style="badgeStyle"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { STATUS_LABELS, STATUS_COLORS } from '@/types'
import type { Registration } from '@/types'

const props = defineProps<{
  status: Registration['status']
}>()

const label = computed(() => STATUS_LABELS[props.status] ?? props.status)
const color = computed(() => STATUS_COLORS[props.status] ?? '#8B949E')

const badgeStyle = computed(() => ({
  backgroundColor: `${color.value}20`,
  color: color.value,
  border: `1px solid ${color.value}40`,
}))
</script>
