<script setup lang="ts">
import { Plus, Check, Send, AlertTriangle, ClipboardCheck, Eye } from 'lucide-vue-next'
import RoleBadge from '@/components/RoleBadge.vue'

export interface TimelineEvent {
  action: string
  operator: string
  operator_role: string
  remark?: string
  created_at: string
}

defineProps<{ events: TimelineEvent[] }>()

const actionIconMap: Record<string, any> = {
  create: Plus,
  confirm: Check,
  submit: Send,
  assess: ClipboardCheck,
  approve: Check,
  reject: AlertTriangle,
  view: Eye,
}

const actionLabelMap: Record<string, string> = {
  create: '创建记录',
  confirm: '确认转栏',
  submit: '提交评估',
  assess: '完成评估',
  approve: '审批通过',
  reject: '审批驳回',
  view: '查看记录',
}

function getIcon(action: string) {
  return actionIconMap[action] || Plus
}

function getLabel(action: string) {
  return actionLabelMap[action] || action
}
</script>

<template>
  <div class="relative pl-8 space-y-6">
    <div class="absolute left-3 top-2 bottom-2 w-px bg-slate-700" />
    <div v-for="(event, idx) in events" :key="idx" class="relative">
      <div
        :class="[
          'absolute -left-5 w-7 h-7 rounded-full flex items-center justify-center border-2',
          idx === 0 ? 'bg-emerald-600/30 border-emerald-500' : 'bg-slate-800 border-slate-600'
        ]"
      >
        <component :is="getIcon(event.action)" :size="12" :class="idx === 0 ? 'text-emerald-400' : 'text-slate-400'" />
      </div>
      <div class="ml-4">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-sm font-medium text-slate-200">{{ getLabel(event.action) }}</span>
          <RoleBadge :role="event.operator_role" />
        </div>
        <div class="text-xs text-slate-500">
          {{ event.operator }} · {{ event.created_at }}
        </div>
        <div v-if="event.remark" class="mt-1.5 text-sm text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
          {{ event.remark }}
        </div>
      </div>
    </div>
  </div>
</template>
