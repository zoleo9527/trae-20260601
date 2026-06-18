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
  statusLabels,
  roleLabels,
  assigneeList
} from '~/data/mock'

const feedbacks = ref<Feedback[]>([...feedbackList])
const inspections = ref<InspectionItem[]>([...inspectionItems])
const schedules = ref<ScheduleItem[]>([...scheduleList])
const materials = ref<MaterialItem[]>([...materialList])


const syncBidirectionalLinks = () => {
  feedbacks.value.forEach(fb => {
    if (fb.relatedInspectionId) {
      const ins = inspections.value.find(i => i.id === fb.relatedInspectionId)
      if (ins && !ins.relatedFeedbackId) ins.relatedFeedbackId = fb.id
    }
    if (fb.relatedScheduleId) {
      const sch = schedules.value.find(s => s.id === fb.relatedScheduleId)
      if (sch && !sch.relatedFeedbackId) sch.relatedFeedbackId = fb.id
    }
    if (fb.relatedMaterialId) {
      const mat = materials.value.find(m => m.id === fb.relatedMaterialId)
      if (mat && !mat.relatedFeedbackId) mat.relatedFeedbackId = fb.id
    }
  })
}
syncBidirectionalLinks()

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

const allTasksFlat = computed<RectificationTask[]>(() => {
  const tasks: RectificationTask[] = []
  feedbacks.value.forEach(f => {
    f.tasks.forEach(t => tasks.push(t))
  })
  return tasks
})

