import type { TicketStatus } from './common';

export interface Ticket {
  id: string;
  code: string;
  scheduleId: string;
  scheduleName: string;
  type: 'normal' | 'group';
  status: TicketStatus;
  price: number;
  seat?: string;
  checkedBy?: string;
  checkedByRole?: string;
  checkedAt?: string;
  refundReason?: string;
  refundedBy?: string;
  refundedByRole?: string;
  refundedAt?: string;
  createdAt: string;
}

export interface TicketLog {
  id: string;
  ticketId: string;
  action: string;
  operator: string;
  operatorRole: string;
  remark?: string;
  createdAt: string;
}

export interface RefundListLog {
  id: string;
  refundListId: string;
  action: string;
  operator: string;
  operatorRole: string;
  remark?: string;
  createdAt: string;
}

export interface BatchCheckResult {
  total: number;
  success: number;
  failed: number;
  failedItems: { code: string; reason: string }[];
  successItems: { code: string; ticketId: string }[];
}

export interface RefundList {
  id: string;
  faultTicketId?: string;
  scheduleId: string;
  scheduleName: string;
  hallName: string;
  startTime: string;
  endTime: string;
  ticketIds: string[];
  reason: string;
  status: 'pending' | 'processing' | 'completed';
  createdBy: string;
  createdAt: string;
  processedBy?: string;
  processedAt?: string;
}

export interface BatchRefundResult {
  total: number;
  success: number;
  failed: number;
  failedItems: { ticketId: string; code: string; reason: string }[];
  successItems: { ticketId: string; code: string }[];
}
