import { v4 as uuidv4 } from 'uuid';
import { allQuery, getQuery, runQuery } from '../database/connection';
import {
  ScreeningException,
  ScreeningExceptionStatus,
  ScreeningExceptionType,
  ScreeningExceptionFilter,
  PaginatedResponse,
  UserRole,
  RefundReason,
  Refund
} from '../types';
import * as refundService from './refundService';

const statusTransitions: Record<ScreeningExceptionStatus, ScreeningExceptionStatus[]> = {
  [ScreeningExceptionStatus.REPORTED]: [
    ScreeningExceptionStatus.PROCESSING,
    ScreeningExceptionStatus.RESOLVED
  ],
  [ScreeningExceptionStatus.PROCESSING]: [
    ScreeningExceptionStatus.HALL_CHANGED,
    ScreeningExceptionStatus.REFUND_INITIATED,
    ScreeningExceptionStatus.RESOLVED
  ],
  [ScreeningExceptionStatus.HALL_CHANGED]: [
    ScreeningExceptionStatus.RESOLVED,
    ScreeningExceptionStatus.REFUND_INITIATED
  ],
  [ScreeningExceptionStatus.REFUND_INITIATED]: [
    ScreeningExceptionStatus.RESOLVED
  ],
  [ScreeningExceptionStatus.RESOLVED]: [
    ScreeningExceptionStatus.CLOSED
  ],
  [ScreeningExceptionStatus.CLOSED]: []
};

interface CreateExceptionParams {
  scheduleId: string;
  type: ScreeningExceptionType;
  title: string;
  description: string;
  reportedBy: string;
  currentHallId?: string;
  affectedTicketCount?: number;
}

