<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ShoppingCart, Truck, AlertTriangle } from 'lucide-vue-next'
import { getStats } from '@/api/stats'
import { getOrders } from '@/api/orders'
import { getArrivals } from '@/api/arrivals'
import type { Stats, Order, Arrival } from '@/types'

const stats = ref<Stats>({ today_orders: 0, pending_arrivals: 0, exception_count: 0 })
const recentOrders = ref<Order[]>([])
const recentArrivals = ref<Arrival[]>([])

const statCards = [
  { label: '今日订货', key: 'today_orders' as const, icon: ShoppingCart, color: '#5D4037' },
  { label: '待到货', key: 'pending_arrivals' as const, icon: Truck, color: '#2E7D32' },
  { label: '异常数', key: 'exception_count' as const, icon: AlertTriangle, color: '#C62828' },
]

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待确认', type: 'warning' },
  confirmed: { label: '已确认', type: 'primary' },
  shipped: { label: '已发货', type: 'info' },
  arrived: { label: '已到货', type: 'success' },
}

const arrivalStatusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待确认', type: 'warning' },
  confirmed: { label: '已确认', type: 'success' },
  exception: { label: '异常', type: 'danger' },
}

onMounted(async () => {
  try {
    const [statsRes, ordersRes, arrivalsRes] = await Promise.all([
      getStats(),
      getOrders(),
      getArrivals(),
    ])
    stats.value = statsRes.data
    recentOrders.value = ordersRes.data.items || []
    recentArrivals.value = arrivalsRes.data.items || []
  } catch {}
})
</script>

<template>
  <div class="p-6">
    <div class="grid grid-cols-3 gap-5 mb-6">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="rounded-md p-5 text-white flex items-center gap-4"
        :style="{ backgroundColor: card.color }"
      >
        <component :is="card.icon" :size="40" class="opacity-80" />
        <div>
          <div class="text-3xl font-bold">{{ stats[card.key] }}</div>
          <div class="text-sm opacity-80 mt-1">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-5">
      <el-card>
        <template #header>
          <span class="text-base font-bold">最近订货单</span>
        </template>
        <div v-if="recentOrders.length === 0" class="text-center text-gray-400 py-4">暂无数据</div>
        <router-link
          v-for="order in recentOrders"
          :key="order.id"
          :to="`/orders/${order.id}`"
          class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 no-underline text-inherit hover:bg-gray-50 px-2 rounded transition-colors"
        >
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500">{{ order.order_no }}</span>
            <span class="text-sm">{{ order.customer_name }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500">¥{{ order.total_amount }}</span>
            <el-tag :type="statusMap[order.status]?.type" size="small">
              {{ statusMap[order.status]?.label }}
            </el-tag>
          </div>
        </router-link>
      </el-card>

      <el-card>
        <template #header>
          <span class="text-base font-bold">最近到货通知</span>
        </template>
        <div v-if="recentArrivals.length === 0" class="text-center text-gray-400 py-4">暂无数据</div>
        <router-link
          v-for="arrival in recentArrivals"
          :key="arrival.id"
          :to="`/arrivals/${arrival.id}`"
          class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 no-underline text-inherit hover:bg-gray-50 px-2 rounded transition-colors"
        >
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500">{{ arrival.arrival_no }}</span>
            <span class="text-sm">{{ arrival.product_name }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500">{{ arrival.ordered_quantity }}{{ arrival.unit }}</span>
            <el-tag :type="arrivalStatusMap[arrival.status]?.type" size="small">
              {{ arrivalStatusMap[arrival.status]?.label }}
            </el-tag>
          </div>
        </router-link>
      </el-card>
    </div>
  </div>
</template>
