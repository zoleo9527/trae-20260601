export type OrderStatus =
  | 'PENDING_CONFIRM'
  | 'CONFIRMED'
  | 'HARVESTING'
  | 'PACKING'
  | 'COMPLETED'
  | 'STUCK';

export type StuckType =
  | 'FORECAST_DEVIATION'
  | 'PACKAGE_DAMAGE'
  | 'CUSTOMER_CHANGE'
  | 'OTHER';

export type RoleType = 'SALES' | 'GROWER' | 'PACKER';

export type ShelterStatus = 'IMMATURE' | 'READY' | 'HARVESTED' | 'ABNORMAL';

export type HarvestPlanStatus = 'PENDING' | 'HARVESTING' | 'DONE' | 'ABNORMAL';

export interface OrderItem {
  id: string;
  orderId: string;
  flowerType: string;
  color: string;
  quantity: number;
  stemsPerBunch: number;
  shelterId: string;
  remark: string;
}

export interface HarvestPlan {
  id: string;
  orderId: string;
  shelterId: string;
  planDate: string;
  planQty: number;
  actualQty?: number;
  status: HarvestPlanStatus;
  operator: string;
  note?: string;
}

export interface StuckRecord {
  id: string;
  orderId: string;
  stuckType: StuckType;
  reason: string;
  stuckAt: string;
  resolvedAt?: string;
  resolver?: string;
  resolution?: string;
  previousStatus?: OrderStatus;
}

export interface CustomerOrder {
  id: string;
  customerName: string;
  phone: string;
  deliveryDate: string;
  address: string;
  status: OrderStatus;
  previousStatus?: OrderStatus;
  totalAmount: number;
  specNote: string;
  createdAt: string;
  updatedAt: string;
  operator: RoleType;
  items: OrderItem[];
  harvestPlan?: HarvestPlan;
  stuckRecord?: StuckRecord;
  logisticsNo?: string;
  packDamageNote?: string;
  specChangeHistory?: Array<{
    id: string;
    changedAt: string;
    changedBy: string;
    before: string;
    after: string;
  }>;
}

export interface Shelter {
  id: string;
  name: string;
  flowerType: string;
  color: string;
  maturity: number;
  status: ShelterStatus;
  availableQty: number;
  forecastDate: string;
  actualDate?: string;
  note?: string;
}

export interface OperationLog {
  id: string;
  orderId: string;
  role: RoleType | 'SYSTEM';
  operatorName: string;
  action: string;
  detail: string;
  timestamp: string;
  isStuck?: boolean;
}

export interface RoleInfo {
  key: RoleType;
  name: string;
  description: string;
  iconName: string;
  todoCount: number;
  onlineCount: number;
}
