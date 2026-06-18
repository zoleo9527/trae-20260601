import { ref, computed } from 'vue'
import type { 
  Feedback, 
  RectificationTask, 
  InspectionItem, 
  ScheduleItem, 
  MaterialItem, 
  DashboardStats,
  Role,
  FeedbackStatus,
  StatusHistory,
  TaskStatus
} from '~/types'
import { 
  feedbackList, 
  inspectionItems, 
  scheduleList, 
  materialList, 
  dashboardStats,
  statusLabels,
  roleLabels,
  assigneeList
} from '~/data/mock'

const feedbacks = ref<Feedback[]>([...feedbackList])
const inspections = ref<InspectionItem[]>([...inspectionItems])
const schedules = ref<ScheduleItem[]>([...scheduleList])
const materials = ref<MaterialItem[]>([...materialList])
const stats = ref<DashboardStats>({ ...dashboardStats })

const selectedFeedback = ref<Feedback | null>(null)
const showDetailSidebar = ref(false)
const showTransferModal = ref(false)
const transferFeedbackId = ref<string | null>(null)
const currentUserRole = ref<Role>('guide')

const generateId = () => Math.random().toString(36).substring(2, 11)
const formatDate = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19)

const createHistory = (
  status: string,
  role: Role,
  assignee: string,
  remark: string
): StatusHistory => ({
  id: generateId(),
  status,
  role,
  assignee,
  remark,
  createdAt: formatDate(new Date())
})

const statusFlowMap: Record<string, { next: FeedbackStatus | null; nextRole: Role | null; action: string }[]> = {
  pending: [
    { next: 'guide_processing', nextRole: 'guide', action: '展教员开始处理' }
  ],
  guide_processing: [
    { next: 'guide_completed', nextRole: 'engineer', action: '流转至设备工程师' },
    { next: 'guide_completed', nextRole: 'activity_teacher', action: '流转至活动老师' },
    { next: 'resolved', nextRole: null, action: '直接解决' }
  ],
  guide_completed: [
    { next: 'engineer_processing', nextRole: 'engineer', action: '工程师开始处理' },
    { next: 'activity_processing', nextRole: 'activity_teacher', action: '活动老师开始处理' }
  ],
  engineer_processing: [
    { next: 'engineer_completed', nextRole: 'guide', action: '流转回展教员验收' },
    { next: 'engineer_completed', nextRole: 'activity_teacher', action: '流转至活动老师' },
    { next: 'resolved', nextRole: null, action: '直接解决' }
  ],
  engineer_completed: [
    { next: 'guide_processing', nextRole: 'guide', action: '展教员验收中' },
    { next: 'activity_processing', nextRole: 'activity_teacher', action: '活动老师继续处理' }
  ],
  activity_processing: [
    { next: 'activity_completed', nextRole: 'guide', action: '流转回展教员验收' },
    { next: 'resolved', nextRole: null, action: '直接解决' }
  ],
  activity_completed: [
    { next: 'guide_processing', nextRole: 'guide', action: '展教员验收中' },
    { next: 'resolved', nextRole: null, action: '直接解决' }
  ],
  resolved: [
    { next: 'closed', nextRole: null, action: '关闭' }
  ]
}

