<template>
  <div class="fixed right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl z-50 flex flex-col">
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div>
        <h2 class="text-xl font-bold text-gray-900">
          {{ taskType === 'refund' ? '退票申请' : taskType === 'reschedule' ? '改期申请' : '投诉处理' }}详情
        </h2>
        <p class="text-sm text-gray-500 mt-1">
          {{ task.ticketNo || task.complaintNo }}
        </p>
      </div>
      <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
        <XMarkIcon class="w-6 h-6" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div class="p-6 space-y-6">
        <div v-if="trackerInfo" class="card bg-blue-50 border-blue-200">
          <h3 class="font-semibold text-blue-900 mb-3 flex items-center">
            <ClockIcon class="w-5 h-5 mr-2" />
            任务追踪
          </h3>

          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                <UserIcon class="w-4 h-4" />
              </div>
              <div class="flex-1">
                <div class="font-medium text-gray-900">
                  当前处理人: {{ trackerInfo.currentHandlerName || '未分配' }}
                </div>
                <div class="text-sm text-gray-600">
                  {{ getRoleLabel(trackerInfo.currentHandler) }} · {{ trackerInfo.handlerDepartment }}
                </div>
              </div>
            </div>

            <div v-if="trackerInfo.stuckPoint" class="flex items-start space-x-3 bg-red-50 p-3 rounded-lg border border-red-200">
              <div class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                <ExclamationTriangleIcon class="w-4 h-4" />
              </div>
              <div class="flex-1">
                <div class="font-medium text-red-900">
                  卡点: {{ trackerInfo.stuckPoint }}
                </div>
                <div class="text-sm text-red-700 mt-1">
                  {{ trackerInfo.stuckReason }}
                </div>
              </div>
            </div>

            <div v-else class="flex items-start space-x-3 bg-green-50 p-3 rounded-lg border border-green-200">
              <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                <CheckCircleIcon class="w-4 h-4" />
              </div>
              <div class="flex-1">
                <div class="font-medium text-green-900">
                  任务正常进行中
                </div>
                <div class="text-sm text-green-700 mt-1">
                  无卡点问题
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-500 mb-1">游客姓名</div>
              <div class="font-medium">{{ task.touristName }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">联系电话</div>
              <div class="font-medium">{{ task.touristPhone }}</div>
            </div>
            <div v-if="task.ticketNo">
              <div class="text-sm text-gray-500 mb-1">票号</div>
              <div class="font-medium">{{ task.ticketNo }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">状态</div>
              <span :class="getStatusBadgeClass(task.status)">
                {{ getStatusLabel(task.status) }}
              </span>
            </div>
            <div v-if="task.refundAmount">
              <div class="text-sm text-gray-500 mb-1">退款金额</div>
              <div class="font-medium text-red-600">¥{{ task.refundAmount }}</div>
            </div>
            <div v-if="task.level">
              <div class="text-sm text-gray-500 mb-1">投诉等级</div>
              <span :class="getLevelBadgeClass(task.level)">
                {{ getLevelLabel(task.level) }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="taskType === 'refund' && task.refundReason" class="card">
          <h3 class="font-semibold text-gray-900 mb-2">退票原因</h3>
          <p class="text-gray-700">{{ task.refundReason }}</p>
        </div>

        <div v-if="taskType === 'reschedule' && task.rescheduleReason" class="card">
          <h3 class="font-semibold text-gray-900 mb-2">改期原因</h3>
          <p class="text-gray-700">{{ task.rescheduleReason }}</p>
          <div class="mt-4 flex items-center space-x-4">
            <div class="text-sm">
              <span class="text-gray-500">原日期:</span>
              <span class="font-medium ml-2">{{ task.originalDate }}</span>
            </div>
            <ArrowRightIcon class="w-4 h-4 text-gray-400" />
            <div class="text-sm">
              <span class="text-gray-500">新日期:</span>
              <span class="font-medium ml-2">{{ task.newDate }}</span>
            </div>
          </div>
        </div>

        <div v-if="taskType === 'complaint' && task.description" class="card">
          <h3 class="font-semibold text-gray-900 mb-2">投诉详情</h3>
          <p class="text-gray-700">{{ task.description }}</p>
          <div class="mt-4 flex items-center space-x-4">
            <div v-if="task.source" class="text-sm">
              <span class="text-gray-500">来源:</span>
              <span class="font-medium ml-2">{{ getSourceLabel(task.source) }}</span>
            </div>
            <div v-if="task.relatedTicketNo" class="text-sm">
              <span class="text-gray-500">关联票号:</span>
              <span class="font-medium text-primary-600 ml-2">{{ task.relatedTicketNo }}</span>
            </div>
          </div>
        </div>

        <div v-if="contextData" class="card">
          <h3 class="font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon class="w-5 h-5 mr-2" />
            关联依据
          </h3>

          <div v-if="contextData.ticketRules && contextData.ticketRules.length > 0" class="mb-4">
            <div class="text-sm font-medium text-gray-700 mb-2">票种规则</div>
            <div v-for="rule in contextData.ticketRules" :key="rule.id" class="bg-gray-50 p-3 rounded-lg mb-2">
              <div class="font-medium text-gray-900">{{ rule.ruleName || rule.ticketType }}</div>
              <div class="text-sm text-gray-600 mt-1">
                <div>退票政策: {{ rule.refundPolicy }}</div>
                <div>改期政策: {{ rule.reschedulePolicy }}</div>
              </div>
            </div>
          </div>

          <div v-if="contextData.tickets && contextData.tickets.length > 0">
            <div class="text-sm font-medium text-gray-700 mb-2">票务信息</div>
            <div v-for="ticket in contextData.tickets" :key="ticket.id" class="bg-gray-50 p-3 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium">{{ ticket.ticketNo }}</span>
                <span class="badge-info">{{ ticket.type }}</span>
              </div>
              <div class="text-sm text-gray-600">
                <div>价格: ¥{{ ticket.price }}</div>
                <div>有效期: {{ ticket.validFrom }} 至 {{ ticket.validUntil }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon class="w-5 h-5 mr-2" />
            处理日志
          </h3>
          <div v-if="task.processingLogs && task.processingLogs.length > 0" class="space-y-3">
            <div v-for="log in task.processingLogs" :key="log.id" class="flex items-start space-x-3">
              <div class="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900">{{ log.action }}</span>
                  <span class="text-sm text-gray-500">{{ log.operator }}</span>
                </div>
                <div class="text-sm text-gray-500 mt-1">
                  {{ log.operatorRole }} · {{ log.operatorDepartment }} · {{ log.timestamp }}
                </div>
                <div v-if="log.comment" class="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">
                  {{ log.comment }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-500 py-8">
            暂无处理记录
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-gray-200 bg-gray-50 p-6">
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">处理意见</label>
          <textarea
            v-model="processingComment"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="请输入处理意见..."
          ></textarea>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <button
              @click="showStuckModal = true"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              标记卡点
            </button>
          </div>
          <div class="flex items-center space-x-3">
            <button
              @click="handleAssign"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              分配任务
            </button>
            <button
              @click="handleProcess"
              :disabled="processing"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50"
            >
              {{ processing ? '处理中...' : '提交处理' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showStuckModal" class="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-bold mb-4">标记卡点</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">卡点阶段</label>
            <input
              v-model="stuckPoint"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="例如: 财务审批"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">卡点原因</label>
            <textarea
              v-model="stuckReason"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="请详细描述卡点原因..."
            ></textarea>
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <button @click="showStuckModal = false" class="btn-secondary">
            取消
          </button>
          <button @click="handleMarkStuck" class="btn-primary">
            确认标记
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAssignModal" class="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-bold mb-4">分配任务</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">选择处理人</label>
            <select
              v-model="newHandler"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">请选择</option>
              <option value="ticket_manager">张明 - 票务主管 - 票务部</option>
              <option value="gate_staff">李华 - 检票员 - 检票部</option>
              <option value="customer_service">王芳 - 客服 - 客服部</option>
            </select>
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <button @click="showAssignModal = false" class="btn-secondary">
            取消
          </button>
          <button @click="confirmAssign" class="btn-primary">
            确认分配
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  XMarkIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  task: any
  taskType: 'refund' | 'reschedule' | 'complaint'
}>()

const emit = defineEmits<{
  close: []
  refresh: []
}>()

const trackerInfo = ref<any>(null)
const contextData = ref<any>(null)
const processingComment = ref('')
const processing = ref(false)
const showStuckModal = ref(false)
const showAssignModal = ref(false)
const stuckPoint = ref('')
const stuckReason = ref('')
const newHandler = ref('')

const currentUser = ref<any>(null)

function getCurrentUser() {
  const userStr = sessionStorage.getItem('currentUser')
  if (userStr) {
    currentUser.value = JSON.parse(userStr)
  }
  return currentUser.value
}

async function loadTaskDetail() {
  try {
    const response = await $fetch(`/api/tasks/${props.task.id}`, {
      query: { type: props.taskType }
    })
    if (response.code === 200) {
      trackerInfo.value = response.data.tracker
    }
  } catch (error) {
    console.error('加载任务详情失败:', error)
  }
}

async function loadContext() {
  try {
    const response = await $fetch(`/api/tasks/${props.task.id}/context`, {
      query: { type: props.taskType }
    })
    if (response.code === 200) {
      contextData.value = response.data
    }
  } catch (error) {
    console.error('加载关联信息失败:', error)
  }
}

async function handleProcess() {
  processing.value = true
  const user = getCurrentUser()
  try {
    const response = await $fetch(`/api/tasks/${props.task.id}/update`, {
      method: 'POST',
      body: {
        type: props.taskType,
        action: 'process',
        comment: processingComment.value,
        newStatus: 'processing',
        operatorInfo: user ? {
          name: user.name,
          role: user.role,
          department: user.department
        } : undefined
      }
    })
    if (response.code === 200) {
      alert('处理成功')
      processingComment.value = ''
      loadTaskDetail()
      loadContext()
      emit('refresh')
    }
  } catch (error) {
    console.error('处理失败:', error)
    alert('处理失败')
  } finally {
    processing.value = false
  }
}

function handleAssign() {
  showAssignModal.value = true
}

async function confirmAssign() {
  if (!newHandler.value) {
    alert('请选择处理人')
    return
  }

  const handlerMap: Record<string, any> = {
    ticket_manager: { name: '张明', department: '票务部', role: 'ticket_manager' },
    gate_staff: { name: '李华', department: '检票部', role: 'gate_staff' },
    customer_service: { name: '王芳', department: '客服部', role: 'customer_service' }
  }

  const user = getCurrentUser()

  try {
    const response = await $fetch(`/api/tasks/${props.task.id}/update`, {
      method: 'POST',
      body: {
        type: props.taskType,
        action: 'assign',
        newHandler: handlerMap[newHandler.value],
        operatorInfo: user ? {
          name: user.name,
          role: user.role,
          department: user.department
        } : undefined
      }
    })
    if (response.code === 200) {
      alert('分配成功')
      showAssignModal.value = false
      newHandler.value = ''
      loadTaskDetail()
      loadContext()
      emit('refresh')
    }
  } catch (error) {
    console.error('分配失败:', error)
    alert('分配失败')
  }
}

async function handleMarkStuck() {
  if (!stuckPoint.value) {
    alert('请输入卡点阶段')
    return
  }

  const user = getCurrentUser()

  try {
    const response = await $fetch(`/api/tasks/${props.task.id}/update`, {
      method: 'POST',
      body: {
        type: props.taskType,
        action: 'stuck',
        stuckPoint: stuckPoint.value,
        stuckReason: stuckReason.value,
        operatorInfo: user ? {
          name: user.name,
          role: user.role,
          department: user.department
        } : undefined
      }
    })
    if (response.code === 200) {
      alert('卡点标记成功')
      showStuckModal.value = false
      stuckPoint.value = ''
      stuckReason.value = ''
      loadTaskDetail()
      loadContext()
      emit('refresh')
    }
  } catch (error) {
    console.error('标记卡点失败:', error)
    alert('标记卡点失败')
  }
}

function getRoleLabel(role: string) {
  const labelMap: Record<string, string> = {
    ticket_manager: '票务主管',
    gate_staff: '检票员',
    customer_service: '客服'
  }
  return labelMap[role] || role
}

function getStatusBadgeClass(status: string) {
  const statusMap: Record<string, string> = {
    pending: 'badge-warning',
    processing: 'badge-info',
    approved: 'badge-success',
    rejected: 'badge-error',
    resolved: 'badge-success',
    closed: 'badge-info'
  }
  return statusMap[status] || 'badge-info'
}

function getStatusLabel(status: string) {
  const labelMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    approved: '已通过',
    rejected: '已拒绝',
    completed: '已完成',
    resolved: '已解决',
    closed: '已关闭'
  }
  return labelMap[status] || status
}

function getLevelBadgeClass(level: string) {
  const levelMap: Record<string, string> = {
    low: 'badge-info',
    medium: 'badge-warning',
    high: 'badge-error',
    urgent: 'badge-error'
  }
  return levelMap[level] || 'badge-info'
}

function getLevelLabel(level: string) {
  const labelMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return labelMap[level] || level
}

function getSourceLabel(source: string) {
  const labelMap: Record<string, string> = {
    phone: '电话',
    online: '线上',
    onsite: '现场',
    third_party: '第三方'
  }
  return labelMap[source] || source
}

onMounted(() => {
  loadTaskDetail()
  loadContext()
})
</script>
