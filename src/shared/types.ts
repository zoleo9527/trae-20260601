export type IncidentStatus = 'pending' | 'processing' | 'review' | 'completed' | 'archived'

export type IncidentType = 'rescue' | 'medical' | 'weather' | 'equipment' | 'other'

export type NoteCategory = 'rescue' | 'medical' | 'insurance' | 'anomaly'

export type MaterialStatus = 'pending' | 'submitted' | 'reviewed' | 'rejected'

export interface RescueIncident {
  id: string
  incident_no: string
  type: IncidentType
  status: IncidentStatus
  location: string
  injured_name: string
  injured_phone: string
  responsible_person: string
  description: string
  occurred_at: string
  created_at: string
  updated_at: string
}

export interface IncidentNote {
  id: string
  incident_id: string
  author: string
  category: NoteCategory
  content: string
  referenced_note_id: string | null
  created_at: string
}

export interface StatusTransition {
  id: string
  incident_id: string
  from_status: IncidentStatus
  to_status: IncidentStatus
  operator: string
  remark: string
  created_at: string
}

export interface InsuranceMaterial {
  id: string
  incident_id: string
  material_type: string
  status: MaterialStatus
  reviewer: string
  notes: string
  anomaly_explanation: string
  referenced_note_ids: string
  anomaly_referenced_note_ids: string | null
  created_at: string
  updated_at: string
}

export interface InsuranceMaterialWithNotes extends InsuranceMaterial {
  referenced_notes: IncidentNote[]
  anomaly_referenced_notes: IncidentNote[]
}

export interface OperationLog {
  id: string
  incident_id: string
  operator: string
  action: string
  detail: string
  created_at: string
}

export interface TimelineItem {
  type: 'note' | 'status' | 'log'
  data: IncidentNote | StatusTransition | OperationLog
  created_at: string
}

export interface IncidentFilters {
  status: IncidentStatus | ''
  responsible_person: string
  search: string
}

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  pending: '待处理',
  processing: '处置中',
  review: '审核中',
  completed: '已完成',
  archived: '已归档',
}

export const STATUS_FLOW: IncidentStatus[] = [
  'pending',
  'processing',
  'review',
  'completed',
  'archived',
]

export const NOTE_CATEGORY_LABELS: Record<NoteCategory, string> = {
  rescue: '救援',
  medical: '医疗',
  insurance: '保险',
  anomaly: '异常',
}
