<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <Zap class="w-5 h-5 text-warn-yellow" />
      <h2 class="text-lg font-semibold text-gray-200">异常快触</h2>
    </div>

    <div v-if="exceptions.length === 0" class="text-sm text-gray-500 italic">
      暂未处理异常
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="ex in exceptions"
        :key="ex.id"
        class="bg-factory-surface border border-factory-border rounded-lg p-4 border-l-4"
        :class="severityBorderClass(ex.severity)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span
                class="text-xs font-medium px-1.5 py-0.5 rounded"
                :class="severityBgClass(ex.severity)"
              >
                {{ typeLabel(ex.type) }}
              </span>
              <span v-if="ex.notified" class="text-xs font-medium px-1.5 py-0.5 rounded bg-pass-green/15 text-pass-green">
                已通知
              </span>
            </div>
            <p class="text-sm text-gray-300 mt-1">{{ ex.description }}</p>
            <p class="text-xs text-gray-500 mt-1.5">{{ formatTime(ex.triggeredAt) }}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-warn-orange text-warn-orange hover:bg-warn-orange/10 transition-colors"
              @click="handleNotify(ex.id)"
            >
              <Bell class="w-3.5 h-3.5" />
              提醒
            </button>
            <button
              class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-danger-red text-white hover:bg-danger-red/80 transition-colors"
              @click="handleReject(ex)"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              退回
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Zap, Bell, RotateCcw } from 'lucide-vue-next'
import { useExceptionStore } from '@/stores/exception'
import { useOrderStore } from '@/stores/order'
import { useToastStore } from '@/stores/toast'
import type { Exception, ExceptionType, ExceptionSeverity } from '@/types'

const exceptionStore = useExceptionStore()
const orderStore = useOrderStore()
const toastStore = useToastStore()

const exceptions = computed(() => exceptionStore.unresolvedExceptions)

const typeMap: Record<ExceptionType, string> = {
  color_mismatch: '色差',
  shape_issue: '形态',
  bite_issue: '咬合',
  material_defect: '材质',
  other: '其他',
}

function typeLabel(type: ExceptionType): string {
  return typeMap[type] ?? type
}

function severityBorderClass(severity: ExceptionSeverity): string {
  switch (severity) {
    case 'high':
      return 'border-l-danger-red'
    case 'medium':
      return 'border-l-warn-orange'
    case 'low':
      return 'border-l-warn-yellow'
    default:
      return 'border-l-warn-orange'
  }
}

function severityBgClass(severity: ExceptionSeverity): string {
  switch (severity) {
    case 'high':
      return 'bg-danger-red/15 text-danger-red'
    case 'medium':
      return 'bg-warn-orange/15 text-warn-orange'
    case 'low':
      return 'bg-warn-yellow/15 text-warn-yellow'
    default:
      return 'bg-warn-orange/15 text-warn-orange'
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

function handleNotify(id: string) {
  exceptionStore.sendNotification(id)
  toastStore.addToast({
    type: 'info',
    title: '提醒已发送',
    message: '已发送提醒',
  })
}

function handleReject(ex: Exception) {
  orderStore.rejectOrder(ex.orderId, '异常退回')
  exceptionStore.resolveException(ex.id)
  toastStore.addToast({
    type: 'warning',
    title: '工单已退回',
    message: '已退回工单',
  })
}
</script>
