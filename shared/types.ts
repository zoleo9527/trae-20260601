export type BanquetType = 'wedding' | 'annual' | 'birthday' | 'other';

export type BanquetStatus = 'draft' | 'pending' | 'confirmed' | 'modified' | 'finalized';

export type ChangeType = 'hall' | 'table_count' | 'table_layout' | 'equipment' | 'material' | 'children_chair' | 'other';

export type ImpactScope = 'hall' | 'kitchen' | 'both';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type UserRole = 'sales' | 'hall_manager' | 'kitchen_manager';

export type MaterialStatus = 'pending' | 'confirmed' | 'shortage' | 'prepared';

export type MaterialCategory = 'hall' | 'kitchen' | 'both';

export type TableShape = 'round' | 'square' | 'rectangle';

export interface Table {
  id: string;
  tableNumber: string;
  shape: TableShape;
  seats: number;
  x: number;
  y: number;
  rotation: number;
}

export interface TableCard {
  id: string;
  tableId: string;
  content: string;
  type: 'guest' | 'vip' | 'family' | 'other';
}

export interface SoundSystem {
  id: string;
  name: string;
  position: { x: number; y: number };
  type: 'main' | 'auxiliary' | 'wireless_mic' | 'projector';
  status: 'available' | 'in_use' | 'maintenance' | 'missing';
}

export interface MotionLine {
  id: string;
  name: string;
  path: { x: number; y: number }[];
  type: 'guest' | 'service' | 'emergency' | 'bride';
}

export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: MaterialCategory;
  status: MaterialStatus;
  scope: ImpactScope;
  note?: string;
}

export interface PlanVersion {
  id: string;
  banquetId: string;
  version: number;
  hall: string;
  tableLayout: Table[];
  materials: MaterialItem[];
  tableCards: TableCard[];
  soundSystem: SoundSystem[];
  motionLines: MotionLine[];
  remark: string;
  changeDescription: string;
  createdAt: string;
  createdBy: string;
}

export interface ConfirmRecord {
  id: string;
  banquetId: string;
  version: number;
  role: UserRole;
  confirmer: string;
  confirmTime: string;
  signature: string;
  remark: string;
}

export interface Alert {
  id: string;
  banquetId: string;
  banquetName: string;
  type: ChangeType;
  description: string;
  scope: ImpactScope;
  priority: Priority;
  acknowledged: boolean;
  fromVersion: number;
  toVersion: number;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface Banquet {
  id: string;
  name: string;
  customer: string;
  customerContact: string;
  type: BanquetType;
  startTime: string;
  endTime: string;
  hall: string;
  guestCount: number;
  tableCount: number;
  status: BanquetStatus;
  currentVersion: number;
  versions: PlanVersion[];
  confirmRecords: ConfirmRecord[];
  alerts: Alert[];
  createdAt: string;
  createdBy: string;
  specialRequirements?: string;
}

export interface BanquetSummary {
  id: string;
  name: string;
  type: BanquetType;
  startTime: string;
  endTime: string;
  hall: string;
  guestCount: number;
  tableCount: number;
  status: BanquetStatus;
  currentVersion: number;
  hasUnacknowledgedAlerts: boolean;
  alertCount: number;
  highPriorityAlerts: number;
}

export interface VersionDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: ChangeType;
  impactScope: ImpactScope;
}

export interface CompareResult {
  version1: PlanVersion;
  version2: PlanVersion;
  differences: VersionDiff[];
  summary: {
    totalChanges: number;
    hallChanges: number;
    kitchenChanges: number;
    bothChanges: number;
  };
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}
