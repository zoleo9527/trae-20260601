export interface BookingStatus {
  id: string;
  booking_id: string;
  status: string;
  handler: string;
  note: string;
  created_at: string;
}

export interface Booking {
  id: string;
  customer_name: string;
  phone: string;
  booking_time: string;
  guest_count: number;
  room_number: string;
  status: 'pending' | 'confirmed' | 'arrived' | 'dining' | 'billing' | 'completed' | 'cancelled';
  handler: string;
  created_at: string;
  updated_at: string;
  status_history: BookingStatus[];
}

export interface ProcurementItem {
  id: string;
  procurement_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  note: string;
}

export interface ProcurementStatus {
  id: string;
  procurement_id: string;
  status: string;
  handler: string;
  note: string;
  created_at: string;
}

export interface Procurement {
  id: string;
  applicant: string;
  apply_time: string;
  approver: string | null;
  approve_time: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'purchasing' | 'received' | 'completed';
  items: ProcurementItem[];
  status_history: ProcurementStatus[];
  created_at: string;
  updated_at: string;
}

export interface Accommodation {
  id: string;
  guest_name: string;
  phone: string;
  room_number: string;
  check_in_time: string;
  check_out_time: string | null;
  status: 'checked_in' | 'checked_out';
  handler: string;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  ingredient_name: string;
  current_quantity: number;
  unit: string;
  warning_threshold: number;
  last_updated: string;
}

export interface InventoryEstimate {
  id: string;
  ingredient_name: string;
  estimated_consumption: number;
  reason: string;
  created_at: string;
}

export interface AlertHandler {
  id: string;
  alert_id: string;
  handler: string;
  action: string;
  created_at: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  type: 'inventory' | 'procurement' | 'booking' | 'accommodation';
  related_id: string;
  status: 'active' | 'resolved';
  created_at: string;
  resolved_at: string | null;
  handlers: AlertHandler[];
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'alert' | 'info' | 'success';
  is_read: boolean;
  created_at: string;
}