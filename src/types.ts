export type ApplicationStatus = 'pending' | 'processing' | 'returned' | 'supplemented' | 'closed'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ComplaintStatus = 'open' | 'processing' | 'resolved'

export interface Tenant {
  id: number
  name: string
  shopNo: string
  contact: string
  phone: string
  category: string
}

export interface ActivityApplication {
  id: number
  tenantId: number
  activityName: string
  activityDate: string
  venueName: string
  description: string
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
  approvalId: number | null
  tenantName?: string
  tenantShopNo?: string
  logs?: ApplicationLog[]
  complaints?: Complaint[]
}

export interface VenueApproval {
  id: number
  applicationId: number
  venueName: string
  status: ApprovalStatus
  createdAt: string
  updatedAt: string
  applicationName?: string
  tenantName?: string
  activityDate?: string
  description?: string
  shopNo?: string
  contact?: string
  phone?: string
  category?: string
  logs?: ApprovalLog[]
  complaints?: Complaint[]
}

export interface ApplicationLog {
  id: number
  applicationId: number
  action: 'created' | 'processed' | 'returned' | 'supplemented' | 'closed'
  operator: string
  remark: string
  handover: string
  createdAt: string
}

export interface ApprovalLog {
  id: number
  approvalId: number
  action: 'created' | 'approved' | 'rejected' | 'supplemented'
  operator: string
  remark: string
  handover: string
  createdAt: string
}

export interface Complaint {
  id: number
  tenantId: number
  title: string
  content: string
  category: string
  status: ComplaintStatus
  result: string
  createdAt: string
  updatedAt: string
  tenantName?: string
  tenantShopNo?: string
  latestLogs?: ComplaintLog[]
}

export interface ComplaintLog {
  id: number
  complaintId: number
  action: 'created' | 'processed' | 'resolved'
  operator: string
  remark: string
  createdAt: string
}

export const APPLICATION_STATUS_MAP: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  processing: { label: '处理中', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  returned: { label: '已退回', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  supplemented: { label: '已补充', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  closed: { label: '已关闭', color: 'text-zinc-500', bg: 'bg-zinc-50 border-zinc-200' },
}

export const APPROVAL_STATUS_MAP: Record<ApprovalStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待审批', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  approved: { label: '已通过', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  rejected: { label: '已退回', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

export const COMPLAINT_STATUS_MAP: Record<ComplaintStatus, { label: string; color: string; bg: string }> = {
  open: { label: '待处理', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  processing: { label: '处理中', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  resolved: { label: '已解决', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
}

export const ACTION_LABEL_MAP: Record<string, string> = {
  created: '创建',
  processed: '受理',
  returned: '退回',
  supplemented: '补充',
  closed: '关闭',
  approved: '通过',
  rejected: '退回',
}

export const VENUE_LIST = [
  '中庭广场',
  '一楼大厅',
  '二楼连廊',
  '南门广场',
  '北门广场',
  '地下停车场入口',
  '三楼活动区',
]
