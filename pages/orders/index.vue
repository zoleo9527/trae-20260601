<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">订单同步</h1>
      <button
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        @click="handleManualSync"
      >
        <RefreshCw class="w-4 h-4" />
        手动同步
      </button>
    </div>

    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">状态：</label>
          <select
            v-model="statusFilter"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部</option>
            <option value="pending_sync">待同步</option>
            <option value="syncing">同步中</option>
            <option value="synced">已同步</option>
            <option value="sync_failed">同步失败</option>
            <option value="pending_customs">待报关</option>
            <option value="customs_processing">报关中</option>
            <option value="completed">已完成</option>
            <option value="exception">异常</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">平台：</label>
          <select
            v-model="platformFilter"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部</option>
            <option value="亚马逊">亚马逊</option>
            <option value="Shopify">Shopify</option>
            <option value="速卖通">速卖通</option>
            <option value="eBay">eBay</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">责任：</label>
          <select
            v-model="responsibilityFilter"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部</option>
            <option value="none">无</option>
            <option value="pending_confirm">待确认</option>
            <option value="operation">运营责任</option>
            <option value="customs">报关责任</option>
          </select>
        </div>

        <div class="flex-1 min-w-[200px] max-w-md">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索订单号、买家名称..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单号</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平台</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">买家</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">国家</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任标记</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="order in filteredOrders"
              :key="order.id"
              class="hover:bg-gray-50"
              :class="{
                'bg-red-50': order.status === 'exception' || order.status === 'sync_failed',
                'bg-yellow-50': order.responsibilityFlag === 'pending_confirm'
              }"
            >
              <td class="px-4 py-4">
                <span class="text-sm font-medium text-blue-600 cursor-pointer" @click="viewDetail(order.id)">
                  {{ order.orderNo }}
                </span>
              </td>
              <td class="px-4 py-4 text-sm text-gray-600">{{ order.platform }}</td>
              <td class="px-4 py-4 text-sm text-gray-600">{{ order.buyerName }}</td>
              <td class="px-4 py-4 text-sm text-gray-600">{{ order.buyerCountry }}</td>
              <td class="px-4 py-4 text-sm text-gray-900 font-medium">
                {{ formatMoney(order.totalAmount, order.currency) }}
              </td>
              <td class="px-4 py-4">
                <StatusBadge :status="order.status" type="order" />
              </td>
              <td class="px-4 py-4">
                <ResponsibilityBadge :flag="order.responsibilityFlag" />
              </td>
              <td class="px-4 py-4 text-right text-sm">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="text-blue-600 hover:text-blue-800"
                    @click="viewDetail(order.id)"
                  >
                    详情
                  </button>
                  <span class="text-gray-300">|</span>
                  <button
                    class="text-green-600 hover:text-green-800"
                    @click="syncOrder(order.id)"
                  >
                    同步
                  </button>
                  <span class="text-gray-300">|</span>
                  <button
                    class="text-purple-600 hover:text-purple-800"
                    @click="flagResponsibility(order.id)"
                  >
                    标记责任
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredOrders.length === 0">
              <td colspan="8" class="px-4 py-12 text-center text-gray-500">
                暂无订单数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RefreshCw, Search } from 'lucide-vue-next'
import StatusBadge from '~/components/StatusBadge.vue'
import ResponsibilityBadge from '~/components/ResponsibilityBadge.vue'
import { useAppStore } from '~/stores/app'
import { useFormat } from '~/composables/useFormat'
import type { Order, OrderStatus, ResponsibilityFlag } from '~/types'

const route = useRoute()
const appStore = useAppStore()
const { formatMoney } = useFormat()

const statusFilter = ref<string>((route.query.status as string) || '')
const platformFilter = ref<string>('')
const responsibilityFilter = ref<string>((route.query.responsibility as string) || '')
const searchKeyword = ref<string>('')

const { data: orders, refresh } = await useFetch<Order[]>('/api/orders')

const filteredOrders = computed(() => {
  if (!orders.value) return []

  return orders.value.filter(order => {
    if (statusFilter.value && order.status !== statusFilter.value) return false
    if (platformFilter.value && order.platform !== platformFilter.value) return false
    if (responsibilityFilter.value && order.responsibilityFlag !== responsibilityFilter.value) return false
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      return (
        order.orderNo.toLowerCase().includes(keyword) ||
        order.buyerName.toLowerCase().includes(keyword)
      )
    }
    return true
  })
})

const handleManualSync = () => {
  refresh()
}

const viewDetail = (id: string) => {
  navigateTo(`/orders/${id}`)
}

const syncOrder = async (id: string) => {
  await $fetch(`/api/orders/${id}/sync`, { method: 'POST' })
  refresh()
}

const flagResponsibility = async (id: string) => {
  const flag = prompt('请输入责任标记 (none/pending_confirm/operation/customs):', 'pending_confirm') as ResponsibilityFlag
  if (flag) {
    await $fetch(`/api/orders/${id}/flag`, {
      method: 'POST',
      body: { flag }
    })
    refresh()
  }
}
</script>
