<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Filter, ChevronRight, AlertTriangle } from 'lucide-vue-next'
import type { Issue, IssueStatus, Severity } from '@/types'
import { issueApi } from '@/api'
import { useRole } from '@/stores/role'
import StatusTag from '@/components/StatusTag.vue'

const router = useRouter()
const { isPm, isCaptain, isEngineer } = useRole()

const issues = ref<Issue[]>([])
const loading = ref(true)

const filters = ref({
  status: '',
  assignee: '',
  severity: '',
})

const showFilters = ref(false)

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending_assign', label: '待指派' },
  { value: 'in_progress', label: '整改中' },
  { value: 'pending_verify', label: '待验证' },
  { value: 'closed', label: '已关闭' },
]

const severityOptions = [
  { value: '', label: '全部严重程度' },
  { value: 'critical', label: '严重' },
  { value: 'major', label: '主要' },
  { value: 'minor', label: '次要' },
]

const statusColor: Record<IssueStatus, string> = {
  pending_assign: 'bg-orange-500',
  in_progress: 'bg-blue-500',
  pending_verify: 'bg-amber-500',
  closed: 'bg-green-500',
}

const severityColor: Record<Severity, string> = {
  critical: 'bg-red-500',
  major: 'bg-orange-500',
  minor: 'bg-yellow-500',
}

const filteredIssues = computed(() => issues.value)

function formatDate(date: string | null) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

async function fetchIssues() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.assignee) params.assignee = filters.value.assignee
    if (filters.value.severity) params.severity = filters.value.severity
    issues.value = await issueApi.getIssues(params)
  } catch (error) {
    console.error('获取问题列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  fetchIssues()
}

function handleReset() {
  filters.value = { status: '', assignee: '', severity: '' }
  fetchIssues()
}

onMounted(() => {
  fetchIssues()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">问题整改</h1>
        <p class="text-slate-500 mt-1">管理所有问题整改单，跟踪整改进度和验证</p>
      </div>
      <button
        v-if="isPm"
        @click="router.push('/issues/new')"
        class="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors"
      >
        <Plus class="w-5 h-5" />
        新建问题整改
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200">
      <div class="p-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="filters.assignee"
              type="text"
              placeholder="搜索责任人..."
              class="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              @keyup.enter="handleSearch"
            />
          </div>
          <select
            v-model="filters.status"
            class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <select
            v-model="filters.severity"
            class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option v-for="opt in severityOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handleSearch"
            class="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
          >
            搜索
          </button>
          <button
            @click="handleReset"
            class="px-4 py-2 border border-slate-200 text-sm text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            重置
          </button>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>

      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="issue in filteredIssues"
          :key="issue.id"
          class="p-5 hover:bg-slate-50 cursor-pointer transition-colors"
          @click="router.push(`/issues/${issue.id}`)"
        >
          <div class="flex items-start gap-4">
            <div
              class="w-1.5 self-stretch rounded-full min-h-[60px]"
              :class="statusColor[issue.status]"
            ></div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3">
                    <AlertTriangle
                      class="w-5 h-5 flex-shrink-0"
                      :class="[
                        issue.severity === 'critical' ? 'text-red-500' :
                        issue.severity === 'major' ? 'text-orange-500' : 'text-yellow-500'
                      ]"
                    />
                    <h3 class="text-base font-semibold text-slate-900 truncate">{{ issue.title }}</h3>
                    <StatusTag type="issue" :status="issue.status" />
                    <StatusTag type="severity" :status="issue.severity" />
                  </div>
                  <div class="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span>{{ issue.project_name || issue.project?.name }}</span>
                    <span>·</span>
                    <span>责任人：{{ issue.assignee || '待指派' }}</span>
                    <span>·</span>
                    <span>创建时间：{{ formatDate(issue.created_at) }}</span>
                  </div>
                  <div v-if="issue.test_title" class="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <span class="text-slate-400">来源：</span>
                    <span class="text-blue-600">{{ issue.test_title }}</span>
                  </div>
                  <p v-if="issue.description" class="text-sm text-slate-600 mt-2 line-clamp-2">
                    {{ issue.description }}
                  </p>
                </div>
                <ChevronRight class="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredIssues.length === 0" class="text-center py-16 text-slate-500">
          暂无问题整改记录
        </div>
      </div>
    </div>
  </div>
</template>
