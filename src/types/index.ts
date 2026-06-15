export interface ConfigItem {
  id: string;
  order_id: string;
  part_id: string;
  part_name: string;
  spec: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface InstalledPart {
  id: string;
  order_id: string;
  part_id: string;
  part_name: string;
  spec: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  batch_no: string;
  expire_date: string;
  installed_by: string;
  installed_at: string;
  remarks?: string;
}

export interface ModifyRecord {
  id: string;
  order_id: string;
  part_id: string;
  part_name: string;
  spec: string;
  change_type: 'upgrade' | 'downgrade' | 'replace';
  old_price: number;
  new_price: number;
  price_diff: number;
  reason: string;
  operator: string;
  created_at: string;
}

export interface Part {
  id: string;
  name: string;
  category: 'cpu' | 'memory' | 'gpu' | 'motherboard' | 'power' | 'harddisk';
  spec: string;
  unit_price: number;
  stock: number;
  batch_no: string;
  expire_date: string;
}

export interface DeliveryRecord {
  id: string;
  order_id: string;
  status: 'pending' | 'delivered' | 'repair';
  delivery_date?: string;
  signer?: string;
  remarks?: string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  phone: string;
  order_date: string;
  status: 'pending' | 'installing' | 'delivered' | 'repairing';
  install_status: 'not_started' | 'in_progress' | 'completed';
  total_price: number;
  paid_amount: number;
  created_by: string;
  created_at: string;
  config_items: ConfigItem[];
  installed_parts: InstalledPart[];
  modify_records: ModifyRecord[];
  delivery_records: DeliveryRecord[];
}

export interface User {
  id: string;
  name: string;
  role: 'sales' | 'technician' | 'support';
}
