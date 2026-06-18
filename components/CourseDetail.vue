<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { User } from '../server/data/mockData'

interface Material {
  id: string
  name: string
  quantity: number
  requiredQuantity: number
  status: 'ready' | 'missing' | 'partial'
  confirmedBy?: string
  confirmedAt?: string
}

interface TimelineItem {
  id: string
  action: string
  actorName: string
  timestamp: string
  description: string
  result?: string
}

interface Issue {
  id: string
  type: 'missing_material' | 'timeout' | 'review_failed'
  title: string
  description: string
  status: 'open' | 'resolved'
  createdAt: string
  resolvedAt?: string
}

interface Registration {
  id: string
  participantName: string
  phone: string
  email: string
  createdAt: string
  promotedFromWaitlist?: boolean
  promotedBy?: string
  promotedAt?: string
}

interface WaitlistEntry {
  id: string
  participantName: string
  phone: string
  email: string
  position: number
  createdAt: string
}

interface Schedule {
  id: string
  teacherId: string
  teacherName: string
  date: string
  status: 'assigned' | 'confirmed' | 'completed' | 'cancelled'
  assignedAt: string
  confirmedAt?: string
  assignedBy: string
  assignerName: string
  confirmerName?: string
}

interface WaitlistHistoryEntry {
  id: string
  action: 'promote' | 'reject' | 'cancel'
  actorName: string
  timestamp: string
  result: string
  notes?: string
}

interface Course {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  maxParticipants: number
  currentParticipants: number
  isFull: boolean
  status: string
  materials: Material[]
  teacherName: string
  submitterName: string
  timeline: TimelineItem[]
  issues: Issue[]
  registrations: Registration[]
  waitlist: WaitlistEntry[]
  schedule: Schedule | null
  waitlistHistory: WaitlistHistoryEntry[]
  materialConfirmationRate: number
  confirmedMaterials: number
  openIssues: number
}

const props = defineProps<{
  courseId: string
  currentUser: User
}>()

const emit = defineEmits<{
  back: []
  refresh: []
}>()

