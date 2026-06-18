<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-bold text-gray-900">景区票务管理系统</h1>
            <span class="badge-info">退票改期与投诉处理</span>
          </div>
          <div class="flex items-center space-x-4">
            <button
              @click="showExceptionDrawer = true"
              class="btn-secondary text-sm flex items-center space-x-2"
            >
              <ExclamationCircleIcon class="w-4 h-4" />
              <span>异常记录</span>
              <span v-if="exceptionCount > 0" class="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                {{ exceptionCount }}
              </span>
            </button>
            <button
              @click="showNotificationCenter = true"
              class="btn-secondary text-sm flex items-center space-x-2"
            >
              <BellIcon class="w-4 h-4" />
              <span>通知</span>
              <span v-if="unreadNotificationCount > 0" class="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                {{ unreadNotificationCount }}
              </span>
            </button>
            <div class="flex items-center space-x-2">
              <div :class="getRoleBgClass(currentUser?.role)" class="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium">
                {{ currentUser?.name?.charAt(0) || '?' }}
              </div>
              <div class="text-sm">
                <div class="font-medium text-gray-900">{{ currentUser?.name || '-' }}</div>
                <div class="text-gray-500 text-xs">{{ getRoleLabel(currentUser?.role) }}</div>
              </div>
              <button @click="handleLogout" class="text-gray-400 hover:text-gray-600 ml-2">
                <ArrowRightOnRectangleIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div class="card cursor-pointer hover:shadow-md transition-shadow" @click="handlePendingCardClick('refund')">
          <div class="text-sm text-gray-500 mb-1">待处理退票</div>
          <div class="text-3xl font-bold text-primary-600">{{ stats.pendingRefunds }}</div>
        </div>
        <div class="card cursor-pointer hover:shadow-md transition-shadow" @click="handlePendingCardClick('reschedule')">
          <div class="text-sm text-gray-500 mb-1">待处理改期</div>
          <div class="text-3xl font-bold text-blue-600">{{ stats.pendingReschedules }}</div>
        </div>
        <div class="card cursor-pointer hover:shadow-md transition-shadow" @click="handlePendingCardClick('complaint')">
          <div class="text-sm text-gray-500 mb-1">待处理投诉</div>
          <div class="text-3xl font-bold text-yellow-600">{{ stats.pendingComplaints }}</div>
        </div>
        <div class="card">
          <div class="text-sm text-gray-500 mb-1">今日处理</div>
          <div class="text-3xl font-bold text-green-600">{{ stats.todayProcessed }}</div>
        </div>
        <div class="card cursor-pointer hover:shadow-md transition-shadow" @click="showStuckTasks">
          <div class="text-sm text-gray-500 mb-1">卡点任务</div>
          <div class="text-3xl font-bold text-red-600">{{ stats.stuckTasks }}</div>
        </div>
        <div class="card cursor-pointer hover:shadow-md transition-shadow" @click="showUrgentComplaints">
          <div class="text-sm text-gray-500 mb-1">紧急投诉</div>
          <div class="text-3xl font-bold text-red-600">{{ stats.urgentComplaints }}</div>
        </div>
      </div>

      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="activeTab = tab.value"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              activeTab === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="flex items-center space-x-3">
          <button class="btn-secondary text-sm" @click="handleExport">
            <ArrowDownTrayIcon class="w-4 h-4 inline mr-1" />
            导出
            <span class="text-xs text-gray-400 ml-1">(模拟)</span>
          </button>
          <button class="btn-primary text-sm" @click="showCreateModal = true">
            <PlusIcon class="w-4 h-4 inline mr-1" />
            新建任务
          </button>
        </div>
      </div>

      <div class="card">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  任务编号
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  游客信息
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当前处理人
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  卡点信息
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="task in filteredTasks"
                :key="task.id"
                class="hover:bg-gray-50 cursor-pointer"
                @click="openTaskDetail(task)"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                  {{ task.ticketNo || task.complaintNo }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span :class="getTypeBadgeClass(task)">
                    {{ getTypeLabel(task) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>{{ task.touristName }}</div>
                  <div class="text-gray-500 text-xs">{{ task.touristPhone }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div class="flex items-center space-x-2">
                    <div :class="getRoleBgClass(task.currentHandler)" class="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white">
                      {{ task.currentHandlerName?.charAt(0) || '-' }}
                    </div>
                    <div>
                      <div class="text-gray-900">{{ task.currentHandlerName || '未分配' }}</div>
                      <div class="text-gray-500 text-xs">{{ task.handlerDepartment || '-' }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusBadgeClass(task.status)">
                    {{ getStatusLabel(task.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div v-if="task.stuckPoint" class="text-red-600">
                    <div class="font-medium">{{ task.stuckPoint }}</div>
                    <div class="text-gray-500 text-xs">{{ task.stuckReason }}</div>
                  </div>
                  <div v-else class="text-gray-400">-</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDateTime(task.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    class="text-primary-600 hover:text-primary-800 font-medium"
                    @click.stop="openTaskDetail(task)"
                  >
                    处理
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <TaskDetailDrawer
      v-if="selectedTask"
      :task="selectedTask"
      :task-type="selectedTaskType"
      @close="selectedTask = null"
      @refresh="loadTasks"
    />

    <CreateTaskModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleTaskCreated"
    />

    <ExceptionDrawer
      v-if="showExceptionDrawer"
      :exceptions="exceptionRecords"
      @close="showExceptionDrawer = false"
      @refresh="loadExceptionRecords"
    />

    <NotificationCenter
      v-if="showNotificationCenter"
      :notifications="notifications"
      @close="showNotificationCenter = false"
      @update="loadNotifications"
      @navigate="handleNotificationNavigate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  BellIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  ExclamationCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'
import type { User, RefundRequest, RescheduleRequest, Complaint, DashboardStats, ExceptionRecord } from '~/types'
import type { Notification } from '~/components/NotificationCenter.vue'

const currentUser = ref<User | null>(null)

const stats = ref<DashboardStats>({
  pendingRefunds: 0,
  pendingReschedules: 0,
  pendingComplaints: 0,
  todayProcessed: 0,
  stuckTasks: 0,
  urgentComplaints: 0
})

const tasks = ref<any[]>([])
const exceptionRecords = ref<ExceptionRecord[]>([])
const notifications = ref<Notification[]>([])

const activeTab = ref('all')
const filterType = ref('')
const filterStatus = ref('')
const filterStuck = ref(false)
const filterUrgent = ref(false)
const showCreateModal = ref(false)
const selectedTask = ref<any>(null)
const selectedTaskType = ref<'refund' | 'reschedule' | 'complaint'>('refund')
const showExceptionDrawer = ref(false)
const showNotificationCenter = ref(false)

const tabs = [
  { label: '全部', value: 'all' },
  { label: '退票申请', value: 'refund' },
  { label: '改期申请', value: 'reschedule' },
  { label: '投诉处理', value: 'complaint' }
]

const filteredTasks = computed(() => {
  if (activeTab.value === 'all') {
    return tasks.value
  }
  return tasks.value.filter(task => {
    if (activeTab.value === 'refund') return 'refundReason' in task
    if (activeTab.value === 'reschedule') return 'originalDate' in task
    if (activeTab.value === 'complaint') return 'title' in task
    return true
  })
})

const exceptionCount = computed(() => exceptionRecords.value.filter(e => e.status !== 'resolved').length)

const unreadNotificationCount = computed(() => notifications.value.filter(n => !n.read).length)

function checkLogin() {
  const userStr = sessionStorage.getItem('currentUser')
  if (userStr) {
    currentUser.value = JSON.parse(userStr)
  } else {
    window.location.href = '/login'
  }
}

async function loadStats() {
  try {
    const response = await $fetch('/api/dashboard/stats')
    if (response.code === 200) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

async function loadTasks() {
  try {
    const response = await $fetch('/api/tasks/list', {
      query: { 
        type: filterType.value || undefined,
        status: filterStatus.value || undefined,
        stuck: filterStuck.value ? 'true' : undefined,
        urgent: filterUrgent.value ? 'true' : undefined
      }
    })
    if (response.code === 200) {
      tasks.value = response.data
    }
  } catch (error) {
    console.error('加载任务列表失败:', error)
  }
}

async function loadExceptionRecords() {
  try {
    const response = await $fetch('/api/dashboard/exceptions')
    if (response.code === 200) {
      exceptionRecords.value = response.data
    }
  } catch (error) {
    console.error('加载异常记录失败:', error)
  }
}

function loadNotifications() {
  notifications.value = [
    {
      id: 'n1',
      type: 'alert' as const,
      title: '紧急投诉提醒',
      message: '游客张三投诉退票退款流程过慢，已超过3个工作日未处理',
      relatedNo: 'CT20240618002',
      read: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'n2',
      type: 'info' as const,
      title: '闸机故障通知',
      message: '北门2号闸机故障，已通知维修人员处理',
      relatedNo: 'CT20240618001',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'n3',
      type: 'success' as const,
      title: '改期申请已通过',
      message: '游客张三的改期申请已处理完成，新日期为2024-06-25',
      relatedNo: 'TK20240618001',
      read: true,
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'n4',
      type: 'info' as const,
      title: '新投诉已提交',
      message: '游客李四提交了VIP服务投诉，请及时处理',
      relatedNo: 'CT20240618003',
      read: true,
      createdAt: new Date(Date.now() - 1800000).toISOString()
    }
  ]
}

function openTaskDetail(task: any) {
  selectedTask.value = task
  if ('refundReason' in task) {
    selectedTaskType.value = 'refund'
  } else if ('originalDate' in task) {
    selectedTaskType.value = 'reschedule'
  } else if ('title' in task) {
    selectedTaskType.value = 'complaint'
  }
}

function handlePendingCardClick(type: string) {
  activeTab.value = type
  filterType.value = type
  filterStatus.value = 'pending'
  loadTasks()
}

function showStuckTasks() {
  activeTab.value = 'all'
  filterType.value = ''
  filterStatus.value = ''
  filterStuck.value = true
  loadTasks()
}

function showUrgentComplaints() {
  activeTab.value = 'complaint'
  filterType.value = 'complaint'
  filterStatus.value = ''
  filterUrgent.value = true
  loadTasks()
}

function handleExport() {
  alert('导出功能为模拟实现,实际将导出Excel文件')
}

function handleTaskCreated() {
  showCreateModal.value = false
  loadTasks()
  loadStats()
}

function handleNotificationNavigate(relatedNo: string, type: string) {
  showNotificationCenter.value = false
  
  const actualType = determineTaskType(relatedNo, type)
  
  let task = null
  
  if (actualType === 'complaint') {
    task = tasks.value.find(t => 
      'title' in t && 
      (t.complaintNo === relatedNo || (t.complaintNo && t.complaintNo.includes(relatedNo)))
    )
  } else if (actualType === 'refund') {
    task = tasks.value.find(t => 
      'refundReason' in t && 
      (t.ticketNo === relatedNo || (t.ticketNo && t.ticketNo.includes(relatedNo)))
    )
  } else if (actualType === 'reschedule') {
    task = tasks.value.find(t => 
      'originalDate' in t && 
      (t.ticketNo === relatedNo || (t.ticketNo && t.ticketNo.includes(relatedNo)))
    )
  }
  
  if (!task) {
    task = tasks.value.find(t => 
      t.id === relatedNo || 
      t.ticketNo === relatedNo || 
      t.complaintNo === relatedNo
    )
  }

  if (task) {
    openTaskDetail(task)
  } else {
    activeTab.value = actualType
    filterType.value = actualType
    filterStatus.value = ''
    filterStuck.value = false
    filterUrgent.value = false
    loadTasks()
    setTimeout(() => {
      const delayedTask = tasks.value.find(t => 
        t.id === relatedNo || 
        t.ticketNo === relatedNo || 
        t.complaintNo === relatedNo
      )
      if (delayedTask) {
        openTaskDetail(delayedTask)
      }
    }, 300)
  }
}

function determineTaskType(relatedNo: string, type: string): string {
  if (relatedNo) {
    if (relatedNo.startsWith('CT')) {
      return 'complaint'
    } else if (relatedNo.startsWith('RT')) {
      return 'refund'
    } else if (relatedNo.startsWith('TK')) {
      if (type === 'reschedule' || type === 'refund') {
        return type
      }
    }
  }
  return type || 'all'
}

function handleLogout() {
  sessionStorage.removeItem('currentUser')
  window.location.href = '/login'
}

function getRoleBgClass(role?: string) {
  const classMap: Record<string, string> = {
    ticket_manager: 'bg-blue-600',
    gate_staff: 'bg-green-600',
    customer_service: 'bg-purple-600'
  }
  return classMap[role || ''] || 'bg-gray-600'
}

function getRoleLabel(role?: string) {
  const labelMap: Record<string, string> = {
    ticket_manager: '票务主管',
    gate_staff: '检票员',
    customer_service: '客服'
  }
  return labelMap[role || ''] || '-'
}

function getTypeBadgeClass(task: any) {
  if ('refundReason' in task) return 'badge-warning'
  if ('originalDate' in task) return 'badge-info'
  if ('title' in task) return 'badge-error'
  return 'badge-info'
}

function getTypeLabel(task: any) {
  if ('refundReason' in task) return '退票'
  if ('originalDate' in task) return '改期'
  if ('title' in task) return '投诉'
  return '其他'
}

function getStatusBadgeClass(status: string) {
  const statusMap: Record<string, string> = {
    pending: 'badge-warning',
    processing: 'badge-info',
    approved: 'badge-success',
    rejected: 'badge-error',
    resolved: 'badge-success',
    closed: 'badge-info',
    submitted: 'badge-warning',
    assigned: 'badge-info'
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
    closed: '已关闭',
    submitted: '已提交',
    assigned: '已分配'
  }
  return labelMap[status] || status
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-'
  return dateStr.slice(0, 16).replace('T', ' ')
}

onMounted(() => {
  checkLogin()
  loadStats()
  loadTasks()
  loadExceptionRecords()
  loadNotifications()
})
</script>