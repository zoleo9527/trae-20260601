import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Complaint,
  ComplaintStatus,
  TenantVisit,
  ExceptionNote,
  KeyJudgement,
  StatusChangeLog,
  ResponsibilityParty,
  VisitResult
} from '@/types/complaint'
import { mockComplaints } from '@/mock/complaintData'
import dayjs from 'dayjs'

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

export const useComplaintStore = defineStore('complaint', () => {
  const complaints = ref<Complaint[]>(JSON.parse(JSON.stringify(mockComplaints)))
  const selectedComplaintId = ref<string | null>(null)
  const currentUser = ref({ name: '周雨晴', role: '租户关系专员' })

  const selectedComplaint = computed(() => {
    return complaints.value.find(c => c.id === selectedComplaintId.value) || null
  })

  const pendingList = computed(() => {
    return complaints.value.filter(c => !['closed'].includes(c.status))
  })

  const pendingCount = computed(() => pendingList.value.length)

  const overdueCount = computed(() =>
    complaints.value.filter(c => c.slaLevel === 'overdue' && c.status !== 'closed').length
  )

  const judgingCount = computed(() =>
    complaints.value.filter(c => c.status === 'judging').length
  )

  const visitingCount = computed(() =>
    complaints.value.filter(c => c.status === 'visiting').length
  )

  const todayRegisteredCount = computed(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return complaints.value.filter(c => dayjs(c.registeredAt).format('YYYY-MM-DD') === today).length
  })

  const categoryStats = computed(() => {
    const stats: Record<string, number> = {}
    complaints.value.forEach(c => {
      stats[c.category] = (stats[c.category] || 0) + 1
    })
    return stats
  })

  function selectComplaint(id: string | null) {
    selectedComplaintId.value = id
  }

  function updateComplaintStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    remark: string
  ) {
    const complaint = complaints.value.find(c => c.id === complaintId)
    if (!complaint) return

    const oldStatus = complaint.status
    complaint.status = newStatus
    complaint.statusHistory.push({
      id: uid('sh'),
      fromStatus: oldStatus,
      toStatus: newStatus,
      operator: currentUser.value.name,
      operatorRole: currentUser.value.role,
      remark,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
  }

  function updateResponsibility(
    complaintId: string,
    party: ResponsibilityParty,
    detail: string,
    judgementContent: string
  ) {
    const complaint = complaints.value.find(c => c.id === complaintId)
    if (!complaint) return

    complaint.responsibilityParty = party
    complaint.responsibilityPartyDetail = detail
    complaint.keyJudgements.push({
      id: uid('kj'),
      content: judgementContent,
      operator: currentUser.value.name,
      operatorRole: currentUser.value.role,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      type: 'responsibility'
    })
  }

  function assignHandler(
    complaintId: string,
    handler: string,
    handlerRole: string,
    remark: string
  ) {
    const complaint = complaints.value.find(c => c.id === complaintId)
    if (!complaint) return

    complaint.currentHandler = handler
    complaint.currentHandlerRole = handlerRole
    complaint.assignedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')

    if (complaint.status === 'judging') {
      updateComplaintStatus(complaintId, 'assigned', remark)
    }
  }

  function addKeyJudgement(
    complaintId: string,
    content: string,
    type: KeyJudgement['type'] = 'other'
  ) {
    const complaint = complaints.value.find(c => c.id === complaintId)
    if (!complaint) return

    complaint.keyJudgements.push({
      id: uid('kj'),
      content,
      operator: currentUser.value.name,
      operatorRole: currentUser.value.role,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      type
    })
  }

  function addExceptionNote(
    complaintId: string,
    type: ExceptionNote['type'],
    title: string,
    content: string
  ) {
    const complaint = complaints.value.find(c => c.id === complaintId)
    if (!complaint) return

    complaint.exceptionNotes.push({
      id: uid('en'),
      complaintId,
      type,
      title,
      content,
      operator: currentUser.value.name,
      operatorRole: currentUser.value.role,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
  }

  function createTenantVisit(
    complaintId: string,
    tenantContact: string,
    tenantPhone: string,
    tenantName: string,
    shopCode: string
  ) {
    const complaint = complaints.value.find(c => c.id === complaintId)
    if (!complaint) return null

    const visit: TenantVisit = {
      id: uid('tv'),
      complaintId,
      visitTime: null,
      visitor: currentUser.value.name,
      visitorRole: currentUser.value.role,
      tenantContact,
      tenantPhone,
      tenantName,
      shopCode,
      result: 'pending',
      feedback: '',
      improvementItems: [],
      nextFollowUp: null,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }

    complaint.tenantVisits.push(visit)
    if (complaint.status !== 'visiting') {
      updateComplaintStatus(complaintId, 'visiting', '创建租户回访任务，进入回访阶段')
    }
    return visit
  }

  function submitTenantVisit(
    complaintId: string,
    visitId: string,
    result: VisitResult,
    feedback: string,
    improvementItems: string[],
    nextFollowUp: string | null
  ) {
    const complaint = complaints.value.find(c => c.id === complaintId)
    if (!complaint) return

    const visit = complaint.tenantVisits.find(v => v.id === visitId)
    if (!visit) return

    visit.result = result
    visit.feedback = feedback
    visit.improvementItems = improvementItems
    visit.nextFollowUp = nextFollowUp
    visit.visitTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    visit.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')

    if (result === 'satisfied' || result === 'basically_satisfied') {
      updateComplaintStatus(complaintId, 'completed', `回访完成：${result === 'satisfied' ? '满意' : '基本满意'}`)
    } else if (result === 'dissatisfied') {
      addExceptionNote(
        complaintId,
        'tenant_refusal',
        '回访不满意',
        `租户/顾客对处理结果不满意，反馈如下：${feedback}`
      )
      updateComplaintStatus(complaintId, 'processing', '回访不满意，需重新处理')
    }
  }

  function completeProcessing(complaintId: string, remark: string) {
    updateComplaintStatus(complaintId, 'visiting', remark)
  }

  function closeComplaint(complaintId: string, closingRemark: string) {
    const complaint = complaints.value.find(c => c.id === complaintId)
    if (!complaint) return

    complaint.closingRemark = closingRemark
    complaint.closedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    complaint.closedBy = currentUser.value.name
    updateComplaintStatus(complaintId, 'closed', closingRemark)
  }

  function refreshSlaLevel() {
    const now = dayjs()
    complaints.value.forEach(c => {
      if (c.status === 'closed') return
      const deadline = dayjs(c.slaDeadline)
      const diffHours = deadline.diff(now, 'hour')
      const diffMinutes = deadline.diff(now, 'minute')
      if (diffMinutes < 0) {
        c.slaLevel = 'overdue'
      } else if (diffHours < 2) {
        c.slaLevel = 'warning'
      } else {
        c.slaLevel = 'normal'
      }
    })
  }

  function reorderToVisiting(complaintId: string) {
    updateComplaintStatus(complaintId, 'visiting', '转为回访阶段')
  }

  return {
    complaints,
    selectedComplaintId,
    selectedComplaint,
    pendingList,
    pendingCount,
    overdueCount,
    judgingCount,
    visitingCount,
    todayRegisteredCount,
    categoryStats,
    currentUser,
    selectComplaint,
    updateComplaintStatus,
    updateResponsibility,
    assignHandler,
    addKeyJudgement,
    addExceptionNote,
    createTenantVisit,
    submitTenantVisit,
    completeProcessing,
    closeComplaint,
    refreshSlaLevel,
    reorderToVisiting
  }
})
