<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useDataStore } from '@/stores/data'
import { useRouter } from 'vue-router'

const props = defineProps<{
  status: string
  size?: 'sm' | 'md'
}>()

const statusMap: Record<string, { label: string; class: string }> = {
  draft: { label: '草稿', class: 'badge-draft' },
  submitted: { label: '已提交待复核', class: 'badge-submitted' },
  reviewing: { label: '复核中', class: 'badge-reviewing' },
  confirmed: { label: '已确认', class: 'badge-confirmed' },
  disputed: { label: '有争议', class: 'badge-disputed' },
  pending: { label: '待复核', class: 'badge-pending' },
  rejected: { label: '已驳回', class: 'badge-rejected' },
  resolved: { label: '已解决', class: 'badge-resolved' },
  escalated: { label: '已升级', class: 'badge-escalated' }
}

const statusInfo = computed(() => statusMap[props.status] || { label: props.status, class: '' })
const sizeClass = computed(() => props.size === 'sm' ? 'status-badge-sm' : '')
</script>

<template>
  <span :class="['status-badge', statusInfo.class, sizeClass]">{{ statusInfo.label }}</span>
</template>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge-sm {
  padding: 1px 6px;
  font-size: 11px;
}

.badge-draft {
  background: #f0f0f0;
  color: #595959;
}

.badge-submitted {
  background: #e6f7ff;
  color: #1890ff;
}

.badge-reviewing {
  background: #fff7e6;
  color: #fa8c16;
}

.badge-confirmed {
  background: #f6ffed;
  color: #52c41a;
}

.badge-disputed {
  background: #fff2f0;
  color: #ff4d4f;
}

.badge-pending {
  background: #fffbe6;
  color: #faad14;
}

.badge-rejected {
  background: #fff1f0;
  color: #cf1322;
}

.badge-resolved {
  background: #f6ffed;
  color: #389e0d;
}

.badge-escalated {
  background: #fff2f0;
  color: #d4380d;
}
</style>
