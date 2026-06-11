export type ProjectStatus = 'pending_survey' | 'survey_submitted' | 'wiring_planned' | 'in_progress' | 'completed'

export type PriorityLevel = 'low' | 'normal' | 'high'

export type RiskLevel = 'none' | 'low' | 'medium' | 'high'

export interface Project {
  id: number
  project_name: string
  project_code?: string
  client_name?: string
  site_address?: string
  project_manager?: string
  construction_team?: string
  document_staff?: string
  completion_docs_status?: 'pending' | 'in_progress' | 'completed'
  status: ProjectStatus
  priority: PriorityLevel
  description?: string
  risk_level: RiskLevel
  risk_reason?: string
  created_at: string
  updated_at: string
  last_opened_at?: string
}

export interface Survey {
  id: number
  project_id: number
  survey_date?: string
  surveyor?: string
  site_condition?: string
  power_environment?: string
  cable_route?: string
  equipment_position?: string
  ground_condition?: string
  remarks?: string
  attachment_paths?: string
  submitted_by?: string
  submitted_at?: string
  confirmed_by?: string
  confirmed_at?: string
  cable_route_structured?: Array<{
    from: string
    to: string
    method: string
    length?: number
    notes?: string
  }>
  existing_lines?: Array<{
    location: string
    type: string
    condition: string
    notes?: string
  }>
  difficulty_points?: Array<{
    location: string
    description: string
    solution?: string
  }>
  status: 'draft' | 'submitted' | 'approved'
  created_at: string
  updated_at: string
}

export interface WiringPlan {
  id: number
  project_id: number
  plan_version?: string
  work_face?: string
  previous_conclusion?: string
  wiring_method?: string
  cable_spec?: string
  cable_length?: number
  conduit_spec?: string
  conduit_length?: number
  remarks?: string
  planned_materials?: Array<{
    material_id: number
    material_name?: string
    spec?: string
    unit?: string
    quantity: number
    notes?: string
  }>
  created_by?: string
  confirmed_at?: string
  status: 'draft' | 'confirmed'
  confirmed_by?: string
  created_at: string
  updated_at: string
}

export interface Material {
  id: number
  material_code?: string
  material_name: string
  category?: string
  spec?: string
  unit?: string
  stock_quantity?: number
  unit_price: number
  created_at: string
}

export interface ProjectMaterial {
  id: number
  project_id: number
  material_id: number
  planned_qty: number
  used_qty?: number
  returned_qty?: number
  is_overrun?: boolean
  overrun_approved_by?: string
  overrun_reason?: string
  material_name?: string
  spec?: string
  unit?: string
  unit_price?: number
}

export interface MaterialUsageRecord {
  id: number
  project_id: number
  material_id: number
  quantity: number
  usage_type?: string
  work_face?: string
  operator?: string
  approver?: string
  is_overrun?: boolean
  remarks?: string
  created_at: string
  material_name?: string
  spec?: string
  unit?: string
  unit_price?: number
  planned_qty?: number
  used_qty?: number
}

export interface ActivityLog {
  id: number
  project_id?: number
  action_type: string
  action_detail?: string
  operator: string
  created_at: string
  project_name?: string
}

export interface TodoItem {
  id: string
  type: 'pending_survey' | 'survey_review' | 'wiring_confirm' | 'material_overuse' | 'docs_incomplete'
  title: string
  description?: string
  project_id: number
  project_name: string
  priority?: PriorityLevel
  created_at?: string
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  pending_survey: '待勘查',
  survey_submitted: '待审核勘查',
  wiring_planned: '布线已规划',
  in_progress: '施工中',
  completed: '已完成'
}

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  pending_survey: '#faad14',
  survey_submitted: '#1890ff',
  wiring_planned: '#722ed1',
  in_progress: '#13c2c2',
  completed: '#52c41a'
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  none: '无风险',
  low: '低风险',
  medium: '中风险',
  high: '高风险'
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  none: '#8c8c8c',
  low: '#52c41a',
  medium: '#faad14',
  high: '#f5222d'
}

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: '低',
  normal: '中',
  high: '高'
}

export const STEPS = [
  { key: 'pending_survey', label: '待勘查', description: '等待现场勘查' },
  { key: 'survey_submitted', label: '勘查审核', description: '勘查报告审核中' },
  { key: 'wiring_planned', label: '布线规划', description: '制定布线方案' },
  { key: 'in_progress', label: '施工中', description: '现场施工进行中' },
  { key: 'completed', label: '已完成', description: '项目竣工验收' }
]

export const SURVEY_STATUS_LABELS: Record<'draft' | 'submitted' | 'approved', string> = {
  draft: '草稿',
  submitted: '已提交待审核',
  approved: '已审核通过'
}
