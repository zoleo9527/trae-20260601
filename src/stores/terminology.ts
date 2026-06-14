import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Terminology, TerminologyVersion, TerminologyStatus, HistoryRecord } from '@/types'
import { terminologies as mockTerminologies } from '@/data/mockData'
import { useAssignmentStore } from './assignment'

const generateId = () => `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}}`
const generateVersionId = () => `ver-${Date.now()}-${Math.random().toString(36).substr(2, 9)}}`
const generateHistoryId = () => `hr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}}`

export const useTerminologyStore = defineStore('terminology', () => {
  const terminologies = ref<Terminology[]>(mockTerminologies)

  const getTerminologyById = (id: string): Terminology | undefined => {
    return terminologies.value.find(t => t.id === id)
  }

  const getTerminologiesByAssignment = (assignmentId: string): Terminology[] => {
    return terminologies.value.filter(t => t.assignmentId === assignmentId)
  }

  const getTerminologiesByStatus = (status: TerminologyStatus): Terminology[] => {
    return terminologies.value.filter(t => t.status === status)
  }

  const addHistoryRecord = (
    terminologyId: string,
    action: string,
    operator: string,
    operatorRole: 'project_manager' | 'translator' | 'reviewer',
    remark: string
  ) => {
    const terminology = getTerminologyById(terminologyId)
    if (!terminology) return

    const record: HistoryRecord = {
      id: generateHistoryId(),
      action,
      operator,
      operatorRole,
      timestamp: new Date().toISOString(),
      remark,
    }

    terminology.history.push(record)
    terminology.updatedAt = new Date().toISOString()
  }

  const createTerminology = (
    assignmentId: string,
    sourceTerm: string,
    targetTerm: string,
    operator: string,
    context?: string,
    note?: string
  ) => {
    const terminology: Terminology = {
      id: generateId(),
      assignmentId,
      sourceTerm,
      targetTerm,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [{
        id: generateVersionId(),
        sourceTerm,
        targetTerm,
        updatedBy: operator,
        updatedAt: new Date().toISOString(),
        remark: '初次翻译',
      }],
      history: [],
      context,
      note,
    }

    addHistoryRecord(terminology.id, '创建术语', operator, 'translator', `添加术语：${sourceTerm} -> ${targetTerm}`)
    terminologies.value.push(terminology)

    const assignmentStore = useAssignmentStore()
    const assignment = assignmentStore.getAssignmentById(assignmentId)
    if (assignment) {
      assignment.terminologyIds.push(terminology.id)
    }

    return terminology
  }

  const updateTerminology = (
    terminologyId: string,
    newTargetTerm: string,
    operator: string,
    operatorRole: 'project_manager' | 'translator' | 'reviewer',
    remark: string
  ) => {
    if (operatorRole !== 'translator') return false
    
    const terminology = getTerminologyById(terminologyId)
    if (!terminology || terminology.status !== 'rejected') return false

    const version: TerminologyVersion = {
      id: generateVersionId(),
      sourceTerm: terminology.sourceTerm,
      targetTerm: newTargetTerm,
      updatedBy: operator,
      updatedAt: new Date().toISOString(),
      remark,
    }

    terminology.versions.push(version)
    terminology.targetTerm = newTargetTerm
    terminology.status = 'pending'
    addHistoryRecord(terminologyId, '更新术语', operator, operatorRole, `修改为：${terminology.sourceTerm} -> ${newTargetTerm}`)
    
    const assignmentStore = useAssignmentStore()
    const assignment = assignmentStore.getAssignmentById(terminology.assignmentId)
    if (assignment) {
      assignmentStore.addHistoryRecord(
        assignment.id,
        '术语更新',
        operator,
        operatorRole,
        `更新术语：${terminology.sourceTerm} -> ${newTargetTerm}`
      )
    }
    
    return true
  }

  const approveTerminology = (terminologyId: string, operator: string, operatorRole: 'project_manager' | 'translator' | 'reviewer', remark: string) => {
    const terminology = getTerminologyById(terminologyId)
    if (!terminology) return

    terminology.status = 'approved'
    addHistoryRecord(terminologyId, '确认术语', operator, operatorRole, remark)

    const assignmentStore = useAssignmentStore()
    const assignment = assignmentStore.getAssignmentById(terminology.assignmentId)
    if (assignment) {
      assignmentStore.addHistoryRecord(
        assignment.id,
        '术语确认',
        operator,
        operatorRole,
        `确认术语：${terminology.sourceTerm} -> ${terminology.targetTerm}`
      )
    }
  }

  const rejectTerminology = (terminologyId: string, operator: string, operatorRole: 'project_manager' | 'translator' | 'reviewer', reason: string) => {
    if (operatorRole !== 'reviewer') return false
    
    const terminology = getTerminologyById(terminologyId)
    if (!terminology || terminology.status !== 'pending') return false

    terminology.status = 'rejected'
    addHistoryRecord(terminologyId, '驳回术语', operator, operatorRole, `驳回：${reason}`)

    const assignmentStore = useAssignmentStore()
    const assignment = assignmentStore.getAssignmentById(terminology.assignmentId)
    if (assignment) {
      assignmentStore.addHistoryRecord(
        assignment.id,
        '术语驳回',
        operator,
        operatorRole,
        `驳回术语：${terminology.sourceTerm}，原因：${reason}`
      )
    }
  }

  return {
    terminologies,
    getTerminologyById,
    getTerminologiesByAssignment,
    getTerminologiesByStatus,
    createTerminology,
    updateTerminology,
    approveTerminology,
    rejectTerminology,
  }
}, {
  persist: true,
})