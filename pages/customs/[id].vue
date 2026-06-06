<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          class="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          @click="navigateTo('/customs')"
        >
          <ArrowLeft class="w-5 h-5" />
          返回
        </button>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ document?.declarationNo || `报关资料` }}
        </h1>
        <span class="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          V{{ document?.version }}
        </span>
        <StatusBadge v-if="document" :status="document.status" type="customs" />
      </div>
      <div class="flex items-center gap-3">
        <template v-if="document?.status === 'draft'">
          <button
            class="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            @click="handleEdit"
          >
            <Edit class="w-4 h-4" />
            编辑
          </button>
          <button
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            @click="handleSubmit"
          >
            <Send class="w-4 h-4" />
            提交审核
          </button>
        </template>
        <template v-if="document?.status === 'pending_review'">
          <button
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            @click="handleReview(true)"
          >
            <Check class="w-4 h-4" />
            审核通过
          </button>
          <button
            class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            @click="handleReview(false)"
          >
            <X class="w-4 h-4" />
            驳回
          </button>
        </template>
      </div>
    </div>

    <div v-if="document" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">报关资料详情</h2>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <p class="text-sm text-gray-500">关联订单</p>
              <p class="text-sm font-medium text-blue-600 mt-1 cursor-pointer" @click="navigateTo(`/orders/${document.orderId}`)">
                {{ document.orderNo }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">版本</p>
              <p class="text-sm font-medium text-gray-900 mt-1">V{{ document.version }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">出口商</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ document.exporter }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">进口商</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ document.importer }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-sm text-gray-500">货物描述</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ document.goodsDescription }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">HS编码</p>
              <p class="text-sm font-medium text-gray-900 mt-1 font-mono">{{ document.hsCode }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">申报价值</p>
              <p class="text-sm font-medium text-gray-900 mt-1">
                {{ formatMoney(document.declaredValue, document.currency) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">重量</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ document.weight }} kg</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">数量</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ document.quantity }} 件</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">提交人</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ document.submitter || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">审核人</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ document.reviewer || '-' }}</p>
            </div>
            <div v-if="document.reviewComment" class="col-span-2">
              <p class="text-sm text-gray-500">审核意见</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ document.reviewComment }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">操作历史</h2>
          <Timeline :events="document.timeline" />
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">版本历史</h2>
          <div class="space-y-3">
            <div
              v-for="version in versionHistory"
              :key="version.id"
              class="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              :class="{ 'ring-2 ring-blue-500': version.id === document.id }"
              @click="navigateTo(`/customs/${version.id}`)"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-900">V{{ version.version }}</span>
                <StatusBadge :status="version.status" type="customs" />
              </div>
              <p class="text-xs text-gray-500 mt-1">
                {{ formatDate(version.createdAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, Edit, Send, Check, X } from 'lucide-vue-next'
import StatusBadge from '~/components/StatusBadge.vue'
import Timeline from '~/components/Timeline.vue'
import { useAppStore } from '~/stores/app'
import { useFormat } from '~/composables/useFormat'
import type { CustomsDocument } from '~/types'

const route = useRoute()
const appStore = useAppStore()
const { formatMoney, formatDate } = useFormat()

const docId = computed(() => route.params.id as string)

const { data: document, refresh } = await useFetch<CustomsDocument>(() => `/api/customs/${docId.value}`)
const { data: allDocuments } = await useFetch<CustomsDocument[]>('/api/customs')

const versionHistory = computed(() => {
  if (!allDocuments.value || !document.value) return []
  return allDocuments.value
    .filter(doc => doc.orderNo === document.value!.orderNo)
    .sort((a, b) => b.version - a.version)
})

const handleEdit = () => {
  alert('编辑报关资料')
}

const handleSubmit = async () => {
  await $fetch(`/api/customs/${docId.value}/submit`, { method: 'POST' })
  refresh()
}

const handleReview = async (approved: boolean) => {
  const comment = approved ? '' : prompt('请输入驳回原因：')
  if (!approved && !comment) return

  await $fetch(`/api/customs/${docId.value}/review`, {
    method: 'POST',
    body: { approved, comment }
  })
  refresh()
}
</script>
