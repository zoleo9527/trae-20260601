import type { HallStatus, FaultStatus } from './common';

export interface Hall {
  id: string;
  name: string;
  seatCount: number;
  equipment: string[];
  status: HallStatus;
  lastInspection?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HallLog {
  id: string;
  hallId: string;
  fromStatus?: HallStatus;
  toStatus?: HallStatus;
  action: string;
  reason?: string;
  operator: string;
  operatorRole: string;
  createdAt: string;
}

export interface Inspection {
  id: string;
  hallId: string;
  operator: string;
  operatorRole: string;
  result: 'normal' | 'warning' | 'fault';
  remark?: string;
  createdAt: string;
}

export interface FaultTicket {
  id: string;
  hallId: string;
  hallName: string;
  scheduleId?: string;
  title: string;
  description: string;
  status: FaultStatus;
  reportedBy: string;
  reportedByRole: string;
  handledBy?: string;
  handledByRole?: string;
  createdAt: string;
  resolvedAt?: string;
  closedAt?: string;
  resolveRemark?: string;
}

export interface CreateFaultTicketDTO {
  hallId: string;
  scheduleId?: string;
  title: string;
  description: string;
}

export interface SubmitInspectionDTO {
  hallId: string;
  result: 'normal' | 'warning' | 'fault';
  remark?: string;
}
