<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFeedback } from '~/composables/useFeedback'
import type { Feedback, FeedbackStatus, Role, TaskStatus } from '~/types'

const {
  closeDetail,
  transferFeedback,
  updateTaskStatus,
  availableActions,
  getStatusLabel,
  getRoleLabel,
  getAssigneesByRole,
  getRelatedInspection,
  getRelatedSchedule,
  getRelatedMaterial
} = useFeedback()

const props = defineProps<{
  feedback: Feedback | null
}>()

const activeTab = ref<'info' | 'history' | 'tasks' | 'related'>('info')
const showTransferForm = ref(false)
const selectedAction = ref<{ next: FeedbackStatus | null; nextRole: Role | null; action: string } | null>(null)
const transferRemark = ref('')
const createTask = ref(false)
const taskTitle = ref('')
const taskDescription = ref('')
const taskDeadline = ref('')
const selectedAssignee = ref('')

watch(() => props.feedback, () => {
  activeTab.value = 'info'
  showTransferForm.value = false
  selectedAction.value = null
  transferRemark.value = ''
  createTask.value = false
  taskTitle.value = ''
  taskDescription.value = ''
  taskDeadline.value = ''
  selectedAssignee.value = ''
})

const typeLabels: Record<string, string> = {
  suggestion: '建议',
  complaint: '投诉',
  question: '咨询',
  praise: '表扬',
  fault: '故障'
}

const typeColors: Record<string, string> = {
  suggestion: 'badge-info',
  complaint: 'badge-danger',
  question: 'badge-warning',
  praise: 'badge-success',
  fault: 'badge-danger'
}

const statusColors: Record<string, string> = {
  pending: 'badge-gray',
  guide_processing: 'badge-info',
  guide_completed: 'badge-success',
  engineer_processing: 'badge-info',
  engineer_completed: 'badge-success',
  activity_processing: 'badge-info',
  activity_completed: 'badge-success',
  resolved: 'badge-success',
  closed: 'badge-gray'
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

const taskStatusLabels: Record<string, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  verified: '已验收'
}

const taskStatusColors: Record<string, string> = {
  pending: 'badge-gray',
  in_progress: 'badge-info',
  completed: 'badge-success',
  verified: 'badge-success'
}

const roleColors: Record<Role, string> = {
  guide: 'bg-blue-100 text-blue-700',
  engineer: 'bg-orange-100 text-orange-700',
  activity_teacher: 'bg-green-100 text-green-700'
}

const roleIcons: Record<Role, string> = {
  guide: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>',
  engineer: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>',
  activity_teacher: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>'
}

const relatedInspection = computed(() => props.feedback ? getRelatedInspection(props.feedback.relatedInspectionId) : null)
const relatedSchedule = computed(() => props.feedback ? getRelatedSchedule(props.feedback.relatedScheduleId) : null)
const relatedMaterial = computed(() => props.feedback ? getRelatedMaterial(props.feedback.relatedMaterialId) : null)

const sortedHistory = computed(() => {
  if (!props.feedback) return []
  return [...props.feedback.history].reverse()
})

const selectAction = (action: { next: FeedbackStatus | null; nextRole: Role | null; action: string }) => {
  selectedAction.value = action
  showTransferForm.value = true
  if (action.nextRole) {
    const assignees = getAssigneesByRole(action.nextRole)
    selectedAssignee.value = assignees[0] || ''
  }
}

const handleTransfer = () => {
  if (!props.feedback || !selectedAction.value) return

  transferFeedback(
    props.feedback.id,
    selectedAction.value.next || props.feedback.status,
    selectedAction.value.nextRole,
    selectedAssignee.value || (selectedAction.value.nextRole ? getAssigneesByRole(selectedAction.value.nextRole)[0] : props.feedback.currentAssignee),
    transferRemark.value,
    createTask.value ? taskTitle.value : undefined,
    createTask.value ? taskDescription.value : undefined,
    createTask.value ? taskDeadline.value : undefined
  )

  showTransferForm.value = false
  selectedAction.value = null
  transferRemark.value = ''
}

