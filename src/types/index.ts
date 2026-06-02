export interface Customer {
  id: number;
  name: string;
  phone: string;
  level: 'normal' | 'vip';
  notes: string;
  created_at: string;
  vehicle_count?: number;
}

export interface Vehicle {
  id: number;
  customer_id: number;
  plate: string;
  brand: string;
  model: string;
  color: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  customer_level?: string;
}

export interface PackageTemplateItem {
  id: number;
  package_template_id: number;
  service_type: string;
  count: number;
}

export interface PackageTemplate {
  id: number;
  name: string;
  price: number;
  validity_days: number;
  description: string;
  created_at: string;
  items?: PackageTemplateItem[];
  items_summary?: string;
}

export interface CustomerPackageItem {
  service_type: string;
  total: number;
  used: number;
  remaining: number;
}

export interface CustomerPackage {
  id: number;
  customer_id: number;
  package_template_id: number;
  total_count: number;
  remaining_count: number;
  purchased_at: string;
  expires_at: string;
  package_name?: string;
  package_price?: number;
  validity_days?: number;
  package_description?: string;
  items?: CustomerPackageItem[];
  isLow?: boolean;
  isExpiring?: boolean;
  customer_name?: string;
}

export interface Employee {
  id: number;
  name: string;
  role: 'technician' | 'inspector' | 'manager';
  created_at: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'rework';

export interface OrderItem {
  id: number;
  order_id: number;
  customer_package_id: number | null;
  service_type: string;
  price: number;
  package_name?: string;
  package_template_id?: number;
}

export interface Inspection {
  id: number;
  order_id: number;
  inspector_id: number;
  result: 'pass' | 'rework';
  reason: string | null;
  created_at: string;
  inspector_name?: string;
}

export interface Order {
  id: number;
  customer_id: number;
  vehicle_id: number;
  employee_id: number | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  completed_at: string | null;
  is_rework: number;
  original_order_id: number | null;
  customer_name?: string;
  customer_phone?: string;
  customer_level?: string;
  plate?: string;
  brand?: string;
  model?: string;
  color?: string;
  employee_name?: string;
  items?: OrderItem[];
  inspections?: Inspection[];
}

export type DeductionType = 'usage' | 'rework_refund' | 'compensation';

export interface DeductionRecord {
  id: number;
  customer_package_id: number;
  order_item_id: number | null;
  type: DeductionType;
  count: number;
  service_type: string | null;
  reason: string | null;
  created_at: string;
  customer_name?: string;
  package_name?: string;
}

export interface TodayStats {
  summary: {
    total_orders: number;
    total_revenue: number;
    pending_count: number;
    in_progress_count: number;
    completed_count: number;
    rework_count: number;
  };
  by_status: Array<{
    status: string;
    count: number;
    revenue: number;
  }>;
  low_packages: CustomerPackage[];
  expiring_packages: CustomerPackage[];
}

export interface ReworkRateStats {
  overall: {
    total: number;
    rework_count: number;
    rework_rate: number;
  };
  by_employee: Array<{
    employee_name: string;
    employee_id: number;
    total: number;
    rework_count: number;
    rework_rate: number;
  }>;
}

export interface PackageConsumptionStats {
  by_template: Array<{
    name: string;
    id: number;
    sold_count: number;
    total_items: number;
    remaining_items: number;
    consumption_rate: number;
  }>;
  by_service_type: Array<{
    service_type: string;
    total_sold: number;
    total_used: number;
    consumption_rate: number;
  }>;
}

export interface CompensationStats {
  records: DeductionRecord[];
  summary: Array<{
    type: string;
    count: number;
    total_count: number;
  }>;
}

export interface CustomerDetail extends Customer {
  vehicles: Vehicle[];
  packages: CustomerPackage[];
  recentOrders: Order[];
}
