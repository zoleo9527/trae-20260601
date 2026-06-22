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
  Phone,
  AlertCircle,
  Loader,
  XCircle,
  Check,
  X
} from 'lucide-vue-next'
import { gasApi } from '@/api/gas'
import type { CustomerVisit, GasApplication } from '@/types/gas'

const router = useRouter()
const route = useRoute()

const visit = ref<CustomerVisit | null>(null)
const application = ref<GasApplication | null>(null)
const loading = ref(true)
const showCompleteModal = ref(false)
const showVerifyModal = ref(false)
const contactResult = ref<'reached' | 'not_reached' | 'refused'>('reached')
const feedback = ref('')

const id = computed(() => route.params.id as string)

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
    pre_visit: 'bg-blue-500',
    post_visit: 'bg-green-500',
    follow_up: 'bg-purple-500'
  }
  return classes[type] || 'bg-gray-500'
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

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    safety_inspector: '安检员',
    customer_service: '客服',
    repair_technician: '维修师傅'
  }
  return labels[role] || role
}

const handleComplete = async () => {
  if (!feedback.value.trim()) {
    alert('请填写回访反馈')
    return
  }
  
  try {
    await gasApi.completeVisit(id.value, {
      contact_result: contactResult.value,
      feedback: feedback.value
    })
    showCompleteModal.value = false
    contactResult.value = 'reached'
    feedback.value = ''
    fetchData()
  } catch (err) {
    console.error('完成回访失败:', err)
    alert('操作失败，请重试')
  }
}

