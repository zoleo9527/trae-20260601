<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Filter,
  Checkbox,
  Eye,
  Download,
  Calendar,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  MessageSquare
} from 'lucide-vue-next'
import { gasApi } from '@/api/gas'
import type { CustomerVisit, VisitStatus } from '@/types/gas'

const router = useRouter()

const visits = ref<CustomerVisit[]>([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref<VisitStatus | ''>('')
const selectedIds = ref<string[]>([])

const statusOptions: { value: VisitStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待回访' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '回访失败' },
  { value: 'pending_verify', label: '待验证' }
]

const filteredVisits = computed(() => {
  let result = [...visits.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(visit => 
      visit.customer_name.toLowerCase().includes(query) ||
      visit.address.toLowerCase().includes(query) ||
      visit.id.toLowerCase().includes(query)
    )
  }
  
  if (statusFilter.value) {
    result = result.filter(visit => visit.status === statusFilter.value)
  }
  
  return result
})

const selectedCount = computed(() => selectedIds.value.length)

const isAllSelected = computed(() => {
  return selectedCount.value === filteredVisits.value.length && filteredVisits.value.length > 0
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待回访',
    completed: '已完成',
    failed: '回访失败',
    pending_verify: '待验证'
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    pending_verify: 'bg-blue-100 text-blue-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    pre_visit: '事前回访',
    post_visit: '事后回访',
    follow_up: '跟踪回访'
  }
  return labels[type] || type
}

const getTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    pre_visit: 'bg-blue-100 text-blue-700',
    post_visit: 'bg-green-100 text-green-700',
    follow_up: 'bg-purple-100 text-purple-700'
  }
  return classes[type] || 'bg-gray-100 text-gray-700'
}

const getContactResultLabel = (result: string | undefined) => {
  if (!result) return '-'
  const labels: Record<string, string> = {
    reached: '已联系',
    not_reached: '未联系上',
    refused: '拒绝'
  }
  return labels[result] || result
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredVisits.value.map(visit => visit.id)
  }
}

const toggleSelect = (id: string) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const handleExport = () => {
  const data = filteredVisits.value.map(visit => ({
    回访编号: visit.id,
    客户名称: visit.customer_name,
    联系电话: visit.customer_phone,
    地址: visit.address,
    回访类型: getTypeLabel(visit.visit_type),
    状态: getStatusLabel(visit.status),
    计划日期: visit.scheduled_date,
    回访人: visit.visitor
  }))
  const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `客户回访_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

async function fetchVisits() {
  loading.value = true
  try {
    const res = await gasApi.getVisits()
    if (res.success) {
      visits.value = res.data
    }
  } catch (err) {
    console.error('获取回访列表失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchVisits()
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">客户回访管理</h1>
        <p class="text-slate-500 mt-1">管理客户回访任务，跟踪回访进度</p>
      </div>
      <button
        @click="router.push('/gas/visits/new')"
        class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        <Plus class="w-5 h-5" />
        新建回访
      </button>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div class="px-6 py-4 border-b border-slate-200">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1 relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索客户名称、地址或回访编号..."
              class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div class="flex items-center gap-3">
            <select
              v-model="statusFilter"
              class="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <button
              @click="handleExport"
              class="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download class="w-4 h-4" />
              导出
            </button>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <Checkbox
              :checked="isAllSelected"
              @change="toggleSelectAll"
              class="w-4 h-4 text-green-600 rounded"
            />
            <span class="text-sm text-slate-600">全选</span>
          </label>
          <template v-if="selectedCount > 0">
            <span class="text-sm text-slate-500">已选择 {{ selectedCount }} 条记录</span>
          </template>
          <span class="text-sm text-slate-400 ml-auto">共 {{ filteredVisits.length }} 条记录</span>
        </div>
      </div>

      <div class="divide-y divide-slate-200">
        <div
          v-for="visit in filteredVisits"
          :key="visit.id"
          class="px-6 py-4 hover:bg-slate-50 transition-colors"
        >
          <div class="flex items-start gap-4">
            <label class="flex items-center gap-2 cursor-pointer pt-1">
              <Checkbox
                :checked="selectedIds.includes(visit.id)"
                @change="toggleSelect(visit.id)"
                class="w-4 h-4 text-green-600 rounded"
              />
            </label>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-sm font-medium text-slate-500">#{{ visit.id }}</span>
                <span :class="['text-xs px-2 py-0.5 rounded-full', getTypeClass(visit.visit_type)]">
                  {{ getTypeLabel(visit.visit_type) }}
                </span>
                <span :class="['text-xs px-2 py-0.5 rounded-full', getStatusClass(visit.status)]">
                  {{ getStatusLabel(visit.status) }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <div class="flex items-center gap-1">
                  <User class="w-4 h-4 text-slate-400" />
                  {{ visit.customer_name }}
                </div>
                <div class="flex items-center gap-1">
                  <MapPin class="w-4 h-4 text-slate-400" />
                  {{ visit.address }}
                </div>
                <div class="flex items-center gap-1">
                  <Calendar class="w-4 h-4 text-slate-400" />
                  {{ visit.scheduled_date }}
                </div>
              </div>
              <div class="mt-2 flex items-center gap-4 text-sm">
                <span class="text-slate-500">{{ visit.purpose }}</span>
                <span v-if="visit.contact_result" class="text-slate-400">
                  联系结果: {{ getContactResultLabel(visit.contact_result) }}
                </span>
              </div>
              <div v-if="visit.application" class="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-flex items-center gap-1">
                <MessageSquare class="w-3 h-3" />
                关联申请: {{ visit.application.id }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="router.push(`/gas/visits/${visit.id}`)"
                class="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="查看详情"
              >
                <Eye class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredVisits.length === 0" class="px-6 py-16 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Search class="w-8 h-8 text-slate-400" />
          </div>
          <h3 class="text-lg font-medium text-slate-900 mb-2">暂无回访记录</h3>
          <p class="text-slate-500 mb-4">当前筛选条件下没有找到相关的客户回访</p>
          <button
            @click="router.push('/gas/visits/new')"
            class="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus class="w-4 h-4" />
            新建回访
          </button>
        </div>
      </div>

      <div v-if="loading" class="px-6 py-16 text-center">
        <Loader class="w-8 h-8 mx-auto text-green-500 animate-spin" />
        <p class="text-slate-500 mt-2">加载中...</p>
      </div>
    </div>
  </div>
</template>
