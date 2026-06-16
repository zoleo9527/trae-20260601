<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useInspectionStore } from '~/stores/inspection'
import { computed, ref } from 'vue'

const route = useRoute()
const store = useInspectionStore()

const warningId = computed(() => route.params.id as string)

const warning = computed(() => {
  return store.warnings.find(w => w.id === warningId.value)
})

const relatedReviews = computed(() => {
  if (!warning.value || warning.value.type !== 'bad_review') return []
  return store.badReviews.filter(r => r.storeId === warning.value!.storeId)
})

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    stock_shortage: '缺菜预警',
    bad_review: '外卖差评',
    standard_deviation: '执行标准不一'
  }
  return labels[type] || type
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    stock_shortage: '🥬',
    bad_review: '📝',
    standard_deviation: '📊'
  }
  return icons[type] || '⚠️'
}

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    high: '紧急',
    medium: '中等',
    low: '一般'
  }
  return labels[severity] || severity
}

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    high: 'bg-danger-100 text-danger-600',
    medium: 'bg-warning-100 text-warning-600',
    low: 'bg-gray-100 text-gray-600'
  }
  return colors[severity] || 'bg-gray-100 text-gray-600'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: '处理中',
    resolved: '已处理'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'bg-warning-100 text-warning-600',
    resolved: 'bg-success-100 text-success-600'
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const showActionModal = ref(false)
const actionComment = ref('')

const handleResolve = () => {
  if (!warning.value) return
  store.resolveWarning(warning.value.id, '系统', actionComment.value || undefined)
  showActionModal.value = false
  actionComment.value = ''
}

const handleAddAction = (action: string) => {
  if (!warning.value) return
  store.handleWarning(warning.value.id, action, actionComment.value || undefined)
  showActionModal.value = false
  actionComment.value = ''
}

const showReviewModal = ref<string | null>(null)
const reviewResponse = ref('')

