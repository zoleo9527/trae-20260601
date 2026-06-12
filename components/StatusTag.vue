<script setup lang="ts">
import { computed } from 'vue'
import type { TaskStatus } from '~/types'
import { StatusMeta } from '~/types'

const props = defineProps<{
  status: TaskStatus
  size?: 'sm' | 'md'
  withDot?: boolean
}>()

const size = computed(() => props.size || 'md')

const toneMap: Record<string, { bg: string; text: string; dot: string; ring?: string }> = {
  gray: { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
  blue: { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  cyan: { bg: '#ecfeff', text: '#0e7490', dot: '#06b6d4' },
  amber: { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  green: { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  red: { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' }
}

const meta = computed(() => StatusMeta[props.status])
const tone = computed(() => toneMap[meta.value.tone])
</script>

<template>
  <span
    class="status-tag"
    :class="size"
    :style="{ backgroundColor: tone.bg, color: tone.text }"
  >
    <span
      v-if="withDot !== false && meta.dot"
      class="dot"
      :style="{ backgroundColor: tone.dot }"
    />
    {{ meta.label }}
  </span>
</template>

<style scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 999px;
}
.status-tag.md {
  padding: 4px 12px;
  font-size: 13px;
}
.status-tag.sm {
  padding: 2px 8px;
  font-size: 12px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
