export type ContractStatus = 'draft' | 'pending_review' | 'approved' | 'returned' | 'in_archive' | 'closed'
export type ArchiveStatus = 'pending' | 'processing' | 'returned' | 'completed' | 'closed'
export type Role = 'doctor' | 'nurse' | 'public_health'
export type NoteSource = 'contract' | 'archive' | 'return'
export type NotificationType = 'contract_changed' | 'contract_returned' | 'archive_return' | 'archive_completed'

export interface Contract {
  id: string
  resident_name: string
  resident_id_card: string
  resident_phone: string
  contract_no: string
  contract_type: string
  service_package: string
  period_start: string
  period_end: string
  team_doctor: string
  team_nurse: string
  status: ContractStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface ContractDetail extends Contract {
  notes: Note[]
  change_logs: ChangeLog[]
}

export interface Archive {
  id: string
  contract_id: string
  archive_no: string
  status: ArchiveStatus
  processed_by: string | null
  return_reason: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  resident_name?: string
  contract_no?: string
}

export interface ArchiveDetail extends Archive {
  contract_type?: string
  service_package?: string
  period_start?: string
  period_end?: string
  team_doctor?: string
  team_nurse?: string
  contract_status?: ContractStatus
  notes: Note[]
  change_logs: ChangeLog[]
  notifications: AppNotification[]
}

export interface Note {
  id: string
  contract_id: string
  archive_id: string | null
  content: string
  source: NoteSource
  created_by: string
  created_by_role: Role
  created_at: string
}

export interface ChangeLog {
  id: string
  contract_id: string
  field: string
  old_value: string | null
  new_value: string | null
  changed_by: string
  changed_by_role: Role
  created_at: string
}

export interface AppNotification {
  id: string
  contract_id: string
  archive_id: string | null
  type: NotificationType
  title: string
  summary: string
  is_read: number
  target_role: Role
  created_at: string
  resident_name?: string
  contract_no?: string
  archive_no?: string
}

export interface RecentItem {
  id: string
  user_id: string
  item_type: string
  item_id: string
  accessed_at: string
  resident_name?: string
  contract_no?: string
  status?: string
}

export interface DashboardData {
  todoCount: Record<string, number>
  recentNotifications: AppNotification[]
  stats: {
    totalContracts: number
    totalArchives: number
    completionRate: number
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export const ROLE_LABELS: Record<Role, string> = {
  doctor: '全科医生',
  nurse: '护士',
  public_health: '公共卫生专员',
}

export const ROLE_USERS: Record<Role, { name: string; id: string }[]> = {
  doctor: [
    { name: '李明华', id: '李明华' },
    { name: '赵国栋', id: '赵国栋' },
  ],
  nurse: [
    { name: '王秀芳', id: '王秀芳' },
    { name: '陈晓燕', id: '陈晓燕' },
  ],
  public_health: [
    { name: '公共卫生科张主任', id: '公共卫生科张主任' },
    { name: '公共卫生科李科员', id: '公共卫生科李科员' },
  ],
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: '草稿',
  pending_review: '待审核',
  approved: '已通过',
  returned: '已退回',
  in_archive: '建档中',
  closed: '已关闭',
}

export const ARCHIVE_STATUS_LABELS: Record<ArchiveStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  returned: '已退回',
  completed: '已完成',
  closed: '已关闭',
}

export const FIELD_LABELS: Record<string, string> = {
  resident_name: '居民姓名',
  resident_id_card: '身份证号',
  resident_phone: '联系电话',
  contract_type: '签约类型',
  service_package: '服务包',
  period_start: '起始日期',
  period_end: '截止日期',
  team_doctor: '全科医生',
  team_nurse: '护士',
}
