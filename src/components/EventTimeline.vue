<script setup lang="ts">
import { computed } from 'vue'
import { Calendar, FileCheck, MessageSquare, AlertTriangle, CheckCircle, Clock } from 'lucide-vue-next'
import type { TimelineEntry } from '@/types'

interface Props {
  entries: TimelineEntry[]
}

const props = defineProps<Props>()

const roleLabels: Record<string, string> = {
  sales: '宴会销售',
  hall: '厅面主管',
  kitchen: '后厨统筹',
  system: '系统',
}

const typeColors: Record<string, string> = {
  event_created: 'bg-blue-500',
  reconciliation_created: 'bg-amber-500',
  reconciliation_completed: 'bg-emerald-500',
  difference_marked: 'bg-red-500',
  feedback_completed: 'bg-purple-500',
}

function getIcon(type: string) {
  switch (type) {
    case 'event_created': return Calendar
    case 'reconciliation_created': return FileCheck
    case 'reconciliation_completed': return CheckCircle
    case 'difference_marked': return AlertTriangle
    case 'feedback_completed': return MessageSquare
    default: return Clock
  }
}

const sortedEntries = computed(() =>
  [...props.entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
)

function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  return {
    date: date.toLocaleDateString('zh-CN'),
    time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  }
}
</script>

<template>
  <div class="relative">
    <div class="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-200"></div>

    <div class="space-y-6">
      <div
        v-for="entry in sortedEntries"
        :key="entry.id"
        class="relative flex gap-4"
      >
        <div
          class="relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          :class="typeColors[entry.type] || 'bg-slate-500'"
        >
          <component :is="getIcon(entry.type)" class="w-5 h-5 text-white" />
        </div>

        <div class="flex-1 bg-slate-50 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-slate-800 font-semibold">{{ entry.title }}</h4>
            <span class="text-slate-400 text-sm">
              {{ formatTime(entry.timestamp).date }} {{ formatTime(entry.timestamp).time }}
            </span>
          </div>
          <p class="text-slate-600 text-sm mb-2">{{ entry.description }}</p>
          <div class="flex items-center gap-2 text-xs">
            <span class="px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
              {{ roleLabels[entry.role] || entry.role }}
            </span>
            <span class="text-slate-500">{{ entry.performed_by }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="entries.length === 0" class="text-center py-8 text-slate-500">
      暂无时间线记录
    </div>
  </div>
</template>
