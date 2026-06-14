<script setup>
const props = defineProps({
  kind: { type: String, required: true },
  type: { type: String, default: 'appointment' },
  small: { type: Boolean, default: false }
})
import {
  APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS,
  SCHEDULE_STATUS_LABELS, SCHEDULE_STATUS_COLORS,
  EXAM_STATUS_LABELS, EXAM_STATUS_COLORS
} from '@/data/mock.js'

const labels = props.type === 'appointment' ? APPOINTMENT_STATUS_LABELS
  : props.type === 'schedule' ? SCHEDULE_STATUS_LABELS
  : EXAM_STATUS_LABELS
const colors = props.type === 'appointment' ? APPOINTMENT_STATUS_COLORS
  : props.type === 'schedule' ? SCHEDULE_STATUS_COLORS
  : EXAM_STATUS_COLORS

const colorClass = (c) => ({
  gray: 'tag-gray', blue: 'tag-blue', green: 'tag-green',
  yellow: 'tag-yellow', red: 'tag-red', cyan: 'tag-cyan', purple: 'tag-purple'
}[c] || 'tag-gray')
</script>

<template>
  <span class="tag" :class="colorClass(colors[kind])" :style="small ? { fontSize: '11px', padding: '1px 7px' } : {}">
    {{ labels[kind] || kind }}
  </span>
</template>
