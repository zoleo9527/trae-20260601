<script setup lang="ts">
import type { ReportStatus } from '@/types'

const props = defineProps<{
  status: ReportStatus
  reportId?: string
  clickable?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const statusMap: Record<ReportStatus, { label: string; class: string }> = {
  pending: { label: '待审核', class: 'badge-pending' },
  rejected: { label: '已驳回', class: 'badge-rejected' },
  confirmed: { label: '已确认', class: 'badge-confirmed' },
  isolating: { label: '隔离中', class: 'badge-isolating' },
  resolved: { label: '已解除', class: 'badge-resolved' }
}

function handleClick() {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<template>
  <span 
    class="badge" 
    :class="[statusMap[status].class, { 'badge-clickable': clickable }]"
    @click="handleClick"
  >
    {{ statusMap[status].label }}
  </span>
</template>

<style scoped>
.badge-clickable {
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.badge-clickable:hover {
  opacity: 0.8;
}
</style>
