const STATUS_MAP = {
  pending: { label: '待受理', type: 'info' },
  accepted: { label: '已受理', type: 'primary' },
  dispatched: { label: '已派单', type: 'warning' },
  in_progress: { label: '施工中', type: 'primary' },
  completed: { label: '已完工', type: 'success' },
  closed: { label: '已关闭', type: 'info' },
  verified: { label: '已验证', type: 'success' },
}

const URGENCY_MAP = {
  normal: { label: '普通', type: 'info' },
  urgent: { label: '紧急', type: 'warning' },
  emergency: { label: '特急', type: 'danger' },
}

const SCENE_TAG_MAP = {
  activity_occupation: { label: '活动占道', type: 'warning', color: '' },
  tenant_timeout: { label: '租户超时', type: 'danger', color: '' },
  complaint_ambiguous: { label: '投诉归属不清', type: '', color: '#9B59B6' },
}

export function getStatusTag(status) {
  return STATUS_MAP[status] || { label: status, type: 'info' }
}

export function getUrgencyTag(urgency) {
  return URGENCY_MAP[urgency] || { label: urgency, type: 'info' }
}

export function getSceneTag(scene) {
  return SCENE_TAG_MAP[scene] || { label: scene, type: 'info', color: '' }
}

export function formatDateTime(dtStr) {
  if (!dtStr) return '-'
  const d = new Date(dtStr)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function computeSlaRemaining(slaDeadline) {
  if (!slaDeadline) return null
  const diff = new Date(slaDeadline).getTime() - Date.now()
  if (diff <= 0) return { text: '已超时', overdue: true, hours: 0 }
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours < 4) return { text: `${hours}时${mins}分`, overdue: false, warning: true, hours }
  return { text: `${hours}时${mins}分`, overdue: false, warning: false, hours }
}

export const STATUS_LIST = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待受理' },
  { value: 'accepted', label: '已受理' },
  { value: 'dispatched', label: '已派单' },
  { value: 'in_progress', label: '施工中' },
  { value: 'completed', label: '已完工' },
  { value: 'closed', label: '已关闭' },
  { value: 'verified', label: '已验证' },
]

export const URGENCY_LIST = [
  { value: '', label: '全部紧急程度' },
  { value: 'normal', label: '普通' },
  { value: 'urgent', label: '紧急' },
  { value: 'emergency', label: '特急' },
]

export const WORK_TYPE_LIST = [
  { value: '', label: '全部工种' },
  { value: '电气', label: '电气' },
  { value: '水管', label: '水管' },
  { value: '空调', label: '空调' },
  { value: '装修', label: '装修' },
  { value: '综合', label: '综合' },
]

export const WORK_TYPE_MAP = {
  '电气': '电气',
  '水管': '水管',
  '空调': '空调',
  '装修': '装修',
  '综合': '综合',
  electrical: '电气',
  plumbing: '水管',
  hvac: '空调',
  carpentry: '装修',
  general: '综合',
}

export const SOURCE_MAP = {
  operation: '营运专员',
  service_desk: '客服台',
  tenant: '租户',
  patrol: '巡检',
}
