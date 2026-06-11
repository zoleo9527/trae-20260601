import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.error('API Error:', err)
    return Promise.reject(err)
  }
)

export interface User { id: number; username: string; name: string; role: string; floor?: string; brand?: string }

export interface ChangeLog {
  id: number; allocation_id: number; field_name: string; old_value?: string; new_value?: string
  change_reason?: string; operated_by: number; operator_name?: string; operated_at: string
}

export interface Review {
  id: number; allocation_id: number; review_no: string; actual_quantity?: number
  review_status: string; difference_reason?: string; has_allocation_modified: boolean
  modification_acknowledged: boolean; reviewed_by: number; reviewer_name?: string
  reviewed_at?: string; created_at: string; updated_at: string
}

export interface Verification {
  id: number; allocation_id: number; verification_no: string
  conclusion: string; responsibility: string; processing_remark?: string
  verified_by: number; verifier_name?: string; verified_at: string
  created_at: string; updated_at: string
}

export interface Allocation {
  id: number; allocation_no: string; idempotent_key: string
  from_counter: string; to_counter: string; brand: string; floor: string
  goods_code: string; goods_name: string; sku?: string; quantity: number; unit: string
  status: string; remark?: string; history_remark?: string
  version: number; is_modified: boolean; last_modified_at?: string
  created_by: number; updated_by?: number; creator_name?: string; updater_name?: string
  created_at: string; updated_at: string
  change_logs: ChangeLog[]; reviews: Review[]; verifications: Verification[]
}

export interface TimelineItem {
  allocation_id: number; allocation_no: string; goods_name: string; goods_code: string
  expected_quantity: number; actual_quantity?: number
  allocation_status: string; review_status: string
  is_modified: boolean; has_allocation_modified: boolean; modification_acknowledged: boolean
  last_modified_at?: string; modified_by?: string; change_count: number
  created_at: string; reviewed_at?: string
  verification_conclusion?: string; verification_responsibility?: string
  verified_by_name?: string; verified_at?: string
}

export const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待楼层审批', type: 'info' },
  modified: { label: '已修改待审批', type: 'warning' },
  approved: { label: '待品牌发货', type: 'primary' },
  shipped: { label: '已发货待复核', type: 'success' },
  reviewed: { label: '已复核完成', type: 'success' },
  disputed: { label: '有差异待核实', type: 'danger' },
  verified: { label: '差异已核实', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
}

export const reviewStatusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待复核', type: 'info' },
  reviewed: { label: '复核一致', type: 'success' },
  disputed: { label: '数量差异', type: 'danger' },
}

export const conclusionMap: Record<string, { label: string; type: string; color: string }> = {
  sender_short: { label: '发货方少装', type: 'danger', color: '#991b1b' },
  receiver_false: { label: '收货方误报', type: 'warning', color: '#92400e' },
}

export default {
  getUsers: () => api.get<any, User[]>('/users'),
  listAllocations: (params?: any) => api.get<any, any>('/allocations', { params }),
  getAllocation: (id: number) => api.get<any, any>(`/allocations/${id}`),
  createAllocation: (data: any, creatorId: number) => api.post<any, any>('/allocations', data, { params: { creator_id: creatorId } }),
  updateAllocation: (id: number, data: any, operatorId: number) => api.put<any, any>(`/allocations/${id}`, data, { params: { operator_id: operatorId } }),
  approveAllocation: (id: number, approverId: number) => api.post<any, any>(`/allocations/${id}/approve`, null, { params: { approver_id: approverId } }),
  listPendingReviews: (params?: any) => api.get<any, any>('/reviews/pending', { params }),
  getReviewTimeline: (params?: any) => api.get<any, any>('/reviews/timeline', { params }),
  getReview: (id: number) => api.get<any, any>(`/reviews/${id}`),
  createReview: (data: any, reviewerId: number) => api.post<any, any>('/reviews', data, { params: { reviewer_id: reviewerId } }),
  createDisputeVerification: (data: any, verifierId: number) => api.post<any, any>('/dispute-verifications', data, { params: { verifier_id: verifierId } }),
  getDisputeVerification: (allocationId: number) => api.get<any, any>(`/dispute-verifications/${allocationId}`),
}
