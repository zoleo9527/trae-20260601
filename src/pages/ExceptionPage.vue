<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Bell, RotateCcw, CheckCircle, Palette, Shapes, ScanLine, Gem, HelpCircle } from 'lucide-vue-next'
import { useExceptionStore } from '@/stores/exception'
import { useOrderStore } from '@/stores/order'
import { useStaffStore } from '@/stores/staff'
import { useToastStore } from '@/stores/toast'
import type { ExceptionType, ExceptionSeverity, Exception } from '@/types'

const exceptionStore = useExceptionStore()
const orderStore = useOrderStore()
const staffStore = useStaffStore()
const toastStore = useToastStore()

const severityOrder: Record<ExceptionSeverity, number> = { high: 0, medium: 1, low: 2 }

const sortedExceptions = computed(() =>
  [...exceptionStore.exceptions].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  )
)

const highCount = computed(() =>
  exceptionStore.unresolvedExceptions.filter((e) => e.severity === 'high').length
)
const mediumCount = computed(() =>
  exceptionStore.unresolvedExceptions.filter((e) => e.severity === 'medium').length
)
const lowCount = computed(() =>
  exceptionStore.unresolvedExceptions.filter((e) => e.severity === 'low').length
)

const severityBarColor: Record<ExceptionSeverity, string> = {
  high: 'bg-danger-red',
  medium: 'bg-warn-orange',
  low: 'bg-warn-yellow',
}

const severityBorderColor: Record<ExceptionSeverity, string> = {
  high: 'border-l-danger-red',
  medium: 'border-l-warn-orange',
  low: 'border-l-warn-yellow',
}

const typeIconMap: Record<ExceptionType, typeof AlertTriangle> = {
  color_mismatch: Palette,
  shape_issue: Shapes,
  bite_issue: ScanLine,
  material_defect: Gem,
  other: HelpCircle,
}

const typeLabelMap: Record<ExceptionType, string> = {
  color_mismatch: '色差',
  shape_issue: '形态',
  bite_issue: '咬合',
  material_defect: '材质',
  other: '其他',
}

function staffName(id: string): string {
  return staffStore.getStaffById(id)?.name ?? id
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function handleSendNotification(ex: Exception) {
  exceptionStore.sendNotification(ex.id)
  toastStore.addToast({ type: 'success', title: '提醒已发送', message: '提醒已发送至处理人' })
}

function handleReturnOrder(ex: Exception) {
  orderStore.rejectOrder(ex.orderId, '异常退回')
  exceptionStore.resolveException(ex.id)
  toastStore.addToast({ type: 'warning', title: '已退回', message: '工单已退回至设计师' })
}

function handleResolve(ex: Exception) {
  exceptionStore.resolveException(ex.id)
  toastStore.addToast({ type: 'success', title: '已解决', message: '异常已标记解决' })
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center gap-3">
      <AlertTriangle :size="28" class="text-warn-orange" />
      <h1 class="text-2xl font-bold text-gray-100">异常提醒中心</h1>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <div class="bg-factory-surface border border-factory-border rounded-xl p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-danger-red/15 flex items-center justify-center">
          <AlertTriangle :size="20" class="text-danger-red" />
        </div>
        <div>
          <div class="text-2xl font-bold text-danger-red">{{ highCount }}</div>
          <div class="text-xs text-gray-400">高危</div>
        </div>
      </div>
      <div class="bg-factory-surface border border-factory-border rounded-xl p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-warn-orange/15 flex items-center justify-center">
          <AlertTriangle :size="20" class="text-warn-orange" />
        </div>
        <div>
          <div class="text-2xl font-bold text-warn-orange">{{ mediumCount }}</div>
          <div class="text-xs text-gray-400">中等</div>
        </div>
      </div>
      <div class="bg-factory-surface border border-factory-border rounded-xl p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-warn-yellow/15 flex items-center justify-center">
          <AlertTriangle :size="20" class="text-warn-yellow" />
        </div>
        <div>
          <div class="text-2xl font-bold text-warn-yellow">{{ lowCount }}</div>
          <div class="text-xs text-gray-400">低危</div>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <div
        v-for="ex in sortedExceptions"
        :key="ex.id"
        :class="[
          'bg-factory-surface border border-factory-border rounded-xl p-4 border-l-4 transition-opacity',
          severityBorderColor[ex.severity],
          ex.resolved ? 'opacity-40' : 'opacity-100',
        ]"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <component
                :is="typeIconMap[ex.type]"
                :size="16"
                :class="[
                  'flex-shrink-0',
                  ex.severity === 'high' ? 'text-danger-red' : ex.severity === 'medium' ? 'text-warn-orange' : 'text-warn-yellow',
                ]"
              />
              <span
                :class="[
                  'text-xs font-medium px-2 py-0.5 rounded',
                  ex.severity === 'high' ? 'bg-danger-red/15 text-danger-red' : ex.severity === 'medium' ? 'bg-warn-orange/15 text-warn-orange' : 'bg-warn-yellow/15 text-warn-yellow',
                ]"
              >
                {{ typeLabelMap[ex.type] }}
              </span>
              <span class="font-mono text-sm text-flow-blue">{{ ex.orderId }}</span>
            </div>
            <p class="text-sm text-gray-300 mb-2">{{ ex.description }}</p>
            <div class="flex items-center gap-3 text-xs text-gray-500">
              <span>触发人: {{ staffName(ex.triggeredBy) }}</span>
              <span>{{ formatTime(ex.triggeredAt) }}</span>
            </div>
          </div>

          <div class="flex flex-col items-end gap-2 flex-shrink-0">
            <div class="flex items-center gap-2">
              <span
                v-if="ex.notified"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pass-green/15 text-pass-green"
              >
                已通知
              </span>
              <span
                v-else
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-500/15 text-gray-400"
              >
                未通知
              </span>
              <span
                v-if="ex.resolved"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pass-green/15 text-pass-green"
              >
                已解决
              </span>
              <span
                v-else
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warn-orange/15 text-warn-orange animate-pulse-slow"
              >
                处理中
              </span>
            </div>
            <div v-if="!ex.resolved" class="flex items-center gap-2">
              <button
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-warn-orange text-warn-orange text-xs font-medium hover:bg-warn-orange/10 transition-colors"
                @click="handleSendNotification(ex)"
              >
                <Bell :size="13" />
                发送提醒
              </button>
              <button
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-danger-red text-white text-xs font-medium hover:bg-danger-red/80 transition-colors"
                @click="handleReturnOrder(ex)"
              >
                <RotateCcw :size="13" />
                退回工单
              </button>
              <button
                v-if="ex.notified"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-pass-green text-pass-green text-xs font-medium hover:bg-pass-green/10 transition-colors"
                @click="handleResolve(ex)"
              >
                <CheckCircle :size="13" />
                标记解决
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="sortedExceptions.length === 0" class="text-center py-12 text-gray-500">
        暂无异常记录
      </div>
    </div>
  </div>
</template>
