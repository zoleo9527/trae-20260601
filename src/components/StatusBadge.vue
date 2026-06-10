<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const statusMap: Record<string, { label: string; cls: string }> = {
  pending_transfer: { label: '待转栏', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  transferred: { label: '已转栏', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  pending_assessment: { label: '待评估', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  pending_approval: { label: '待审批', cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  culled: { label: '已淘汰', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  retained: { label: '已留养', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
}

const info = computed(() => statusMap[props.status] || { label: props.status, cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' })
</script>

<template>
  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', info.cls]">
    {{ info.label }}
  </span>
</template>
