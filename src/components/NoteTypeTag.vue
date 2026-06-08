<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
    :style="tagStyle"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NOTE_TYPE_LABELS, NOTE_TYPE_COLORS } from '@/types'
import type { HandoverLog } from '@/types'

const props = defineProps<{
  type: HandoverLog['note_type']
}>()

const label = computed(() => NOTE_TYPE_LABELS[props.type] ?? props.type)
const color = computed(() => NOTE_TYPE_COLORS[props.type] ?? '#8B949E')

const tagStyle = computed(() => ({
  backgroundColor: `${color.value}20`,
  color: color.value,
  border: `1px solid ${color.value}30`,
}))
</script>
