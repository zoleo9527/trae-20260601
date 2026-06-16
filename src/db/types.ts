export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'manager' | 'staff';
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: number;
  name: string;
  stage_name?: string;
  phone?: string;
  email?: string;
  genre?: string;
  agent_name?: string;
  agent_phone?: string;
  description?: string;
  status: 'active' | 'inactive' | 'blacklisted';
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface Performance {
  id: number;
  guest_id: number;
  date: string;
  start_time: string;
  end_time: string;
  stage: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface Reservation {
  id: number;
  customer_name: string;
  phone: string;
  date: string;
  time_slot: string;
  table_number: number;
  guests_count: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface WineStorage {
  id: number;
  customer_name: string;
  phone: string;
  wine_name: string;
  quantity: number;
  bottle_size: string;
  storage_location: string;
  status: 'stored' | 'retrieved' | 'consumed';
  stored_at: string;
  retrieved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface OperationLog {
  id: number;
  table_name: string;
  record_id: number;
  operation: 'create' | 'update' | 'delete';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  operator_id: number;
  operator_name: string;
  notes?: string;
  created_at: string;
}

export interface Attachment {
  id: number;
  table_name: string;
  record_id: number;
  file_name: string;
  file_path?: string;
  file_type?: string;
  description?: string;
  uploaded_at: string;
  uploaded_by: number;
}
