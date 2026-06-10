export interface Order {
  id: number
  order_no: string
  customer_name: string
  customer_phone: string
  product_name: string
  product_spec: string
  quantity: number
  unit: string
  unit_price: number
  total_amount: number
  note: string
  status: 'pending' | 'confirmed' | 'shipped' | 'arrived'
  created_at: string
  updated_at: string
  attachments: Attachment[]
}

export interface Arrival {
  id: number
  arrival_no: string
  order_id: number
  order_no: string
  order_note: string
  product_name: string
  product_spec: string
  ordered_quantity: number
  actual_quantity: number | null
  unit: string
  arrival_note: string
  exception_note: string
  status: 'pending' | 'confirmed' | 'exception'
  created_at: string
  updated_at: string
  attachments: Attachment[]
}

export interface Attachment {
  id: number
  entity_type: 'order' | 'arrival'
  entity_id: number
  file_name: string
  note: string
  status: 'placeholder' | 'uploaded'
  created_at: string
}

export interface OperationLog {
  id: number
  entity_type: 'order' | 'arrival' | 'attachment'
  entity_id: number
  action: 'create' | 'update' | 'status_change' | 'confirm' | 'delete' | 'attach'
  detail: string
  operator: string
  created_at: string
}

export interface Stats {
  today_orders: number
  pending_arrivals: number
  exception_count: number
}
