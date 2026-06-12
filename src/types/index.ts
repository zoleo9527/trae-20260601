export interface Cattle {
  id: number;
  tagId: string;
  name: string;
  birthDate: string;
  breed: string;
  weight: number;
  status: 'healthy' | 'treatment' | 'quarantine' | 'recovered';
  createdAt: string;
}

export interface VeterinaryRecord {
  id: number;
  cattleId: number;
  examDate: string;
  vetName: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  operator: string;
}

export interface QuarantineRecord {
  id: number;
  vetRecordId: number;
  cattleId: number;
  startDate: string;
  endDate?: string;
  reason: string;
  status: 'pending' | 'quarantining' | 'completed' | 'rejected';
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  operator: string;
}

export interface ExceptionRecord {
  id: number;
  vetRecordId?: number;
  quarantineId?: number;
  type: 'reject' | 'warning' | 'info';
  description: string;
  action: string;
  createdAt: string;
  operator: string;
}

export interface MilkingRecord {
  id: number;
  cattleId: number;
  milkingTime: string;
  amount: number;
  quality: 'good' | 'normal' | 'poor';
  operator: string;
  createdAt: string;
}

export interface FeedingPlan {
  id: number;
  cattleId: number;
  feedType: string;
  amount: number;
  feedingTime: string;
  status: 'pending' | 'completed';
  operator: string;
  createdAt: string;
}

export type StatusType = VeterinaryRecord['status'] | QuarantineRecord['status'];

export interface FilterOptions {
  keyword: string;
  status: StatusType | 'all';
  dateRange: [string, string] | null;
  cattleId: number | null;
}
