<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">筛选条件</h3>
      <button
        @click="handleClear"
        class="text-sm text-blue-600 hover:text-blue-800"
      >
        清除筛选
      </button>
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">车辆状态</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="status in statusOptions"
            :key="status.value"
            @click="toggleStatus(status.value)"
            :class="[
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              filters.status.includes(status.value)
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            ]"
          >
            {{ status.label }}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">品牌</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="brand in brands"
            :key="brand"
            @click="toggleBrand(brand)"
            :class="[
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              filters.brand.includes(brand)
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            ]"
          >
            {{ brand }}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">责任人</label>
        <select
          v-model="selectedCollector"
          @change="handleCollectorChange"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
        >
          <option value="">全部收车经理</option>
          <option v-for="user in collectors" :key="user.id" :value="user.id">
            {{ user.name }}
          </option>
        </select>
        <select
          v-model="selectedEvaluator"
          @change="handleEvaluatorChange"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
        >
          <option value="">全部评估师</option>
          <option v-for="user in evaluators" :key="user.id" :value="user.id">
            {{ user.name }}
          </option>
        </select>
        <select
          v-model="selectedFinanceStaff"
          @change="handleFinanceStaffChange"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部金融专员</option>
          <option v-for="user in financeStaffs" :key="user.id" :value="user.id">
            {{ user.name }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
        <div class="flex gap-2">
          <select
            v-model="sortField"
            @change="handleSortChange"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">入库时间</option>
            <option value="updatedAt">更新时间</option>
            <option value="purchasePrice">收车价</option>
          </select>
          <button
            @click="toggleSortOrder"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            {{ sortOrder === 'asc' ? '↑ 升序' : '↓ 降序' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useVehicles } from '@/composables/useVehicles'
import { useStatusTransition } from '@/composables/useStatusTransition'
import type { VehicleStatus } from '@/types'

const {
  filters,
  setFilters,
  clearFilters,
  setSort,
  sortBy,
  sortOrder: storeSortOrder,
  getBrands
} = useVehicles()

const { statusConfig } = useStatusTransition()

const statusOptions = computed(() => {
  return Object.entries(statusConfig).map(([value, config]) => ({
    value: value as VehicleStatus,
    label: config.label
  }))
})

const brands = computed(() => getBrands.value)

const selectedCollector = ref('')
const selectedEvaluator = ref('')
const selectedFinanceStaff = ref('')
const sortField = ref('createdAt')
const sortOrder = ref('desc')

onMounted(() => {
  if (filters.value) {
    selectedCollector.value = filters.value.collector || ''
    selectedEvaluator.value = filters.value.evaluator || ''
    selectedFinanceStaff.value = filters.value.financeStaff || ''
    sortField.value = sortBy.value
    sortOrder.value = storeSortOrder.value
  }
})

const collectors = [
  { id: 'U001', name: '张伟' }
]

const evaluators = [
  { id: 'U002', name: '李明' }
]

const financeStaffs = [
  { id: 'U003', name: '王芳' }
]

const toggleStatus = (status: VehicleStatus) => {
  const newStatuses = filters.value.status.includes(status)
    ? filters.value.status.filter(s => s !== status)
    : [...filters.value.status, status]
  setFilters({ status: newStatuses })
}

const toggleBrand = (brand: string) => {
  const newBrands = filters.value.brand.includes(brand)
    ? filters.value.brand.filter(b => b !== brand)
    : [...filters.value.brand, brand]
  setFilters({ brand: newBrands })
}

const handleCollectorChange = () => {
  setFilters({ collector: selectedCollector.value || null })
}

const handleEvaluatorChange = () => {
  setFilters({ evaluator: selectedEvaluator.value || null })
}

const handleFinanceStaffChange = () => {
  setFilters({ financeStaff: selectedFinanceStaff.value || null })
}

const handleSortChange = () => {
  setSort(sortField.value as any, sortOrder.value)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  setSort(sortField.value as any, sortOrder.value)
}

const handleClear = () => {
  clearFilters()
  selectedCollector.value = ''
  selectedEvaluator.value = ''
  selectedFinanceStaff.value = ''
  sortField.value = 'createdAt'
  sortOrder.value = 'desc'
}
</script>
