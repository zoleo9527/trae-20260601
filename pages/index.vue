<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">工作台</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        class="bg-red-50 border border-red-200 rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow"
        @click="navigateTo('/orders?status=exception')"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-red-600 text-sm font-medium">异常订单数</p>
            <p class="text-3xl font-bold text-red-700 mt-2">{{ stats?.exceptionOrders || 0 }}</p>
          </div>
          <AlertTriangle class="w-12 h-12 text-red-400" />
        </div>
        <p class="text-red-500 text-sm mt-3">点击查看详情 →</p>
      </div>

      <div
        class="bg-orange-50 border border-orange-200 rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow"
        @click="navigateTo('/orders?responsibility=pending_confirm')"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-600 text-sm font-medium">待确认责任单数</p>
            <p class="text-3xl font-bold text-orange-700 mt-2">{{ stats?.pendingResponsibility || 0 }}</p>
          </div>
          <Clock class="w-12 h-12 text-orange-400" />
        </div>
        <p class="text-orange-500 text-sm mt-3">点击查看详情 →</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">今日同步数</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.todaySynced || 0 }}</p>
          </div>
          <RefreshCw class="w-10 h-10 text-blue-500" />
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">待报关数</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.pendingCustoms || 0 }}</p>
          </div>
          <FileText class="w-10 h-10 text-yellow-500" />
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">报关通过率</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ (stats?.customsPassRate || 0).toFixed(1) }}%</p>
          </div>
          <CheckCircle class="w-10 h-10 text-green-500" />
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">库存预警</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.inventoryWarnings || 0 }}</p>
          </div>
          <Package class="w-10 h-10 text-red-500" />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-gray-200">
      <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <AlertOctagon class="w-5 h-5 text-red-500" />
          <h2 class="text-lg font-semibold text-gray-900">卡单清单</h2>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <span>共 {{ stuckItemsTotal }} 条待处理</span>
        </div>
      </div>

      <div class="divide-y divide-gray-100">
        <div v-for="category in stuckCategories" :key="category.key" class="px-5 py-4">
          <div class="flex items-center gap-2 mb-3">
            <div
              class="w-3 h-3 rounded-full"
              :class="{
                'bg-red-500': category.key === 'sync_failed',
                'bg-orange-500': category.key === 'pending_confirm',
                'bg-yellow-500': category.key === 'pending_customs',
                'bg-blue-500': category.key === 'pending_review',
                'bg-purple-500': category.key === 'rejected'
              }"
            ></div>
            <h3 class="text-sm font-semibold text-gray-900">{{ category.title }}</h3>
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {{ getStuckItems(category.key).length }} 条
            </span>
          </div>

          <div v-if="getStuckItems(category.key).length > 0" class="space-y-2">
            <div
              v-for="item in getStuckItems(category.key)"
              :key="item.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-medium text-gray-900">{{ item.orderNo }}</span>
                  <ResponsibilityBadge v-if="item.responsibility" :flag="item.responsibility" />
                </div>
                <p class="text-xs text-gray-500 mb-1">{{ item.reason }}</p>
                <div class="flex items-center gap-3 text-xs text-gray-400">
                  <span>责任：{{ item.responsibleRole }}</span>
                  <span>最后处理：{{ formatDate(item.lastHandledAt) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 ml-4">
                <button
                  v-if="item.orderId"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  @click.stop="navigateTo(`/orders/${item.orderId}`)"
                >
                  订单详情
                </button>
                <button
                  v-if="item.customsId"
                  class="text-green-600 hover:text-green-800 text-sm font-medium"
                  @click.stop="navigateTo(`/customs/${item.customsId}`)"
                >
                  报关资料
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-sm text-gray-400 text-center py-4">
            暂无此类卡单
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-gray-200">
      <div class="px-5 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">待办任务</h2>
      </div>
      <div class="divide-y divide-gray-100">
        <div
          v-for="task in todoTasks"
          :key="task.id"
          class="px-5 py-4 flex items-center justify-between hover:bg-gray-50"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-2 h-2 rounded-full"
              :class="{
                'bg-red-500': task.priority === 'high',
                'bg-yellow-500': task.priority === 'medium',
                'bg-gray-400': task.priority === 'low'
              }"
            ></div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ task.title }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ task.description }}</p>
            </div>
          </div>
          <span class="text-xs text-gray-400">{{ formatDate(task.createdAt) }}</span>
        </div>
        <div v-if="todoTasks.length === 0" class="px-5 py-8 text-center text-gray-500">
          暂无待办任务
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, Clock, RefreshCw, FileText, CheckCircle, Package, AlertOctagon } from 'lucide-vue-next'
import { useAppStore } from '~/stores/app'
import { useFormat } from '~/composables/useFormat'
import ResponsibilityBadge from '~/components/ResponsibilityBadge.vue'
import type { DashboardStats, Order, CustomsDocument, ResponsibilityFlag } from '~/types'

const appStore = useAppStore()
const { formatDate } = useFormat()

const { data: statsRaw } = await useFetch<{ success: boolean; data: DashboardStats }>('/api/dashboard/stats')
const stats = computed(() => statsRaw.value?.data)

const { data: ordersRaw } = await useFetch<{ success: boolean; data: Order[] }>('/api/orders')
const orders = computed(() => ordersRaw.value?.data || [])

const { data: customsRaw } = await useFetch<{ success: boolean; data: CustomsDocument[] }>('/api/customs')
const customsList = computed(() => customsRaw.value?.data || [])

const stuckCategories = [
  { key: 'sync_failed' as const, title: '同步失败' },
  { key: 'pending_confirm' as const, title: '责任待确认' },
  { key: 'pending_customs' as const, title: '待补报关资料' },
  { key: 'pending_review' as const, title: '待审核' },
  { key: 'rejected' as const, title: '报关驳回' }
]