export function useFeedback() {
  const pendingFeedbacks = computed(() => 
    feedbacks.value.filter(f => f.status === 'pending')
  )

  const processingFeedbacks = computed(() => 
    feedbacks.value.filter(f => f.status.includes('processing'))
  )

  const resolvedFeedbacks = computed(() => 
    feedbacks.value.filter(f => f.status === 'resolved' || f.status === 'closed')
  )

  const myFeedbacks = computed(() => 
    feedbacks.value.filter(f => f.currentRole === currentUserRole.value)
  )

  const myPendingFeedbacks = computed(() =>
    feedbacks.value.filter(f => 
      f.currentRole === currentUserRole.value && 
      !['resolved', 'closed'].includes(f.status)
    )
  )

  const guideFeedbacks = computed(() =>
    feedbacks.value.filter(f => f.currentRole === 'guide' && !['resolved', 'closed'].includes(f.status))
  )

  const engineerFeedbacks = computed(() =>
    feedbacks.value.filter(f => f.currentRole === 'engineer' && !['resolved', 'closed'].includes(f.status))
  )

  const activityFeedbacks = computed(() =>
    feedbacks.value.filter(f => f.currentRole === 'activity_teacher' && !['resolved', 'closed'].includes(f.status))
  )

  const activeTasks = computed(() => {
    const tasks: RectificationTask[] = []
    feedbacks.value.forEach(f => {
      f.tasks.forEach(t => {
        if (t.status === 'pending' || t.status === 'in_progress') {
          tasks.push(t)
        }
      })
    })
    return tasks
  })

  const availableActions = computed(() => {
    if (!selectedFeedback.value) return []
    const currentStatus = selectedFeedback.value.status
    return statusFlowMap[currentStatus] || []
  })

  const selectFeedback = (feedback: Feedback) => {
    selectedFeedback.value = feedback
    showDetailSidebar.value = true
  }

  const closeDetail = () => {
    showDetailSidebar.value = false
    selectedFeedback.value = null
  }

  const openTransferModal = (feedbackId: string) => {
    transferFeedbackId.value = feedbackId
    showTransferModal.value = true
  }

  const closeTransferModal = () => {
    showTransferModal.value = false
    transferFeedbackId.value = null
  }

  const transferFeedback = (
    feedbackId: string,
    nextStatus: FeedbackStatus,
    nextRole: Role | null,
    assignee: string,
    remark: string,
    taskTitle?: string,
    taskDescription?: string,
    taskDeadline?: string
  ) => {
    const feedback = feedbacks.value.find(f => f.id === feedbackId)
    if (!feedback) return

    const history = createHistory(nextStatus, nextRole || feedback.currentRole, assignee, remark)
    feedback.history.push(history)
    feedback.status = nextStatus
    feedback.updatedAt = formatDate(new Date())

    if (nextRole) {
      feedback.currentRole = nextRole
      feedback.currentAssignee = assignee
    }

    if (taskTitle && taskDescription) {
      const newTask: RectificationTask = {
        id: generateId(),
        title: taskTitle,
        description: taskDescription,
        feedbackId: feedbackId,
        status: 'pending',
        priority: feedback.priority,
        role: nextRole || feedback.currentRole,
        assignee: assignee,
        deadline: taskDeadline || '',
        createdAt: formatDate(new Date()),
        progress: 0,
        remark: remark,
        history: [
          createHistory('pending', nextRole || feedback.currentRole, assignee, '整改任务已创建')
        ]
      }
      feedback.tasks.push(newTask)
    }

    closeTransferModal()
    updateStats()
  }

  const updateFeedbackStatus = (id: string, status: Feedback['status'], remark: string = '') => {
    const feedback = feedbacks.value.find(f => f.id === id)
    if (feedback) {
      const history = createHistory(status, feedback.currentRole, feedback.currentAssignee, remark)
      feedback.history.push(history)
      feedback.status = status
      feedback.updatedAt = formatDate(new Date())
      updateStats()
    }
  }

  const updateTaskStatus = (feedbackId: string, taskId: string, status: TaskStatus, progress: number, remark: string = '') => {
    const feedback = feedbacks.value.find(f => f.id === feedbackId)
    if (!feedback) return

    const task = feedback.tasks.find(t => t.id === taskId)
    if (!task) return

    const history = createHistory(status, task.role, task.assignee, remark)
    task.history.push(history)
    task.status = status
    task.progress = progress
    task.updatedAt = formatDate(new Date())

    if (status === 'completed') {
      task.completedAt = formatDate(new Date())
    }

    updateStats()
  }

  const updateStats = () => {
    const allTasks: RectificationTask[] = []
    feedbacks.value.forEach(f => {
      f.tasks.forEach(t => allTasks.push(t))
    })

    stats.value = {
      ...stats.value,
      totalFeedback: feedbacks.value.length,
      pendingFeedback: feedbacks.value.filter(f => f.status === 'pending').length,
      resolvedFeedback: feedbacks.value.filter(f => f.status === 'resolved' || f.status === 'closed').length,
      resolutionRate: Math.round(
        (feedbacks.value.filter(f => f.status === 'resolved' || f.status === 'closed').length / feedbacks.value.length) * 100
      ),
      activeTasks: allTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
      completedTasks: allTasks.filter(t => t.status === 'completed' || t.status === 'verified').length,
      roleStats: [
        { 
          role: 'guide', 
          roleName: '展教员', 
          pendingCount: feedbacks.value.filter(f => f.currentRole === 'guide' && f.status === 'pending').length,
          processingCount: feedbacks.value.filter(f => f.currentRole === 'guide' && f.status.includes('processing')).length,
          completedCount: feedbacks.value.filter(f => f.status === 'resolved' || f.status === 'closed').length
        },
        { 
          role: 'engineer', 
          roleName: '设备工程师', 
          pendingCount: feedbacks.value.filter(f => f.currentRole === 'engineer' && f.status === 'pending').length,
          processingCount: feedbacks.value.filter(f => f.currentRole === 'engineer' && f.status.includes('processing')).length,
          completedCount: feedbacks.value.filter(f => f.status.includes('engineer_completed')).length
        },
        { 
          role: 'activity_teacher', 
          roleName: '活动老师', 
          pendingCount: feedbacks.value.filter(f => f.currentRole === 'activity_teacher' && f.status === 'pending').length,
          processingCount: feedbacks.value.filter(f => f.currentRole === 'activity_teacher' && f.status.includes('processing')).length,
          completedCount: feedbacks.value.filter(f => f.status.includes('activity_completed')).length
        }
      ]
    }
  }

  const setCurrentRole = (role: Role) => {
    currentUserRole.value = role
  }

  const getRelatedInspection = (id?: string) => {
    return id ? inspections.value.find(i => i.id === id) : null
  }

  const getRelatedSchedule = (id?: string) => {
    return id ? schedules.value.find(s => s.id === id) : null
  }

  const getRelatedMaterial = (id?: string) => {
    return id ? materials.value.find(m => m.id === id) : null
  }

  const getStatusLabel = (status: string) => statusLabels[status] || status
  const getRoleLabel = (role: Role) => roleLabels[role] || role
  const getAssigneesByRole = (role: Role) => assigneeList[role] || []

  return {
    feedbacks,
    inspections,
    schedules,
    materials,
    stats,
    selectedFeedback,
    showDetailSidebar,
    showTransferModal,
    transferFeedbackId,
    currentUserRole,
    pendingFeedbacks,
    processingFeedbacks,
    resolvedFeedbacks,
    myFeedbacks,
    myPendingFeedbacks,
    guideFeedbacks,
    engineerFeedbacks,
    activityFeedbacks,
    activeTasks,
    availableActions,
    selectFeedback,
    closeDetail,
    openTransferModal,
    closeTransferModal,
    transferFeedback,
    updateFeedbackStatus,
    updateTaskStatus,
    setCurrentRole,
    getRelatedInspection,
    getRelatedSchedule,
    getRelatedMaterial,
    getStatusLabel,
    getRoleLabel,
    getAssigneesByRole
  }
}
