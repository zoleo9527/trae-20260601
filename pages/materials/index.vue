<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFeedback } from '~/composables/useFeedback'

const { materials, feedbacks, selectFeedback, openTransferModal } = useFeedback()

const activeTab = ref<'all' | 'normal' | 'low' | 'out'>('all')
const searchQuery = ref('')
const selectedCategory = ref<string>('all')
const showDetailSidebar = ref(false)
const selectedMaterial = ref<any>(null)

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'normal', label: '正常' },
  { key: 'low', label: '库存预警' },
  { key: 'out', label: '已缺货' }
]

const categories = computed(() => {
  const cats = [...new Set(materials.value.map(m => m.category))]
  return [{ value: 'all', label: '全部分类' }, ...cats.map(c => ({ value: c, label: c }))]
})

const filteredMaterials = computed(() => {
  let result = materials.value
  
  if (activeTab.value !== 'all') {
    result = result.filter(m => m.status === activeTab.value)
  }
  
  if (selectedCategory.value !== 'all') {
    result = result.filter(m => m.category === selectedCategory.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.location.toLowerCase().includes(query)
    )
  }
  
  return result
})

const outStockItems = computed(() => materials.value.filter(m => m.status === 'out'))
const lowStockItems = computed(() => materials.value.filter(m => m.status === 'low'))

const getRelatedFeedback = (feedbackId?: string) => {
  if (!feedbackId) return null
  return feedbacks.value.find(f => f.id === feedbackId)
}

const openMaterialDetail = (item: any) => {
  selectedMaterial.value = item
  showDetailSidebar.value = true
}

const closeMaterialDetail = () => {
  showDetailSidebar.value = false
  selectedMaterial.value = null
}

const viewRelatedFeedback = (feedbackId: string) => {
  const fb = getRelatedFeedback(feedbackId)
  if (fb) {
    closeMaterialDetail()
    selectFeedback(fb)
  }
}

const createFeedbackFromMaterial = (item: any) => {
  openTransferModal('fb-new')
}

const statusLabels: Record<string, string> = {
  normal: '正常',
  low: '库存预警',
  out: '已缺货'
}

const statusColors: Record<string, string> = {
  normal: 'badge-success',
  low: 'badge-warning',
  out: 'badge-danger'
}

