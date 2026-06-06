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

export interface BatchCheckResult {
  total: number;
  success: number;
  failed: number;
  failedItems: { code: string; reason: string }[];
  successItems: { code: string; ticketId: string }[];
}
