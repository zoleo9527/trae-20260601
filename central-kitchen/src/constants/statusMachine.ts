import type {
  MealOrderStatus,
  ShortageStatus,
  Role,
  RolePermission,
} from '@/types'

export const MEAL_ORDER_STATUS_LABELS: Record<MealOrderStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  production_review: '生产审核中',
  production_approved: '生产已确认',
  production_rejected: '生产已驳回',
  distributed: '已配送',
  received: '门店已签收',
  shortage_reported: '已报缺货',
}

export const MEAL_ORDER_STATUS_COLORS: Record<MealOrderStatus, string> = {
  draft: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  submitted: 'bg-blue-50 text-blue-600 border-blue-200',
  production_review: 'bg-amber-50 text-amber-600 border-amber-200',
  production_approved: 'bg-green-50 text-green-600 border-green-200',
  production_rejected: 'bg-red-50 text-red-600 border-red-200',
  distributed: 'bg-purple-50 text-purple-600 border-purple-200',
  received: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  shortage_reported: 'bg-orange-50 text-orange-600 border-orange-200',
}

export const SHORTAGE_STATUS_LABELS: Record<ShortageStatus, string> = {
  pending_review: '待审核',
  supply_review: '采购审核中',
  supply_approved: '采购已确认',
  supply_rejected: '采购已驳回',
  replenishing: '补发中',
  replenished: '已补发',
  supervisor_review: '督导复核中',
  closed: '已关闭',
}

export const SHORTAGE_STATUS_COLORS: Record<ShortageStatus, string> = {
  pending_review: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  supply_review: 'bg-amber-50 text-amber-600 border-amber-200',
  supply_approved: 'bg-blue-50 text-blue-600 border-blue-200',
  supply_rejected: 'bg-red-50 text-red-600 border-red-200',
  replenishing: 'bg-purple-50 text-purple-600 border-purple-200',
  replenished: 'bg-green-50 text-green-600 border-green-200',
  supervisor_review: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  closed: 'bg-gray-50 text-gray-600 border-gray-200',
}

export interface StatusTransition {
  from: MealOrderStatus | ShortageStatus
  to: MealOrderStatus | ShortageStatus
  action: string
  allowedRoles: Role[]
  requiresRemark: boolean
  remarkLabel?: string
}

export const MEAL_ORDER_TRANSITIONS: StatusTransition[] = [
  {
    from: 'draft',
    to: 'submitted',
    action: '提交配餐单',
    allowedRoles: ['store_supervisor', 'production_leader'],
    requiresRemark: false,
  },
  {
    from: 'submitted',
    to: 'production_review',
    action: '进入生产审核',
    allowedRoles: ['production_leader'],
    requiresRemark: false,
  },
  {
    from: 'production_review',
    to: 'production_approved',
    action: '生产确认',
    allowedRoles: ['production_leader'],
    requiresRemark: false,
    remarkLabel: '生产备注',
  },
  {
    from: 'production_review',
    to: 'production_rejected',
    action: '生产驳回',
    allowedRoles: ['production_leader'],
    requiresRemark: true,
    remarkLabel: '驳回原因',
  },
  {
    from: 'production_rejected',
    to: 'submitted',
    action: '修改后重新提交',
    allowedRoles: ['store_supervisor', 'production_leader'],
    requiresRemark: true,
    remarkLabel: '修改说明',
  },
  {
    from: 'production_approved',
    to: 'distributed',
    action: '配送出库',
    allowedRoles: ['production_leader'],
    requiresRemark: false,
    remarkLabel: '配送备注',
  },
  {
    from: 'distributed',
    to: 'received',
    action: '门店签收',
    allowedRoles: ['store_supervisor'],
    requiresRemark: false,
  },
  {
    from: 'distributed',
    to: 'shortage_reported',
    action: '上报缺货',
    allowedRoles: ['store_supervisor'],
    requiresRemark: true,
    remarkLabel: '缺货说明',
  },
]

