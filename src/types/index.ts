export type UserRole = 'brewer' | 'packager' | 'sales' | 'admin'

export type BatchStatus = 'PENDING' | 'FEEDING' | 'FERMENTING' | 'CONDITIONING' | 'READY' | 'PACKAGED' | 'ABNORMAL'

export type AlertLevel = 'info' | 'warning' | 'critical'
export type AlertStatus = 'pending' | 'resolved' | 'rejected'

export type AlertType = 'feeding_deviation' | 'temp_abnormal' | 'status_timeout' | 'feeding_changed' | 'quality_issue'

export interface RecipeIngredient {
  name: string
  amount: number
  unit: string
}

export interface Recipe {
  id: string
  name: string
  ingredients: RecipeIngredient[]
  targetVolume: number
  description: string
  fermentationDays: number
}

export interface FeedingIngredient {
  name: string
  amount: number
  unit: string
  deviation?: number
}

export interface Feeding {
  id: string
  batchId: string
  recipeId: string
  brewerId: string
  brewerName: string
  feedingTime: string
  ingredients: FeedingIngredient[]
  status: 'draft' | 'confirmed' | 'modified'
  notes: string
  totalWeight: number
}

export interface FeedingChangeLog {
  id: string
  feedingId: string
  fieldName: string
  oldValue: string
  newValue: string
  operator: string
  operatorRole: UserRole
  changeTime: string
  reason?: string
}

export interface Batch {
  id: string
  batchNumber: string
  name: string
  status: BatchStatus
  startTime: string
  endTime?: string
  tankId: string
  temperature: number
  targetTemperature: number
  gravity: number
  originalGravity: number
  volume: number
  recipeId: string
  feedingId?: string
  notes: string
  lastStatusUpdate: string
}

export interface BatchStateLog {
  id: string
  batchId: string
  fromStatus: BatchStatus
  toStatus: BatchStatus
  operator: string
  operatorRole: UserRole
  reason: string
  changeTime: string
}

export interface Packaging {
  id: string
  batchId: string
  packagingType: string
  quantity: number
  operator: string
  packagingTime: string
  qualityStatus: 'pass' | 'fail' | 'pending'
  notes: string
}

export interface Alert {
  id: string
  batchId?: string
  feedingId?: string
  type: AlertType
  level: AlertLevel
  message: string
  status: AlertStatus
  handler?: string
  createdAt: string
  resolvedAt?: string
  resolution?: string
}

export interface BackupInfo {
  id: string
  name: string
  createdAt: string
  size: number
  recordCount: {
    batches: number
    feedings: number
    recipes: number
    packaging: number
    alerts: number
  }
}

export interface AppData {
  recipes: Recipe[]
  feedings: Feeding[]
  batches: Batch[]
  batchStateLogs: BatchStateLog[]
  packagingRecords: Packaging[]
  alerts: Alert[]
  feedingChangeLogs: FeedingChangeLog[]
  backups: BackupInfo[]
  currentRole: UserRole
}

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  PENDING: '待投料',
  FEEDING: '投料中',
  FERMENTING: '发酵中',
  CONDITIONING: '后熟',
  READY: '待包装',
  PACKAGED: '已包装',
  ABNORMAL: '异常',
}

export const BATCH_STATUS_COLORS: Record<BatchStatus, string> = {
  PENDING: 'bg-gray-600',
  FEEDING: 'bg-amber-600',
  FERMENTING: 'bg-green-600',
  CONDITIONING: 'bg-blue-600',
  READY: 'bg-purple-600',
  PACKAGED: 'bg-emerald-700',
  ABNORMAL: 'bg-red-600',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  brewer: '酿酒师',
  packager: '包装主管',
  sales: '销售内勤',
  admin: '管理员',
}

export const ALERT_LEVEL_COLORS: Record<AlertLevel, string> = {
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
}

export const MENU_ITEMS = [
  { path: '/dashboard', label: '工作台', icon: '🏠', roles: ['brewer', 'packager', 'sales', 'admin'] as UserRole[] },
  { path: '/feeding', label: '投料工作台', icon: '🍺', roles: ['brewer', 'admin'] as UserRole[] },
  { path: '/batches', label: '发酵批次', icon: '📊', roles: ['brewer', 'packager', 'sales', 'admin'] as UserRole[] },
  { path: '/packaging', label: '包装管理', icon: '📦', roles: ['packager', 'admin'] as UserRole[] },
  { path: '/sales', label: '销售查询', icon: '🔍', roles: ['sales', 'admin'] as UserRole[] },
  { path: '/system', label: '系统中心', icon: '⚙️', roles: ['admin'] as UserRole[] },
]
