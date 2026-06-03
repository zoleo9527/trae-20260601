<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <AlertCircle class="w-5 h-5 text-warn-orange" />
      <h2 class="text-lg font-semibold text-gray-200">卡点提示</h2>
    </div>

    <div v-if="stuckList.length === 0" class="text-sm text-gray-500 italic">
      暂无卡点工单
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="order in stuckList"
        :key="order.id"
        class="flex items-center gap-3 bg-factory-surface border border-factory-border rounded-lg px-4 py-3 cursor-pointer transition-colors hover:bg-factory-surface-light border-l-4 border-l-warn-orange"
        :class="{ 'animate-glow-orange': order.id === mostStuckId }"
        @click="handleClick(order)"
      >
        <span class="font-mono text-sm text-warn-orange">{{ order.id }}</span>
        <span class="text-sm text-gray-300">{{ order.patientName }}</span>
        <span class="text-xs text-gray-500 bg-factory-surface-light px-2 py-0.5 rounded">
          {{ stuckStageLabel(order.stuckAt) }}
        </span>
        <span class="ml-auto text-xs font-mono text-warn-orange">
          {{ formatDuration(order.stuckDuration) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircle } from 'lucide-vue-next'
import { useOrderStore } from '@/stores/order'
import type { Order } from '@/types'

const router = useRouter()
const orderStore = useOrderStore()

const stuckList = computed(() => orderStore.stuckOrders)

const mostStuckId = computed(() => {
  if (stuckList.value.length === 0) return ''
  const max = stuckList.value.reduce((prev, curr) =>
    (curr.stuckDuration ?? 0) > (prev.stuckDuration ?? 0) ? curr : prev
  )
  return max.id
})

const stuckStageMap: Record<string, string> = {
  pending_design: '待设计',
  designing: '设计中',
  pending_qc: '待质检',
  qc_in_progress: '质检中',
  pending_shipping: '待回寄',
  shipped: '已寄出',
}

function stuckStageLabel(stage?: string): string {
  if (!stage) return '未知'
  return stuckStageMap[stage] ?? stage
}

function formatDuration(minutes?: number): string {
  if (!minutes) return '0小时'
  const hours = Math.floor(minutes / 60)
  if (hours < 1) return `${minutes}分钟`
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}小时${remaining}分` : `${hours}小时`
}

function handleClick(order: Order) {
  if (order.stuckAt === 'pending_shipping' || order.stuckAt === 'shipped') {
    router.push('/shipping')
  } else {
    router.push('/qc')
  }
}
</script>
