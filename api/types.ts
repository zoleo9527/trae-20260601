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

export interface ComplaintLog {
  id: number
  complaintId: number
  action: 'created' | 'processed' | 'resolved'
  operator: string
  remark: string
  createdAt: string
}
