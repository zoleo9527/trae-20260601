<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  Eye,
  Download,
  Calendar,
  User,
  MapPin,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-vue-next'
import { gasApi } from '@/api/gas'
import type { HiddenDanger } from '@/types/gas'

const router = useRouter()

const dangers = ref<HiddenDanger[]>([])
const loading = ref(true)
const searchQuery = ref('')
const levelFilter = ref('all')
const statusFilter = ref('all')

const filteredDangers = computed(() => {
  let result = dangers.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(danger => 
      danger.customer_name.toLowerCase().includes(query) ||
      danger.address.toLowerCase().includes(query) ||
      danger.id.toLowerCase().includes(query)
    )
  }
  
  if (levelFilter.value !== 'all') {
    result = result.filter(danger => danger.level === levelFilter.value)
  }
  
  if (statusFilter.value !== 'all') {
    result = result.filter(danger => danger.status === statusFilter.value)
  }
  
  return result
})

const getLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    critical: '严重',
    major: '较大',
    minor: '一般'
  }
  return labels[level] || level
}

const getLevelClass = (level: string) => {
  const classes: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    major: 'bg-orange-100 text-orange-700',
    minor: 'bg-yellow-100 text-yellow-700'
  }
  return classes[level] || 'bg-gray-100 text-gray-700'
}

const getLevelIcon = (level: string) => {
  if (level === 'critical') return AlertCircle
  if (level === 'major') return AlertTriangle
  return AlertTriangle
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待处理',
    in_progress: '处理中',
    completed: '已完成'
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

const getStatusIcon = (status: string) => {
  if (status === 'pending') return Clock
  if (status === 'in_progress') return AlertCircle
  return CheckCircle
}

const handleExport = () => {
  const data = filteredDangers.value.map(danger => ({
    隐患编号: danger.id,
    客户名称: danger.customer_name,
    地址: danger.address,
    隐患等级: getLevelLabel(danger.level),
    状态: getStatusLabel(danger.status),
    发现日期: danger.created_at.split('T')[0],
    处理人: danger.rectified_by || '-'
  }))
  const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `隐患通知_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

async function fetchDangers() {
  loading.value = true
  try {
    const res = await gasApi.getHiddenDangers()
    if (res.success) {
      dangers.value = res.data
    }
  } catch (err) {
    console.error('获取隐患通知失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDangers()
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">隐患通知管理</h1>
        <p class="text-slate-500 mt-1">管理燃气安全隐患，跟踪处理进度</p>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div class="px-6 py-4 border-b border-slate-200">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1 relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索客户名称、地址或隐患编号..."
              class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            v-model="levelFilter"
            class="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">全部等级</option>
            <option value="critical">严重</option>
            <option value="major">较大</option>
            <option value="minor">一般</option>
          </select>
          <select
            v-model="statusFilter"
            class="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="in_progress">处理中</option>
            <option value="completed">已完成</option>
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

      <div class="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <span class="text-sm text-slate-400">共 {{ filteredDangers.length }} 条记录</span>
        <div class="flex items-center gap-4 mt-2">
          <span class="text-xs text-slate-500">等级分布：</span>
          <span class="text-xs">
            <span class="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
            严重 {{ dangers.filter(d => d.level === 'critical').length }}
          </span>
          <span class="text-xs">
            <span class="inline-block w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
            较大 {{ dangers.filter(d => d.level === 'major').length }}
          </span>
          <span class="text-xs">
            <span class="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
            一般 {{ dangers.filter(d => d.level === 'minor').length }}
          </span>
        </div>
      </div>

      <div class="divide-y divide-slate-200">
        <div
          v-for="danger in filteredDangers"
          :key="danger.id"
          class="px-6 py-4 hover:bg-slate-50 transition-colors"
        >
          <div class="flex items-start gap-4">
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', getLevelClass(danger.level)]">
              <component :is="getLevelIcon(danger.level)" class="w-5 h-5" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-sm font-medium text-slate-700">#{{ danger.id }}</span>
                <span :class="['text-xs px-2 py-0.5 rounded-full', getLevelClass(danger.level)]">
                  {{ getLevelLabel(danger.level) }}
                </span>
                <span :class="['text-xs px-2 py-0.5 rounded-full flex items-center gap-1', getStatusClass(danger.status)]">
                  <component :is="getStatusIcon(danger.status)" class="w-3 h-3" />
                  {{ getStatusLabel(danger.status) }}
                </span>
              </div>
              <p class="text-sm text-slate-700 mb-2">{{ danger.description }}</p>
              <div class="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <div class="flex items-center gap-1">
                  <User class="w-4 h-4" />
                  {{ danger.customer_name }}
                </div>
                <div class="flex items-center gap-1">
                  <MapPin class="w-4 h-4" />
                  {{ danger.address }}
                </div>
                <div class="flex items-center gap-1">
                  <Calendar class="w-4 h-4" />
                  {{ danger.created_at.split('T')[0] }}
                </div>
                <div v-if="danger.rectified_by" class="text-slate-600">
                  处理人：{{ danger.rectified_by }}
                </div>
              </div>
            </div>
            <button
              @click="router.push(`/gas/hidden-dangers/${danger.id}`)"
              class="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="查看详情"
            >
              <Eye class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="filteredDangers.length === 0" class="px-6 py-16 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <AlertTriangle class="w-8 h-8 text-slate-400" />
          </div>
          <h3 class="text-lg font-medium text-slate-900 mb-2">暂无隐患通知</h3>
          <p class="text-slate-500">当前筛选条件下没有找到相关的隐患通知</p>
        </div>
      </div>
    </div>
  </div>
</template>