export function createException(params: CreateExceptionParams): ScreeningException {
  const id = uuidv4();
  const now = new Date().toISOString();
  const affectedCount = params.affectedTicketCount || 0;

  runQuery(
    `INSERT INTO screening_exceptions (
      id, schedule_id, type, status, title, description, 
      reported_by, reported_at, current_hall_id, affected_ticket_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, params.scheduleId, params.type, ScreeningExceptionStatus.REPORTED,
      params.title, params.description, params.reportedBy, now,
      params.currentHallId, affectedCount
    ]
  );

  return getExceptionById(id) as ScreeningException;
}

export function getExceptionById(id: string): ScreeningException | undefined {
  const row = getQuery<any>(
    `SELECT 
      id, schedule_id as scheduleId, type, status, title, description,
      reported_by as reportedBy, reported_at as reportedAt,
      current_hall_id as currentHallId, target_hall_id as targetHallId,
      affected_ticket_count as affectedTicketCount,
      handled_by as handledBy, handled_at as handledAt, resolution
     FROM screening_exceptions WHERE id = ?`,
    [id]
  );
  return row;
}

export function getExceptionList(
  filter: ScreeningExceptionFilter,
  userRole?: UserRole
): PaginatedResponse<ScreeningException> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filter.status) {
    whereClauses.push('status = ?');
    params.push(filter.status);
  }
  if (filter.type) {
    whereClauses.push('type = ?');
    params.push(filter.type);
  }
  if (filter.scheduleId) {
    whereClauses.push('schedule_id = ?');
    params.push(filter.scheduleId);
  }
  if (filter.startDate) {
    whereClauses.push('reported_at >= ?');
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    whereClauses.push('reported_at <= ?');
    params.push(filter.endDate);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countResult = getQuery<any>(
    `SELECT COUNT(*) as total FROM screening_exceptions ${whereSql}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = allQuery<any>(
    `SELECT 
      id, schedule_id as scheduleId, type, status, title, description,
      reported_by as reportedBy, reported_at as reportedAt,
      current_hall_id as currentHallId, target_hall_id as targetHallId,
      affected_ticket_count as affectedTicketCount,
      handled_by as handledBy, handled_at as handledAt, resolution
     FROM screening_exceptions 
     ${whereSql}
     ORDER BY reported_at DESC
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

export function updateExceptionStatus(
  id: string,
  newStatus: ScreeningExceptionStatus,
  handledBy: string,
  resolution?: string
): ScreeningException | undefined {
  const exception = getExceptionById(id);
  if (!exception) {
    throw new Error('异常记录不存在');
  }

  const allowedTransitions = statusTransitions[exception.status];
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`无法从 ${exception.status} 状态转移到 ${newStatus}`);
  }

  const now = new Date().toISOString();

  runQuery(
    `UPDATE screening_exceptions 
     SET status = ?, handled_by = ?, handled_at = ?, resolution = COALESCE(?, resolution)
     WHERE id = ?`,
    [newStatus, handledBy, now, resolution || null, id]
  );

  return getExceptionById(id);
}

export function processHallChange(
  id: string,
  targetHallId: string,
  handledBy: string
): ScreeningException | undefined {
  const exception = getExceptionById(id);
  if (!exception) {
    throw new Error('异常记录不存在');
  }

  if (exception.status !== ScreeningExceptionStatus.PROCESSING) {
    throw new Error('只有处理中状态的异常才能执行换厅');
  }

  const now = new Date().toISOString();

  runQuery(
    `UPDATE screening_exceptions 
     SET status = ?, target_hall_id = ?, handled_by = ?, handled_at = ?
     WHERE id = ?`,
    [ScreeningExceptionStatus.HALL_CHANGED, targetHallId, handledBy, now, id]
  );

  return getExceptionById(id);
}

export function initiateRefundForException(
  id: string,
  handledBy: string
): { exception: ScreeningException | undefined; refunds: Refund[] } {
  const exception = getExceptionById(id);
  if (!exception) {
    throw new Error('异常记录不存在');
  }

  const validStatuses = [
    ScreeningExceptionStatus.PROCESSING,
    ScreeningExceptionStatus.HALL_CHANGED
  ];
  if (!validStatuses.includes(exception.status)) {
    throw new Error('当前状态无法发起退票流程');
  }

  const now = new Date().toISOString();

  runQuery(
    `UPDATE screening_exceptions 
     SET status = ?, handled_by = ?, handled_at = ?
     WHERE id = ?`,
    [ScreeningExceptionStatus.REFUND_INITIATED, handledBy, now, id]
  );

  const existingRefunds = refundService.getRefundsByExceptionId(id);
  
  if (existingRefunds.length === 0) {
    const schedule = getQuery<any>(
      `SELECT id, movie_name as movieName, start_time as startTime 
       FROM schedules WHERE id = ?`,
      [exception.scheduleId]
    );
    
    const affectedCount = exception.affectedTicketCount || 10;
    const avgPrice = 45;
    
    for (let i = 0; i < Math.min(3, Math.ceil(affectedCount / 20)); i++) {
      refundService.createRefund({
        orderId: `ORD-EXC-${id.slice(-6)}-${i + 1}`,
        scheduleId: exception.scheduleId,
        exceptionId: id,
        userId: `auto-user-${id.slice(-4)}-${i}`,
        userName: `观众${i + 1}`,
        phone: `138${String(10000000 + Math.floor(Math.random() * 90000000)).slice(0, 8)}`,
        ticketCount: Math.floor(Math.random() * 4) + 1,
        totalAmount: avgPrice * (Math.floor(Math.random() * 4) + 1),
        reason: RefundReason.SCREENING_EXCEPTION,
        remark: '放映异常自动生成退票申请'
      });
    }
  }

  const updatedException = getExceptionById(id);
  const refunds = refundService.getRefundsByExceptionId(id);

  return {
    exception: updatedException,
    refunds
  };
}

export function closeException(
  id: string,
  handledBy: string,
  resolution: string
): ScreeningException | undefined {
  const exception = getExceptionById(id);
  if (!exception) {
    throw new Error('异常记录不存在');
  }

  if (exception.status !== ScreeningExceptionStatus.RESOLVED) {
    throw new Error('只有已解决状态的异常才能关闭');
  }

  const now = new Date().toISOString();

  runQuery(
    `UPDATE screening_exceptions 
     SET status = ?, handled_by = ?, handled_at = ?, resolution = ?
     WHERE id = ?`,
    [ScreeningExceptionStatus.CLOSED, handledBy, now, resolution, id]
  );

  return getExceptionById(id);
}

export function getExceptionStatistics() {
  const rows = allQuery<any>(
    `SELECT status, COUNT(*) as count 
     FROM screening_exceptions 
     GROUP BY status`
  );

  const stats: Record<string, number> = {};
  rows.forEach(row => {
    stats[row.status] = row.count;
  });

  return {
    total: rows.reduce((sum, r) => sum + r.count, 0),
    byStatus: stats,
    processing: stats[ScreeningExceptionStatus.PROCESSING] || 0,
    pending: stats[ScreeningExceptionStatus.REPORTED] || 0,
    closed: stats[ScreeningExceptionStatus.CLOSED] || 0,
    stuck: (stats[ScreeningExceptionStatus.PROCESSING] || 0) + (stats[ScreeningExceptionStatus.REPORTED] || 0)
  };
}
