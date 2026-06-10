<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShoppingCart, Truck, AlertTriangle, Bell } from 'lucide-vue-next'
import { getStats } from '@/api/stats'
import { getOrders } from '@/api/orders'
import { getArrivals } from '@/api/arrivals'
import { getNotifications } from '@/api/notifications'
import { useUnreadCount } from '@/composables/useUnreadCount'
import type { Stats, Order, Arrival, Notification } from '@/types'

const router = useRouter()
const { refreshUnread } = useUnreadCount()
const stats = ref<Stats>({ today_orders: 0, pending_arrivals: 0, exception_count: 0, unread_notifications: 0 })
const recentOrders = ref<Order[]>([])
const recentArrivals = ref<Arrival[]>([])
const recentNotifications = ref<Notification[]>([])

const statCards = [
  { label: '今日订货', key: 'today_orders' as const, icon: ShoppingCart, color: '#5D4037' },
  { label: '待到货', key: 'pending_arrivals' as const, icon: Truck, color: '#2E7D32' },
  { label: '异常数', key: 'exception_count' as const, icon: AlertTriangle, color: '#C62828' },
  { label: '未读通知', key: 'unread_notifications' as const, icon: Bell, color: '#E65100' },
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
    const [statsRes, ordersRes, arrivalsRes, notifRes] = await Promise.all([
      getStats(),
      getOrders(),
      getArrivals(),
      getNotifications({ page: 1, page_size: 5 }),
    ])
    stats.value = statsRes.data
    recentOrders.value = ordersRes.data.items || []
    recentArrivals.value = arrivalsRes.data.items || []
    recentNotifications.value = notifRes.data.items || []
    refreshUnread()
  } catch {}
})
</script>

<template>
  <div class="p-6">
    <div class="grid grid-cols-4 gap-5 mb-6">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="rounded-md p-5 text-white flex items-center gap-4 cursor-pointer transition-transform hover:scale-105"
        :style="{ backgroundColor: card.color }"
        @click="card.key === 'unread_notifications' ? router.push('/notifications') : undefined"
      >
        <component :is="card.icon" :size="40" class="opacity-80" />
        <div>
          <div class="text-3xl font-bold">{{ stats[card.key] }}</div>
          <div class="text-sm opacity-80 mt-1">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-5">
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

      <el-card>
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-base font-bold">最近通知</span>
            <router-link to="/notifications" class="text-sm text-[#5D4037] no-underline hover:underline">查看全部</router-link>
          </div>
        </template>
        <div v-if="recentNotifications.length === 0" class="text-center text-gray-400 py-4">暂无通知</div>
        <div
          v-for="item in recentNotifications"
          :key="item.id"
          class="flex items-start gap-2 py-3 border-b border-gray-100 last:border-0 cursor-pointer"
          :class="{ 'bg-[#FFF8E1] px-2 rounded': !item.is_read }"
          @click="router.push('/notifications')"
        >
          <el-tag :type="item.type === 'exception_alert' ? 'danger' : 'success'" size="small" class="flex-shrink-0 mt-0.5">
            {{ item.type === 'exception_alert' ? '异常' : '待到货' }}
          </el-tag>
          <div class="min-w-0">
            <div class="text-sm font-medium truncate" :class="{ 'font-bold': !item.is_read }">{{ item.title }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ item.created_at }}</div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>
