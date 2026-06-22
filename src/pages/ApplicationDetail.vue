<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Calendar,
  MessageSquare,
  FileText,
  Phone,
  AlertCircle,
  Loader,
  XCircle,
  TrendingUp
} from 'lucide-vue-next'
import { gasApi, createVisit } from '@/api/gas'
import type { GasApplication, CustomerVisit } from '@/types/gas'

const router = useRouter()
const route = useRoute()

const application = ref<GasApplication | null>(null)
const visits = ref<CustomerVisit[]>([])
const loading = ref(true)
const showActionModal = ref(false)
const selectedAction = ref('')
const actionRemark = ref('')
const showVisitModal = ref(false)

const id = computed(() => route.params.id as string)

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

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    stop: '停气申请',
    resume: '复气申请',
    temporary_stop: '临时停气申请'
  }
  return labels[type] || type
}

const getTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    stop: 'bg-red-500',
    resume: 'bg-green-500',
    temporary_stop: 'bg-amber-500'
  }
  return classes[type] || 'bg-gray-500'
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    safety_inspector: '安检员',
    customer_service: '客服',
    repair_technician: '维修师傅'
  }
  return labels[role] || role
}

const getVisitTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    pre_visit: '事前回访',
    post_visit: '事后回访',
    follow_up: '跟踪回访'
  }
  return labels[type] || type
}

const getVisitStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待回访',
    completed: '已完成',
    failed: '回访失败',
    pending_verify: '待验证'
  }
  return labels[status] || status
}

const getVisitStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    pending_verify: 'bg-blue-100 text-blue-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

const availableActions = computed(() => {
  if (!application.value) return []
  const actions = []
  if (application.value.status === 'pending') {
    actions.push({ value: 'approve', label: '批准申请', color: 'bg-green-500' })
    actions.push({ value: 'cancel', label: '取消申请', color: 'bg-red-500' })
  }
  if (application.value.status === 'approved') {
    actions.push({ value: 'execute', label: '开始执行', color: 'bg-blue-500' })
  }
  if (application.value.status === 'executing') {
    actions.push({ value: 'complete', label: '完成执行', color: 'bg-green-500' })
  }
  return actions
})

const handleAction = async () => {
  if (!selectedAction.value) return
  
  try {
    switch (selectedAction.value) {
      case 'approve':
        await gasApi.approveApplication(id.value, '安检员王师傅')
        break
      case 'cancel':
        await gasApi.cancelApplication(id.value, '客服小李')
        break
      case 'execute':
        await gasApi.executeApplication(id.value, '维修师傅张工')
        break
      case 'complete':
        await gasApi.completeApplication(id.value)
        break
    }
    showActionModal.value = false
    selectedAction.value = ''
    actionRemark.value = ''
    fetchData()
  } catch (err) {
    console.error('操作失败:', err)
  }
}