const stats = computed<DashboardStats>(() => {
  const fb = feedbacks.value
  const ins = inspections.value
  const sch = schedules.value
  const mat = materials.value
  const tasks = allTasksFlat.value

  const resolvedCount = fb.filter(f => f.status === 'resolved' || f.status === 'closed').length
  const today = new Date().toISOString().substring(0, 10)
  const todaySch = sch.filter(s => s.date === today)

  return {
    totalFeedback: fb.length,
    pendingFeedback: fb.filter(f => f.status === 'pending').length,
    resolvedFeedback: resolvedCount,
    resolutionRate: fb.length ? Math.round((resolvedCount / fb.length) * 100) : 0,
    activeTasks: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
    completedTasks: tasks.filter(t => t.status === 'completed' || t.status === 'verified').length,
    inspectionItems: ins.length,
    normalItems: ins.filter(i => i.status === 'normal').length,
    todaySchedules: todaySch.length,
    totalVisitors: todaySch.reduce((sum, s) => sum + s.currentVisitors, 0),
    materialsCount: mat.length,
    lowStockCount: mat.filter(m => m.status === 'low' || m.status === 'out').length,
    roleStats: [
      {
        role: 'guide' as Role,
        roleName: '展教员',
        pendingCount: fb.filter(f => f.currentRole === 'guide' && f.status === 'pending').length,
        processingCount: fb.filter(f => f.currentRole === 'guide' && f.status.includes('processing')).length,
        completedCount: resolvedCount
      },
      {
        role: 'engineer' as Role,
        roleName: '设备工程师',
        pendingCount: fb.filter(f => f.currentRole === 'engineer' && f.status === 'pending').length,
        processingCount: fb.filter(f => f.currentRole === 'engineer' && f.status.includes('processing')).length,
        completedCount: fb.filter(f => f.status.includes('engineer_completed')).length
      },
      {
        role: 'activity_teacher' as Role,
        roleName: '活动老师',
        pendingCount: fb.filter(f => f.currentRole === 'activity_teacher' && f.status === 'pending').length,
        processingCount: fb.filter(f => f.currentRole === 'activity_teacher' && f.status.includes('processing')).length,
        completedCount: fb.filter(f => f.status.includes('activity_completed')).length
      }
    ]
  }
})

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
    return allTasksFlat.value.filter(t => t.status === 'pending' || t.status === 'in_progress')
  })

  const availableActions = computed(() => {
    if (!selectedFeedback.value) return []
    const currentStatus = selectedFeedback.value.status
    return statusFlowMap[currentStatus] || []
  })

  const getAvailableActions = (feedbackId: string) => {
    const feedback = feedbacks.value.find(f => f.id === feedbackId)
    if (!feedback) return []
    return statusFlowMap[feedback.status] || []
  }

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

  const createFeedback = (params: {
    title: string
    content: string
    type: Feedback['type']
    priority: Feedback['priority']
    visitorName?: string
    visitorContact?: string
    currentAssignee?: string
    exhibitionId?: string
    exhibitionName?: string
    images?: string[]
    tags?: string[]
    relatedInspectionId?: string
    relatedScheduleId?: string
    relatedMaterialId?: string
  }) => {
    const now = formatDate(new Date())
    const id = generateId()
    const feedback: Feedback = {
      id,
      title: params.title,
      content: params.content,
      type: params.type,
      status: 'pending',
      priority: params.priority,
      visitorName: params.visitorName || '系统创建',
      visitorContact: params.visitorContact || '',
      currentRole: 'guide',
      currentAssignee: params.currentAssignee || assigneeList.guide[0],
      exhibitionId: params.exhibitionId,
      exhibitionName: params.exhibitionName,
      images: params.images,
      tags: params.tags || [],
      relatedInspectionId: params.relatedInspectionId,
      relatedScheduleId: params.relatedScheduleId,
      relatedMaterialId: params.relatedMaterialId,
      createdAt: now,
      updatedAt: now,
      history: [
        createHistory('pending', 'guide', params.currentAssignee || assigneeList.guide[0], '反馈已创建')
      ],
      tasks: []
    }

    feedbacks.value.push(feedback)

    if (params.relatedInspectionId) {
      const inspection = inspections.value.find(i => i.id === params.relatedInspectionId)
      if (inspection) inspection.relatedFeedbackId = id
    }
    if (params.relatedScheduleId) {
      const schedule = schedules.value.find(s => s.id === params.relatedScheduleId)
      if (schedule) schedule.relatedFeedbackId = id
    }
    if (params.relatedMaterialId) {
      const material = materials.value.find(m => m.id === params.relatedMaterialId)
      if (material) material.relatedFeedbackId = id
    }

    return feedback
  }

  const getRelatedFeedbackByInspection = (inspectionId: string) => {
    return feedbacks.value.find(f => f.relatedInspectionId === inspectionId) || null
  }

  const getRelatedFeedbackBySchedule = (scheduleId: string) => {
    return feedbacks.value.find(f => f.relatedScheduleId === scheduleId) || null
  }

  const getRelatedFeedbackByMaterial = (materialId: string) => {
    return feedbacks.value.find(f => f.relatedMaterialId === materialId) || null
  }

  const getStatusColor = (status: FeedbackStatus) => {
    const map: Record<string, string> = {
      pending: 'bg-gray-500',
      guide_processing: 'bg-blue-500',
      guide_completed: 'bg-blue-400',
      engineer_processing: 'bg-orange-500',
      engineer_completed: 'bg-orange-400',
      activity_processing: 'bg-purple-500',
      activity_completed: 'bg-purple-400',
      resolved: 'bg-green-500',
      closed: 'bg-gray-600'
    }
    return map[status] || 'bg-gray-500'
  }

  const getFeedbackSummary = (feedback: Feedback | null) => {
    if (!feedback) return null
    const lastHistory = feedback.history.length > 0 
      ? feedback.history[feedback.history.length - 1] 
      : null
    return {
      id: feedback.id,
      title: feedback.title,
      status: feedback.status,
      statusLabel: getStatusLabel(feedback.status),
      statusColor: getStatusColor(feedback.status),
      currentRole: feedback.currentRole,
      currentRoleLabel: getRoleLabel(feedback.currentRole),
      currentAssignee: feedback.currentAssignee,
      updatedAt: feedback.updatedAt,
      lastRemark: lastHistory?.remark || '',
      lastAt: lastHistory?.createdAt || feedback.updatedAt,
      progress: feedback.tasks.length > 0
        ? Math.round(feedback.tasks.reduce((s, t) => s + t.progress, 0) / feedback.tasks.length)
        : 0
    }
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
  }

  const updateFeedbackStatus = (id: string, status: Feedback['status'], remark: string = '') => {
    const feedback = feedbacks.value.find(f => f.id === id)
    if (feedback) {
      const history = createHistory(status, feedback.currentRole, feedback.currentAssignee, remark)
      feedback.history.push(history)
      feedback.status = status
      feedback.updatedAt = formatDate(new Date())
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
    syncBidirectionalLinks,
    stats,
    allTasksFlat,
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
    getAssigneesByRole,
    createFeedback,
    getAvailableActions,
    getRelatedFeedbackByInspection,
    getRelatedFeedbackBySchedule,
    getRelatedFeedbackByMaterial,
    getStatusColor,
    getFeedbackSummary
  }
}
