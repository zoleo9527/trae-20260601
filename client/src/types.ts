export interface CargoOrder {
  id: number;
  order_no: string;
  flight_no: string;
  arrival_time: string;
  goods_name: string;
  goods_type: string;
  weight_kg: number;
  consignee: string;
  contact_phone: string;
  status: string;
  is_urgent: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationAllocation {
  id: number;
  order_id: number;
  zone: string;
  shelf: string;
  position: string;
  full_location: string;
  allocated_by: string;
  allocated_at: string;
  status: string;
  notes: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PickupAppointment {
  id: number;
  order_id: number;
  allocation_id: number | null;
  appointee: string;
  contact_phone: string;
  appointment_time: string | null;
  status: string;
  notes: string;
  allocation_snapshot: string;
  allocation_changed: boolean;
  created_at: string;
  updated_at: string;
}

export interface StatusChangeLog {
  id: number;
  entity_type: string;
  entity_id: number;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  role: string;
  notes: string;
  created_at: string;
}

export interface DashboardStats {
  total_orders: number;
  urgent_orders: number;
  status_counts: Record<string, number>;
  allocation_changes: number;
  recent_logs: StatusChangeLog[];
}

export interface TimelineEntry {
  entity_type: string;
  entity_id: number;
  action_label: string;
  from_status: string | null;
  to_status: string | null;
  changed_by: string;
  role: string;
  notes: string;
  created_at: string;
}

export interface TimelineResponse {
  order: CargoOrder;
  allocation: LocationAllocation | null;
  appointments: PickupAppointment[];
  entries: TimelineEntry[];
}

export const STATUS_LABELS: Record<string, string> = {
  created: '新建',
  accepting: '受理中',
  supplementing: '补材料中',
  pending_security: '待安检',
  inspecting: '安检中',
  security_rejected: '安检退回',
  pending_allocation: '待分配库位',
  allocated: '已分配库位',
  allocation_changed: '库位变动',
  appointed: '已预约',
  pending_pickup: '待提货',
  picked_up: '已提货',
  escalated: '催办',
  rejected: '已退回',
};

export const ROLE_LABELS: Record<string, string> = {
  system: '系统',
  cargo_acceptor: '货站受理',
  security_inspector: '安检员',
  warehouse_dispatcher: '库区调度',
};

export const STATUS_COLORS: Record<string, string> = {
  created: 'bg-gray-100 text-gray-700',
  accepting: 'bg-blue-100 text-blue-700',
  supplementing: 'bg-amber-100 text-amber-700',
  pending_security: 'bg-indigo-100 text-indigo-700',
  inspecting: 'bg-purple-100 text-purple-700',
  security_rejected: 'bg-red-100 text-red-700',
  pending_allocation: 'bg-cyan-100 text-cyan-700',
  allocated: 'bg-emerald-100 text-emerald-700',
  allocation_changed: 'bg-orange-100 text-orange-700',
  appointed: 'bg-teal-100 text-teal-700',
  pending_pickup: 'bg-lime-100 text-lime-700',
  picked_up: 'bg-green-100 text-green-700',
  escalated: 'bg-rose-100 text-rose-700',
  rejected: 'bg-red-100 text-red-700',
  active: 'bg-emerald-100 text-emerald-700',
  released: 'bg-gray-100 text-gray-700',
  reallocated: 'bg-orange-100 text-orange-700',
  confirmed: 'bg-teal-100 text-teal-700',
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

export const ENTITY_LABELS: Record<string, string> = {
  cargo_order: '货单',
  location_allocation: '库位分配',
  pickup_appointment: '提货预约',
};