const lowStockCount = computed(() => materials.value.filter(m => m.status === 'low').length)
const outStockCount = computed(() => materials.value.filter(m => m.status === 'out').length)
const normalCount = computed(() => materials.value.filter(m => m.status === 'normal').length)
const totalMaterials = computed(() => materials.value.length)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">实验材料</h1>
      <button class="btn btn-primary">
        <span class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          新增材料
        </span>
      </button>
    </div>

    <div v-if="outStockItems.length > 0" class="card p-5 border-l-4 border-l-red-500">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-red-700 mb-2">紧急！以下材料已缺货，影响实验开展</h3>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="item in outStockItems"
              :key="item.id"
              @click="openMaterialDetail(item)"
              class="p-3 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-red-900">{{ item.name }}</span>
                <span class="text-xs text-red-600">{{ item.category }}</span>
              </div>
              <p class="text-xs text-red-600 mt-1">库存：{{ item.quantity }}{{ item.unit }} / 最低{{ item.minStock }}{{ item.unit }}</p>
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

    <div v-if="lowStockItems.length > 0 && outStockItems.length === 0" class="card p-5 border-l-4 border-l-yellow-500">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-yellow-700 mb-2">注意！以下材料库存不足，请及时补充</h3>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="item in lowStockItems"
              :key="item.id"
              @click="openMaterialDetail(item)"
              class="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 cursor-pointer transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-yellow-900">{{ item.name }}</span>
                <span class="text-xs text-yellow-600">{{ item.quantity }}{{ item.unit }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-6">
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">总材料数</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalMaterials }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">库存正常</p>
            <p class="text-2xl font-bold text-green-600">{{ normalCount }}</p>
          </div>
          <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="card p-5" :class="{ 'ring-2 ring-yellow-400': lowStockCount > 0 }">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">库存预警</p>
            <p class="text-2xl font-bold text-yellow-600">{{ lowStockCount }}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="card p-5" :class="{ 'ring-2 ring-red-400 animate-pulse': outStockCount > 0 }">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">已缺货</p>
            <p class="text-2xl font-bold text-red-600">{{ outStockCount }}</p>
          </div>
          <div class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
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
              {{ materials.filter(m => m.status === tab.key).length }}
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
              placeholder="搜索材料名称、位置..."
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
          v-for="item in filteredMaterials"
          :key="item.id"
          @click="openMaterialDetail(item)"
          class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          :class="{
            'bg-red-50': item.status === 'out',
            'bg-yellow-50': item.status === 'low'
          }"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">{{ item.name }}</h4>
              <p class="text-xs text-gray-500">{{ item.category }} · {{ item.location }}</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <span
                  class="text-sm font-semibold"
                  :class="{
                    'text-green-600': item.status === 'normal',
                    'text-yellow-600': item.status === 'low',
                    'text-red-600': item.status === 'out'
                  }"
                >
                  {{ item.quantity }} {{ item.unit }}
                </span>
                <span class="text-xs text-gray-400">(最低: {{ item.minStock }})</span>
              </div>
              <span class="badge" :class="statusColors[item.status]">{{ statusLabels[item.status] }}</span>
              <button
                v-if="item.status !== 'normal' && !item.relatedFeedbackId"
                @click.stop="createFeedbackFromMaterial(item)"
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
          <div v-if="item.lastRemark" class="mt-2">
            <p class="text-xs" :class="item.status === 'out' ? 'text-red-600' : item.status === 'low' ? 'text-yellow-600' : 'text-gray-500'">
              备注：{{ item.lastRemark }}
            </p>
          </div>
        </div>
        
        <div v-if="filteredMaterials.length === 0" class="p-12 text-center">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          <p class="text-gray-500 text-sm">暂无材料数据</p>
        </div>
      </div>
    </div>

    <div
      class="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-gray-200 shadow-xl z-40 transform transition-transform duration-300"
      :class="showDetailSidebar ? 'translate-x-0' : 'translate-x-full'"
    >
      <div v-if="selectedMaterial" class="flex flex-col h-full">
        <div class="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 class="font-semibold text-gray-900">材料详情</h3>
          <button @click="closeMaterialDetail" class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <h4 class="text-base font-medium text-gray-900">{{ selectedMaterial.name }}</h4>
              <span class="badge" :class="statusColors[selectedMaterial.status]">{{ statusLabels[selectedMaterial.status] }}</span>
            </div>
            <p class="text-sm text-gray-500">{{ selectedMaterial.category }} · {{ selectedMaterial.location }}</p>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">当前库存</span>
              <span 
                class="font-semibold"
                :class="{
                  'text-green-600': selectedMaterial.status === 'normal',
                  'text-yellow-600': selectedMaterial.status === 'low',
                  'text-red-600': selectedMaterial.status === 'out'
                }"
              >
                {{ selectedMaterial.quantity }} {{ selectedMaterial.unit }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">最低库存</span>
              <span class="text-gray-900 font-medium">{{ selectedMaterial.minStock }} {{ selectedMaterial.unit }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all"
                :class="{
                  'bg-green-500': selectedMaterial.status === 'normal',
                  'bg-yellow-500': selectedMaterial.status === 'low',
                  'bg-red-500': selectedMaterial.status === 'out'
                }"
                :style="{ width: Math.min((selectedMaterial.quantity / selectedMaterial.minStock) * 100, 100) + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">最后更新</span>
              <span class="text-gray-900">{{ selectedMaterial.lastUpdated }}</span>
            </div>
          </div>

          <div v-if="selectedMaterial.lastRemark">
            <h5 class="text-sm font-medium text-gray-700 mb-2">备注信息</h5>
            <div class="p-3 rounded-lg" :class="selectedMaterial.status === 'out' ? 'bg-red-50 text-red-700' : selectedMaterial.status === 'low' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'">
              <p class="text-sm">{{ selectedMaterial.lastRemark }}</p>
            </div>
          </div>

          <div v-if="selectedMaterial.relatedFeedbackId">
            <h5 class="text-sm font-medium text-gray-700 mb-2">关联反馈</h5>
            <div
              v-if="getRelatedFeedback(selectedMaterial.relatedFeedbackId)"
              class="p-3 bg-primary-50 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors"
              @click="viewRelatedFeedback(selectedMaterial.relatedFeedbackId)"
            >
              <p class="text-sm font-medium text-primary-900">{{ getRelatedFeedback(selectedMaterial.relatedFeedbackId)?.title }}</p>
              <p class="text-xs text-primary-600 mt-1">点击查看反馈详情 →</p>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-gray-100 space-y-2">
          <button
            v-if="!selectedMaterial.relatedFeedbackId && selectedMaterial.status !== 'normal'"
            @click="createFeedbackFromMaterial(selectedMaterial)"
            class="btn btn-primary w-full"
          >
            创建反馈并流转处理
          </button>
          <button
            v-if="selectedMaterial.relatedFeedbackId"
            @click="viewRelatedFeedback(selectedMaterial.relatedFeedbackId)"
            class="btn btn-secondary w-full"
          >
            查看关联反馈
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
