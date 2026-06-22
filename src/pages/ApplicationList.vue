<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Filter,
  Checkbox,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader
} from 'lucide-vue-next'
import { gasApi } from '@/api/gas'
import type { GasApplication, ApplicationStatus } from '@/types/gas'

const router = useRouter()

const applications = ref<GasApplication[]>([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref<ApplicationStatus | ''>('')
const selectedIds = ref<string[]>([])
const showActions = ref(false)

const statusOptions: { value: ApplicationStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已批准' },
  { value: 'executing', label: '执行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

const filteredApplications = computed(() => {
  let result = [...applications.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(app => 
      app.customer_name.toLowerCase().includes(query) ||
      app.address.toLowerCase().includes(query) ||
      app.id.toLowerCase().includes(query)
    )
  }
  
  if (statusFilter.value) {
    result = result.filter(app => app.status === statusFilter.value)
  }
  
  return result
})

const selectedCount = computed(() => selectedIds.value.length)

const isAllSelected = computed(() => {
  return selectedCount.value === filteredApplications.value.length && filteredApplications.value.length > 0
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待审核',
    approved: '已批准',
    executing: '执行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    executing: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

const getStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    pending: Clock,
    approved: CheckCircle,
    executing: Loader,
    completed: CheckCircle,
    cancelled: XCircle
  }
  return icons[status] || AlertCircle
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    stop: '停气',
    resume: '复气',
    temporary_stop: '临时停气'
  }
  return labels[type] || type
}

const getTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    stop: 'bg-red-100 text-red-700',
    resume: 'bg-green-100 text-green-700',
    temporary_stop: 'bg-amber-100 text-amber-700'
  }
  return classes[type] || 'bg-gray-100 text-gray-700'
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredApplications.value.map(app => app.id)
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
  const data = filteredApplications.value.map(app => ({
    申请编号: app.id,
    客户名称: app.customer_name,
    联系电话: app.customer_phone,
    地址: app.address,
    申请类型: getTypeLabel(app.application_type),
    状态: getStatusLabel(app.status),
    计划日期: app.planned_date,
    申请人: app.applicant
  }))
  const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `停复气申请_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

const handleBatchCancel = () => {
  if (confirm(`确定要取消选中的 ${selectedCount.value} 条申请吗？`)) {
    selectedIds.value.forEach(id => {
      gasApi.cancelApplication(id, '系统')
    })
    selectedIds.value = []
    fetchApplications()
  }
}

async function fetchApplications() {
  loading.value = true
  try {
    const res = await gasApi.getApplications()
    if (res.success) {
      applications.value = res.data
    }
  } catch (err) {
    console.error('获取申请列表失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchApplications()
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">停复气申请管理</h1>
        <p class="text-slate-500 mt-1">管理燃气停复气申请，跟踪处理进度</p>
      </div>
      <button
        @click="router.push('/gas/applications/new')"
        class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <Plus class="w-5 h-5" />
        新建申请
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
              placeholder="搜索客户名称、地址或申请编号..."
              class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div class="flex items-center gap-3">
            <select
              v-model="statusFilter"
              class="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              class="w-4 h-4 text-blue-600 rounded"
            />
            <span class="text-sm text-slate-600">全选</span>
          </label>
          <template v-if="selectedCount > 0">
            <span class="text-sm text-slate-500">已选择 {{ selectedCount }} 条记录</span>
            <button
              @click="handleBatchCancel"
              class="text-sm text-red-600 hover:text-red-700"
            >
              批量取消
            </button>
          </template>
          <span class="text-sm text-slate-400 ml-auto">共 {{ filteredApplications.length }} 条记录</span>
        </div>
      </div>

      <div class="divide-y divide-slate-200">
        <div
          v-for="app in filteredApplications"
          :key="app.id"
          class="px-6 py-4 hover:bg-slate-50 transition-colors"
        >
          <div class="flex items-start gap-4">
            <label class="flex items-center gap-2 cursor-pointer pt-1">
              <Checkbox
                :checked="selectedIds.includes(app.id)"
                @change="toggleSelect(app.id)"
                class="w-4 h-4 text-blue-600 rounded"
              />
            </label>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-sm font-medium text-slate-500">#{{ app.id }}</span>
                <span :class="['text-xs px-2 py-0.5 rounded-full', getTypeClass(app.application_type)]">
                  {{ getTypeLabel(app.application_type) }}
                </span>
                <span :class="['text-xs px-2 py-0.5 rounded-full flex items-center gap-1', getStatusClass(app.status)]">
                  <component :is="getStatusIcon(app.status)" class="w-3 h-3" />
                  {{ getStatusLabel(app.status) }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <div class="flex items-center gap-1">
                  <User class="w-4 h-4 text-slate-400" />
                  {{ app.customer_name }}
                </div>
                <div class="flex items-center gap-1">
                  <MapPin class="w-4 h-4 text-slate-400" />
                  {{ app.address }}
                </div>
                <div class="flex items-center gap-1">
                  <Calendar class="w-4 h-4 text-slate-400" />
                  {{ app.planned_date }}
                </div>
              </div>
              <div class="mt-2 text-sm text-slate-500 line-clamp-2">{{ app.reason }}</div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="router.push(`/gas/applications/${app.id}`)"
                class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="查看详情"
              >
                <Eye class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredApplications.length === 0" class="px-6 py-16 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Search class="w-8 h-8 text-slate-400" />
          </div>
          <h3 class="text-lg font-medium text-slate-900 mb-2">暂无申请记录</h3>
          <p class="text-slate-500 mb-4">当前筛选条件下没有找到相关的停复气申请</p>
          <button
            @click="router.push('/gas/applications/new')"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus class="w-4 h-4" />
            新建申请
          </button>
        </div>
      </div>

      <div v-if="loading" class="px-6 py-16 text-center">
        <Loader class="w-8 h-8 mx-auto text-blue-500 animate-spin" />
        <p class="text-slate-500 mt-2">加载中...</p>
      </div>
    </div>
  </div>
</template>
