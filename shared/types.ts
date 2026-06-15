export interface Equipment {
  id: number;
  name: string;
  model: string;
  serialNumber: string;
  category: string;
  status: 'idle' | 'rented' | 'maintenance' | 'returned';
  createdAt: string;
  remark?: string;
}

export interface Contract {
  id: number;
  contractNo: string;
  equipmentId: number;
  equipmentName?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  rentStartDate: string;
  plannedReturnDate: string;
  dailyRate: number;
  monthlyRate?: number;
  deposit: number;
  contractManager: string;
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
  remark?: string;
}

export interface DispatchRecord {
  id: number;
  contractId: number;
  dispatchTime: string;
  dispatcher: string;
  operatorName: string;
  startFuelLevel: number;
  startWorkingHours: number;
  photoIds?: number[];
  remark?: string;
}

export interface Photo {
  id: number;
  filePath: string;
  fileName: string;
  fileSize: number;
  uploadTime: string;
  type: 'dispatch' | 'return' | 'damage';
  relatedId?: number;
  remark?: string;
}

export interface DamageItem {
  id: number;
  returnRecordId: number;
  category: 'appearance' | 'structure' | 'hydraulic' | 'engine' | 'electrical' | 'tire' | 'accessory' | 'other';
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  needRepair: boolean;
  repairCost: number;
  deductible: number;
  repairer?: string;
  photoIds?: number[];
  remark?: string;
}

export interface ReturnRecord {
  id: number;
  contractId: number;
  contractNo?: string;
  equipmentId: number;
  equipmentName?: string;
  customerName?: string;
  returnTime: string;
  actualReturnDate: string;
  dispatcher: string;
  contractManager: string;
  endFuelLevel: number;
  fuelDifference: number;
  fuelCostPerUnit: number;
  fuelCompensation: number;
  endWorkingHours: number;
  workingHoursUsed: number;
  workingHoursOverLimit: number;
  overHoursRate: number;
  overHoursCost: number;
  cleaningStatus: 'clean' | 'slightly_dirty' | 'dirty' | 'needs_wash';
  cleaningCost: number;
  rentDays: number;
  totalRent: number;
  extraDays: number;
  extraDaysCost: number;
  totalDamageDeductible: number;
  totalDeductions: number;
  deposit: number;
  depositRefund: number;
  additionalPayment: number;
  status: 'pending' | 'confirmed' | 'customer_confirmed' | 'disputed' | 'settled';
  dispatchPhotoIds?: number[];
  returnPhotoIds?: number[];
  damageItems?: DamageItem[];
  customerRemark?: string;
  settlementRemark?: string;
  createdAt: string;
  confirmedAt?: string;
  customerConfirmedAt?: string;
}

export type DamageCategory = DamageItem['category'];
export type DamageSeverity = DamageItem['severity'];
export type CleaningStatus = ReturnRecord['cleaningStatus'];
export type ReturnStatus = ReturnRecord['status'];

export const DAMAGE_CATEGORY_LABELS: Record<DamageCategory, string> = {
  appearance: '外观损伤',
  structure: '结构损伤',
  hydraulic: '液压系统',
  engine: '发动机',
  electrical: '电气系统',
  tire: '轮胎/履带',
  accessory: '附属配件',
  other: '其他',
};

export const DAMAGE_SEVERITY_LABELS: Record<DamageSeverity, string> = {
  minor: '轻微',
  moderate: '中等',
  severe: '严重',
};

export const CLEANING_STATUS_LABELS: Record<CleaningStatus, string> = {
  clean: '清洁',
  slightly_dirty: '轻度污渍',
  dirty: '较脏',
  needs_wash: '需要清洗',
};

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  customer_confirmed: '客户已确认',
  disputed: '有异议',
  settled: '已结算',
};

export const EQUIPMENT_STATUS_LABELS: Record<Equipment['status'], string> = {
  idle: '闲置',
  rented: '出租中',
  maintenance: '维修中',
  returned: '已回场',
};

export const CONTRACT_STATUS_LABELS: Record<Contract['status'], string> = {
  active: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

export interface DatabaseStats {
  equipmentCount: number;
  contractCount: number;
  returnRecordCount: number;
  pendingCount: number;
  totalRevenue: number;
}
