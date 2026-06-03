<script setup lang="ts">
defineProps<{
  status: string
}>()

const statusMap: Record<string, { label: string; dotClass: string; bgClass: string; pulse?: boolean }> = {
  pending_design: { label: '等待设计', dotClass: 'bg-gray-400', bgClass: 'bg-gray-400/15 text-gray-300' },
  designing: { label: '设计中', dotClass: 'bg-flow-blue', bgClass: 'bg-flow-blue/15 text-flow-blue' },
  pending_qc: { label: '待质检', dotClass: 'bg-warn-yellow', bgClass: 'bg-warn-yellow/15 text-warn-yellow' },
  qc_in_progress: { label: '质检中', dotClass: 'bg-warn-orange', bgClass: 'bg-warn-orange/15 text-warn-orange', pulse: true },
  passed: { label: '已放行', dotClass: 'bg-pass-green', bgClass: 'bg-pass-green/15 text-pass-green' },
  rejected: { label: '已退回', dotClass: 'bg-danger-red', bgClass: 'bg-danger-red/15 text-danger-red' },
  pending_shipping: { label: '待回寄', dotClass: 'bg-warn-yellow', bgClass: 'bg-warn-yellow/15 text-warn-yellow' },
  shipped: { label: '已寄出', dotClass: 'bg-flow-blue', bgClass: 'bg-flow-blue/15 text-flow-blue' },
  delivered: { label: '已签收', dotClass: 'bg-pass-green', bgClass: 'bg-pass-green/15 text-pass-green' },
}
</script>

<template>
  <span
    v-if="statusMap[status]"
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="[statusMap[status].bgClass]"
  >
    <span
      class="inline-block h-1.5 w-1.5 rounded-full"
      :class="[statusMap[status].dotClass, statusMap[status].pulse ? 'animate-pulse-slow' : '']"
    />
    {{ statusMap[status].label }}
  </span>
  <span v-else class="inline-flex items-center gap-1.5 rounded-full bg-gray-400/15 px-2.5 py-0.5 text-xs font-medium text-gray-400">
    {{ status }}
  </span>
</template>
