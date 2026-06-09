<script setup lang="ts">
import { computed } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { ROLE_LABELS } from '@/types'
import type { UserRole } from '@/types'

const props = defineProps<{ orderId: string }>()

const ordersStore = useOrdersStore()
const events = computed(() => ordersStore.getTimeline(props.orderId))

const dotColor: Record<UserRole, string> = {
  sales_clerk: 'bg-blue-500',
  warehouse: 'bg-green-500',
  after_sales: 'bg-orange-500',
}

const lineColor: Record<UserRole, string> = {
  sales_clerk: 'bg-blue-300',
  warehouse: 'bg-green-300',
  after_sales: 'bg-orange-300',
}
</script>

<template>
  <div v-if="events.length" class="relative pl-6 space-y-4">
    <div
      v-for="(event, index) in events"
      :key="event.id"
      class="relative"
    >
      <div
        class="absolute left-[-1.375rem] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm"
        :class="dotColor[event.role]"
      />
      <div
        v-if="index < events.length - 1"
        class="absolute left-[-0.875rem] top-4 w-0.5 h-full"
        :class="lineColor[event.role]"
      />
      <div class="text-sm">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-[#1B4965]">{{ event.action }}</span>
          <span class="text-gray-400 text-xs">{{ ROLE_LABELS[event.role] }}</span>
        </div>
        <div class="text-gray-500 text-xs mt-0.5">
          {{ event.operator }} · {{ event.timestamp }}
        </div>
        <div v-if="event.remark" class="italic text-gray-500 mt-1 bg-gray-50 rounded px-2 py-1 text-xs">
          {{ event.remark }}
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-gray-400 text-sm text-center py-4">暂无操作记录</div>
</template>
