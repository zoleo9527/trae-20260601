<script setup lang="ts">
import { computed } from 'vue'
import { Check, Clock, AlertTriangle, ArrowRight } from 'lucide-vue-next'
import RoleBadge from '@/components/RoleBadge.vue'

const props = defineProps<{
  status: string
  nextAction: string
  nextResponsible: string
  isOverdue: boolean
  hoursLeft: number | null
}>()

const steps = [
  { key: 'pending_transfer', label: '待转栏', role: '繁育员' },
  { key: 'transferred', label: '已转栏', role: '繁育员' },
  { key: 'pending_assessment', label: '待评估', role: '兽医' },
  { key: 'pending_approval', label: '待审批', role: '场长' },
  { key: 'done', label: '已完结', role: '' },
]

const statusOrder: Record<string, number> = {
  pending_transfer: 0,
  transferred: 1,
  pending_assessment: 2,
  pending_approval: 3,
  culled: 4,
  retained: 4,
}

const currentIdx = computed(() => statusOrder[props.status] ?? -1)

function getStepState(idx: number): 'completed' | 'current' | 'upcoming' {
  if (idx < currentIdx.value) return 'completed'
  if (idx === currentIdx.value) return 'current'
  return 'upcoming'
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-1">
      <template v-for="(step, idx) in steps" :key="step.key">
        <div
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            getStepState(idx) === 'completed'
              ? 'bg-emerald-600/20 text-emerald-400'
              : getStepState(idx) === 'current'
                ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/50'
                : 'bg-slate-800 text-slate-500'
          ]"
        >
          <Check v-if="getStepState(idx) === 'completed'" :size="12" />
          <Clock v-else-if="getStepState(idx) === 'current'" :size="12" />
          <span>{{ step.label }}</span>
          <RoleBadge v-if="step.role && getStepState(idx) !== 'completed'" :role="step.role" class="!text-[10px] !px-1 !py-px" />
        </div>
        <ArrowRight v-if="idx < steps.length - 1" :size="12" class="text-slate-600 shrink-0" />
      </template>
    </div>

    <div
      v-if="nextAction && nextResponsible"
      :class="[
        'flex items-center gap-3 px-4 py-3 rounded-lg border',
        isOverdue
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
      ]"
    >
      <AlertTriangle v-if="isOverdue" :size="16" class="text-red-400 shrink-0" />
      <Clock v-else :size="16" class="text-amber-400 shrink-0" />
      <div class="flex-1">
        <span :class="['text-sm font-medium', isOverdue ? 'text-red-300' : 'text-amber-300']">
          {{ isOverdue ? '已超时' : '待处理' }}
        </span>
        <span class="text-sm text-slate-400 ml-2">
          {{ nextResponsible }}需「{{ nextAction }}」
        </span>
      </div>
      <div v-if="hoursLeft !== null && !isOverdue" class="text-xs text-amber-400 shrink-0">
        剩余 {{ hoursLeft < 1 ? Math.round(hoursLeft * 60) + '分钟' : Math.round(hoursLeft) + '小时' }}
      </div>
      <div v-else-if="isOverdue" class="text-xs text-red-400 shrink-0">
        已超时
      </div>
    </div>
  </div>
</template>
