import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Assignment, HistoryRecord, AssignmentStatus } from '@/types'
import { assignments as mockAssignments } from '@/data/mockData'

const generateId = () => `asgn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}}`
const generateHistoryId = () => `hr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}}`

export const useAssignmentStore = defineStore('assignment', () => {
  const assignments = ref<Assignment[]>(mockAssignments)
  const selectedIds = ref<string[]>([])

  const statusCounts = computed(() => {
    const counts: Record<AssignmentStatus, number> = {
      pending: 0,
      assigned: 0,
      in_progress: 0,
      reviewing: 0,
      rejected: 0,
      completed: 0,
    }
    assignments.value.forEach(a => {
      counts[a.status]++
    })
    return counts
  })

  const getAssignmentById = (id: string): Assignment | undefined => {
    return assignments.value.find(a => a.id === id)
  }

  const getAssignmentsByStatus = (status: AssignmentStatus): Assignment[] => {
    return assignments.value.filter(a => a.status === status)
  }

  const addHistoryRecord = (
    assignmentId: string,
    action: string,
    operator: string,
    operatorRole: 'project_manager' | 'translator' | 'reviewer',
    remark: string,
    fromStatus?: AssignmentStatus,
    toStatus?: AssignmentStatus
  ) => {
    const assignment = getAssignmentById(assignmentId)
    if (!assignment) return

    const record: HistoryRecord = {
      id: generateHistoryId(),
      action,
      operator,
      operatorRole,
      timestamp: new Date().toISOString(),
      remark,
      fromStatus,
      toStatus,
    }

    assignment.history.push(record)
    assignment.updatedAt = new Date().toISOString()
  }

  const updateStatus = (
    assignmentId: string,
    newStatus: AssignmentStatus,
    operator: string,
    operatorRole: 'project_manager' | 'translator' | 'reviewer',
    remark: string
  ) => {
    const assignment = getAssignmentById(assignmentId)
    if (!assignment) return

    const oldStatus = assignment.status
    assignment.status = newStatus
    addHistoryRecord(assignmentId, '状态变更', operator, operatorRole, remark, oldStatus, newStatus)
  }

  const createAssignment = (data: Partial<Assignment>, operator: string, operatorRole: 'project_manager' | 'translator' | 'reviewer') => {
    const assignment: Assignment = {
      id: generateId(),
      projectName: data.projectName || '',
      sourceLanguage: data.sourceLanguage || '中文',
      targetLanguage: data.targetLanguage || '英语',
      translatorId: data.translatorId || '',
      translatorName: data.translatorName || '',
      reviewerId: data.reviewerId,
      reviewerName: data.reviewerName,
      status: 'pending',
      deadline: data.deadline || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [],
      terminologyIds: [],
      wordCount: data.wordCount,
      description: data.description,
    }

    addHistoryRecord(assignment.id, '创建分配', operator, operatorRole, `创建${assignment.projectName}翻译项目`)
    assignments.value.push(assignment)
    return assignment
  }

  const assignTranslator = (
    assignmentId: string,
    translatorId: string,
    translatorName: string,
    operator: string,
    operatorRole: 'project_manager' | 'translator' | 'reviewer'
  ) => {
    const assignment = getAssignmentById(assignmentId)
    if (!assignment) return

    assignment.translatorId = translatorId
    assignment.translatorName = translatorName
    updateStatus(assignmentId, 'assigned', operator, operatorRole, `分配给${translatorName}`)
  }

  const acceptAssignment = (assignmentId: string, operator: string, operatorRole: 'project_manager' | 'translator' | 'reviewer', remark: string) => {
    updateStatus(assignmentId, 'in_progress', operator, operatorRole, remark)
  }

  const submitForReview = (assignmentId: string, operator: string, operatorRole: 'project_manager' | 'translator' | 'reviewer', remark: string) => {
    updateStatus(assignmentId, 'reviewing', operator, operatorRole, remark)
  }

  const rejectAssignment = (assignmentId: string, operator: string, operatorRole: 'project_manager' | 'translator' | 'reviewer', reason: string) => {
    updateStatus(assignmentId, 'rejected', operator, operatorRole, `驳回：${reason}`)
  }

  const approveAssignment = (assignmentId: string, operator: string, operatorRole: 'project_manager' | 'translator' | 'reviewer', remark: string) => {
    updateStatus(assignmentId, 'completed', operator, operatorRole, remark)
  }

  const batchAssign = (ids: string[], translatorId: string, translatorName: string, operator: string, operatorRole: 'project_manager' | 'translator' | 'reviewer') => {
    ids.forEach(id => {
      const assignment = getAssignmentById(id)
      if (assignment && assignment.status === 'pending') {
        assignTranslator(id, translatorId, translatorName, operator, operatorRole)
      }
    })
    selectedIds.value = []
  }

  const batchReject = (ids: string[], operator: string, operatorRole: 'project_manager' | 'translator' | 'reviewer', reason: string) => {
    ids.forEach(id => {
      const assignment = getAssignmentById(id)
      if (assignment && assignment.status === 'reviewing') {
        rejectAssignment(id, operator, operatorRole, reason)
      }
    })
    selectedIds.value = []
  }

  const batchApprove = (ids: string[], operator: string, operatorRole: 'project_manager' | 'translator' | 'reviewer', remark: string) => {
    ids.forEach(id => {
      const assignment = getAssignmentById(id)
      if (assignment && assignment.status === 'reviewing') {
        approveAssignment(id, operator, operatorRole, remark)
      }
    })
    selectedIds.value = []
  }

  const toggleSelection = (id: string) => {
    const index = selectedIds.value.indexOf(id)
    if (index > -1) {
      selectedIds.value.splice(index, 1)
    } else {
      selectedIds.value.push(id)
    }
  }

  const clearSelection = () => {
    selectedIds.value = []
  }

  return {
    assignments,
    selectedIds,
    statusCounts,
    getAssignmentById,
    getAssignmentsByStatus,
    addHistoryRecord,
    createAssignment,
    assignTranslator,
    acceptAssignment,
    submitForReview,
    rejectAssignment,
    approveAssignment,
    batchAssign,
    batchReject,
    batchApprove,
    toggleSelection,
    clearSelection,
  }
}, {
  persist: true,
})