const handleRespondToReview = (id: string) => {
  if (!reviewResponse.value.trim()) return
  store.respondToReview(id, reviewResponse.value)
  store.handleWarning(warning.value!.id, `已回复差评: ${reviewResponse.value.slice(0, 20)}...`)
  showReviewModal.value = null
  reviewResponse.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button
              @click="navigateTo('/inspections/warnings')"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <div>
              <h1 class="text-xl font-bold text-gray-900">预警详情</h1>
              <p class="text-sm text-gray-500">{{ warning?.storeName }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <span
              v-if="warning"
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium',
                getStatusColor(warning.status)
              ]"
            >
              {{ getStatusLabel(warning.status) }}
            </span>
            <button
              v-if="warning?.status === 'active'"
              @click="showActionModal = true"
              class="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              处理预警
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div v-if="!warning" class="text-center py-12">
        <span class="text-4xl">🔍</span>
        <p class="mt-4 text-gray-500">未找到预警记录</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center space-x-4 mb-4">
              <span class="text-3xl">{{ getTypeIcon(warning.type) }}</span>
              <div>
                <h2 class="text-xl font-semibold text-gray-900">{{ getTypeLabel(warning.type) }}</h2>
                <p class="text-sm text-gray-500">{{ warning.title }}</p>
              </div>
              <span
                :class="[
                  'ml-auto px-3 py-1 rounded-full text-sm font-medium',
                  getSeverityColor(warning.severity)
                ]"
              >
                {{ getSeverityLabel(warning.severity) }}
              </span>
            </div>
            <div class="space-y-4">
              <div>
                <p class="text-sm text-gray-500">预警描述</p>
                <p class="text-gray-900 mt-1">{{ warning.description }}</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500">所属门店</p>
                  <p class="font-medium text-gray-900 mt-1">{{ warning.storeName }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">预警时间</p>
                  <p class="font-medium text-gray-900 mt-1">{{ formatTime(warning.createdAt) }}</p>
                </div>
              </div>
              <div v-if="warning.resolvedAt">
                <p class="text-sm text-gray-500">处理时间</p>
                <p class="font-medium text-gray-900 mt-1">{{ formatTime(warning.resolvedAt) }}</p>
              </div>
              <div v-if="warning.handledBy">
                <p class="text-sm text-gray-500">处理人</p>
                <p class="font-medium text-gray-900 mt-1">{{ warning.handledBy }}</p>
              </div>
            </div>
          </div>

          <div v-if="warning.type === 'bad_review' && relatedReviews.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">关联差评</h2>
            <div class="space-y-4">
              <div
                v-for="review in relatedReviews"
                :key="review.id"
                class="p-4 rounded-lg border border-gray-100"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center space-x-2">
                    <span class="font-medium text-gray-900">{{ review.platform }}</span>
                    <div class="flex items-center space-x-0.5">
                      <span v-for="i in 5" :key="i" class="text-sm">
                        {{ i <= review.rating ? '⭐' : '☆' }}
                      </span>
                    </div>
                  </div>
                  <span class="text-xs text-gray-400">{{ formatTime(review.createdAt) }}</span>
                </div>
                <p class="text-sm text-gray-600">{{ review.content }}</p>
                <div v-if="review.response" class="mt-2 p-2 bg-success-50 rounded text-sm text-success-700">
                  💬 {{ review.response }}
                </div>
                <button
                  v-else
                  @click="showReviewModal = review.id"
                  class="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  回复差评
                </button>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">处理历史</h2>
            <div v-if="warning.handlingHistory.length > 0" class="relative">
              <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div class="space-y-6">
                <div
                  v-for="(record, index) in [...warning.handlingHistory].reverse()"
                  :key="record.id"
                  class="relative pl-12"
                >
                  <div
                    :class="[
                      'absolute left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      index === 0 ? 'bg-primary-500 border-primary-500' : 'bg-white border-gray-300'
                    ]"
                  >
                    <span v-if="index === 0" class="text-white text-xs">•</span>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-medium text-gray-900">{{ record.action }}</span>
                        <span class="ml-2 text-sm text-gray-500">{{ record.operator }} ({{ record.operatorRole }})</span>
                      </div>
                      <span class="text-sm text-gray-400">{{ formatTime(record.time) }}</span>
                    </div>
                    <p v-if="record.comment" class="mt-2 text-sm text-gray-600">
                      💬 {{ record.comment }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-400">
              <span class="text-2xl">📝</span>
              <p class="mt-2">暂无处理记录</p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">门店信息</h2>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">门店名称</span>
                <span class="font-medium text-gray-900">{{ warning.storeName }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">店长</span>
                <span class="font-medium text-gray-900">{{ store.stores.find(s => s.id === warning.storeId)?.manager }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">地址</span>
                <span class="font-medium text-gray-900">{{ store.stores.find(s => s.id === warning.storeId)?.address }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">区域</span>
                <span class="font-medium text-gray-900">{{ store.stores.find(s => s.id === warning.storeId)?.region }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">预警统计</h2>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">预警级别</span>
                <span :class="['font-medium', warning.severity === 'high' ? 'text-danger-600' : warning.severity === 'medium' ? 'text-warning-600' : 'text-gray-900']">
                  {{ getSeverityLabel(warning.severity) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">预警状态</span>
                <span :class="['font-medium', warning.status === 'active' ? 'text-warning-600' : 'text-success-600']">
                  {{ getStatusLabel(warning.status) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">处理记录数</span>
                <span class="font-medium text-gray-900">{{ warning.handlingHistory.length }} 条</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Teleport to="body">
      <div
        v-if="showActionModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showActionModal = false"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">处理预警</h3>
          </div>
          <div class="px-6 py-4">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">处理操作</label>
                <div class="space-y-2">
                  <button
                    @click="handleAddAction('开始处理')"
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    ▶️ 开始处理
                  </button>
                  <button
                    @click="handleAddAction('联系门店')"
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    📞 联系门店
                  </button>
                  <button
                    @click="handleResolve"
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    ✅ 标记已处理
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
                <textarea
                  v-model="actionComment"
                  rows="2"
                  placeholder="请输入处理备注..."
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                ></textarea>
              </div>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              @click="showActionModal = false"
              class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showReviewModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showReviewModal = null"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">回复差评</h3>
          </div>
          <div class="px-6 py-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">回复内容</label>
              <textarea
                v-model="reviewResponse"
                rows="4"
                placeholder="请输入回复内容..."
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              ></textarea>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              @click="showReviewModal = null"
              class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="handleRespondToReview(showReviewModal)"
              :disabled="!reviewResponse.trim()"
              class="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送回复
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
