import { v4 as uuidv4 } from 'uuid';
import { allQuery, getQuery, runQuery } from '../database/connection';
import {
  Refund,
  RefundStatus,
  RefundReason,
  RefundFilter,
  PaginatedResponse
} from '../types';

interface CreateRefundParams {
  orderId: string;
  scheduleId: string;
  exceptionId?: string;
  userId: string;
  userName: string;
  phone: string;
  ticketCount: number;
  totalAmount: number;
  reason: RefundReason;
  remark?: string;
}

export function createRefund(params: CreateRefundParams): Refund {
  const id = uuidv4();
  const now = new Date().toISOString();

  runQuery(
    `INSERT INTO refunds (
      id, order_id, schedule_id, exception_id, user_id, user_name, phone,
      ticket_count, total_amount, reason, status, applied_at, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, params.orderId, params.scheduleId, params.exceptionId || null,
      params.userId, params.userName, params.phone, params.ticketCount,
      params.totalAmount, params.reason, RefundStatus.PENDING, now, params.remark || null
    ]
  );

  return getRefundById(id) as Refund;
}

export function getRefundById(id: string): Refund | undefined {
  const row = getQuery<any>(
    `SELECT 
      id, order_id as orderId, schedule_id as scheduleId, exception_id as exceptionId,
      user_id as userId, user_name as userName, phone, ticket_count as ticketCount,
      total_amount as totalAmount, reason, status, applied_at as appliedAt,
      approved_by as approvedBy, approved_at as approvedAt,
      reject_reason as rejectReason, processed_at as processedAt, remark
     FROM refunds WHERE id = ?`,
    [id]
  );
  return row;
}

export function getRefundList(
  filter: RefundFilter
): PaginatedResponse<Refund> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filter.status) {
    whereClauses.push('status = ?');
    params.push(filter.status);
  }
  if (filter.reason) {
    whereClauses.push('reason = ?');
    params.push(filter.reason);
  }
  if (filter.scheduleId) {
    whereClauses.push('schedule_id = ?');
    params.push(filter.scheduleId);
  }
  if (filter.exceptionId) {
    whereClauses.push('exception_id = ?');
    params.push(filter.exceptionId);
  }
  if (filter.startDate) {
    whereClauses.push('applied_at >= ?');
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    whereClauses.push('applied_at <= ?');
    params.push(filter.endDate);
  }
  if (filter.keyword) {
    whereClauses.push('(user_name LIKE ? OR phone LIKE ? OR order_id LIKE ?)');
    const keyword = `%${filter.keyword}%`;
    params.push(keyword, keyword, keyword);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countResult = getQuery<any>(
    `SELECT COUNT(*) as total FROM refunds ${whereSql}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = allQuery<any>(
    `SELECT 
      id, order_id as orderId, schedule_id as scheduleId, exception_id as exceptionId,
      user_id as userId, user_name as userName, phone, ticket_count as ticketCount,
      total_amount as totalAmount, reason, status, applied_at as appliedAt,
      approved_by as approvedBy, approved_at as approvedAt,
      reject_reason as rejectReason, processed_at as processedAt, remark
     FROM refunds 
     ${whereSql}
     ORDER BY applied_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    list: rows,
    total,
    page,
    pageSize
  };
}

export function approveRefund(
  id: string,
  approvedBy: string
): Refund | undefined {
  const refund = getRefundById(id);
  if (!refund) {
    throw new Error('退票记录不存在');
  }

  if (refund.status !== RefundStatus.PENDING) {
    throw new Error('只有待审核状态的退票才能审批');
  }

  const now = new Date().toISOString();

  runQuery(
    `UPDATE refunds 
     SET status = ?, approved_by = ?, approved_at = ?
     WHERE id = ?`,
    [RefundStatus.APPROVED, approvedBy, now, id]
  );

  return getRefundById(id);
}

export function rejectRefund(
  id: string,
  approvedBy: string,
  rejectReason: string
): Refund | undefined {
  const refund = getRefundById(id);
  if (!refund) {
    throw new Error('退票记录不存在');
  }

  if (refund.status !== RefundStatus.PENDING) {
    throw new Error('只有待审核状态的退票才能驳回');
  }

  const now = new Date().toISOString();

  runQuery(
    `UPDATE refunds 
     SET status = ?, approved_by = ?, approved_at = ?, reject_reason = ?
     WHERE id = ?`,
    [RefundStatus.REJECTED, approvedBy, now, rejectReason, id]
  );

  return getRefundById(id);
}

export function processRefund(
  id: string
): Refund | undefined {
  const refund = getRefundById(id);
  if (!refund) {
    throw new Error('退票记录不存在');
  }

  if (refund.status !== RefundStatus.APPROVED) {
    throw new Error('只有已审批状态的退票才能执行退款');
  }

  const now = new Date().toISOString();

  runQuery(
    `UPDATE refunds 
     SET status = ?, processed_at = ?
     WHERE id = ?`,
    [RefundStatus.PROCESSED, now, id]
  );

  return getRefundById(id);
}

export function getRefundsByExceptionId(exceptionId: string): Refund[] {
  const rows = allQuery<any>(
    `SELECT 
      id, order_id as orderId, schedule_id as scheduleId, exception_id as exceptionId,
      user_id as userId, user_name as userName, phone, ticket_count as ticketCount,
      total_amount as totalAmount, reason, status, applied_at as appliedAt,
      approved_by as approvedBy, approved_at as approvedAt,
      reject_reason as rejectReason, processed_at as processedAt, remark
     FROM refunds 
     WHERE exception_id = ?
     ORDER BY applied_at DESC`,
    [exceptionId]
  );
  return rows;
}

export function getRefundStatistics() {
  const rows = allQuery<any>(
    `SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount
     FROM refunds 
     GROUP BY status`
  );

  const stats: Record<string, { count: number; amount: number }> = {};
  let totalCount = 0;
  let totalAmount = 0;

  rows.forEach(row => {
    stats[row.status] = { count: row.count, amount: row.amount };
    totalCount += row.count;
    totalAmount += row.amount;
  });

  return {
    totalCount,
    totalAmount,
    byStatus: stats,
    pending: stats[RefundStatus.PENDING] || { count: 0, amount: 0 },
    approved: stats[RefundStatus.APPROVED] || { count: 0, amount: 0 },
    processed: stats[RefundStatus.PROCESSED] || { count: 0, amount: 0 },
    rejected: stats[RefundStatus.REJECTED] || { count: 0, amount: 0 }
  };
}

export function getRefundReviewList(
  startDate?: string,
  endDate?: string,
  page: number = 1,
  pageSize: number = 20,
  reason?: string
): PaginatedResponse<any> {
  const offset = (page - 1) * pageSize;

  const whereClauses: string[] = ['status IN (?, ?, ?)'];
  const params: any[] = [RefundStatus.PROCESSED, RefundStatus.REJECTED, RefundStatus.FAILED];

  if (startDate) {
    whereClauses.push('applied_at >= ?');
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push('applied_at <= ?');
    params.push(endDate);
  }
  if (reason) {
    whereClauses.push('reason = ?');
    params.push(reason);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  const countResult = getQuery<any>(
    `SELECT COUNT(*) as total FROM refunds ${whereSql}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = allQuery<any>(
    `SELECT 
      r.id, r.order_id as orderId, r.schedule_id as scheduleId, r.exception_id as exceptionId,
      r.user_name as userName, r.phone, r.ticket_count as ticketCount,
      r.total_amount as totalAmount, r.reason, r.status, r.applied_at as appliedAt,
      r.approved_by as approvedBy, r.approved_at as approvedAt,
      r.processed_at as processedAt, r.reject_reason as rejectReason,
      s.movie_name as movieName, s.start_time as startTime
     FROM refunds r
     LEFT JOIN schedules s ON r.schedule_id = s.id
     ${whereSql}
     ORDER BY r.applied_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    list: rows,
    total,
    page,
    pageSize
  };
}
