export interface Registration {
  id: string
  event_name: string
  team_name: string
  player_count: number
  device_requirement: string
  status: 'pending' | 'confirmed' | 'seating' | 'completed' | 'rejected' | 'escalated'
  submitted_by: string
  confirmed_by: string | null
  submitted_at: string
  confirmed_at: string | null
  deadline_at: string
  current_owner_role: Role
  owner_since: string
  sla_minutes: number
  handover_logs?: HandoverLog[]
  attachments?: Attachment[]
  seat_allocation?: SeatAllocation
  all_allocations?: SeatAllocation[]
  available_seats?: SeatAvailability
}

export interface Seat {
  id: string
  seat_number: string
  zone: string
  status: 'available' | 'occupied' | 'reserved' | 'maintenance'
  current_registration_id: string | null
}

export interface SeatAllocation {
  id: string
  registration_id: string
  seat_ids: string
  allocated_by: string
  confirmed_by: string | null
  allocated_at: string
  confirmed_at: string | null
  status: 'pending' | 'confirmed' | 'released'
  conflict_reason: string | null
  registration?: Registration
  seat_details?: Seat[]
}

export interface HandoverLog {
  id: string
  registration_id: string
  operator_role: string
  operator_name: string
  action: string
  note_type: 'normal' | 'urgent' | 'dispute' | 'supplement' | 'arbitration' | 'reminder'
  note: string
  created_at: string
  from_role: string | null
  to_role: string | null
}

export interface Attachment {
  id: string
  registration_id: string
  file_name: string
  file_size: string
  description: string | null
  category: string | null
  status: 'placeholder' | 'uploaded'
  uploaded_at: string | null
  uploaded_by: string | null
}

export type Role = '网管' | '赛事运营' | '店长'

export interface SeatAvailability {
  total_available: number
  by_zone: Record<string, number>
  total_needed: number
  gap: number
}

export interface DashboardStats {
  pending: number
  overdue: number
  conflicts: number
  my_pending: number
  escalated: number
}

export const STATUS_LABELS: Record<Registration['status'], string> = {
  pending: '待处理',
  confirmed: '已确认',
  seating: '分配中',
  completed: '已完成',
  rejected: '已驳回',
  escalated: '已升级',
}

export const STATUS_COLORS: Record<Registration['status'], string> = {
  pending: '#FFCC00',
  confirmed: '#00FF88',
  seating: '#5AC8FA',
  completed: '#34C759',
  rejected: '#FF3B30',
  escalated: '#FF9500',
}

export const NOTE_TYPE_LABELS: Record<HandoverLog['note_type'], string> = {
  normal: '正常',
  urgent: '紧急',
  dispute: '争议',
  supplement: '补充',
  arbitration: '仲裁',
  reminder: '催办',
}

export const NOTE_TYPE_COLORS: Record<HandoverLog['note_type'], string> = {
  normal: '#8B949E',
  urgent: '#FF3B30',
  dispute: '#FF9500',
  supplement: '#5AC8FA',
  arbitration: '#BF5AF2',
  reminder: '#30D158',
}

export const ROLE_LABELS: Record<Role, string> = {
  '网管': '网管',
  '赛事运营': '赛事运营',
  '店长': '店长',
}

export const ROLE_COLORS: Record<Role, string> = {
  '网管': '#00FF88',
  '赛事运营': '#FFCC00',
  '店长': '#FF3B30',
}

export const OWNER_FLOW: Record<string, Role | null> = {
  'pending': '赛事运营',
  'confirmed': '网管',
  'seating': '店长',
  'completed': null,
  'rejected': null,
  'escalated': '店长',
}

export const SLA_DEFAULTS: Record<string, number> = {
  'pending': 15,
  'confirmed': 15,
  'seating': 10,
  'escalated': 10,
}

export function getUrgencyLevel(reg: Registration): 'overdue' | 'critical' | 'warning' | 'normal' {
  const now = new Date().getTime()
  const deadline = new Date(reg.deadline_at).getTime()
  const slaDeadline = new Date(reg.owner_since).getTime() + reg.sla_minutes * 60 * 1000

  if (deadline < now && reg.status !== 'completed' && reg.status !== 'rejected') return 'overdue'
  if (slaDeadline < now) return 'critical'
  if (deadline - now < 10 * 60 * 1000) return 'warning'
  return 'normal'
}

export function urgencySortWeight(reg: Registration): number {
  const level = getUrgencyLevel(reg)
  switch (level) {
    case 'overdue': return 0
    case 'critical': return 1
    case 'warning': return 2
    default: return 3
  }
}