const handleCreateVisit = async () => {
  if (!application.value) return
  
  const visitType = application.value.status === 'completed' ? 'post_visit' : 'pre_visit'
  const purpose = visitType === 'post_visit' ? '停复气后回访确认' : '停复气前确认'
  
  try {
    await gasApi.createVisit({
      application_id: application.value.id,
      customer_id: application.value.customer_id,
      customer_name: application.value.customer_name,
      customer_phone: application.value.customer_phone,
      address: application.value.address,
      visit_type: visitType as any,
      purpose,
      visitor: '客服小李',
      visitor_role: 'customer_service',
      scheduled_date: new Date().toISOString().split('T')[0]
    })
    showVisitModal.value = false
    fetchData()
  } catch (err) {
    console.error('创建回访失败:', err)
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await gasApi.getApplication(id.value)
    if (res.success) {
      application.value = res.data
      visits.value = (res.data as any).visits || []
    }
  } catch (err) {
    console.error('获取申请详情失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center gap-4 mb-6">
      <button
        @click="router.back()"
        class="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <ArrowLeft class="w-5 h-5" />
        返回
      </button>
      <div class="h-6 w-px bg-slate-300"></div>
      <h1 class="text-xl font-semibold text-slate-900">申请详情</h1>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader class="w-8 h-8 text-blue-500 animate-spin" />
    </div>

    <template v-else-if="application">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-start justify-between mb-6">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-sm font-medium text-slate-500">#{{ application.id }}</span>
                  <span :class="['text-xs px-2 py-1 rounded-full text-white', getTypeClass(application.application_type)]">
                    {{ getTypeLabel(application.application_type) }}
                  </span>
                </div>
                <h2 class="text-xl font-semibold text-slate-900">{{ application.customer_name }}</h2>
              </div>
              <span :class="['px-3 py-1.5 rounded-full text-sm font-medium', getStatusClass(application.status)]">
                {{ getStatusLabel(application.status) }}
              </span>
            </div>

            <div class="space-y-4">
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <MapPin class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">{{ application.address }}</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Phone class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">{{ application.customer_phone }}</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Calendar class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">计划日期：{{ application.planned_date }}</span>
              </div>
              <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <FileText class="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-slate-700 mb-1">申请原因</p>
                  <p class="text-sm text-slate-600">{{ application.reason }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">处理进度</h3>
            <div class="relative">
              <div class="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200"></div>
              <div class="space-y-6">
                <div class="relative pl-8">
                  <div class="absolute left-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Clock class="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-900">申请创建</p>
                    <p class="text-xs text-slate-500">{{ application.applicant }} · {{ getRoleLabel(application.applicant_role) }}</p>
                    <p class="text-xs text-slate-400 mt-1">{{ new Date(application.created_at).toLocaleString() }}</p>
                  </div>
                </div>
                <div v-if="application.approved_at" class="relative pl-8">
                  <div class="absolute left-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle class="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-900">申请批准</p>
                    <p class="text-xs text-slate-500">{{ application.approved_by }}</p>
                    <p class="text-xs text-slate-400 mt-1">{{ new Date(application.approved_at).toLocaleString() }}</p>
                  </div>
                </div>
                <div v-if="application.executed_at" class="relative pl-8">
                  <div class="absolute left-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <TrendingUp class="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-900">开始执行</p>
                    <p class="text-xs text-slate-500">{{ application.executor }}</p>
                    <p class="text-xs text-slate-400 mt-1">{{ new Date(application.executed_at).toLocaleString() }}</p>
                  </div>
                </div>
                <div v-if="application.completed_at" class="relative pl-8">
                  <div class="absolute left-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle class="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-900">执行完成</p>
                    <p class="text-xs text-slate-400 mt-1">{{ new Date(application.completed_at).toLocaleString() }}</p>
                  </div>
                </div>
                <div v-if="application.cancelled_at" class="relative pl-8">
                  <div class="absolute left-0 w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center">
                    <XCircle class="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-900">申请取消</p>
                    <p class="text-xs text-slate-500">{{ application.cancelled_by }}</p>
                    <p class="text-xs text-slate-400 mt-1">{{ new Date(application.cancelled_at).toLocaleString() }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-slate-900">关联回访记录</h3>
              <button
                v-if="application.status !== 'cancelled'"
                @click="showVisitModal = true"
                class="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <MessageSquare class="w-4 h-4" />
                创建回访
              </button>
            </div>
            <div v-if="visits.length === 0" class="text-center py-8 text-slate-400">
              <MessageSquare class="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p>暂无关联回访记录</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="visit in visits"
                :key="visit.id"
                @click="router.push(`/gas/visits/${visit.id}`)"
                class="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-slate-700">{{ getVisitTypeLabel(visit.visit_type) }}</span>
                  <span :class="['text-xs px-2 py-0.5 rounded-full', getVisitStatusClass(visit.status)]">
                    {{ getVisitStatusLabel(visit.status) }}
                  </span>
                </div>
                <p class="text-sm text-slate-500 mb-1">{{ visit.purpose }}</p>
                <p class="text-xs text-slate-400">回访人：{{ visit.visitor }} · {{ visit.scheduled_date }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">操作</h3>
            <div v-if="availableActions.length > 0" class="space-y-2">
              <button
                v-for="action in availableActions"
                :key="action.value"
                @click="selectedAction = action.value; showActionModal = true"
                :class="['w-full py-2.5 rounded-lg text-white font-medium transition-colors', action.color]"
              >
                {{ action.label }}
              </button>
            </div>
            <div v-else class="text-center py-4 text-slate-400">
              <AlertCircle class="w-8 h-8 mx-auto mb-2" />
              <p>当前状态无可用操作</p>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">信息摘要</h3>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">申请人</span>
                <span class="text-slate-700">{{ application.applicant }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">申请角色</span>
                <span class="text-slate-700">{{ getRoleLabel(application.applicant_role) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">创建时间</span>
                <span class="text-slate-700">{{ new Date(application.created_at).toLocaleDateString() }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">更新时间</span>
                <span class="text-slate-700">{{ new Date(application.updated_at).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showActionModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">确认操作</h3>
          <p class="text-slate-600 mb-4">确定要{{ availableActions.find(a => a.value === selectedAction)?.label }}吗？</p>
          <textarea
            v-model="actionRemark"
            placeholder="请输入备注（可选）"
            class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          ></textarea>
          <div class="flex gap-3 mt-4">
            <button
              @click="showActionModal = false"
              class="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              @click="handleAction"
              :class="['flex-1 py-2 rounded-lg text-white', availableActions.find(a => a.value === selectedAction)?.color]"
            >
              确认
            </button>
          </div>
        </div>
      </div>

      <div v-if="showVisitModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">创建回访记录</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">回访类型</label>
              <div class="px-4 py-3 bg-slate-50 rounded-lg">
                {{ application.status === 'completed' ? '事后回访' : '事前回访' }}
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">回访目的</label>
              <div class="px-4 py-3 bg-slate-50 rounded-lg">
                {{ application.status === 'completed' ? '停复气后回访确认' : '停复气前确认' }}
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">客户信息</label>
              <div class="px-4 py-3 bg-slate-50 rounded-lg">
                {{ application.customer_name }} · {{ application.customer_phone }}
              </div>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button
              @click="showVisitModal = false"
              class="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              @click="handleCreateVisit"
              class="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              创建回访
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
