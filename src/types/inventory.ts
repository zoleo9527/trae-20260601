export type RoomStatus =
  | 'CHECKED_OUT_TODAY'
  | 'PENDING_CLEANING'
  | 'PENDING_REINSPECTION'
  | 'DEPOSIT_PENDING'
  | 'COMPLETED';

export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DisputeStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  uploader: string;
  uploadTime: string;
  description: string;
}

export interface Issue {
  id: string;
  category: string;
  description: string;
  severity: IssueSeverity;
  estimatedCost: number;
  reporter: string;
  reportTime: string;
}

export interface Dispute {
  id: string;
  content: string;
  status: DisputeStatus;
  submitTime: string;
  resolution: string;
  resolver?: string;
  resolveTime?: string;
}

export interface OperationLog {
  id: string;
  action: string;
  operator: string;
  time: string;
  remark: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  building: string;
  guestName: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  status: RoomStatus;
  depositAmount: number;
  photos: Photo[];
  issues: Issue[];
  disputes: Dispute[];
  operationLogs: OperationLog[];
}

export type StatusFilter = RoomStatus | 'ALL';