const course = ref<Course | null>(null)
const loading = ref(true)
const activeTab = ref('info')
const showRegistrationForm = ref(false)
const showReviewModal = ref(false)
const showResetModal = ref(false)
const showPromoteModal = ref(false)
const promotionNotes = ref('')
const selectedWaitlistEntry = ref<WaitlistEntry | null>(null)
const registrationForm = ref({
  participantName: '',
  phone: '',
  email: ''
})
const reviewReason = ref('')
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const statusLabels: Record<string, string> = {
  draft: '草稿',
  submitted: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

const statusBadgeClass: Record<string, string> = {
  draft: 'badge-warning',
  submitted: 'badge-info',
  approved: 'badge-success',
  rejected: 'badge-danger',
  in_progress: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-danger'
}

const scheduleStatusLabels: Record<string, string> = {
  assigned: '已分配',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消'
}

const scheduleStatusBadgeClass: Record<string, string> = {
  assigned: 'badge-info',
  confirmed: 'badge-success',
  completed: 'badge-success',
  cancelled: 'badge-danger'
}

const materialStatusLabels: Record<string, string> = {
  ready: '已准备',
  missing: '缺失',
  partial: '不足'
}

const materialStatusBadgeClass: Record<string, string> = {
  ready: 'badge-success',
  missing: 'badge-danger',
  partial: 'badge-warning'
}

const issueTypeLabels: Record<string, string> = {
  missing_material: '材料缺失',
  timeout: '超时预警',
  review_failed: '审核失败'
}

const canReview = computed(() => props.currentUser.role === 'manager' && course.value?.status === 'submitted')
const canRegister = computed(() => course.value?.status === 'approved' && !course.value?.isFull)
const canManageWaitlist = computed(() => props.currentUser.role === 'manager')
const hasOpenIssues = computed(() => course.value?.issues.filter(i => i.status === 'open').length || 0 > 0)
const hasWaitlist = computed(() => course.value?.waitlist.length && course.value.waitlist.length > 0)

const canConfirmSchedule = computed(() => {
  if (!course.value?.schedule) return false
  if (course.value.schedule.status !== 'assigned') return false
  if (props.currentUser.role === 'manager') return true
  if (props.currentUser.role === 'teacher' && course.value.schedule.teacherId === props.currentUser.id) return true
  return false
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateShort = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchCourse = async () => {
  loading.value = true
  try {
    const res = await fetch(`/api/courses/${props.courseId}`)
    if (res.ok) {
      course.value = await res.json()
    } else {
      console.error('Failed to fetch course')
    }
  } catch (error) {
    console.error('Failed to fetch course:', error)
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!registrationForm.value.participantName || !registrationForm.value.phone) {
    showMessage('请填写姓名和手机号', 'error')
    return
  }
  
  try {
    const res = await fetch(`/api/courses/${props.courseId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationForm.value)
    })
    
    const data = await res.json()
    if (res.ok) {
      showMessage(data.message, 'success')
      showRegistrationForm.value = false
      registrationForm.value = { participantName: '', phone: '', email: '' }
      fetchCourse()
    } else {
      showMessage(data.message || '报名失败', 'error')
    }
  } catch (error) {
    showMessage('报名失败', 'error')
  }
}

const handleReview = async (approved: boolean) => {
  try {
    const res = await fetch(`/api/courses/${props.courseId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewerId: props.currentUser.id,
        approved,
        reason: approved ? '' : reviewReason.value
      })
    })
    
    const data = await res.json()
    if (res.ok) {
      showMessage(data.message, 'success')
      showReviewModal.value = false
      reviewReason.value = ''
      fetchCourse()
    } else {
      showMessage(data.message || '审核失败', 'error')
    }
  } catch (error) {
    showMessage('审核失败', 'error')
  }
}

const handleReset = async () => {
  try {
    const res = await fetch(`/api/courses/${props.courseId}/reset-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: props.currentUser.id })
    })
    
    const data = await res.json()
    if (res.ok) {
      showMessage(data.message, 'success')
      showResetModal.value = false
      fetchCourse()
    } else {
      showMessage(data.message || '重置失败', 'error')
    }
  } catch (error) {
    showMessage('重置失败', 'error')
  }
}

const handlePromote = async () => {
  if (!selectedWaitlistEntry.value) return
  
  try {
    const res = await fetch(`/api/courses/${props.courseId}/promote-waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        waitlistId: selectedWaitlistEntry.value.id,
        actorId: props.currentUser.id,
        notes: promotionNotes.value
      })
    })
    
    const data = await res.json()
    if (res.ok) {
      showMessage(data.message, 'success')
      showPromoteModal.value = false
      promotionNotes.value = ''
      selectedWaitlistEntry.value = null
      fetchCourse()
    } else {
      showMessage(data.message || '升级失败', 'error')
    }
  } catch (error) {
    showMessage('升级失败', 'error')
  }
}

