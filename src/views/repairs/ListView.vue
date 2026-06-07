<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">🔧 异常报修</h1>
    </div>

    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
          <input 
            v-model="filters.keyword" 
            type="text" 
            placeholder="搜索设备名称、编号、报修单号、异常描述..."
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
            <option value="submitted">已提交</option>
            <option value="assigned">已指派</option>
            <option value="in_progress">处理中</option>
            <option value="waiting_parts">待备件</option>
            <option value="completed">已完成</option>
            <option value="verified">已验证</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
        <div class="w-44">
          <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
          <select 
            v-model="filters.priority" 
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部优先级</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="urgent">紧急</option>
          </select>
        </div>
        <div class="w-44">
          <label class="block text-sm font-medium text-gray-700 mb-1">上报人</label>
          <select 
            v-model="filters.reporter" 
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部人员</option>
            <option v-for="u in store.users" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>
        <div class="w-44">
          <label class="block text-sm font-medium text-gray-700 mb-1">处理人</label>
          <select 
            v-model="filters.assignee" 
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部人员</option>
            <option v-for="u in store.users" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>
        <div class="w-44">
          <label class="block text-sm font-medium text-gray-700 mb-1">关联巡检</label>
          <select 
            v-model="filters.hasRelatedInspection" 
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部</option>
            <option value="yes">来自巡检</option>
            <option value="no">直接上报</option>
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报修单号</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备信息</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上报人</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">优先级</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上报时间</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联巡检</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="repair in filteredRepairs" 
              :key="repair.id"
              class="hover:bg-gray-50 cursor-pointer transition-colors"
              @click="router.push(`/repairs/${repair.id}`)"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-medium text-blue-600">{{ repair.repairNo }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{{ repair.deviceName }}</div>
                <div class="text-xs text-gray-500">{{ repair.deviceCode }} · {{ repair.location }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ repair.reporterName }}</div>
                <div class="text-xs text-gray-500">{{ store.roleLabel(repair.reporterRole) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <PriorityBadge :priority="repair.priority" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ formatDateTime(repair.reportedAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <StatusBadge type="repair" :status="repair.status" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="repair.relatedInspectionId" class="text-sm text-blue-600">
                  🔗 已关联
                </span>
                <span v-else class="text-sm text-gray-400">-</span>
              </td>
            </tr>
            <tr v-if="filteredRepairs.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                没有找到匹配的报修记录
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
import type { RepairStatus } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'
import PriorityBadge from '@/components/PriorityBadge.vue'

const store = useGasStationStore()
const router = useRouter()

const filters = ref({
  keyword: '',
  status: '' as RepairStatus | '',
  priority: '' as 'low' | 'medium' | 'high' | 'urgent' | '',
  reporter: '',
  assignee: '',
  hasRelatedInspection: '' as '' | 'yes' | 'no',
  startDate: '',
  endDate: ''
})

const filteredRepairs = computed(() => {
  let result = [...store.repairs]
  
  if (filters.value.keyword) {
    const kw = filters.value.keyword.toLowerCase()
    result = result.filter(r => 
      r.deviceName.toLowerCase().includes(kw) ||
      r.deviceCode.toLowerCase().includes(kw) ||
      r.repairNo.toLowerCase().includes(kw) ||
      r.abnormalDescription.toLowerCase().includes(kw) ||
      r.repairProgress.toLowerCase().includes(kw)
    )
  }
  
  if (filters.value.status) {
    result = result.filter(r => r.status === filters.value.status)
  }
  
  if (filters.value.priority) {
    result = result.filter(r => r.priority === filters.value.priority)
  }
  
  if (filters.value.reporter) {
    result = result.filter(r => r.reporterId === filters.value.reporter)
  }

  if (filters.value.assignee) {
    result = result.filter(r => r.assigneeId === filters.value.assignee)
  }

  if (filters.value.hasRelatedInspection === 'yes') {
    result = result.filter(r => !!r.relatedInspectionId)
  } else if (filters.value.hasRelatedInspection === 'no') {
    result = result.filter(r => !r.relatedInspectionId)
  }

  if (filters.value.startDate) {
    const start = new Date(filters.value.startDate)
    start.setHours(0, 0, 0, 0)
    result = result.filter(r => new Date(r.reportedAt) >= start)
  }

  if (filters.value.endDate) {
    const end = new Date(filters.value.endDate)
    end.setHours(23, 59, 59, 999)
    result = result.filter(r => new Date(r.reportedAt) <= end)
  }
  
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const resetFilters = () => {
  filters.value = {
    keyword: '',
    status: '',
    priority: '',
    reporter: '',
    assignee: '',
    hasRelatedInspection: '',
    startDate: '',
    endDate: ''
  }
}

const formatDateTime = (iso: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>
