export interface User {
  id: number
  username: string
  name: string
  role: 'service' | 'guide' | 'warehouse'
  phone?: string
  created_at?: string
}

export interface Fruit {
  id: number
  name: string
  unit: string
  price: number
  is_active: number
}

export interface Reception {
  id: number
  reception_no: string
  group_name: string
  contact_person?: string
  contact_phone?: string
  people_count: number
  scheduled_date: string
  scheduled_time?: string
  source?: string
  status: 'pending' | 'assigned' | 'picking' | 'completed' | 'cancelled'
  remark?: string
  created_by: number
  created_by_name?: string
  created_at: string
  updated_at: string
  guideTasks?: GuideTask[]
  attachments?: Attachment[]
  auditLogs?: AuditLog[]
}

export interface GuideTask {
  id: number
  task_no: string
  reception_id: number
  guide_id: number
  assigned_by: number
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  picking_area?: string
  fruit_details?: string
  total_weight: number
  start_time?: string
  end_time?: string
  remark?: string
  created_at: string
  updated_at: string
  group_name?: string
  reception_no?: string
  scheduled_date?: string
  guide_name?: string
  assigned_by_name?: string
  people_count?: number
  contact_person?: string
  contact_phone?: string
  warehouseTransfer?: WarehouseTransfer
  attachments?: Attachment[]
  auditLogs?: AuditLog[]
}

export interface WarehouseTransfer {
  id: number
  transfer_no: string
  guide_task_id: number
  received_by: number
  status: 'pending' | 'received' | 'stored'
  fruit_details?: string
  total_weight: number
  storage_location?: string
  received_time?: string
  stored_time?: string
  remark?: string
  created_at: string
  updated_at: string
  task_no?: string
  group_name?: string
  reception_no?: string
  received_by_name?: string
  guide_name?: string
  picking_area?: string
  people_count?: number
  attachments?: Attachment[]
  auditLogs?: AuditLog[]
}

export interface Attachment {
  id: number
  biz_type: string
  biz_id: number
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_by?: number
  created_at: string
}

export interface AuditLog {
  id: number
  biz_type: string
  biz_id: number
  action: string
  operator_id?: number
  operator_name?: string
  detail?: string
  ip?: string
  created_at: string
}

export interface Notification {
  id: number
  title: string
  content?: string
  biz_type?: string
  biz_id?: number
  type: string
  is_read: number
  read_time?: string
  created_at: string
}

export interface PageResult<T> {
  total: number
  list: T[]
  page: number
  pageSize: number
  totalPages: number
}

export interface FruitDetailItem {
  fruit_id: number
  fruit_name: string
  weight: number
  unit: string
  price?: number
}
