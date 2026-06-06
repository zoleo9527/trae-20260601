<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          class="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          @click="navigateTo('/orders')"
        >
          <ArrowLeft class="w-5 h-5" />
          返回
        </button>
        <h1 class="text-2xl font-bold text-gray-900">{{ order?.orderNo }}</h1>
        <StatusBadge v-if="order" :status="order.status" type="order" />
        <ResponsibilityBadge v-if="order" :flag="order.responsibilityFlag" />
      </div>
      <div class="flex items-center gap-3">
        <button
          class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          @click="handleSync"
        >
          <RefreshCw class="w-4 h-4" />
          同步
        </button>
        <button
          class="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          @click="showCommentModal = true"
        >
          <MessageSquare class="w-4 h-4" />
          添加备注
        </button>
        <button
          class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          @click="handleFlagResponsibility"
        >
          <Flag class="w-4 h-4" />
          标记责任
        </button>
      </div>
    </div>

    <div v-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">平台订单号</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ order.platformOrderNo }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">平台</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ order.platform }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">买家名称</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ order.buyerName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">国家</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ order.buyerCountry }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">总金额</p>
              <p class="text-sm font-medium text-gray-900 mt-1">
                {{ formatMoney(order.totalAmount, order.currency) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">同步次数</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ order.syncCount }} 次</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">创建时间</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ formatDate(order.createdAt) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">最后同步</p>
              <p class="text-sm font-medium text-gray-900 mt-1">
                {{ order.lastSyncAt ? formatDate(order.lastSyncAt) : '-' }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">商品列表</h2>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品名称</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">单价</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">小计</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="item in order.skuList" :key="item.sku">
                  <td class="px-4 py-3 text-sm text-gray-900 font-mono">{{ item.sku }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ item.name }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ item.quantity }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    {{ formatMoney(item.price, order.currency) }}
                  </td>
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">
                    {{ formatMoney(item.price * item.quantity, order.currency) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">操作历史</h2>
          <Timeline :events="order.timeline" />
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">关联报关资料</h2>
          <div class="space-y-3">
            <div
              v-for="doc in relatedCustoms"
              :key="doc.id"
              class="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              @click="navigateTo(`/customs/${doc.id}`)"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-blue-600">{{ doc.declarationNo || `版本 ${doc.version}` }}</span>
                <StatusBadge :status="doc.status" type="customs" />
              </div>
              <p class="text-xs text-gray-500 mt-1">版本: {{ doc.version }}</p>
            </div>
            <div v-if="relatedCustoms.length === 0" class="text-center py-4 text-sm text-gray-500">
              暂无关联报关资料
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCommentModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">添加备注</h3>
        <textarea
          v-model="commentText"
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入备注内容..."
        ></textarea>
        <div class="flex justify-end gap-3 mt-4">
          <button
            class="px-4 py-2 text-gray-600 hover:text-gray-900"
            @click="showCommentModal = false"
          >
            取消
          </button>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="handleAddComment"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, RefreshCw, MessageSquare, Flag } from 'lucide-vue-next'
import StatusBadge from '~/components/StatusBadge.vue'
import ResponsibilityBadge from '~/components/ResponsibilityBadge.vue'
import Timeline from '~/components/Timeline.vue'
import { useAppStore } from '~/stores/app'
import { useFormat } from '~/composables/useFormat'
import type { Order, CustomsDocument, ResponsibilityFlag } from '~/types'

const route = useRoute()
const appStore = useAppStore()
const { formatMoney, formatDate } = useFormat()

const orderId = computed(() => route.params.id as string)
const showCommentModal = ref(false)
const commentText = ref('')

const { data: order, refresh } = await useFetch<Order>(() => `/api/orders/${orderId.value}`)
const { data: customsList } = await useFetch<CustomsDocument[]>('/api/customs')

const relatedCustoms = computed(() => {
  if (!customsList.value || !order.value) return []
  return customsList.value.filter(doc => doc.orderId === order.value!.id)
})

const handleSync = async () => {
  await $fetch(`/api/orders/${orderId.value}/sync`, { method: 'POST' })
  refresh()
}

const handleFlagResponsibility = async () => {
  const flag = prompt('请输入责任标记 (none/pending_confirm/operation/customs):', 'pending_confirm') as ResponsibilityFlag
  if (flag) {
    await $fetch(`/api/orders/${orderId.value}/flag`, {
      method: 'POST',
      body: { flag }
    })
    refresh()
  }
}

const handleAddComment = async () => {
  if (!commentText.value.trim()) return

  await $fetch(`/api/orders/${orderId.value}/comment`, {
    method: 'POST',
    body: { comment: commentText.value }
  })
  commentText.value = ''
  showCommentModal.value = false
  refresh()
}
</script>
