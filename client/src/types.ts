export type Role = 'supervisor' | 'cleaner' | 'engineer'

export interface Staff {
  id: string
  name: string
  role: Role
}

export type ItemCategory = '贵重物品' | '普通物品' | '危险品'
export type ItemStatus = 'registered' | 'claimed' | 'returned' | 'disputed' | 'disposed' | 'expired'

export interface LostItem {
  id: string
  room_number: string
  item_name: string
  item_description: string
  category: ItemCategory
  found_by: string
  found_by_role: Role
  found_at: string
  location_detail: string
  storage_location: string
  status: ItemStatus

  claimant_name: string | null
  claimant_id_type: string | null
  claimant_id_number: string | null
  contact_phone: string | null
  claim_at: string | null
  verified_by: string | null

  return_reason: string | null
  supplementary_notes: string | null
  handled_by: string | null
  handled_at: string | null

  exception_type: string | null
  exception_note: string | null

  created_at: string
  updated_at: string
}

export interface TodoItem {
  type: string
  label: string
  count: number
}

export const ROLE_LABELS: Record<Role, string> = {
  supervisor: '客房主管',
  cleaner: '保洁员',
  engineer: '工程师',
}

export const STATUS_LABELS: Record<ItemStatus, string> = {
  registered: '已登记',
  claimed: '已认领',
  returned: '已退回',
  disputed: '争议中',
  disposed: '已处置',
  expired: '已过期',
}

export const CATEGORY_OPTIONS: ItemCategory[] = ['贵重物品', '普通物品', '危险品']
export const ID_TYPE_OPTIONS = ['身份证', '护照', '驾驶证', '其他']
export const EXCEPTION_TYPE_OPTIONS = ['查房漏项', '布草亏损', '客人争议', '其他异常']
