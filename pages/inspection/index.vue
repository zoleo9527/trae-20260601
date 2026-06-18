<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFeedback } from '~/composables/useFeedback'

const { inspections, feedbacks, selectFeedback, openTransferModal, createFeedback } = useFeedback()

const activeTab = ref<'all' | 'normal' | 'warning' | 'error'>('all')
const searchQuery = ref('')
const selectedCategory = ref<string>('all')
const showDetailSidebar = ref(false)
const selectedInspection = ref<any>(null)

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'normal', label: '正常' },
  { key: 'warning', label: '警告' },
  { key: 'error', label: '异常停机' }
]

const categories = computed(() => {
  const cats = [...new Set(inspections.value.map(i => i.category))]
  return [{ value: 'all', label: '全部分类' }, ...cats.map(c => ({ value: c, label: c }))]
})

const filteredInspections = computed(() => {
  let result = inspections.value
  
  if (activeTab.value !== 'all') {
    result = result.filter(i => i.status === activeTab.value)
  }
  
  if (selectedCategory.value !== 'all') {
    result = result.filter(i => i.category === selectedCategory.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(i => 
      i.name.toLowerCase().includes(query) || 
      i.location.toLowerCase().includes(query)
    )
  }
  
  return result
})

const errorItems = computed(() => inspections.value.filter(i => i.status === 'error'))
const warningItems = computed(() => inspections.value.filter(i => i.status === 'warning'))

const getRelatedFeedback = (feedbackId?: string) => {
  if (!feedbackId) return null
  return feedbacks.value.find(f => f.id === feedbackId)
}

const openInspectionDetail = (item: any) => {
  selectedInspection.value = item
  showDetailSidebar.value = true
}

const closeInspectionDetail = () => {
  showDetailSidebar.value = false
  selectedInspection.value = null
}

const viewRelatedFeedback = (feedbackId: string) => {
  const fb = getRelatedFeedback(feedbackId)
  if (fb) {
    closeInspectionDetail()
    selectFeedback(fb)
  }
}

const createFeedbackFromInspection = (item: any) => {
  const newFeedback = createFeedback({
    title: `${item.name} - 展项异常反馈`,
    content: `展项${item.name}（${item.location}）出现异常，备注：${item.lastRemark || '无'}，请尽快处理。`,
    type: 'fault',
    priority: item.status === 'error' ? 'high' : 'medium',
    visitorName: item.inspector || '巡检员',
    visitorContact: '',
    currentAssignee: item.inspector || '王讲解员',
    relatedInspectionId: item.id
  })
  selectFeedback(newFeedback)
  openTransferModal(newFeedback.id)
}

const statusLabels: Record<string, string> = {
  normal: '正常',
  warning: '警告',
  error: '异常停机'
}

const statusColors: Record<string, string> = {
  normal: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-danger'
}

const statusDotColors: Record<string, string> = {
  normal: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">展项巡检</h1>
      <button class="btn btn-primary">
        <span class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          开始巡检
        </span>
      </button>
    </div>

    <div class="grid grid-cols-4 gap-6">
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">总展项数</p>
            <p class="text-2xl font-bold text-gray-900">{{ inspections.length }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">正常运行</p>
            <p class="text-2xl font-bold text-green-600">{{ inspections.filter(i => i.status === 'normal').length }}</p>
          </div>
          <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="card p-5" :class="{ 'ring-2 ring-yellow-400': warningItems.length > 0 }">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">需关注</p>
            <p class="text-2xl font-bold text-yellow-600">{{ warningItems.length }}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="card p-5" :class="{ 'ring-2 ring-red-400 animate-pulse': errorItems.length > 0 }">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">异常停机</p>
            <p class="text-2xl font-bold text-red-600">{{ errorItems.length }}</p>
          </div>
          <div class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div v-if="errorItems.length > 0" class="card p-5 border-l-4 border-l-red-500">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-red-700 mb-2">紧急！以下展项异常停机，需要立即处理</h3>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="item in errorItems"
              :key="item.id"
              @click="openInspectionDetail(item)"
              class="p-3 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-red-900">{{ item.name }}</span>
                <span class="text-xs text-red-600">{{ item.location }}</span>
              </div>
              <p v-if="item.lastRemark" class="text-xs text-red-600 mt-1 line-clamp-1">{{ item.lastRemark }}</p>
              <div v-if="item.relatedFeedbackId" class="mt-2">
                <button
                  @click.stop="viewRelatedFeedback(item.relatedFeedbackId)"
                  class="text-xs text-primary-600 hover:text-primary-700 underline"
                >
                  查看关联反馈 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="border-b border-gray-100">
        <nav class="flex gap-8 px-5">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key as typeof activeTab"
            class="py-4 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === tab.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          >
            {{ tab.label }}
            <span
              v-if="tab.key !== 'all'"
              class="ml-1.5 px-2 py-0.5 text-xs rounded-full"
              :class="activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ inspections.filter(i => i.status === tab.key).length }}
            </span>
          </button>
        </nav>
      </div>
      
      <div class="p-4 flex items-center justify-between gap-4 border-b border-gray-100">
        <div class="flex items-center gap-3 flex-1">
          <div class="relative flex-1 max-w-md">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索展项名称、位置..."
              class="w-full h-9 pl-10 pr-4 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          
          <select
            v-model="selectedCategory"
            class="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
          </select>
        </div>
      </div>
      
      <div class="divide-y divide-gray-100">
        <div
          v-for="item in filteredInspections"
          :key="item.id"
          @click="openInspectionDetail(item)"
          class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          :class="{
            'bg-red-50': item.status === 'error',
            'bg-yellow-50': item.status === 'warning'
          }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full" :class="statusDotColors[item.status]"></div>
              <div>
                <h4 class="text-sm font-medium text-gray-900">{{ item.name }}</h4>
                <p class="text-xs text-gray-500">{{ item.category }} · {{ item.location }}</p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span
                class="text-sm font-medium"
                :class="{
                  'text-gray-600': item.issues === 0,
                  'text-yellow-600': item.issues > 0 && item.issues < 2,
                  'text-red-600': item.issues >= 2
                }"
              >
                {{ item.issues }}个问题
              </span>
              <span class="badge" :class="statusColors[item.status]">{{ statusLabels[item.status] }}</span>
              <button
                v-if="item.status !== 'normal' && !item.relatedFeedbackId"
                @click.stop="createFeedbackFromInspection(item)"
                class="btn btn-primary btn-xs"
              >
                创建反馈
              </button>
              <button
                v-if="item.relatedFeedbackId"
                @click.stop="viewRelatedFeedback(item.relatedFeedbackId)"
                class="btn btn-secondary btn-xs"
              >
                查看反馈
              </button>
            </div>
          </div>
          <div v-if="item.lastRemark" class="mt-2 pl-5">
            <p class="text-xs" :class="item.status === 'error' ? 'text-red-600' : 'text-yellow-600'">
              备注：{{ item.lastRemark }}
            </p>
          </div>
        </div>
        
        <div v-if="filteredInspections.length === 0" class="p-12 text-center">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p class="text-gray-500 text-sm">暂无展项数据</p>
        </div>
      </div>
    </div>

    <div
      class="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-gray-200 shadow-xl z-40 transform transition-transform duration-300"
      :class="showDetailSidebar ? 'translate-x-0' : 'translate-x-full'"
    >
      <div v-if="selectedInspection" class="flex flex-col h-full">
        <div class="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 class="font-semibold text-gray-900">展项详情</h3>
          <button @click="closeInspectionDetail" class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <h4 class="text-base font-medium text-gray-900">{{ selectedInspection.name }}</h4>
              <span class="badge" :class="statusColors[selectedInspection.status]">{{ statusLabels[selectedInspection.status] }}</span>
            </div>
            <p class="text-sm text-gray-500">{{ selectedInspection.category }} · {{ selectedInspection.location }}</p>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">巡检员</span>
              <span class="text-gray-900 font-medium">{{ selectedInspection.inspector }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">上次巡检</span>
              <span class="text-gray-900">{{ selectedInspection.lastInspectionDate }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">下次巡检</span>
              <span class="text-gray-900">{{ selectedInspection.nextInspectionDate }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">问题数量</span>
              <span class="font-medium" :class="selectedInspection.issues > 0 ? 'text-red-600' : 'text-gray-900'">{{ selectedInspection.issues }}</span>
            </div>
          </div>

          <div v-if="selectedInspection.lastRemark">
            <h5 class="text-sm font-medium text-gray-700 mb-2">巡检备注</h5>
            <div class="p-3 rounded-lg" :class="selectedInspection.status === 'error' ? 'bg-red-50 text-red-700' : selectedInspection.status === 'warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'">
              <p class="text-sm">{{ selectedInspection.lastRemark }}</p>
            </div>
          </div>

          <div v-if="selectedInspection.relatedFeedbackId">
            <h5 class="text-sm font-medium text-gray-700 mb-2">关联反馈</h5>
            <div
              v-if="getRelatedFeedback(selectedInspection.relatedFeedbackId)"
              class="p-3 bg-primary-50 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors"
              @click="viewRelatedFeedback(selectedInspection.relatedFeedbackId)"
            >
              <p class="text-sm font-medium text-primary-900">{{ getRelatedFeedback(selectedInspection.relatedFeedbackId)?.title }}</p>
              <p class="text-xs text-primary-600 mt-1">点击查看反馈详情 →</p>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-gray-100 space-y-2">
          <button
            v-if="!selectedInspection.relatedFeedbackId"
            @click="createFeedbackFromInspection(selectedInspection)"
            class="btn btn-primary w-full"
          >
            创建反馈并流转处理
          </button>
          <button
            v-else
            @click="viewRelatedFeedback(selectedInspection.relatedFeedbackId)"
            class="btn btn-secondary w-full"
          >
            查看关联反馈
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
