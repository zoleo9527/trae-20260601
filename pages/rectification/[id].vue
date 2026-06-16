<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useInspectionStore } from '~/stores/inspection'
import { computed, ref } from 'vue'

const route = useRoute()
const store = useInspectionStore()

const taskId = computed(() => route.params.id as string)

const task = computed(() => {
  return store.rectificationTasks.find(t => t.id === taskId.value)
})

const inspection = computed(() => {
  if (!task.value) return null
  return store.inspections.find(i => i.id === task.value!.inspectionId)
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待处理',
    processing: '进行中',
    completed: '已完成',
    verified: '已验收'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-danger-100 text-danger-600',
    processing: 'bg-warning-100 text-warning-600',
    completed: 'bg-primary-100 text-primary-600',
    verified: 'bg-success-100 text-success-600'
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    high: '紧急',
    medium: '中等',
    low: '一般'
  }
  return labels[priority] || priority
}

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    high: 'bg-danger-100 text-danger-600',
    medium: 'bg-warning-100 text-warning-600',
    low: 'bg-gray-100 text-gray-600'
  }
  return colors[priority] || 'bg-gray-100 text-gray-600'
}

const getAssigneeLabel = (role: string) => {
  const labels: Record<string, string> = {
    store_manager: '店长',
    regional_supervisor: '区域督导',
    purchaser: '采购'
  }
  return labels[role] || role
}

const comment = ref('')
const showActionModal = ref<string | null>(null)

const canTakeAction = computed(() => {
  if (!task.value) return false
  const role = store.currentRole
  if (role === 'store_manager') {
    return task.value.status === 'pending' || task.value.status === 'processing'
  }
  if (role === 'regional_supervisor') {
    return task.value.status === 'completed'
  }
  return false
})

const getNextStatus = (currentStatus: string) => {
  const transitions: Record<string, string> = {
    pending: 'processing',
    processing: 'completed',
    completed: 'verified'
  }
  return transitions[currentStatus]
}

const handleAction = () => {
  if (!task.value || !showActionModal.value) return
  
  const nextStatus = getNextStatus(task.value.status) as any
  store.updateTaskStatus(task.value.id, nextStatus, comment.value || undefined)
  
  showActionModal.value = null
  comment.value = ''
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button
              @click="navigateTo('/rectification')"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <div>
              <h1 class="text-xl font-bold text-gray-900">整改任务详情</h1>
              <p class="text-sm text-gray-500">{{ task?.storeName }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <span
              v-if="task"
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium',
                getStatusColor(task.status)
              ]"
            >
              {{ getStatusLabel(task.status) }}
            </span>
            <button
              v-if="canTakeAction"
              @click="showActionModal = task.status"
              class="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              {{ task?.status === 'pending' ? '接受任务' : task?.status === 'processing' ? '完成整改' : '验收通过' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div v-if="!task" class="text-center py-12">
        <span class="text-4xl">🔍</span>
        <p class="mt-4 text-gray-500">未找到整改任务</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">任务信息</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">任务标题</p>
                <p class="font-medium text-gray-900">{{ task.title }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">优先级</p>
                <span
                  :class="[
                    'inline-flex px-2 py-1 rounded text-sm font-medium',
                    getPriorityColor(task.priority)
                  ]"
                >
                  {{ getPriorityLabel(task.priority) }}
                </span>
              </div>
              <div>
                <p class="text-sm text-gray-500">负责人</p>
                <p class="font-medium text-gray-900">{{ task.assignee }} ({{ getAssigneeLabel(task.assigneeRole) }})</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">截止日期</p>
                <p :class="['font-medium', new Date(task.deadline) < new Date() && task.status !== 'verified' ? 'text-danger-600' : 'text-gray-900']">
                  {{ task.deadline }}
                  <span v-if="new Date(task.deadline) < new Date() && task.status !== 'verified'" class="ml-1">⚠️ 已逾期</span>
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">任务描述</h2>
            <p class="text-gray-600">{{ task.description }}</p>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">处理历史</h2>
            <div class="relative">
              <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div class="space-y-6">
                <div
                  v-for="(record, index) in [...task.history].reverse()"
                  :key="record.id"
                  class="relative pl-12"
                >
                  <div
                    :class="[
                      'absolute left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      index === 0 ? 'bg-primary-500 border-primary-500' : 'bg-white border-gray-300'
                    ]"
                  >
                    <span v-if="index === 0" class="text-white text-xs">•</span>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-medium text-gray-900">{{ record.action }}</span>
                        <span class="ml-2 text-sm text-gray-500">{{ record.operator }} ({{ record.operatorRole }})</span>
                      </div>
                      <span class="text-sm text-gray-400">{{ formatTime(record.time) }}</span>
                    </div>
                    <p v-if="record.comment" class="mt-2 text-sm text-gray-600">
                      💬 {{ record.comment }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div v-if="inspection" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">关联检查</h2>
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-gray-900">{{ inspection.storeName }}</span>
                <span class="text-sm text-gray-500">{{ inspection.inspectDate }}</span>
              </div>
              <p class="text-sm text-gray-600">检查人: {{ inspection.inspector }}</p>
              <button
                @click="navigateTo(`/inspections/${inspection.id}`)"
                class="mt-3 w-full py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                查看检查详情
              </button>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">门店信息</h2>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">门店名称</span>
                <span class="font-medium text-gray-900">{{ task.storeName }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">店长</span>
                <span class="font-medium text-gray-900">{{ store.stores.find(s => s.id === task.storeId)?.manager }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">地址</span>
                <span class="font-medium text-gray-900">{{ store.stores.find(s => s.id === task.storeId)?.address }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">区域</span>
                <span class="font-medium text-gray-900">{{ store.stores.find(s => s.id === task.storeId)?.region }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">时间统计</h2>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">创建时间</span>
                <span class="font-medium text-gray-900">{{ formatTime(task.createdAt) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">更新时间</span>
                <span class="font-medium text-gray-900">{{ formatTime(task.updatedAt) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">处理进度</span>
                <span class="font-medium text-gray-900">{{ task.history.length }} 步 / 4 步</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Teleport to="body">
      <div
        v-if="showActionModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showActionModal = null"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ task?.status === 'pending' ? '接受任务' : task?.status === 'processing' ? '完成整改' : '验收通过' }}
            </h3>
          </div>
          <div class="px-6 py-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">处理备注（可选）</label>
              <textarea
                v-model="comment"
                rows="3"
                placeholder="请输入处理备注..."
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              ></textarea>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              @click="showActionModal = null"
              class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="handleAction"
              class="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              确认操作
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
