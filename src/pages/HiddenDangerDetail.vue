<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  UserCheck,
  Loader,
  FileText,
  CheckSquare
} from 'lucide-vue-next'
import { gasApi } from '@/api/gas'
import type { HiddenDanger } from '@/types/gas'

const router = useRouter()
const route = useRoute()

const danger = ref<HiddenDanger | null>(null)
const loading = ref(true)
const isCompleting = ref(false)

const id = computed(() => route.params.id as string)

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

const canComplete = computed(() => {
  return danger.value?.status !== 'completed'
})

const handleComplete = async () => {
  if (!canComplete.value) return
  
  isCompleting.value = true
  try {
    await gasApi.rectifyHiddenDanger(id.value, {
      rectified_by: '维修师傅张工',
      verify_result: 'passed'
    })
    danger.value!.status = 'completed'
    danger.value!.rectified_by = '维修师傅张工'
  } catch (err) {
    console.error('处理隐患失败:', err)
  } finally {
    isCompleting.value = false
  }
}

async function fetchDanger() {
  loading.value = true
  try {
    const res = await gasApi.getHiddenDanger(id.value)
    if (res.success) {
      danger.value = res.data
    }
  } catch (err) {
    console.error('获取隐患详情失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDanger()
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
      <h1 class="text-xl font-semibold text-slate-900">隐患详情</h1>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader class="w-8 h-8 text-purple-500 animate-spin" />
    </div>

    <template v-else-if="danger">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-3">
                <div :class="['w-12 h-12 rounded-full flex items-center justify-center', getLevelClass(danger.level)]">
                  <component :is="getLevelIcon(danger.level)" class="w-6 h-6" />
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-medium text-slate-500">#{{ danger.id }}</span>
                    <span :class="['text-xs px-2 py-0.5 rounded-full', getLevelClass(danger.level)]">
                      {{ getLevelLabel(danger.level) }}
                    </span>
                  </div>
                  <h2 class="text-xl font-semibold text-slate-900">{{ danger.customer_name }}</h2>
                </div>
              </div>
              <span :class="['px-3 py-1 rounded-full flex items-center gap-1', getStatusClass(danger.status)]">
                <component :is="getStatusIcon(danger.status)" class="w-4 h-4" />
                {{ getStatusLabel(danger.status) }}
              </span>
            </div>

            <div class="space-y-4">
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <MapPin class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">{{ danger.address }}</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Calendar class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">发现日期：{{ new Date(danger.created_at).toLocaleDateString() }}</span>
              </div>
              <div v-if="danger.rectified_by" class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <UserCheck class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">处理人：{{ danger.rectified_by }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-center gap-2 mb-4">
              <AlertTriangle class="w-5 h-5 text-orange-500" />
              <h3 class="text-lg font-semibold text-slate-900">隐患描述</h3>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed">{{ danger.description }}</p>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-center gap-2 mb-4">
              <FileText class="w-5 h-5 text-slate-500" />
              <h3 class="text-lg font-semibold text-slate-900">处理建议</h3>
            </div>
            <div class="space-y-2">
              <div v-if="danger.level === 'critical'" class="p-4 bg-red-50 rounded-lg">
                <p class="text-sm text-red-700">
                  【严重隐患】请立即安排维修人员上门处理，必要时先采取停气措施确保安全。
                </p>
              </div>
              <div v-if="danger.level === 'major'" class="p-4 bg-orange-50 rounded-lg">
                <p class="text-sm text-orange-700">
                  【较大隐患】请尽快安排维修人员上门处理，建议在3个工作日内完成。
                </p>
              </div>
              <div v-if="danger.level === 'minor'" class="p-4 bg-yellow-50 rounded-lg">
                <p class="text-sm text-yellow-700">
                  【一般隐患】请在7个工作日内安排维修人员上门处理。
                </p>
              </div>
            </div>
          </div>

          <div v-if="danger.status === 'completed'" class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-center gap-2 mb-4">
              <CheckSquare class="w-5 h-5 text-green-500" />
              <h3 class="text-lg font-semibold text-slate-900">处理结果</h3>
            </div>
            <div class="p-4 bg-green-50 rounded-lg">
              <p class="text-sm text-green-700">隐患已由 {{ danger.rectified_by || '系统' }} 处理完成，验证结果：{{ danger.verify_result || '通过' }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">操作</h3>
            <button
              v-if="canComplete"
              @click="handleComplete"
              :disabled="isCompleting"
              :class="[
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors',
                isCompleting 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              ]"
            >
              <CheckCircle class="w-5 h-5" />
              {{ isCompleting ? '处理中...' : '标记为已处理' }}
            </button>
            <div v-else class="w-full p-4 bg-green-50 text-green-700 rounded-lg text-center">
              <CheckCircle class="w-6 h-6 mx-auto mb-2" />
              <p class="text-sm">该隐患已处理完成</p>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">关联信息</h3>
            <div class="space-y-3">
              <div v-if="danger.check_id" class="p-3 bg-slate-50 rounded-lg">
                <span class="text-xs text-slate-500">关联安检记录</span>
                <p class="text-sm text-slate-700">#{{ danger.check_id }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
