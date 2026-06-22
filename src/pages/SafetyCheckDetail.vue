<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  AlertTriangle
} from 'lucide-vue-next'
import { gasApi } from '@/api/gas'
import type { SafetyCheck, HiddenDanger } from '@/types/gas'

const router = useRouter()
const route = useRoute()

const check = ref<SafetyCheck | null>(null)
const hiddenDangers = ref<HiddenDanger[]>([])
const loading = ref(true)

const id = computed(() => route.params.id as string)

const getResultLabel = (result: string) => {
  return result === 'passed' ? '通过' : '未通过'
}

const getResultClass = (result: string) => {
  return result === 'passed' 
    ? 'bg-green-100 text-green-700' 
    : 'bg-red-100 text-red-700'
}

const getDangerLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    critical: '严重',
    major: '较大',
    minor: '一般'
  }
  return labels[level] || level
}

const getDangerLevelClass = (level: string) => {
  const classes: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    major: 'bg-orange-100 text-orange-700',
    minor: 'bg-yellow-100 text-yellow-700'
  }
  return classes[level] || 'bg-gray-100 text-gray-700'
}

const getDangerStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待处理',
    in_progress: '处理中',
    completed: '已完成'
  }
  return labels[status] || status
}

const getDangerStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

async function fetchData() {
  loading.value = true
  try {
    const res = await gasApi.getSafetyCheck(id.value)
    if (res.success) {
      check.value = res.data
      hiddenDangers.value = (res.data as any).hiddenDangers || []
    }
  } catch (err) {
    console.error('获取安检详情失败:', err)
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
      <h1 class="text-xl font-semibold text-slate-900">安检详情</h1>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader class="w-8 h-8 text-purple-500 animate-spin" />
    </div>

    <template v-else-if="check">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-start justify-between mb-6">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-sm font-medium text-slate-500">#{{ check.id }}</span>
                  <span :class="['text-xs px-2 py-1 rounded-full', getResultClass(check.overall_result)]">
                    {{ getResultLabel(check.overall_result) }}
                  </span>
                </div>
                <h2 class="text-xl font-semibold text-slate-900">{{ check.customer_name }}</h2>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <MapPin class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">{{ check.address }}</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Calendar class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">检查日期：{{ check.check_date }}</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <ClipboardCheck class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">安检员：{{ check.inspector }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">检查项目</h3>
            <div class="space-y-3">
              <div
                v-for="item in check.items"
                :key="item.id"
                class="flex items-start gap-4 p-4 border border-slate-200 rounded-lg"
              >
                <div :class="[
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                  item.passed ? 'bg-green-100' : 'bg-red-100'
                ]">
                  <component :is="item.passed ? CheckCircle : XCircle" :class="[
                    'w-4 h-4',
                    item.passed ? 'text-green-600' : 'text-red-600'
                  ]" />
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-slate-700">{{ item.item_name }}</span>
                    <span :class="[
                      'text-xs px-2 py-0.5 rounded-full',
                      item.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    ]">
                      {{ item.passed ? '合格' : '不合格' }}
                    </span>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span class="text-slate-500">标准值：</span>
                      <span class="text-slate-700">{{ item.standard }}</span>
                    </div>
                    <div>
                      <span class="text-slate-500">实测值：</span>
                      <span class="text-slate-700">{{ item.actual }}</span>
                    </div>
                  </div>
                  <div v-if="item.remark" class="mt-2 text-sm text-slate-500">
                    备注：{{ item.remark }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="hiddenDangers.length > 0" class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-center gap-2 mb-4">
              <AlertTriangle class="w-5 h-5 text-orange-500" />
              <h3 class="text-lg font-semibold text-slate-900">发现的安全隐患</h3>
            </div>
            <div class="space-y-3">
              <div
                v-for="danger in hiddenDangers"
                :key="danger.id"
                class="p-4 border border-slate-200 rounded-lg"
              >
                <div class="flex items-center justify-between mb-2">
                  <span :class="['text-xs px-2 py-0.5 rounded-full', getDangerLevelClass(danger.level)]">
                    {{ getDangerLevelLabel(danger.level) }}
                  </span>
                  <span :class="['text-xs px-2 py-0.5 rounded-full', getDangerStatusClass(danger.status)]">
                    {{ getDangerStatusLabel(danger.status) }}
                  </span>
                </div>
                <p class="text-sm text-slate-700">{{ danger.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div v-if="check.remark" class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">备注</h3>
            <p class="text-sm text-slate-600">{{ check.remark }}</p>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">统计信息</h3>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">检查项目总数</span>
                <span class="text-slate-700">{{ check.items.length }} 项</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">合格项目</span>
                <span class="text-green-600 font-medium">
                  {{ check.items.filter(i => i.passed).length }} 项
                </span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">不合格项目</span>
                <span class="text-red-600 font-medium">
                  {{ check.items.filter(i => !i.passed).length }} 项
                </span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">发现隐患</span>
                <span class="text-orange-600 font-medium">{{ hiddenDangers.length }} 条</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
