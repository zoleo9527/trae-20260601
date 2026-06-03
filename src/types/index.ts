export interface Store {
  id: number;
  name: string;
  code: string;
  address: string;
  contact: string;
  created_at: string;
}

export interface Dish {
  id: number;
  name: string;
  code: string;
  category: string;
  allergens: string;
  unit: string;
  specification: string;
  production_time: number;
  is_active: boolean;
  created_at: string;
}

export interface DailyOrder {
  id: number;
  order_date: string;
  store_id: number;
  dish_id: number;
  quantity: number;
  is_urgent: boolean;
  allergens_confirmation: string;
  special_instructions: string;
  status: 'pending' | 'confirmed' | 'in_production' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  store_name?: string;
  dish_name?: string;
  dish_allergens?: string;
}

export interface ProductionSchedule {
  id: number;
  schedule_date: string;
  dish_id: number;
  total_quantity: number;
  start_time: string | null;
  end_time: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  dish_name?: string;
  dish_category?: string;
}

export interface ProductionBatch {
  id: number;
  schedule_id: number;
  batch_number: string;
  quantity: number;
  status: 'pending' | 'in_progress' | 'completed';
  started_at: string | null;
  completed_at: string | null;
  operator: string | null;
}

export interface Delivery {
  id: number;
  delivery_date: string;
  store_id: number;
  order_id: number;
  dish_id: number;
  quantity: number;
  status: 'pending' | 'dispatched' | 'received' | 'cancelled';
  dispatched_at: string | null;
  received_at: string | null;
  received_by: string | null;
  receiver_signature: string | null;
  notes: string;
}

export interface OperationLog {
  id: number;
  operation_type: string;
  entity_type: string;
  entity_id: number;
  old_value: string | null;
  new_value: string | null;
  operator: string;
  timestamp: string;
  notes: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
