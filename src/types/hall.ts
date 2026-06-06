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

export interface AffectedSchedule {
  scheduleId: string;
  scheduleName: string;
  startTime: string;
  endTime: string;
  refundTicketIds: string[];
}

export interface FaultTicket {
  id: string;
  hallId: string;
  hallName: string;
  scheduleId?: string;
  affectedSchedules: AffectedSchedule[];
  title: string;
  description: string;
  status: FaultStatus;
  reportedBy: string;
  reportedByRole: string;
  processStartedBy?: string;
  processStartedByRole?: string;
  resolvedBy?: string;
  resolvedByRole?: string;
  closedBy?: string;
  closedByRole?: string;
  handledBy?: string;
  handledByRole?: string;
  createdAt: string;
  processStartedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  resolveRemark?: string;
  refundGenerated: boolean;
}

export interface CreateFaultTicketDTO {
  hallId: string;
  scheduleId?: string;
  affectedScheduleIds: string[];
  title: string;
  description: string;
  autoGenerateRefund?: boolean;
}

export interface SubmitInspectionDTO {
  hallId: string;
  result: 'normal' | 'warning' | 'fault';
  remark?: string;
}
