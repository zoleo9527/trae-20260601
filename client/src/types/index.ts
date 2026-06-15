export interface Equipment {
  id: string;
  code: string;
  model: string;
  brand: string;
  customerName: string;
  customerAddress: string;
  purchaseDate: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  status: 'running' | 'warning' | 'down';
  workingHours: number;
  location: string;
  responsibleTechnician: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenancePlan {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentModel: string;
  customerName: string;
  planType: 'regular' | 'emergency';
  planName: string;
  scheduledDate: string;
  actualDate: string | null;
  status: 'pending' | 'overdue' | 'completed';
  items: { name: string; status: 'pending' | 'completed' }[];
  responsibleTechnician: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartsInventory {
  id: string;
  code: string;
  name: string;
  brand: string;
  model: string;
  quantity: number;
  minStock: number;
  location: string;
  unit: string;
  price: number;
  supplier: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperationLog {
  id: string;
  operator: string;
  role: 'maintenance_manager' | 'field_technician' | 'warehouse_manager' | 'system';
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  description: string;
  detail: string;
  createdAt: string;
}

export interface Exception {
  id: string;
  type: 'overdue_maintenance' | 'wrong_parts_delivery' | 'equipment_down' | 'low_stock';
  title: string;
  description: string;
  equipmentId: string | null;
  equipmentCode: string | null;
  customerName: string | null;
  status: 'pending' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
  assignee: string;
}

export interface User {
  id: string;
  name: string;
  role: 'maintenance_manager' | 'field_technician' | 'warehouse_manager';
}
