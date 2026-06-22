<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  User,
  Calendar,
  Folder,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Clock
} from 'lucide-vue-next'
import {
  getTest,
  executeTestItem,
  completeTest,
  convertToIssue
} from '@/api'
import type { JointTest, TestStatus, TestItem, OperationLog } from '@/types'
import StatusTag from '@/components/StatusTag.vue'
import Timeline from '@/components/Timeline.vue'
import { useRole } from '@/stores/role'
import { cn } from '@/lib/utils'

const router = useRouter()
const route = useRoute()
const { currentRole } = useRole()

const test = ref<JointTest | null>(null)
const loading = ref(false)
const executingItemId = ref<string | null>(null)
const completing = ref(false)
const converting = ref(false)
const selectedFailedItems = ref<string[]>([])
const remarkInputs = ref<Record<string, string>>({})
const showConvertPanel = ref(false)
const logs = ref<OperationLog[]>([])

const testId = computed(() => route.params.id as string)

const allItemsExecuted = computed(() => {
  if (!test.value?.items) return false
  return test.value.items.every((item) => item.passed !== null)
})

const hasFailedItems = computed(() => {
  if (!test.value?.items) return false
  return test.value.items.some((item) => item.passed === false)
})

const failedItems = computed(() => {
  if (!test.value?.items) return []
  return test.value.items.filter((item) => item.passed === false)
})

const allFailedSelected = computed(() => {
  return failedItems.value.length > 0 &&
    failedItems.value.every((item) => selectedFailedItems.value.includes(item.id))
})

const canExecute = computed(() => {
  return currentRole.value === 'pm' || currentRole.value === 'captain'
})

const canConvertToIssue = computed(() => {
  return (currentRole.value === 'pm' || currentRole.value === 'captain') &&
    hasFailedItems.value
})

const canComplete = computed(() => {
  return (currentRole.value === 'pm' || currentRole.value === 'captain') &&
    allItemsExecuted.value &&
    test.value?.status !== 'passed' &&
    test.value?.status !== 'failed'
})

