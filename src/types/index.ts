export interface Order {
  id: string
  customer_name: string
  phone: string
  device_model: string
  serial_number: string
  issue_description: string
  status: OrderStatus
  created_by: string
  created_at: string
  updated_at: string
  notes?: Note[]
  inspection?: Inspection
  warranty?: Warranty
  photos?: InspectionPhoto[]
  usages?: SparePartUsage[]
}

export type OrderStatus = 'pending' | 'inspection_pending' | 'warranty_pending' | 'repairing' | 'completed'

export interface Inspection {
  id: string
  order_id: string
  technician_id: string
  technician_name: string
  appearance_condition: string
  screen_condition: string
  battery_condition: string
  accessories: string
  description: string
  status: string
  created_at: string
}

export interface Warranty {
  id: string
  order_id: string
  manager_id: string
  manager_name: string
  warranty_type: string
  warranty_period: number
  responsibility: string
  approved: number
  approved_at: string
  created_at: string
}

export interface Note {
  id: string
  order_id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
}

export interface InspectionPhoto {
  id: string
  order_id: string
  file_path: string
  description: string
  created_at: string
}

export interface SparePart {
  id: string
  name: string
  sku: string
  quantity: number
  location: string
  created_at: string
  updated_at: string
}

export interface SparePartUsage {
  id: string
  order_id: string
  spare_part_id: string
  spare_part_name: string
  spare_part_sku: string
  quantity: number
  used_by: string
  used_by_name: string
  used_at: string
}

export interface CreateOrderRequest {
  customer_name: string
  phone: string
  device_model: string
  serial_number?: string
  issue_description: string
  created_by: string
}

export interface CreateInspectionRequest {
  technician_id: string
  technician_name: string
  appearance_condition: string
  screen_condition: string
  battery_condition: string
  accessories?: string
  description: string
}

export interface CreateWarrantyRequest {
  manager_id: string
  manager_name: string
  warranty_type: string
  warranty_period: number
  responsibility: string
}

export interface CreateNoteRequest {
  user_id: string
  user_name: string
  content: string
}