const handleConfirmSchedule = async () => {
  try {
    const res = await fetch(`/api/courses/${props.courseId}/confirm-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: props.currentUser.id })
    })
    
    const data = await res.json()
    if (res.ok) {
      showMessage(data.message, 'success')
      fetchCourse()
    } else {
      showMessage(data.message || '确认失败', 'error')
    }
  } catch (error) {
    showMessage('确认失败', 'error')
  }
}

const handleConfirmMaterial = async (materialId: string) => {
  try {
    const res = await fetch(`/api/courses/${props.courseId}/confirm-material`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: props.currentUser.id, materialId })
    })
    
    const data = await res.json()
    if (res.ok) {
      showMessage(data.message, 'success')
      fetchCourse()
    } else {
      showMessage(data.message || '确认失败', 'error')
    }
  } catch (error) {
    showMessage('确认失败', 'error')
  }
}

const openPromoteModal = (entry: WaitlistEntry) => {
  selectedWaitlistEntry.value = entry
  promotionNotes.value = ''
  showPromoteModal.value = true
}

const showMessage = (msg: string, type: 'success' | 'error') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

watch(() => props.courseId, () => {
  fetchCourse()
}, { immediate: true })
</script>

<template>
  <div>
    <div v-if="message" :class="messageType === 'success' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'" class="p-4 rounded-lg mb-4">
      {{ message }}
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
    </div>

    <div v-else-if="course">
      <div class="flex items-center space-x-4 mb-6">
        <button @click="emit('back')" class="btn btn-outline">
          ← 返回列表
        </button>
        <h2 class="text-xl font-semibold text-gray-900">{{ course.title }}</h2>
        <span :class="statusBadgeClass[course.status]" class="badge">{{ statusLabels[course.status] }}</span>
        <span v-if="course.isFull" class="badge badge-danger">已满员</span>
      </div>

      <div class="grid grid-cols-6 gap-4 mb-6">
        <div class="card text-center">
          <div class="text-3xl font-bold text-primary-600">{{ course.currentParticipants }}</div>
          <div class="text-sm text-gray-500">已报名 / {{ course.maxParticipants }}</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-warning-600">{{ course.waitlist.length }}</div>
          <div class="text-sm text-gray-500">候补人数</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-danger-600">{{ course.openIssues }}</div>
          <div class="text-sm text-gray-500">待处理问题</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-info-600">{{ course.confirmedMaterials }}/{{ course.materials.length }}</div>
          <div class="text-sm text-gray-500">物料确认</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold" :class="course.materialConfirmationRate >= 100 ? 'text-success-600' : course.materialConfirmationRate > 0 ? 'text-warning-600' : 'text-gray-400'">
            {{ course.materialConfirmationRate }}%
          </div>
          <div class="text-sm text-gray-500">确认率</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-purple-600">{{ course.waitlistHistory.length }}</div>
          <div class="text-sm text-gray-500">候补处理记录</div>
        </div>
      </div>

      <div class="flex space-x-2 mb-6 flex-wrap">
        <button 
          @click="activeTab = 'info'"
          :class="activeTab === 'info' ? 'btn-primary' : 'btn btn-outline'"
          class="btn"
        >
          课程信息
        </button>
        <button 
          @click="activeTab = 'schedule'"
          :class="activeTab === 'schedule' ? 'btn-primary' : 'btn btn-outline'"
          class="btn"
        >
          讲师排班
        </button>
        <button 
          @click="activeTab = 'materials'"
          :class="activeTab === 'materials' ? 'btn-primary' : 'btn btn-outline'"
          class="btn"
        >
          物料清单
        </button>
        <button 
          @click="activeTab = 'timeline'"
          :class="activeTab === 'timeline' ? 'btn-primary' : 'btn btn-outline'"
          class="btn"
        >
          时间线
        </button>
        <button 
          @click="activeTab = 'registrations'"
          :class="activeTab === 'registrations' ? 'btn-primary' : 'btn btn-outline'"
          class="btn"
        >
          报名列表
        </button>
        <button 
          @click="activeTab = 'waitlist'"
          :class="activeTab === 'waitlist' ? 'btn-primary' : 'btn btn-outline'"
          class="btn"
        >
          候补管理
        </button>
        
        <div class="ml-auto flex space-x-2">
          <button 
            v-if="canRegister"
            @click="showRegistrationForm = true"
            class="btn btn-primary"
          >
            报名
          </button>
          <button 
            v-if="canReview"
            @click="showReviewModal = true"
            class="btn btn-warning"
          >
            审核课程
          </button>
          <button 
            v-if="currentUser.role === 'manager'"
            @click="showResetModal = true"
            class="btn btn-danger"
          >
            重置数据
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'info'" class="card">
        <h3 class="text-lg font-semibold mb-4">基本信息</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-gray-500">日期:</span>
            <p class="font-medium">{{ course.date }}</p>
          </div>
          <div>
            <span class="text-gray-500">时间:</span>
            <p class="font-medium">{{ course.startTime }} - {{ course.endTime }}</p>
          </div>
          <div>
            <span class="text-gray-500">地点:</span>
            <p class="font-medium">{{ course.location }}</p>
          </div>
          <div>
            <span class="text-gray-500">讲师:</span>
            <p class="font-medium">{{ course.teacherName }}</p>
          </div>
          <div>
            <span class="text-gray-500">提交人:</span>
            <p class="font-medium">{{ course.submitterName }}</p>
          </div>
          <div>
            <span class="text-gray-500">状态:</span>
            <p :class="statusBadgeClass[course.status]" class="inline-block badge">{{ statusLabels[course.status] }}</p>
          </div>
        </div>
        <div class="mt-4">
          <span class="text-gray-500">课程描述:</span>
          <p class="font-medium">{{ course.description }}</p>
        </div>
      </div>

      <div v-if="activeTab === 'schedule'" class="card">
        <h3 class="text-lg font-semibold mb-4">讲师排班</h3>
        <div v-if="course.schedule" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-gray-500">讲师:</span>
              <p class="font-medium">{{ course.schedule.teacherName }}</p>
            </div>
            <div>
              <span class="text-gray-500">状态:</span>
              <p :class="scheduleStatusBadgeClass[course.schedule.status]" class="inline-block badge">{{ scheduleStatusLabels[course.schedule.status] }}</p>
            </div>
            <div>
              <span class="text-gray-500">授课日期:</span>
              <p class="font-medium">{{ course.schedule.date }}</p>
            </div>
            <div>
              <span class="text-gray-500">课程时间:</span>
              <p class="font-medium">{{ course.startTime }} - {{ course.endTime }}</p>
            </div>
            <div>
              <span class="text-gray-500">分配人:</span>
              <p class="font-medium">{{ course.schedule.assignerName }} ({{ formatDateShort(course.schedule.assignedAt) }})</p>
            </div>
            <div v-if="course.schedule.confirmedAt">
              <span class="text-gray-500">确认人:</span>
              <p class="font-medium">{{ course.schedule.confirmerName }} ({{ formatDateShort(course.schedule.confirmedAt) }})</p>
            </div>
          </div>
          
          <div v-if="canConfirmSchedule" class="pt-4 border-t border-gray-200">
            <button @click="handleConfirmSchedule" class="btn btn-success">
              {{ currentUser.role === 'teacher' ? '确认授课安排' : '确认排班' }}
            </button>
            <p v-if="currentUser.role === 'teacher'" class="text-xs text-gray-500 mt-2">确认后表示您已收到授课通知并同意安排</p>
          </div>
          <div v-else-if="course.schedule.status === 'assigned' && !canConfirmSchedule" class="pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-500">
              <span v-if="currentUser.role === 'teacher' && course.schedule.teacherId !== currentUser.id">此排班不属于您</span>
              <span v-else-if="currentUser.role === 'volunteer'">志愿者无法确认排班</span>
            </p>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">📅</div>
          <p>暂无排班信息</p>
        </div>
      </div>

      <div v-if="activeTab === 'materials'" class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">物料清单</h3>
          <div class="flex items-center space-x-2">
            <div class="w-32 bg-gray-200 rounded-full h-2">
              <div 
                class="bg-success-500 h-2 rounded-full transition-all duration-500"
                :style="{ width: `${course.materialConfirmationRate}%` }"
              ></div>
            </div>
            <span class="text-sm text-gray-500">{{ course.materialConfirmationRate }}% 已确认</span>
          </div>
        </div>
        
        <div class="space-y-3">
          <div 
            v-for="material in course.materials" 
            :key="material.id"
            class="flex items-center justify-between p-3 rounded-lg"
            :class="material.status === 'missing' ? 'bg-danger-50' : material.status === 'partial' ? 'bg-warning-50' : 'bg-gray-50'"
          >
            <div class="flex items-center space-x-3 flex-1">
              <span class="font-medium">{{ material.name }}</span>
              <span :class="materialStatusBadgeClass[material.status]" class="badge">{{ materialStatusLabels[material.status] }}</span>
              <span v-if="material.confirmedBy" class="text-xs text-success-600 ml-auto">✓ 已确认</span>
            </div>
            <div class="flex items-center space-x-4">
              <span class="text-sm">
                {{ material.quantity }} / {{ material.requiredQuantity }}
              </span>
              <button 
                v-if="!material.confirmedBy && (currentUser.role === 'volunteer' || currentUser.role === 'manager')"
                @click="handleConfirmMaterial(material.id)"
                class="btn btn-success text-xs"
              >
                确认
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="currentUser.role !== 'volunteer' && currentUser.role !== 'manager'" class="mt-4 pt-4 border-t border-gray-200">
          <p class="text-sm text-gray-500">只有志愿者或主管可以确认物料</p>
        </div>
      </div>

      <div v-if="activeTab === 'timeline'" class="card">
        <h3 class="text-lg font-semibold mb-4">操作时间线</h3>
        <div class="relative">
          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div class="space-y-6">
            <div 
              v-for="(item, index) in course.timeline" 
              :key="item.id"
              class="relative pl-12"
            >
              <div 
                class="absolute left-2 w-5 h-5 rounded-full border-4"
                :class="index === course.timeline.length - 1 ? 'bg-primary-500 border-primary-200' : 'bg-white border-gray-300'"
              ></div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium">{{ item.description }}</span>
                  <span class="text-xs text-gray-500">{{ formatDate(item.timestamp) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">操作人: {{ item.actorName }}</span>
                  <span v-if="item.result" class="text-sm" :class="item.result === '成功' || item.result === '通过' || item.result === '已确认' ? 'text-success-600' : item.result === '未通过' ? 'text-danger-600' : 'text-gray-500'">
                    {{ item.result }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'registrations'" class="card">
        <h3 class="text-lg font-semibold mb-4">报名列表 ({{ course.registrations.length }}人)</h3>
        <div class="space-y-3">
          <div 
            v-for="registration in course.registrations" 
            :key="registration.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <span class="font-medium">{{ registration.participantName }}</span>
                <span v-if="registration.promotedFromWaitlist" class="badge badge-warning text-xs">候补转正</span>
              </div>
              <span class="text-sm text-gray-500">{{ registration.phone }} {{ registration.email }}</span>
            </div>
            <div class="text-right">
              <span class="text-xs text-gray-500">{{ formatDate(registration.createdAt) }}</span>
              <div v-if="registration.promotedAt" class="text-xs text-success-600">
                转正于 {{ formatDateShort(registration.promotedAt) }}
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="course.registrations.length === 0" class="text-center py-8 text-gray-500">
          暂无报名记录
        </div>
      </div>

      <div v-if="activeTab === 'waitlist'" class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">候补管理</h3>
          <span class="text-sm text-gray-500">共 {{ course.waitlist.length }} 人</span>
        </div>
        
        <div v-if="hasWaitlist" class="space-y-4">
          <div class="bg-warning-50 rounded-lg p-4 mb-4">
            <h4 class="font-medium text-warning-800 mb-2">候补队列</h4>
            <div class="space-y-2">
              <div 
                v-for="entry in course.waitlist" 
                :key="entry.id"
                class="flex items-center justify-between p-2 bg-white rounded-lg"
              >
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <span class="badge badge-info">#{{ entry.position }}</span>
                    <span class="font-medium">{{ entry.participantName }}</span>
                  </div>
                  <span class="text-sm text-gray-500">{{ entry.phone }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-xs text-gray-400">{{ formatDateShort(entry.createdAt) }}</span>
                  <button 
                    v-if="canManageWaitlist"
                    @click="openPromoteModal(entry)"
                    class="btn btn-primary text-xs"
                  >
                    升级
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 class="font-medium text-gray-800 mb-2">候补处理历史</h4>
            <div class="space-y-2">
              <div 
                v-for="history in course.waitlistHistory" 
                :key="history.id"
                class="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="font-medium">{{ history.actorName }}</span>
                    <span class="badge" :class="history.result.includes('成功') ? 'badge-success' : 'badge-danger'">
                      {{ history.action === 'promote' ? '升级' : history.action === 'reject' ? '拒绝' : '取消' }}
                    </span>
                  </div>
                  <p class="text-sm" :class="history.result.includes('成功') ? 'text-success-600' : 'text-danger-600'">
                    {{ history.result }}
                  </p>
                  <p v-if="history.notes" class="text-xs text-gray-500 mt-1">备注: {{ history.notes }}</p>
                </div>
                <span class="text-xs text-gray-400">{{ formatDateShort(history.timestamp) }}</span>
              </div>
            </div>
            
            <div v-if="course.waitlistHistory.length === 0" class="text-center py-4 text-gray-500">
              暂无处理记录
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">📋</div>
          <p>暂无候补记录</p>
        </div>
      </div>

      <div v-if="hasOpenIssues" class="card bg-danger-50 border-danger-200 mt-6">
        <h3 class="text-lg font-semibold text-danger-700 mb-4">⚠️ 待处理问题</h3>
        <div class="space-y-3">
          <div 
            v-for="issue in course.issues.filter(i => i.status === 'open')" 
            :key="issue.id"
            class="bg-white p-4 rounded-lg border border-danger-200"
          >
            <div class="flex items-center space-x-2 mb-2">
              <span class="badge badge-danger">{{ issueTypeLabels[issue.type] }}</span>
              <span class="font-medium">{{ issue.title }}</span>
            </div>
            <p class="text-sm text-gray-600">{{ issue.description }}</p>
            <span class="text-xs text-gray-400 mt-2 block">{{ formatDate(issue.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRegistrationForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">报名课程</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">姓名 *</label>
            <input v-model="registrationForm.participantName" type="text" class="input" placeholder="请输入姓名" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">手机号 *</label>
            <input v-model="registrationForm.phone" type="tel" class="input" placeholder="请输入手机号" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">邮箱</label>
            <input v-model="registrationForm.email" type="email" class="input" placeholder="请输入邮箱（选填）" />
          </div>
          <div class="flex space-x-3">
            <button @click="showRegistrationForm = false" class="btn btn-outline flex-1">取消</button>
            <button @click="handleRegister" class="btn btn-primary flex-1">确认报名</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showReviewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">审核课程</h3>
        <p class="text-gray-600 mb-4">确定要审核此课程吗？</p>
        <div v-if="!reviewReason" class="mb-4">
          <label class="block text-sm font-medium mb-1">审核意见（拒绝时必填）</label>
          <textarea v-model="reviewReason" class="input" rows="3" placeholder="请输入审核意见..."></textarea>
        </div>
        <div class="flex space-x-3">
          <button @click="showReviewModal = false" class="btn btn-outline flex-1">取消</button>
          <button @click="handleReview(false)" class="btn btn-danger flex-1">拒绝</button>
          <button @click="handleReview(true)" class="btn btn-success flex-1">通过</button>
        </div>
      </div>
    </div>

    <div v-if="showResetModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-danger-700 mb-4">⚠️ 确认重置数据</h3>
        <p class="text-gray-600 mb-4">此操作将清除该课程的所有报名记录和候补名单，且无法恢复。确定要继续吗？</p>
        <div class="text-sm text-gray-500 mb-4">
          操作人: {{ currentUser.name }}
        </div>
        <div class="flex space-x-3">
          <button @click="showResetModal = false" class="btn btn-outline flex-1">取消</button>
          <button @click="handleReset" class="btn btn-danger flex-1">确认重置</button>
        </div>
      </div>
    </div>

    <div v-if="showPromoteModal && selectedWaitlistEntry" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">升级候补学员</h3>
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <p class="font-medium">{{ selectedWaitlistEntry.participantName }}</p>
          <p class="text-sm text-gray-500">{{ selectedWaitlistEntry.phone }}</p>
          <p class="text-sm text-gray-500">当前位置: 第 {{ selectedWaitlistEntry.position }} 位</p>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">备注（选填）</label>
          <textarea v-model="promotionNotes" class="input" rows="2" placeholder="请输入备注信息..."></textarea>
        </div>
        <div class="text-sm text-gray-500 mb-4">
          操作人: {{ currentUser.name }}
        </div>
        <div class="flex space-x-3">
          <button @click="showPromoteModal = false" class="btn btn-outline flex-1">取消</button>
          <button @click="handlePromote" class="btn btn-success flex-1">确认升级</button>
        </div>
      </div>
    </div>
  </div>
</template>