export const SHORTAGE_TRANSITIONS: StatusTransition[] = [
  {
    from: 'pending_review',
    to: 'supply_review',
    action: '进入采购审核',
    allowedRoles: ['purchase_manager'],
    requiresRemark: false,
  },
  {
    from: 'supply_review',
    to: 'supply_approved',
    action: '采购确认',
    allowedRoles: ['purchase_manager'],
    requiresRemark: false,
    remarkLabel: '采购备注',
  },
  {
    from: 'supply_review',
    to: 'supply_rejected',
    action: '采购驳回',
    allowedRoles: ['purchase_manager'],
    requiresRemark: true,
    remarkLabel: '驳回原因（需补充材料）',
  },
  {
    from: 'supply_rejected',
    to: 'supply_review',
    action: '补充材料后重提',
    allowedRoles: ['store_supervisor'],
    requiresRemark: true,
    remarkLabel: '补充说明',
  },
  {
    from: 'supply_approved',
    to: 'replenishing',
    action: '开始补发',
    allowedRoles: ['purchase_manager', 'production_leader'],
    requiresRemark: false,
    remarkLabel: '补发安排',
  },
  {
    from: 'replenishing',
    to: 'replenished',
    action: '补发完成',
    allowedRoles: ['production_leader'],
    requiresRemark: false,
    remarkLabel: '补发详情',
  },
  {
    from: 'replenished',
    to: 'supervisor_review',
    action: '申请督导复核',
    allowedRoles: ['production_leader'],
    requiresRemark: false,
  },
  {
    from: 'supervisor_review',
    to: 'closed',
    action: '复核通过并关闭',
    allowedRoles: ['store_supervisor'],
    requiresRemark: true,
    remarkLabel: '复核意见',
  },
  {
    from: 'supervisor_review',
    to: 'replenishing',
    action: '复核不通过，重新补发',
    allowedRoles: ['store_supervisor'],
    requiresRemark: true,
    remarkLabel: '不通过原因',
  },
]

export const ROLE_PERMISSIONS: Record<Role, RolePermission> = {
  purchase_manager: {
    role: 'purchase_manager',
    name: '采购主管',
    description: '负责缺货补发的审核和采购安排',
    allowedStatuses: [
      'supply_review',
      'supply_approved',
      'supply_rejected',
      'replenishing',
    ],
    allowedActions: [
      'view_shortage',
      'review_shortage',
      'approve_shortage',
      'reject_shortage',
      'arrange_replenish',
      'export_report',
    ],
    menuItems: [
      'dashboard',
      'shortage-review',
      'shortage-history',
      'batch-entry',
      'reports',
    ],
  },
  production_leader: {
    role: 'production_leader',
    name: '生产班长',
    description: '负责门店配餐的生产安排、批量录入和配送',
    allowedStatuses: [
      'draft',
      'submitted',
      'production_review',
      'production_approved',
      'production_rejected',
      'distributed',
      'replenishing',
      'replenished',
      'supervisor_review',
    ],
    allowedActions: [
      'create_order',
      'edit_order',
      'submit_order',
      'review_production',
      'approve_production',
      'reject_production',
      'batch_entry',
      'distribute',
      'arrange_replenish',
      'complete_replenish',
      'request_supervisor_review',
    ],
    menuItems: [
      'dashboard',
      'meal-orders',
      'batch-entry',
      'production-board',
      'shortage-review',
    ],
  },
  store_supervisor: {
    role: 'store_supervisor',
    name: '门店督导',
    description: '负责门店报量确认、签收、缺货上报和复核',
    allowedStatuses: [
      'draft',
      'submitted',
      'production_rejected',
      'distributed',
      'received',
      'shortage_reported',
      'supply_rejected',
      'replenished',
      'supervisor_review',
      'closed',
    ],
    allowedActions: [
      'create_order',
      'edit_order',
      'submit_order',
      'confirm_receipt',
      'report_shortage',
      'resubmit_shortage',
      'review_replenish',
      'close_shortage',
    ],
    menuItems: [
      'dashboard',
      'meal-orders',
      'store-report',
      'shortage-review',
      'shortage-history',
    ],
  },
}

export const ROLE_LABELS: Record<Role, string> = {
  purchase_manager: '采购主管',
  production_leader: '生产班长',
  store_supervisor: '门店督导',
}

export function getAvailableTransitions(
  currentStatus: MealOrderStatus | ShortageStatus,
  role: Role,
  isShortage: boolean
): StatusTransition[] {
  const transitions = isShortage ? SHORTAGE_TRANSITIONS : MEAL_ORDER_TRANSITIONS
  return transitions.filter(
    (t) => t.from === currentStatus && t.allowedRoles.includes(role)
  )
}

export function canPerformAction(
  currentStatus: MealOrderStatus | ShortageStatus,
  action: string,
  role: Role,
  isShortage: boolean
): boolean {
  const transitions = isShortage ? SHORTAGE_TRANSITIONS : MEAL_ORDER_TRANSITIONS
  return transitions.some(
    (t) =>
      t.from === currentStatus &&
      t.action === action &&
      t.allowedRoles.includes(role)
  )
}