const handleVerify = async (passed: boolean) => {
  try {
    await gasApi.verifyVisit(id.value, passed)
    showVerifyModal.value = false
    fetchData()
  } catch (err) {
    console.error('验证回访失败:', err)
    alert('操作失败，请重试')
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await gasApi.getVisit(id.value)
    if (res.success) {
      visit.value = res.data
      application.value = (res.data as any).application || null
    }
  } catch (err) {
    console.error('获取回访详情失败:', err)
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
      <h1 class="text-xl font-semibold text-slate-900">回访详情</h1>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader class="w-8 h-8 text-green-500 animate-spin" />
    </div>

    <template v-else-if="visit">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-start justify-between mb-6">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-sm font-medium text-slate-500">#{{ visit.id }}</span>
                  <span :class="['text-xs px-2 py-1 rounded-full text-white', getTypeClass(visit.visit_type)]">
                    {{ getTypeLabel(visit.visit_type) }}
                  </span>
                </div>
                <h2 class="text-xl font-semibold text-slate-900">{{ visit.customer_name }}</h2>
              </div>
              <span :class="['px-3 py-1.5 rounded-full text-sm font-medium', getStatusClass(visit.status)]">
                {{ getStatusLabel(visit.status) }}
              </span>
            </div>

            <div class="space-y-4">
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <MapPin class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">{{ visit.address }}</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Phone class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">{{ visit.customer_phone }}</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Calendar class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">计划日期：{{ visit.scheduled_date }}</span>
              </div>
              <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <MessageSquare class="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-slate-700 mb-1">回访目的</p>
                  <p class="text-sm text-slate-600">{{ visit.purpose }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="visit.contact_result || visit.feedback" class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">回访记录</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span class="text-sm text-slate-500">联系结果</span>
                <span :class="[
                  'text-sm font-medium',
                  visit.contact_result === 'reached' ? 'text-green-700' :
                  visit.contact_result === 'not_reached' ? 'text-orange-700' : 'text-red-700'
                ]">
                  {{ getContactResultLabel(visit.contact_result) }}
                </span>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg">
                <p class="text-sm font-medium text-slate-700 mb-1">客户反馈</p>
                <p class="text-sm text-slate-600">{{ visit.feedback }}</p>
              </div>
              <div v-if="visit.visited_at" class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span class="text-sm text-slate-500">回访时间</span>
                <span class="text-sm text-slate-700">{{ new Date(visit.visited_at).toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <div v-if="application" class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-center gap-2 mb-4">
              <MessageSquare class="w-5 h-5 text-blue-500" />
              <h3 class="text-lg font-semibold text-slate-900">关联申请</h3>
            </div>
            <div
              @click="router.push(`/gas/applications/${application.id}`)"
              class="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-slate-700">#{{ application.id }}</span>
                <span :class="['text-xs px-2 py-0.5 rounded-full',
                  application.application_type === 'stop' ? 'bg-red-100 text-red-700' :
                  application.application_type === 'resume' ? 'bg-green-100 text-green-700' :
                  'bg-amber-100 text-amber-700'
                ]">
                  {{ application.application_type === 'stop' ? '停气' :
                     application.application_type === 'resume' ? '复气' : '临时停气' }}
                </span>
              </div>
              <p class="text-sm text-slate-500">{{ application.reason }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">操作</h3>
            <div v-if="visit.status === 'pending'" class="space-y-2">
              <button
                @click="showCompleteModal = true"
                class="w-full py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                完成回访
              </button>
            </div>
            <div v-else-if="visit.status === 'pending_verify'" class="space-y-2">
              <button
                @click="showVerifyModal = true"
                class="w-full py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                验证回访结果
              </button>
            </div>
            <div v-else class="text-center py-4 text-slate-400">
              <AlertCircle class="w-8 h-8 mx-auto mb-2" />
              <p>当前状态无可用操作</p>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">回访人信息</h3>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">回访人</span>
                <span class="text-slate-700">{{ visit.visitor }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">角色</span>
                <span class="text-slate-700">{{ getRoleLabel(visit.visitor_role) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">创建时间</span>
                <span class="text-slate-700">{{ new Date(visit.created_at).toLocaleDateString() }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">更新时间</span>
                <span class="text-slate-700">{{ new Date(visit.updated_at).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showCompleteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">完成回访</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">联系结果</label>
              <div class="grid grid-cols-3 gap-3">
                <label
                  :class="[
                    'flex items-center justify-center py-2 rounded-lg border cursor-pointer transition-colors',
                    contactResult === 'reached'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 hover:border-slate-300'
                  ]"
                >
                  <input
                    v-model="contactResult"
                    value="reached"
                    type="radio"
                    class="sr-only"
                  />
                  <CheckCircle class="w-4 h-4 mr-1" />
                  已联系
                </label>
                <label
                  :class="[
                    'flex items-center justify-center py-2 rounded-lg border cursor-pointer transition-colors',
                    contactResult === 'not_reached'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 hover:border-slate-300'
                  ]"
                >
                  <input
                    v-model="contactResult"
                    value="not_reached"
                    type="radio"
                    class="sr-only"
                  />
                  <Clock class="w-4 h-4 mr-1" />
                  未联系上
                </label>
                <label
                  :class="[
                    'flex items-center justify-center py-2 rounded-lg border cursor-pointer transition-colors',
                    contactResult === 'refused'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-slate-200 hover:border-slate-300'
                  ]"
                >
                  <input
                    v-model="contactResult"
                    value="refused"
                    type="radio"
                    class="sr-only"
                  />
                  <XCircle class="w-4 h-4 mr-1" />
                  拒绝
                </label>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">客户反馈</label>
              <textarea
                v-model="feedback"
                rows="4"
                placeholder="请记录客户反馈内容..."
                class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              ></textarea>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button
              @click="showCompleteModal = false"
              class="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              @click="handleComplete"
              class="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              完成回访
            </button>
          </div>
        </div>
      </div>

      <div v-if="showVerifyModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">验证回访结果</h3>
          <p class="text-slate-600 mb-6">请确认回访记录是否有效</p>
          <div class="flex gap-3">
            <button
              @click="handleVerify(false)"
              class="flex-1 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <X class="w-5 h-5" />
              无效
            </button>
            <button
              @click="handleVerify(true)"
              class="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Check class="w-5 h-5" />
              有效
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
