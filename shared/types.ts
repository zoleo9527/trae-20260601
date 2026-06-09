export type Role = 'station_cs' | 'courier' | 'station_manager'

export type DeliveryStatus = 'pending' | 'delivering' | 'delivered' | 'problem' | 'returned'

export type ProblemType = 'damaged' | 'lost' | 'wrong_address' | 'refused' | 'overweight' | 'expired' | 'other'

export type ProblemStatus = 'pending' | 'contacting' | 'resolved' | 'returned' | 'supplementing' | 'reviewing' | 'closed'

export type ContactType = 'phone' | 'sms' | 'wechat' | 'in_person'

export type NotificationType = 'problem_created' | 'problem_updated' | 'contact_required' | 'review_required' | 'return_confirmed' | 'exception' | 'responsible_change'

export interface Delivery {
  id: string
  trackingNumber: string
  recipientName: string
  recipientPhone: string
  deliveryAddress: string
  stationId: string
  courierId: string
  courierName: string
  status: DeliveryStatus
  stationSignImage: string | null
  createdAt: string
  updatedAt: string
}

export interface ProblemRecord {
  id: string
  deliveryId: string
  trackingNumber: string
  problemType: ProblemType
  description: string
  reporterId: string
  reporterName: string
  reporterRole: Role
  responsiblePersonId: string
  responsiblePersonName: string
  status: ProblemStatus
  resolution: string | null
  createdAt: string
  updatedAt: string
}

export interface CustomerContact {
  id: string
  problemRecordId: string
  trackingNumber: string
  contactType: ContactType
  contactPersonId: string
  contactPersonName: string
  contactPersonRole: Role
  customerResponse: string
  followUpRequired: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

export interface ProblemHistory {
  id: string
  problemRecordId: string
  action: string
  operatorId: string
  operatorName: string
  operatorRole: Role
  description: string
  createdAt: string
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  content: string
  sourceType: string
  sourceId: string
  isRead: boolean
  createdAt: string
}

export interface ProblemDetail extends ProblemRecord {
  contacts: CustomerContact[]
  history: ProblemHistory[]
  delivery: Delivery | null
}

export const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  damaged: '破损',
  lost: '丢失',
  wrong_address: '地址错误',
  refused: '拒收',
  overweight: '超重',
  expired: '滞留',
  other: '其他',
}

export const PROBLEM_STATUS_LABELS: Record<ProblemStatus, string> = {
  pending: '待处理',
  contacting: '联系中',
  resolved: '已解决',
  returned: '已退回',
  supplementing: '补录中',
  reviewing: '复核中',
  closed: '已关闭',
}

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: '待派送',
  delivering: '派送中',
  delivered: '已签收',
  problem: '问题件',
  returned: '已退回',
}

export const ROLE_LABELS: Record<Role, string> = {
  station_cs: '网点客服',
  courier: '派件员',
  station_manager: '驿站负责人',
}

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  phone: '电话',
  sms: '短信',
  wechat: '微信',
  in_person: '上门',
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  problem_created: '问题件登记',
  problem_updated: '问题件变更',
  contact_required: '待联系客户',
  review_required: '待复核',
  return_confirmed: '退回确认',
  exception: '异常提醒',
  responsible_change: '责任人变更',
}
