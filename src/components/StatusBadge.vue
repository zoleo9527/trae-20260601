<script setup lang="ts">
import type { ReportStatus } from '@/types'

const props = defineProps<{
  status: ReportStatus
}>()

const statusMap: Record<ReportStatus, { label: string; class: string }> = {
  pending: { label: '待审核', class: 'badge-pending' },
  rejected: { label: '已驳回', class: 'badge-rejected' },
  confirmed: { label: '已确认', class: 'badge-confirmed' },
  isolating: { label: '隔离中', class: 'badge-isolating' },
  resolved: { label: '已解除', class: 'badge-resolved' }
}
</script>

<template>
  <span class="badge" :class="statusMap[status].class">
    {{ statusMap[status].label }}
  </span>
</template>
