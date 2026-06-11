<script setup lang="ts">
import type { DocStatus } from '@/types'

defineProps<{ status: DocStatus }>()

const statusConfig: Record<DocStatus, { bg: string; text: string; dot: string }> = {
  '待整理': { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400' },
  '待审核': { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  '待签认': { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  '已签认': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  '已驳回': { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
    :class="[statusConfig[status].bg, statusConfig[status].text]"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="statusConfig[status].dot"></span>
    {{ status }}
  </span>
</template>