interface StuckItem {
  id: string
  orderNo: string
  orderId: string
  customsId?: string
  reason: string
  responsibility?: ResponsibilityFlag
  responsibleRole: string
  lastHandledAt: string
}

const orderLatestCustomsMap = computed(() => {
  const map: Record<string, CustomsDocument> = {}
  for (const doc of customsList.value) {
    if (!map[doc.orderId] || doc.version > map[doc.orderId].version) {
      map[doc.orderId] = doc
    }
  }
  return map
})

const getRoleName = (role: string) => {
  const names: Record<string, string> = {
    operation: '运营',
    customs: '关务',
    warehouse: '仓配',
    system: '系统'
  }
  return names[role] || role
}

const getStuckItems = (category: string): StuckItem[] => {
  const items: StuckItem[] = []

  switch (category) {
    case 'sync_failed':
      orders.value.filter(o => o.status === 'sync_failed').forEach(order => {
        items.push({
          id: `sync_${order.id}`,
          orderNo: order.orderNo,
          orderId: order.id,
          reason: '订单同步至ERP失败，请检查数据后重试',
          responsibility: order.responsibilityFlag !== 'none' ? order.responsibilityFlag : undefined,
          responsibleRole: '运营',
          lastHandledAt: order.lastSyncAt || order.updatedAt
        })
      })
      break

    case 'pending_confirm':
      orders.value.filter(o => o.responsibilityFlag === 'pending_confirm').forEach(order => {
        items.push({
          id: `confirm_${order.id}`,
          orderNo: order.orderNo,
          orderId: order.id,
          reason: '订单责任待确认，请运营/关务及时标记',
          responsibility: 'pending_confirm',
          responsibleRole: '运营/关务',
          lastHandledAt: order.updatedAt
        })
      })
      break

    case 'pending_customs':
      orders.value.filter(o => o.status === 'pending_customs' || o.status === 'synced').forEach(order => {
        const hasCustoms = orderLatestCustomsMap.value[order.id]
        if (!hasCustoms) {
          items.push({
            id: `customs_${order.id}`,
            orderNo: order.orderNo,
            orderId: order.id,
            reason: '订单已同步，等待关务准备报关资料',
            responsibility: undefined,
            responsibleRole: '关务',
            lastHandledAt: order.lastSyncAt || order.updatedAt
          })
        }
      })
      break

    case 'pending_review':
      customsList.value
        .filter(d => d.status === 'pending_review' && d.id === orderLatestCustomsMap.value[d.orderId]?.id)
        .forEach(doc => {
          const order = orders.value.find(o => o.id === doc.orderId)
          items.push({
            id: `review_${doc.id}`,
            orderNo: doc.orderNo,
            orderId: doc.orderId,
            customsId: doc.id,
            reason: '报关资料已提交，等待审核',
            responsibility: order?.responsibilityFlag !== 'none' ? order?.responsibilityFlag : undefined,
            responsibleRole: '关务主管',
            lastHandledAt: doc.updatedAt
          })
        })
      break

    case 'rejected':
      customsList.value
        .filter(d => d.status === 'rejected' && d.id === orderLatestCustomsMap.value[d.orderId]?.id)
        .forEach(doc => {
          const order = orders.value.find(o => o.id === doc.orderId)
          items.push({
            id: `rejected_${doc.id}`,
            orderNo: doc.orderNo,
            orderId: doc.orderId,
            customsId: doc.id,
            reason: doc.reviewComment ? `报关驳回：${doc.reviewComment}` : '报关资料被驳回，请修改后重新提交',
            responsibility: 'customs',
            responsibleRole: '关务',
            lastHandledAt: doc.updatedAt
          })
        })
      break
  }

  return items.sort((a, b) => new Date(a.lastHandledAt).getTime() - new Date(b.lastHandledAt).getTime())
}

const stuckItemsTotal = computed(() => {
  return stuckCategories.reduce((sum, cat) => sum + getStuckItems(cat.key).length, 0)
})

const todoTasks = computed(() => {
  const tasks: Array<{ id: string; title: string; description: string; priority: 'high' | 'medium' | 'low'; createdAt: string }> = []

  if (stats.value?.exceptionOrders && stats.value.exceptionOrders > 0) {
    tasks.push({
      id: 'exception',
      title: `处理 ${stats.value.exceptionOrders} 个异常订单`,
      description: '同步失败或报关异常的订单需要处理',
      priority: 'high',
      createdAt: new Date().toISOString()
    })
  }

  if (stats.value?.pendingResponsibility && stats.value.pendingResponsibility > 0) {
    tasks.push({
      id: 'responsibility',
      title: `确认 ${stats.value.pendingResponsibility} 个订单责任`,
      description: '订单超时未处理，需要确认责任归属',
      priority: 'high',
      createdAt: new Date().toISOString()
    })
  }

  if (stats.value?.pendingCustoms && stats.value.pendingCustoms > 0) {
    tasks.push({
      id: 'customs',
      title: `处理 ${stats.value.pendingCustoms} 个待报关订单`,
      description: '准备报关资料并提交审核',
      priority: 'medium',
      createdAt: new Date().toISOString()
    })
  }

  if (stats.value?.inventoryWarnings && stats.value.inventoryWarnings > 0) {
    tasks.push({
      id: 'inventory',
      title: `处理 ${stats.value.inventoryWarnings} 个库存预警`,
      description: '部分商品库存低于预警阈值',
      priority: 'medium',
      createdAt: new Date().toISOString()
    })
  }

  return tasks
})
</script>
