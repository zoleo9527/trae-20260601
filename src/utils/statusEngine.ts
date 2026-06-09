import type { FollowUp, FollowUpStatus, Role, StatusLog } from '@/types'
import { ROLE_LABELS } from '@/types'

const ROLE_NAMES: Record<Role, string> = {
  doctor: '陈医生',
  nurse: '林护士',
  ph_specialist: '杨专员',
}

interface TransitionResult {
  newStatus: FollowUpStatus
  newAssigneeRole: Role
  newAssigneeName: string
  statusLog: StatusLog
}

function makeLog(
  followUpId: string,
  fromStatus: FollowUpStatus | null,
  toStatus: FollowUpStatus,
  operatorRole: Role,
  remark: string
): StatusLog {
  return {
    id: `sl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    followUpId,
    fromStatus,
    toStatus,
    operatorRole,
    operatorName: ROLE_NAMES[operatorRole],
    operatedAt: new Date().toISOString(),
    remark,
  }
}

export function transitionFollowUp(
  followUp: FollowUp,
  targetStatus: FollowUpStatus,
  operatorRole: Role,
  remark: string
): TransitionResult | null {
  const { status, id } = followUp

  if (targetStatus === status) return null

  const transitions: Record<FollowUpStatus, FollowUpStatus[]> = {
    pending: ['in_progress', 'warned'],
    in_progress: ['pending_review', 'pending', 'warned'],
    pending_review: ['completed', 'warned', 'in_progress'],
    completed: [],
    warned: ['in_progress', 'confirmed'],
    confirmed: [],
  }

  if (!transitions[status].includes(targetStatus)) return null

  let newAssigneeRole: Role = followUp.assigneeRole
  let newAssigneeName: string = followUp.assigneeName
  let actualRemark = remark

  switch (targetStatus) {
    case 'in_progress':
      newAssigneeRole = 'nurse'
      newAssigneeName = ROLE_NAMES.nurse
      if (status === 'pending') actualRemark = remark || '开始执行随访'
      if (status === 'warned' || status === 'pending_review') actualRemark = remark || '退回重新执行随访'
      break
    case 'pending_review':
      newAssigneeRole = 'doctor'
      newAssigneeName = ROLE_NAMES.doctor
      actualRemark = remark || '指标录入完成，提交审核'
      break
    case 'completed':
      newAssigneeRole = 'doctor'
      newAssigneeName = ROLE_NAMES.doctor
      actualRemark = remark || '审核通过，指标正常'
      break
    case 'warned':
      newAssigneeRole = 'ph_specialist'
      newAssigneeName = ROLE_NAMES.ph_specialist
      actualRemark = remark || '审核发现异常指标，转出预警'
      break
    case 'pending':
      newAssigneeRole = 'nurse'
      newAssigneeName = ROLE_NAMES.nurse
      actualRemark = remark || '退回待随访'
      break
    case 'confirmed':
      newAssigneeRole = 'doctor'
      newAssigneeName = ROLE_NAMES.doctor
      actualRemark = remark || '预警已处理，随访闭环完成'
      break
  }

  const statusLog = makeLog(id, status, targetStatus, operatorRole, actualRemark)

  return {
    newStatus: targetStatus,
    newAssigneeRole,
    newAssigneeName,
    statusLog,
  }
}

export function getAvailableActions(
  status: FollowUpStatus,
  role: Role
): { label: string; targetStatus: FollowUpStatus; variant: 'primary' | 'secondary' | 'danger' }[] {
  const actions: { label: string; targetStatus: FollowUpStatus; variant: 'primary' | 'secondary' | 'danger' }[] = []

  switch (status) {
    case 'pending':
      if (role === 'nurse' || role === 'doctor') {
        actions.push({ label: '开始随访', targetStatus: 'in_progress', variant: 'primary' })
      }
      break
    case 'in_progress':
      if (role === 'nurse' || role === 'doctor') {
        actions.push({ label: '提交审核', targetStatus: 'pending_review', variant: 'primary' })
      }
      break
    case 'pending_review':
      if (role === 'doctor') {
        actions.push({ label: '审核通过', targetStatus: 'completed', variant: 'primary' })
        actions.push({ label: '转预警', targetStatus: 'warned', variant: 'danger' })
        actions.push({ label: '退回', targetStatus: 'in_progress', variant: 'secondary' })
      }
      break
    case 'warned':
      if (role === 'ph_specialist' || role === 'doctor') {
        actions.push({ label: '确认闭环', targetStatus: 'confirmed', variant: 'primary' })
        actions.push({ label: '退回随访', targetStatus: 'in_progress', variant: 'secondary' })
      }
      break
  }

  return actions
}

export function getStatusColor(status: FollowUpStatus): string {
  const colors: Record<FollowUpStatus, string> = {
    pending: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    pending_review: 'bg-amber-500',
    completed: 'bg-emerald-500',
    warned: 'bg-red-500',
    confirmed: 'bg-teal-500',
  }
  return colors[status]
}

export function getStatusBgColor(status: FollowUpStatus): string {
  const colors: Record<FollowUpStatus, string> = {
    pending: 'bg-gray-50 border-gray-200',
    in_progress: 'bg-blue-50 border-blue-200',
    pending_review: 'bg-amber-50 border-amber-200',
    completed: 'bg-emerald-50 border-emerald-200',
    warned: 'bg-red-50 border-red-200',
    confirmed: 'bg-teal-50 border-teal-200',
  }
  return colors[status]
}

export function formatTimeAgo(isoString: string): string {
  const now = new Date()
  const then = new Date(isoString)
  const diffMs = now.getTime() - then.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return '刚刚'
  if (diffHours < 24) return `${diffHours}小时前`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}天前`
}

export function getDeadlineInfo(createdAt: string, deadlineHours: number, status: FollowUpStatus): { text: string; urgent: boolean } {
  if (status === 'completed' || status === 'warned' || status === 'confirmed') return { text: '', urgent: false }
  const now = new Date()
  const created = new Date(createdAt)
  const deadline = new Date(created.getTime() + deadlineHours * 60 * 60 * 1000)
  const remaining = deadline.getTime() - now.getTime()
  if (remaining <= 0) return { text: '已超时', urgent: true }
  const remainingHours = Math.floor(remaining / (1000 * 60 * 60))
  if (remainingHours < 6) return { text: `剩余${remainingHours}小时`, urgent: true }
  return { text: `剩余${remainingHours}小时`, urgent: false }
}

export { ROLE_NAMES }
