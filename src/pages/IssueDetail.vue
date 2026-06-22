<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-vue-next'
import {
  getIssue,
  assignIssue,
  updateIssueProgress,
  completeIssue,
  verifyIssue
} from '@/api'
import type { Issue, IssueStatus, OperationLog } from '@/types'
import StatusTag from '@/components/StatusTag.vue'
import IssueProgressTimeline from '@/components/IssueProgressTimeline.vue'
import Timeline from '@/components/Timeline.vue'
import { cn } from '@/lib/utils'

const router = useRouter()
const route = useRoute()

const issue = ref<Issue | null>(null)
const loading = ref(false)
const logs = ref<OperationLog[]>([])

const assigneeInput = ref('')
const progressInput = ref('')
const verifyResult = ref<'pass' | 'fail'>('pass')
const verifyRemark = ref('')
const submitting = ref(false)

const statusBannerClass = computed(() => {
  if (!issue.value) return 'bg-gray-500'
  const classes: Record<IssueStatus, string> = {
    pending_assign: 'bg-red-500',
    in_progress: 'bg-orange-500',
    pending_verify: 'bg-blue-500',
    closed: 'bg-green-500'
  }
  return classes[issue.value.status] || 'bg-gray-500'
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchIssue = async () => {
  loading.value = true
  try {
    const res = await getIssue(route.params.id as string)
    if (res.success && res.data) {
      issue.value = res.data
      logs.value = res.data.logs || []
    }
  } catch (err) {
    console.error('获取问题详情失败:', err)
  } finally {
    loading.value = false
  }
}

const handleAssign = async () => {
  if (!assigneeInput.value.trim() || !issue.value) return
  submitting.value = true
  try {
    const res = await assignIssue(issue.value.id, assigneeInput.value.trim())
    if (res.success) {
      assigneeInput.value = ''
      await fetchIssue()
    }
  } catch (err) {
    console.error('指派失败:', err)
  } finally {
    submitting.value = false
  }
}

const handleUpdateProgress = async () => {
  if (!progressInput.value.trim() || !issue.value) return
  submitting.value = true
  try {
    const res = await updateIssueProgress(issue.value.id, progressInput.value.trim())
    if (res.success) {
      progressInput.value = ''
      await fetchIssue()
    }
  } catch (err) {
    console.error('更新进度失败:', err)
  } finally {
    submitting.value = false
  }
}

const handleComplete = async () => {
  if (!issue.value) return
  submitting.value = true
  try {
    const res = await completeIssue(issue.value.id)
    if (res.success) {
      await fetchIssue()
    }
  } catch (err) {
    console.error('提交整改完成失败:', err)
  } finally {
    submitting.value = false
  }
}

const handleVerify = async () => {
  if (!issue.value) return
  submitting.value = true
  try {
    const res = await verifyIssue(issue.value.id, {
      passed: verifyResult.value === 'pass',
      remark: verifyRemark.value.trim() || undefined
    })
    if (res.success) {
      verifyRemark.value = ''
      await fetchIssue()
    }
  } catch (err) {
    console.error('验证失败:', err)
  } finally {
    submitting.value = false
  }
}

const handleSourceTestClick = (testId: string) => {
  router.push(`/tests/${testId}`)
}

onMounted(() => {
  fetchIssue()
})
</script>

<template>
  <div class="min-h-full flex flex-col">
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else-if="issue">
      <div class="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-200">
        <button
          @click="router.back()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft class="w-5 h-5" />
          <span>返回</span>
        </button>
        <h1 class="text-xl font-bold text-slate-900 flex-1 truncate">
          {{ issue.title }}
        </h1>
      </div>

      <div :class="['h-2 w-full', statusBannerClass]" />

      <div class="flex-1 p-6 space-y-6 overflow-auto">
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">基本信息</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle class="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div class="text-sm text-slate-500">严重程度</div>
                <StatusTag type="severity" :status="issue.severity" />
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <User class="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div class="text-sm text-slate-500">责任人</div>
                <div class="font-medium text-slate-900">{{ issue.assignee || '未分配' }}</div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Calendar class="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div class="text-sm text-slate-500">创建时间</div>
                <div class="font-medium text-slate-900">{{ formatDate(issue.created_at) }}</div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Calendar class="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div class="text-sm text-slate-500">关闭时间</div>
                <div class="font-medium text-slate-900">
                  {{ issue.closed_at ? formatDate(issue.closed_at) : '-' }}
                </div>
              </div>
            </div>

            <div v-if="issue.sourceTest" class="md:col-span-2">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div class="text-sm text-slate-500">来源测试</div>
                  <button
                    @click="handleSourceTestClick(issue.test_id!)"
                    class="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {{ issue.sourceTest.title }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">问题描述</h2>
          <div class="text-slate-700 whitespace-pre-wrap leading-relaxed">
            {{ issue.description || '暂无描述' }}
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">操作</h2>

          <div v-if="issue.status === 'pending_assign'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">指派责任人</label>
              <input
                v-model="assigneeInput"
                type="text"
                placeholder="请输入责任人姓名"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              @click="handleAssign"
              :disabled="!assigneeInput.trim() || submitting"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <User class="w-4.5 h-4.5" />
              指派
            </button>
          </div>

          <div v-else-if="issue.status === 'in_progress'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">更新进度</label>
              <textarea
                v-model="progressInput"
                rows="3"
                placeholder="请输入当前整改进度..."
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            <div class="flex items-center gap-3">
              <button
                @click="handleUpdateProgress"
                :disabled="!progressInput.trim() || submitting"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                更新进度
              </button>
              <button
                @click="handleComplete"
                :disabled="submitting"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle class="w-4.5 h-4.5" />
                提交整改完成
              </button>
            </div>
          </div>

          <div v-else-if="issue.status === 'pending_verify'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-3">验证结果</label>
              <div class="flex items-center gap-6">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="verifyResult"
                    type="radio"
                    value="pass"
                    class="w-4 h-4 text-green-600 border-slate-300 focus:ring-green-500"
                  />
                  <span class="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                    <CheckCircle class="w-4 h-4" />
                    通过
                  </span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="verifyResult"
                    type="radio"
                    value="fail"
                    class="w-4 h-4 text-red-600 border-slate-300 focus:ring-red-500"
                  />
                  <span class="inline-flex items-center gap-1.5 text-sm font-medium text-red-700">
                    <XCircle class="w-4 h-4" />
                    不通过
                  </span>
                </label>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
              <textarea
                v-model="verifyRemark"
                rows="3"
                placeholder="请输入验证备注（可选）..."
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            <button
              @click="handleVerify"
              :disabled="submitting"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              验证
            </button>
          </div>

          <div v-else-if="issue.status === 'closed'" class="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
            <CheckCircle class="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <div class="font-medium text-green-900">问题已关闭</div>
              <div class="text-sm text-green-700 mt-0.5">该问题已完成整改并通过验证</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">整改进度</h2>
          <IssueProgressTimeline :progresses="issue.progresses" />
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">操作历史</h2>
          <Timeline :logs="logs" />
        </div>
      </div>
    </template>
  </div>
</template>
