<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Eye,
  Download,
  Calendar,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  ClipboardCheck
} from 'lucide-vue-next'
import { gasApi } from '@/api/gas'
import type { SafetyCheck } from '@/types/gas'

const router = useRouter()

const checks = ref<SafetyCheck[]>([])
const loading = ref(true)
const searchQuery = ref('')

const filteredChecks = computed(() => {
  if (!searchQuery.value) return checks.value
  
  const query = searchQuery.value.toLowerCase()
  return checks.value.filter(check => 
    check.customer_name.toLowerCase().includes(query) ||
    check.address.toLowerCase().includes(query) ||
    check.id.toLowerCase().includes(query)
  )
})

const getResultLabel = (result: string) => {
  return result === 'passed' ? '通过' : '未通过'
}

const getResultClass = (result: string) => {
  return result === 'passed' 
    ? 'bg-green-100 text-green-700' 
    : 'bg-red-100 text-red-700'
}

const getResultIcon = (result: string) => {
  return result === 'passed' ? CheckCircle : XCircle
}

const handleExport = () => {
  const data = filteredChecks.value.map(check => ({
    安检编号: check.id,
    客户名称: check.customer_name,
    联系电话: check.customer_phone,
    地址: check.address,
    安检员: check.inspector,
    检查日期: check.check_date,
    结果: getResultLabel(check.overall_result)
  }))
  const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `安检记录_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

async function fetchChecks() {
  loading.value = true
  try {
    const res = await gasApi.getSafetyChecks()
    if (res.success) {
      checks.value = res.data
    }
  } catch (err) {
    console.error('获取安检记录失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchChecks()
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">安检记录管理</h1>
        <p class="text-slate-500 mt-1">管理燃气安检记录，跟踪安全检查情况</p>
      </div>
      <button
        @click="router.push('/gas/safety-checks/new')"
        class="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
      >
        <Plus class="w-5 h-5" />
        新建安检
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
              placeholder="搜索客户名称、地址或安检编号..."
              class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
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
        <span class="text-sm text-slate-400">共 {{ filteredChecks.length }} 条记录</span>
      </div>

      <div class="divide-y divide-slate-200">
        <div
          v-for="check in filteredChecks"
          :key="check.id"
          class="px-6 py-4 hover:bg-slate-50 transition-colors"
        >
          <div class="flex items-start gap-4">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-sm font-medium text-slate-500">#{{ check.id }}</span>
              <span :class="['text-xs px-2 py-0.5 rounded-full flex items-center gap-1', getResultClass(check.overall_result)]">
                <component :is="getResultIcon(check.overall_result)" class="w-3 h-3" />
                {{ getResultLabel(check.overall_result) }}
              </span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <div class="flex items-center gap-1">
              <User class="w-4 h-4 text-slate-400" />
              {{ check.customer_name }}
            </div>
            <div class="flex items-center gap-1">
              <MapPin class="w-4 h-4 text-slate-400" />
              {{ check.address }}
            </div>
            <div class="flex items-center gap-1">
              <Calendar class="w-4 h-4 text-slate-400" />
              {{ check.check_date }}
            </div>
            <div class="flex items-center gap-1">
              <ClipboardCheck class="w-4 h-4 text-slate-400" />
              {{ check.inspector }}
            </div>
          </div>
          <div class="mt-3 flex items-center gap-2">
            <span class="text-xs text-slate-400">检查项目：{{ check.items.length }} 项</span>
            <span v-if="check.remark" class="text-xs text-slate-500">· {{ check.remark }}</span>
          </div>
          <div class="mt-3 flex items-center justify-end">
            <button
              @click="router.push(`/gas/safety-checks/${check.id}`)"
              class="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="查看详情"
            >
              <Eye class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="filteredChecks.length === 0" class="px-6 py-16 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <ClipboardCheck class="w-8 h-8 text-slate-400" />
          </div>
          <h3 class="text-lg font-medium text-slate-900 mb-2">暂无安检记录</h3>
          <p class="text-slate-500 mb-4">当前筛选条件下没有找到相关的安检记录</p>
          <button
            @click="router.push('/gas/safety-checks/new')"
            class="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Plus class="w-4 h-4" />
            新建安检
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
