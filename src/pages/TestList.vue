<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, RotateCcw, Plus, Calendar, User, Folder } from 'lucide-vue-next'
import type { JointTest, TestStatus } from '@/types'
import { testApi } from '@/api'
import StatusTag from '@/components/StatusTag.vue'
import Empty from '@/components/Empty.vue'

const router = useRouter()

interface FilterForm {
  status: string
  project: string
  date_from: string
  date_to: string
}

const tests = ref<JointTest[]>([])
const loading = ref(false)
const filter = ref<FilterForm>({
  status: '',
  project: '',
  date_from: '',
  date_to: '',
})

const statusOptions: { value: TestStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待执行' },
  { value: 'in_progress', label: '执行中' },
  { value: 'passed', label: '已通过' },
  { value: 'failed', label: '未通过' },
]

const getStatusColor = (status: TestStatus) => {
  const colors: Record<TestStatus, string> = {
    pending: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    passed: 'bg-green-500',
    failed: 'bg-red-500',
  }
  return colors[status] || 'bg-gray-400'
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchTests() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filter.value.status) params.status = filter.value.status
    if (filter.value.project) params.project = filter.value.project
    if (filter.value.date_from) params.date_from = filter.value.date_from
    if (filter.value.date_to) params.date_to = filter.value.date_to

    const res = await testApi.getTests(
      Object.keys(params).length > 0 ? params : undefined
    )
    if (res.success) {
      tests.value = res.data || []
    }
  } catch (err) {
    console.error('获取测试列表失败:', err)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  fetchTests()
}

function handleReset() {
  filter.value = {
    status: '',
    project: '',
    date_from: '',
    date_to: '',
  }
  fetchTests()
}

function handleCardClick(id: string) {
  router.push(`/tests/${id}`)
}

onMounted(() => {
  fetchTests()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">联调测试</h1>
        <p class="text-slate-500 mt-1">管理和查看所有联调测试任务</p>
      </div>
      <button
        @click="router.push('/tests/new')"
        class="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
      >
        <Plus class="w-5 h-5" />
        新建测试
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">状态</label>
          <select
            v-model="filter.status"
            class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">项目名称</label>
          <input
            v-model="filter.project"
            type="text"
            placeholder="请输入项目名称"
            class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">开始日期</label>
          <input
            v-model="filter.date_from"
            type="date"
            class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">结束日期</label>
          <input
            v-model="filter.date_to"
            type="date"
            class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div class="flex items-end gap-3">
          <button
            @click="handleSearch"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Search class="w-4 h-4" />
            搜索
          </button>
          <button
            @click="handleReset"
            class="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RotateCcw class="w-4 h-4" />
            重置
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-xl border border-slate-200 p-16">
      <div class="flex items-center justify-center">
        <div class="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>

    <div v-else-if="tests.length === 0" class="bg-white rounded-xl border border-slate-200">
      <Empty
        title="暂无测试数据"
        description="点击右上角「新建测试」创建第一个联调测试任务"
      />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="test in tests"
        :key="test.id"
        @click="handleCardClick(test.id)"
        class="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer flex"
      >
        <div :class="['w-1.5 flex-shrink-0', getStatusColor(test.status)]"></div>
        <div class="flex-1 p-5">
          <div class="flex items-start justify-between gap-3 mb-3">
            <h3 class="text-base font-semibold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
              {{ test.title }}
            </h3>
            <StatusTag type="test" :status="test.status" />
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2 text-slate-600">
              <Folder class="w-4 h-4 text-slate-400" />
              <span class="line-clamp-1">{{ test.project?.name || '-' }}</span>
            </div>
            <div class="flex items-center gap-2 text-slate-600">
              <User class="w-4 h-4 text-slate-400" />
              <span>{{ test.executor || '-' }}</span>
            </div>
            <div class="flex items-center gap-2 text-slate-600">
              <Calendar class="w-4 h-4 text-slate-400" />
              <span>计划：{{ formatDate(test.planned_at) }}</span>
            </div>
            <div class="flex items-center gap-2 text-slate-600">
              <Calendar class="w-4 h-4 text-slate-400" />
              <span>完成：{{ formatDate(test.completed_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
