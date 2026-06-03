<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { FileCheck, MessageSquare, Clock, AlertTriangle, Plus, ArrowRight } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useReconciliations, useFeedbacks, useHandover } from '@/composables/useApi'
import type { Reconciliation, Feedback, HandoverItem } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const { getReconciliations } = useReconciliations()
const { getFeedbacks } = useFeedbacks()
const { getHandover } = useHandover()

const reconciliations = ref<Reconciliation[]>([])
const feedbacks = ref<Feedback[]>([])
const handoverItems = ref<HandoverItem[]>([])
const loading = ref(true)

const stats = computed(() => {
  const pendingReconciliationCount = handoverItems.value.filter(
    (item) => (item.type === 'reconciliation' || item.type === 'reconciliation_difference') && item.role === userStore.user?.role
  ).length

  const pendingFeedbackCount = handoverItems.value.filter(
    (item) => item.type === 'feedback' && item.role === userStore.user?.role
  ).length

  const overdueCount = handoverItems.value.filter(
    (item) => item.remainingHours !== null && item.remainingHours < 0 && item.role === userStore.user?.role
  ).length

  return {
    pendingReconciliation: pendingReconciliationCount,
    pendingFeedback: pendingFeedbackCount,
    overdue: overdueCount,
  }
})

const myPendingItems = computed(() =>
  handoverItems.value
    .filter((item) => item.role === userStore.user?.role)
    .slice(0, 5)
)

function formatRemainingHours(hours: number | null) {
  if (hours === null) return '无时效'
  if (hours < 0) return `已超时 ${Math.abs(hours).toFixed(1)} 小时`
  return `剩余 ${hours.toFixed(1)} 小时`
}

function getStatusColor(hours: number | null) {
  if (hours === null) return 'text-slate-500'
  if (hours < 0) return 'text-red-600'
  if (hours < 12) return 'text-amber-600'
  return 'text-emerald-600'
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    reconciliation: '待核对',
    reconciliation_difference: '待处理差异',
    feedback: '待填反馈',
  }
  return labels[type] || type
}

function getTypeBgColor(type: string) {
  const colors: Record<string, string> = {
    reconciliation: 'bg-blue-100 text-blue-700',
    reconciliation_difference: 'bg-amber-100 text-amber-700',
    feedback: 'bg-emerald-100 text-emerald-700',
  }
  return colors[type] || 'bg-slate-100 text-slate-700'
}

function handleItemClick(item: HandoverItem) {
  if (item.type === 'feedback' && item.feedbackId) {
    router.push(`/feedbacks/${item.feedbackId}`)
  } else if (item.reconciliationId) {
    router.push(`/reconciliations/${item.reconciliationId}`)
  }
}

async function loadData() {
  loading.value = true
  try {
    const [recRes, fbRes, hoRes] = await Promise.all([
      getReconciliations(),
      getFeedbacks(),
      getHandover(),
    ])
    if (recRes.success) reconciliations.value = recRes.data
    if (fbRes.success) feedbacks.value = fbRes.data
    if (hoRes.success) handoverItems.value = hoRes.data
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h2 class="text-2xl font-semibold text-slate-800 mb-1">
        欢迎回来，{{ userStore.user?.name }}
      </h2>
      <p class="text-slate-500">{{ userStore.roleLabel }}工作台</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileCheck class="w-6 h-6 text-blue-600" />
          </div>
          <span class="text-3xl font-bold text-slate-800">{{ stats.pendingReconciliation }}</span>
        </div>
        <h3 class="text-slate-800 font-medium mb-1">尾款待核对</h3>
        <p class="text-slate-500 text-sm">需要您确认的对账项</p>
      </div>

      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <MessageSquare class="w-6 h-6 text-emerald-600" />
          </div>
          <span class="text-3xl font-bold text-slate-800">{{ stats.pendingFeedback }}</span>
        </div>
        <h3 class="text-slate-800 font-medium mb-1">反馈待填写</h3>
        <p class="text-slate-500 text-sm">需要您提交的客户反馈</p>
      </div>

      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-red-600" />
          </div>
          <span class="text-3xl font-bold text-slate-800">{{ stats.overdue }}</span>
        </div>
        <h3 class="text-slate-800 font-medium mb-1">超时预警</h3>
        <p class="text-slate-500 text-sm">已超过时效的待办项</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">我的待办</h3>
          <button
            @click="router.push('/handover')"
            class="text-amber-600 text-sm font-medium hover:text-amber-700 flex items-center gap-1"
          >
            查看全部
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
        <div class="p-6">
          <div v-if="loading" class="text-center py-12 text-slate-500">
            加载中...
          </div>
          <div v-else-if="myPendingItems.length === 0" class="text-center py-12">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock class="w-8 h-8 text-slate-400" />
            </div>
            <p class="text-slate-600 font-medium">暂无待办事项</p>
            <p class="text-slate-400 text-sm mt-1">所有工作都已完成</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in myPendingItems"
              :key="item.itemId || item.sectionId"
              class="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              @click="handleItemClick(item)"
            >
              <div class="flex items-center gap-4">
                <span :class="['px-3 py-1 rounded-full text-xs font-medium', getTypeBgColor(item.type)]">
                  {{ getTypeLabel(item.type) }}
                </span>
                <div>
                  <p class="text-slate-800 font-medium">{{ item.eventName }}</p>
                  <p v-if="item.description" class="text-slate-500 text-sm">{{ item.description }}</p>
                </div>
              </div>
              <span :class="['text-sm font-medium', getStatusColor(item.remainingHours)]">
                {{ formatRemainingHours(item.remainingHours) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div v-if="userStore.user?.role === 'sales'" class="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
          <h3 class="text-lg font-semibold mb-4">快捷操作</h3>
          <button
            @click="router.push('/reconciliations')"
            class="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 mb-3"
          >
            <Plus class="w-5 h-5" />
            发起尾款核对
          </button>
          <button
            @click="router.push('/feedbacks')"
            class="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare class="w-5 h-5" />
            查看历史反馈
          </button>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 class="text-lg font-semibold text-slate-800 mb-4">今日概览</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-slate-600">进行中对账</span>
              <span class="font-semibold text-slate-800">{{ reconciliations.filter(r => !r.all_confirmed).length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-600">已完成对账</span>
              <span class="font-semibold text-slate-800">{{ reconciliations.filter(r => r.all_confirmed).length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-600">收集中反馈</span>
              <span class="font-semibold text-slate-800">{{ feedbacks.filter(f => f.status === 'pending').length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-600">已完成反馈</span>
              <span class="font-semibold text-slate-800">{{ feedbacks.filter(f => f.status === 'completed').length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
