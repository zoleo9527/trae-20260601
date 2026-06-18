<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFeedback } from '~/composables/useFeedback'
import type { FeedbackStatus, Role } from '~/types'

const {
  feedbacks,
  showTransferModal,
  transferFeedbackId,
  closeTransferModal,
  transferFeedback,
  getStatusLabel,
  getRoleLabel,
  getAssigneesByRole,
  availableActions
} = useFeedback()

const selectedAction = ref<{ next: FeedbackStatus | null; nextRole: Role | null; action: string } | null>(null)
const transferRemark = ref('')
const createTask = ref(false)
const taskTitle = ref('')
const taskDescription = ref('')
const taskDeadline = ref('')
const selectedAssignee = ref('')

const currentFeedback = computed(() => {
  if (!transferFeedbackId.value) return null
  return feedbacks.value.find(f => f.id === transferFeedbackId.value)
})

watch(showTransferModal, (val) => {
  if (val) {
    selectedAction.value = null
    transferRemark.value = ''
    createTask.value = false
    taskTitle.value = ''
    taskDescription.value = ''
    taskDeadline.value = ''
    selectedAssignee.value = ''
  }
})

const selectAction = (action: { next: FeedbackStatus | null; nextRole: Role | null; action: string }) => {
  selectedAction.value = action
  if (action.nextRole) {
    const assignees = getAssigneesByRole(action.nextRole)
    selectedAssignee.value = assignees[0] || ''
  }
  if (currentFeedback.value) {
    taskTitle.value = `${currentFeedback.value.title} - 整改`
    taskDescription.value = currentFeedback.value.content
  }
}

const handleTransfer = () => {
  if (!currentFeedback.value || !selectedAction.value) return

  transferFeedback(
    currentFeedback.value.id,
    selectedAction.value.next || currentFeedback.value.status,
    selectedAction.value.nextRole,
    selectedAssignee.value || (selectedAction.value.nextRole ? getAssigneesByRole(selectedAction.value.nextRole)[0] : currentFeedback.value.currentAssignee),
    transferRemark.value,
    createTask.value ? taskTitle.value : undefined,
    createTask.value ? taskDescription.value : undefined,
    createTask.value ? taskDeadline.value : undefined
  )
}

const typeLabels: Record<string, string> = {
  suggestion: '建议',
  complaint: '投诉',
  question: '咨询',
  praise: '表扬',
  fault: '故障'
}

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高'
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700'
}

const roleColors: Record<Role, string> = {
  guide: 'bg-blue-100 text-blue-700',
  engineer: 'bg-orange-100 text-orange-700',
  activity_teacher: 'bg-green-100 text-green-700'
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showTransferModal && currentFeedback"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div class="absolute inset-0 bg-black bg-opacity-50" @click="closeTransferModal"></div>
      <div class="relative bg-white rounded-xl shadow-2xl w-[600px] max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">流转处理</h3>
          <button @click="closeTransferModal" class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div class="bg-gray-50 rounded-lg p-4 mb-5">
            <div class="flex items-start justify-between mb-2">
              <h4 class="font-medium text-gray-900">{{ currentFeedback.title }}</h4>
              <span class="px-1.5 py-0.5 text-xs rounded font-medium" :class="priorityColors[currentFeedback.priority]">
                {{ priorityLabels[currentFeedback.priority] }}
              </span>
            </div>
            <p class="text-sm text-gray-600 mb-3">{{ currentFeedback.content }}</p>
            <div class="flex items-center gap-3 text-xs text-gray-500">
              <span>{{ typeLabels[currentFeedback.type] }}</span>
              <span class="px-2 py-0.5 rounded" :class="roleColors[currentFeedback.currentRole]">
                {{ getRoleLabel(currentFeedback.currentRole) }} · {{ currentFeedback.currentAssignee }}
              </span>
              <span>当前状态：{{ getStatusLabel(currentFeedback.status) }}</span>
            </div>
          </div>

          <div v-if="!selectedAction" class="space-y-3">
            <p class="text-sm font-medium text-gray-700 mb-2">选择下一步操作：</p>
            <button
              v-for="action in availableActions"
              :key="action.action"
              @click="selectAction(action)"
              class="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-900">{{ action.action }}</span>
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
              <div v-if="action.nextRole" class="text-xs text-gray-500 mt-1">
                流转至：{{ getRoleLabel(action.nextRole) }}
              </div>
            </button>
          </div>

          <div v-else class="space-y-4">
            <div class="bg-blue-50 rounded-lg p-3">
              <div class="flex items-center gap-2 text-blue-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="font-medium">{{ selectedAction.action }}</span>
              </div>
            </div>

            <div v-if="selectedAction.nextRole" class="space-y-2">
              <label class="text-sm font-medium text-gray-700">选择负责人 <span class="text-red-500">*</span></label>
              <select
                v-model="selectedAssignee"
                class="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option v-for="a in getAssigneesByRole(selectedAction.nextRole)" :key="a" :value="a">{{ a }}</option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">处理备注 <span class="text-red-500">*</span></label>
              <textarea
                v-model="transferRemark"
                rows="3"
                placeholder="请输入处理备注，说明当前处理情况..."
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              ></textarea>
            </div>

            <div v-if="selectedAction.nextRole" class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                v-model="createTask"
                type="checkbox"
                id="createTaskModal"
                class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label for="createTaskModal" class="text-sm text-gray-700">创建整改任务</label>
            </div>

            <div v-if="createTask" class="space-y-3 bg-gray-50 p-4 rounded-lg">
              <h5 class="text-sm font-medium text-gray-700">整改任务信息</h5>
              <div>
                <label class="text-sm text-gray-600">任务名称</label>
                <input
                  v-model="taskTitle"
                  type="text"
                  placeholder="请输入任务名称"
                  class="w-full h-9 mt-1 px-3 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label class="text-sm text-gray-600">任务描述</label>
                <textarea
                  v-model="taskDescription"
                  rows="2"
                  placeholder="请输入任务描述"
                  class="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                ></textarea>
              </div>
              <div>
                <label class="text-sm text-gray-600">截止日期</label>
                <input
                  v-model="taskDeadline"
                  type="date"
                  class="w-full h-9 mt-1 px-3 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div class="flex gap-3 pt-3">
              <button @click="selectedAction = null" class="btn btn-secondary flex-1">
                返回选择
              </button>
              <button @click="handleTransfer" class="btn btn-primary flex-1">
                确认流转
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