const statusBannerClass = computed(() => {
  if (!test.value) return 'bg-gray-500'
  const classes: Record<TestStatus, string> = {
    pending: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    passed: 'bg-green-500',
    failed: 'bg-red-500'
  }
  return classes[test.value.status] || 'bg-gray-500'
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchTest = async () => {
  loading.value = true
  try {
    const res = await getTest(testId.value)
    if (res.success && res.data) {
      test.value = res.data
      logs.value = res.data.logs || []
      selectedFailedItems.value = failedItems.value.map((item) => item.id)
    }
  } catch (err) {
    console.error('获取测试详情失败:', err)
  } finally {
    loading.value = false
  }
}

const handleExecuteItem = async (item: TestItem, passed: boolean) => {
  if (!canExecute.value) return
  executingItemId.value = item.id
  try {
    const res = await executeTestItem(testId.value, {
      testItemId: item.id,
      passed,
      remark: remarkInputs.value[item.id] || undefined
    })
    if (res.success && res.data) {
      test.value = res.data
      selectedFailedItems.value = failedItems.value.map((i) => i.id)
    }
  } catch (err) {
    console.error('执行测试项失败:', err)
  } finally {
    executingItemId.value = null
  }
}

const handleCompleteTest = async () => {
  if (!canComplete.value) return
  completing.value = true
  try {
    const res = await completeTest(testId.value)
    if (res.success && res.data) {
      test.value = res.data
      await fetchTest()
    }
  } catch (err) {
    console.error('完成测试失败:', err)
  } finally {
    completing.value = false
  }
}

const toggleFailedItem = (itemId: string) => {
  const index = selectedFailedItems.value.indexOf(itemId)
  if (index > -1) {
    selectedFailedItems.value.splice(index, 1)
  } else {
    selectedFailedItems.value.push(itemId)
  }
}

const toggleAllFailed = () => {
  if (allFailedSelected.value) {
    selectedFailedItems.value = []
  } else {
    selectedFailedItems.value = failedItems.value.map((item) => item.id)
  }
}

const handleConvertToIssue = async () => {
  if (selectedFailedItems.value.length === 0) return
  converting.value = true
  try {
    const res = await convertToIssue(testId.value, selectedFailedItems.value)
    if (res.success && res.data) {
      showConvertPanel.value = false
      await fetchTest()
      if (res.data.length > 0) {
        router.push('/issues')
      }
    }
  } catch (err) {
    console.error('转问题整改失败:', err)
  } finally {
    converting.value = false
  }
}

onMounted(() => {
  fetchTest()
})
</script>

<template>
  <div class="min-h-full flex flex-col">
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else-if="test">
      <div class="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-200">
        <button
          @click="router.back()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft class="w-5 h-5" />
          <span>返回</span>
        </button>
        <h1 class="text-xl font-bold text-slate-900 flex-1 truncate">
          {{ test.title }}
        </h1>
        <StatusTag type="test" :status="test.status" />
      </div>

      <div :class="['h-2 w-full', statusBannerClass]" />

      <div class="flex-1 p-6 space-y-6 overflow-auto">
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">基本信息</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Folder class="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div class="text-sm text-slate-500">所属项目</div>
                <div class="font-medium text-slate-900">{{ test.project?.name || '-' }}</div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <User class="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div class="text-sm text-slate-500">执行人</div>
                <div class="font-medium text-slate-900">{{ test.executor || '-' }}</div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Calendar class="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div class="text-sm text-slate-500">计划时间</div>
                <div class="font-medium text-slate-900">{{ formatDate(test.planned_at) }}</div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Clock class="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div class="text-sm text-slate-500">完成时间</div>
                <div class="font-medium text-slate-900">{{ formatDate(test.completed_at) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-900">测试项列表</h2>
            <div class="flex items-center gap-3">
              <span class="text-sm text-slate-500">
                共 {{ test.items?.length || 0 }} 项，
                已完成 {{ test.items?.filter((i) => i.passed !== null).length || 0 }} 项，
                <span class="text-green-600 font-medium">通过 {{ test.items?.filter((i) => i.passed === true).length || 0 }}</span>，
                <span class="text-red-600 font-medium">未通过 {{ test.items?.filter((i) => i.passed === false).length || 0 }}</span>
              </span>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="(item, index) in test.items"
              :key="item.id"
              class="border border-slate-200 rounded-xl overflow-hidden"
            >
              <div class="flex items-stretch">
                <div
                  :class="[
                    'w-1.5 flex-shrink-0',
                    item.passed === true ? 'bg-green-500' :
                    item.passed === false ? 'bg-red-500' : 'bg-slate-200'
                  ]"
                />
                <div class="flex-1 p-4">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-3">
                        <span class="text-sm font-medium text-slate-400">{{ index + 1 }}</span>
                        <h3 class="font-medium text-slate-900">{{ item.name }}</h3>
                        <StatusTag
                          v-if="item.passed !== null"
                          type="test"
                          :status="item.passed ? 'passed' : 'failed'"
                        />
                        <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border bg-gray-100 text-gray-700 border-gray-200">
                          <Clock class="w-3.5 h-3.5" />
                          待执行
                        </span>
                      </div>
                      <div class="mt-2 text-sm text-slate-600">
                        <span class="text-slate-400">预期结果：</span>
                        {{ item.expected_result || '无' }}
                      </div>
                      <div v-if="item.actual_result" class="mt-1 text-sm text-slate-600">
                        <span class="text-slate-400">实际结果：</span>
                        {{ item.actual_result }}
                      </div>
                      <div v-if="item.remark" class="mt-1 text-sm text-slate-500">
                        <span class="text-slate-400">备注：</span>
                        {{ item.remark }}
                      </div>
                    </div>

                    <div v-if="canExecute && item.passed === null" class="flex-shrink-0">
                      <div class="flex items-center gap-2">
                        <button
                          @click="handleExecuteItem(item, true)"
                          :disabled="executingItemId === item.id"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 v-if="executingItemId !== item.id" class="w-4 h-4" />
                          <Loader2 v-else class="w-4 h-4 animate-spin" />
                          通过
                        </button>
                        <button
                          @click="handleExecuteItem(item, false)"
                          :disabled="executingItemId === item.id"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <XCircle v-if="executingItemId !== item.id" class="w-4 h-4" />
                          <Loader2 v-else class="w-4 h-4 animate-spin" />
                          未通过
                        </button>
                      </div>
                      <div class="mt-2">
                        <input
                          v-model="remarkInputs[item.id]"
                          type="text"
                          placeholder="添加备注（可选）..."
                          class="w-48 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="canExecute && !allItemsExecuted" class="mt-4 flex items-center justify-end">
            <p class="text-sm text-slate-500">
              提示：逐项点击「通过」或「未通过」完成测试
            </p>
          </div>

          <div v-if="canComplete" class="mt-4 flex items-center justify-end">
            <button
              @click="handleCompleteTest"
              :disabled="completing"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 v-if="!completing" class="w-4.5 h-4.5" />
              <Loader2 v-else class="w-4.5 h-4.5 animate-spin" />
              标记测试完成
            </button>
          </div>
        </div>

        <div v-if="canConvertToIssue" class="bg-white rounded-2xl border border-amber-200 p-6 bg-amber-50/30">
          <button
            @click="showConvertPanel = !showConvertPanel"
            class="w-full flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle class="w-5 h-5 text-amber-600" />
              </div>
              <div class="text-left">
                <h3 class="font-semibold text-slate-900">未通过项转问题整改</h3>
                <p class="text-sm text-slate-500 mt-0.5">
                  选择未通过的测试项，一键生成问题整改单
                </p>
              </div>
            </div>
            <ChevronDown
              :class="['w-5 h-5 text-slate-400 transition-transform', showConvertPanel && 'rotate-180']"
            />
          </button>

          <div v-if="showConvertPanel" class="mt-4 space-y-4">
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="allFailedSelected"
                  @change="toggleAllFailed"
                  class="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                />
                <span class="text-sm font-medium text-slate-700">全选未通过项</span>
              </label>
              <span class="text-sm text-slate-500">
                已选 {{ selectedFailedItems.length }} / {{ failedItems.length }} 项
              </span>
            </div>

            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="item in failedItems"
                :key="item.id"
                class="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200"
              >
                <input
                  type="checkbox"
                  :checked="selectedFailedItems.includes(item.id)"
                  @change="toggleFailedItem(item.id)"
                  class="mt-0.5 w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-slate-900 text-sm">{{ item.name }}</div>
                  <div class="text-xs text-slate-500 mt-1">
                    预期：{{ item.expected_result || '无' }}
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end">
              <button
                @click="handleConvertToIssue"
                :disabled="selectedFailedItems.length === 0 || converting"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText v-if="!converting" class="w-4.5 h-4.5" />
                <Loader2 v-else class="w-4.5 h-4.5 animate-spin" />
                生成问题整改单
              </button>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">操作历史</h2>
          <Timeline :logs="logs" />
        </div>
      </div>
    </template>
  </div>
</template>
