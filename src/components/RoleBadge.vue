<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ role: string }>()

const roleMap: Record<string, { label: string; cls: string }> = {
  '繁育员': { label: '繁育员', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  '兽医': { label: '兽医', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  '场长': { label: '场长', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
}

const info = computed(() => roleMap[props.role] || { label: props.role, cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' })
</script>

<template>
  <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', info.cls]">
    {{ info.label }}
  </span>
</template>
