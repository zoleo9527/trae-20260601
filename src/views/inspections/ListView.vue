<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">📋 设备巡检</h1>
    </div>

    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
          <input 
            v-model="filters.keyword" 
            type="text" 
            placeholder="搜索设备名称、编号、位置、巡检单号..."
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div class="w-44">
          <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select 
            v-model="filters.status" 
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部状态</option>
            <option value="pending">待巡检</option>
            <option value="in_progress">巡检中</option>
            <option value="completed">已完成</option>
            <option value="abnormal">异常</option>
            <option value="recheck">待复检</option>
          </select>
        </div>
        <div class="w-44">
          <label class="block text-sm font-medium text-gray-700 mb-1">巡检人</label>
          <select 
            v-model="filters.inspector" 
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部人员</option>
            <option v-for="u in store.users" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>
        <div class="w-44">
          <label class="block text-sm font-medium text-gray-700 mb-1">关联报修</label>
          <select 
            v-model="filters.hasRelatedRepair" 
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部</option>
            <option value="yes">已关联报修</option>
            <option value="no">未关联报修</option>
          </select>
        </div>
        <div class="w-44">
          <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
          <input 
            v-model="filters.startDate" 
            type="date" 
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div class="w-44">
          <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
          <input 
            v-model="filters.endDate" 
            type="date" 
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div class="flex items-end gap-2">
          <button 
            @click="resetFilters"
            class="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            重置
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">巡检单号</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备信息</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">位置</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">巡检人</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">计划日期</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联报修</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="inspection in filteredInspections" 
              :key="inspection.id"
              class="hover:bg-gray-50 cursor-pointer transition-colors"
              @click="router.push(`/inspections/${inspection.id}`)"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-medium text-blue-600">{{ inspection.inspectionNo }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{{ inspection.deviceName }}</div>
                <div class="text-xs text-gray-500">{{ inspection.deviceCode }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ inspection.location }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ inspection.inspectorName }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ formatDate(inspection.scheduledDate) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <StatusBadge type="inspection" :status="inspection.status" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="inspection.relatedRepairId" class="text-sm text-orange-600">
                  🔗 已关联
                </span>
                <span v-else class="text-sm text-gray-400">-</span>
              </td>
            </tr>
            <tr v-if="filteredInspections.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                没有找到匹配的巡检记录
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
import { useRouter } from 'vue-router'
import { useGasStationStore } from '@/stores/gasStation'
import type { InspectionStatus } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'

const store = useGasStationStore()
const router = useRouter()

const filters = ref({
  keyword: '',
  status: '' as InspectionStatus | '',
  inspector: '',
  hasRelatedRepair: '' as '' | 'yes' | 'no',
  startDate: '',
  endDate: ''
})

const filteredInspections = computed(() => {
  let result = [...store.inspections]
  
  if (filters.value.keyword) {
    const kw = filters.value.keyword.toLowerCase()
    result = result.filter(i => 
      i.deviceName.toLowerCase().includes(kw) ||
      i.deviceCode.toLowerCase().includes(kw) ||
      i.location.toLowerCase().includes(kw) ||
      i.inspectionNo.toLowerCase().includes(kw) ||
      i.overallRemark.toLowerCase().includes(kw)
    )
  }
  
  if (filters.value.status) {
    result = result.filter(i => i.status === filters.value.status)
  }
  
  if (filters.value.inspector) {
    result = result.filter(i => i.inspectorId === filters.value.inspector)
  }

  if (filters.value.hasRelatedRepair === 'yes') {
    result = result.filter(i => !!i.relatedRepairId)
  } else if (filters.value.hasRelatedRepair === 'no') {
    result = result.filter(i => !i.relatedRepairId)
  }

  if (filters.value.startDate) {
    const start = new Date(filters.value.startDate)
    start.setHours(0, 0, 0, 0)
    result = result.filter(i => new Date(i.scheduledDate) >= start)
  }

  if (filters.value.endDate) {
    const end = new Date(filters.value.endDate)
    end.setHours(23, 59, 59, 999)
    result = result.filter(i => new Date(i.scheduledDate) <= end)
  }
  
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const resetFilters = () => {
  filters.value = {
    keyword: '',
    status: '',
    inspector: '',
    hasRelatedRepair: '',
    startDate: '',
    endDate: ''
  }
}

const formatDate = (iso: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>
