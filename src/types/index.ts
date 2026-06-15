export type UserRole = 'sales' | 'designer' | 'warehouse';

export interface ColorLock {
  id: string;
  colorNo: string;
  colorName: string;
  productName: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  projectName: string;
  salesmanName: string;
  designerName?: string;
  status: 'pending' | 'locked' | 'reserved' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  remarks: Remark[];
  responsibilityFlag: boolean;
  linkedReservationId?: string;
}

export interface Remark {
  id: string;
  content: string;
  author: string;
  authorRole: UserRole;
  createdAt: string;
}

export interface InventoryReservation {
  id: string;
  colorLockId: string;
  colorNo: string;
  colorName: string;
  productName: string;
  reservedQuantity: number;
  actualQuantity?: number;
  warehouseName: string;
  status: 'pending' | 'reserved' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  remarks: Remark[];
  responsibilityFlag: boolean;
}

export interface SampleBook {
  id: string;
  name: string;
  category: string;
  colors: ColorInfo[];
}

export interface ColorInfo {
  colorNo: string;
  colorName: string;
  imageUrl: string;
  stock: number;
}

export interface MeasureOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  area: number;
  date: string;
  designerName: string;
  status: 'pending' | 'measured' | 'completed';
}

export interface ReplenishRequest {
  id: string;
  colorNo: string;
  colorName: string;
  productName: string;
  quantity: number;
  requestedBy: string;
  status: 'pending' | 'approved' | 'ordered' | 'completed';
  createdAt: string;
}

export interface UserInfo {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
}