const handleTaskStatusChange = (taskId: string, status: TaskStatus) => {
  if (!props.feedback) return
  const progress = status === 'completed' || status === 'verified' ? 100 : status === 'in_progress' ? 50 : 0
  updateTaskStatus(props.feedback.id, taskId, status, progress, `状态更新为${taskStatusLabels[status]}`)
}
</script>

<template>
  <div
    class="fixed right-0 top-0 h-full w-[480px] bg-white border-l border-gray-200 shadow-xl z-40 transform transition-transform duration-300"
    :class="feedback ? 'translate-x-0' : 'translate-x-full'"
  >
    <div v-if="feedback" class="flex flex-col h-full">
      <div class="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 class="font-semibold text-gray-900">反馈详情</h3>
        <button @click="closeDetail" class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="px-4 py-3 border-b border-gray-100">
        <div class="flex items-center gap-2 mb-2">
          <span class="badge" :class="typeColors[feedback.type]">{{ typeLabels[feedback.type] }}</span>
          <span class="badge" :class="statusColors[feedback.status]">{{ getStatusLabel(feedback.status) }}</span>
          <span class="px-2 py-0.5 text-xs font-medium rounded" :class="priorityColors[feedback.priority]">
            {{ priorityLabels[feedback.priority] }}优先级
          </span>
        </div>
        <h4 class="text-base font-medium text-gray-900 mb-2">{{ feedback.title }}</h4>
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <span class="px-2 py-0.5 text-xs rounded" :class="roleColors[feedback.currentRole]">
            {{ getRoleLabel(feedback.currentRole) }} · {{ feedback.currentAssignee }}
          </span>
        </div>
      </div>

      <div class="border-b border-gray-100">
        <nav class="flex">
          <button
            v-for="tab in [{key:'info',label:'详情'},{key:'history',label:'流转记录'},{key:'tasks',label:'整改任务'},{key:'related',label:'关联信息'}]"
            :key="tab.key"
            @click="activeTab = tab.key as typeof activeTab"
            class="flex-1 py-3 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === tab.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          >
            {{ tab.label }}
            <span v-if="tab.key === 'history'" class="ml-1 text-xs">({{ feedback.history.length }})</span>
            <span v-if="tab.key === 'tasks'" class="ml-1 text-xs">({{ feedback.tasks.length }})</span>
          </button>
        </nav>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <div v-show="activeTab === 'info'" class="space-y-6">
          <div>
            <h5 class="text-sm font-medium text-gray-700 mb-2">反馈内容</h5>
            <p class="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">{{ feedback.content }}</p>
          </div>

          <div v-if="feedback.tags && feedback.tags.length > 0">
            <h5 class="text-sm font-medium text-gray-700 mb-2">标签</h5>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in feedback.tags" :key="tag" class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                {{ tag }}
              </span>
            </div>
          </div>

          <div>
            <h5 class="text-sm font-medium text-gray-700 mb-3">访客信息</h5>
            <div class="bg-gray-50 rounded-lg p-3 space-y-2">
              <div class="flex items-center gap-2 text-sm">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span class="text-gray-600">{{ feedback.visitorName }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span class="text-gray-600">{{ feedback.visitorContact }}</span>
              </div>
              <div v-if="feedback.exhibitionName" class="flex items-center gap-2 text-sm">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <span class="text-gray-600">{{ feedback.exhibitionName }}</span>
              </div>
            </div>
          </div>

          <div>
            <h5 class="text-sm font-medium text-gray-700 mb-3">时间信息</h5>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">提交时间</span>
                <span class="text-gray-700">{{ feedback.createdAt }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">更新时间</span>
                <span class="text-gray-700">{{ feedback.updatedAt }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'history'" class="space-y-4">
          <div class="relative">
            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div
              v-for="(item, index) in sortedHistory"
              :key="item.id"
              class="relative pl-10 pb-6 last:pb-0"
            >
              <div
                class="absolute left-2 w-5 h-5 rounded-full border-2 border-white shadow flex items-center justify-center"
                :class="{
                  'bg-gray-400': index === sortedHistory.length - 1,
                  'bg-blue-500': item.role === 'guide' && index !== sortedHistory.length - 1,
                  'bg-orange-500': item.role === 'engineer' && index !== sortedHistory.length - 1,
                  'bg-green-500': item.role === 'activity_teacher' && index !== sortedHistory.length - 1
                }"
              >
                <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="roleIcons[item.role]"></svg>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-gray-900">{{ getStatusLabel(item.status) }}</span>
                  <span class="px-2 py-0.5 text-xs rounded" :class="roleColors[item.role]">
                    {{ getRoleLabel(item.role) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mb-2">{{ item.remark }}</p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>{{ item.assignee }}</span>
                  <span>{{ item.createdAt }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'tasks'" class="space-y-3">
          <div v-if="feedback.tasks.length === 0" class="text-center py-8 text-gray-500 text-sm">
            暂无整改任务
          </div>
          <div
            v-for="task in feedback.tasks"
            :key="task.id"
            class="bg-gray-50 rounded-lg p-3"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <h6 class="text-sm font-medium text-gray-900 mb-1">{{ task.title }}</h6>
                <p class="text-xs text-gray-600">{{ task.description }}</p>
              </div>
              <span class="badge shrink-0" :class="taskStatusColors[task.status]">
                {{ taskStatusLabels[task.status] }}
              </span>
            </div>
            <div class="mb-2">
              <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>进度</span>
                <span>{{ task.progress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  class="bg-primary-500 h-1.5 rounded-full transition-all"
                  :style="{ width: task.progress + '%' }"
                ></div>
              </div>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span class="px-2 py-0.5 rounded" :class="roleColors[task.role]">
                {{ getRoleLabel(task.role) }} · {{ task.assignee }}
              </span>
              <span>截止: {{ task.deadline }}</span>
            </div>
            <div v-if="task.remark" class="text-xs text-gray-500 bg-white rounded p-2 mb-2">
              <span class="font-medium">备注：</span>{{ task.remark }}
            </div>
            <div v-if="task.status !== 'completed' && task.status !== 'verified'" class="flex gap-2">
              <button
                v-if="task.status === 'pending'"
                @click="handleTaskStatusChange(task.id, 'in_progress')"
                class="btn btn-primary btn-xs flex-1"
              >
                开始处理
              </button>
              <button
                v-if="task.status === 'in_progress'"
                @click="handleTaskStatusChange(task.id, 'completed')"
                class="btn btn-success btn-xs flex-1"
              >
                完成
              </button>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'related'" class="space-y-4">
          <div v-if="relatedInspection" class="bg-gray-50 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <span class="text-sm font-medium text-gray-700">关联展项巡检</span>
            </div>
            <div class="text-sm space-y-1">
              <p class="text-gray-900 font-medium">{{ relatedInspection.name }}</p>
              <p class="text-gray-500 text-xs">{{ relatedInspection.location }}</p>
              <p class="text-gray-500 text-xs">状态：
                <span :class="{
                  'text-green-600': relatedInspection.status === 'normal',
                  'text-yellow-600': relatedInspection.status === 'warning',
                  'text-red-600': relatedInspection.status === 'error'
                }">{{ getStatusLabel(relatedInspection.status) }}</span>
              </p>
              <p v-if="relatedInspection.lastRemark" class="text-xs text-gray-500 bg-white rounded p-2 mt-2">
                {{ relatedInspection.lastRemark }}
              </p>
            </div>
          </div>

          <div v-if="relatedSchedule" class="bg-gray-50 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-sm font-medium text-gray-700">关联讲解预约</span>
            </div>
            <div class="text-sm space-y-1">
              <p class="text-gray-900 font-medium">{{ relatedSchedule.title }}</p>
              <p class="text-gray-500 text-xs">{{ relatedSchedule.date }} {{ relatedSchedule.startTime }}-{{ relatedSchedule.endTime }}</p>
              <p class="text-gray-500 text-xs">{{ relatedSchedule.location }} · {{ relatedSchedule.guideName }}</p>
              <p v-if="relatedSchedule.conflictInfo" class="text-xs text-red-600 bg-red-50 rounded p-2 mt-2">
                {{ relatedSchedule.conflictInfo }}
              </p>
            </div>
          </div>

          <div v-if="relatedMaterial" class="bg-gray-50 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <span class="text-sm font-medium text-gray-700">关联实验材料</span>
            </div>
            <div class="text-sm space-y-1">
              <p class="text-gray-900 font-medium">{{ relatedMaterial.name }}</p>
              <p class="text-gray-500 text-xs">{{ relatedMaterial.category }} · {{ relatedMaterial.location }}</p>
              <p class="text-gray-500 text-xs">库存：
                <span :class="{
                  'text-green-600': relatedMaterial.status === 'normal',
                  'text-yellow-600': relatedMaterial.status === 'low',
                  'text-red-600': relatedMaterial.status === 'out'
                }">{{ relatedMaterial.quantity }}{{ relatedMaterial.unit }} / 最低{{ relatedMaterial.minStock }}{{ relatedMaterial.unit }}</span>
              </p>
              <p v-if="relatedMaterial.lastRemark" class="text-xs text-gray-500 bg-white rounded p-2 mt-2">
                {{ relatedMaterial.lastRemark }}
              </p>
            </div>
          </div>

          <div v-if="!relatedInspection && !relatedSchedule && !relatedMaterial" class="text-center py-8 text-gray-500 text-sm">
            暂无关联信息
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-gray-100">
        <div v-if="!showTransferForm" class="space-y-2">
          <div v-if="availableActions.length > 0" class="text-xs text-gray-500 mb-2">可执行操作：</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="action in availableActions"
              :key="action.action"
              @click="selectAction(action)"
              class="btn btn-primary btn-sm"
            >
              {{ action.action }}
            </button>
          </div>
        </div>

        <div v-else class="space-y-3">
          <div class="text-sm font-medium text-gray-700">
            {{ selectedAction?.action }}
          </div>

          <div v-if="selectedAction?.nextRole" class="space-y-2">
            <label class="text-sm text-gray-600">选择负责人</label>
            <select
              v-model="selectedAssignee"
              class="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option v-for="a in getAssigneesByRole(selectedAction.nextRole)" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-gray-600">处理备注</label>
            <textarea
              v-model="transferRemark"
              rows="3"
              placeholder="请输入处理备注..."
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            ></textarea>
          </div>

          <div v-if="selectedAction?.nextRole" class="flex items-center gap-2">
            <input
              v-model="createTask"
              type="checkbox"
              id="createTask"
              class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label for="createTask" class="text-sm text-gray-600">创建整改任务</label>
          </div>

          <div v-if="createTask" class="space-y-2 bg-gray-50 p-3 rounded-lg">
            <div>
              <label class="text-sm text-gray-600">任务名称</label>
              <input
                v-model="taskTitle"
                type="text"
                placeholder="请输入任务名称"
                class="w-full h-8 mt-1 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label class="text-sm text-gray-600">任务描述</label>
              <textarea
                v-model="taskDescription"
                rows="2"
                placeholder="请输入任务描述"
                class="w-full mt-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              ></textarea>
            </div>
            <div>
              <label class="text-sm text-gray-600">截止日期</label>
              <input
                v-model="taskDeadline"
                type="date"
                class="w-full h-8 mt-1 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div class="flex gap-2">
            <button @click="showTransferForm = false" class="btn btn-secondary flex-1">
              取消
            </button>
            <button @click="handleTransfer" class="btn btn-primary flex-1">
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
