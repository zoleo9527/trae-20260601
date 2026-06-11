import { getDb } from '../db/database.js';
import { getUserById, getUsersByRole } from './userService.js';
import { getInspectionById, updateInspectionStatus } from './inspectionService.js';
import type { Dispatch, CreateDispatchRequest, UpdateDispatchRequest, InspectionStatus, UserRole } from '../../shared/types.js';

export function getAllDispatches(): Dispatch[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT d.*,
           u1.name as dispatcher_name,
           u2.name as receiver_name
    FROM dispatches d
    LEFT JOIN users u1 ON d.dispatcher_id = u1.id
    LEFT JOIN users u2 ON d.receiver_id = u2.id
    ORDER BY d.dispatch_time DESC
  `).all() as any[];

  return rows.map(row => ({
    id: row.id,
    inspectionId: row.inspection_id,
    dispatcherId: row.dispatcher_id,
    dispatcherName: row.dispatcher_name,
    receiverId: row.receiver_id,
    receiverName: row.receiver_name,
    dispatchTime: row.dispatch_time,
    expectedCompletionTime: row.expected_completion_time,
    actualCompletionTime: row.actual_completion_time,
    dispatchRemark: row.dispatch_remark,
    rectificationRemark: row.rectification_remark
  }));
}

export function getDispatchById(id: string): Dispatch | undefined {
  const db = getDb();
  const row = db.prepare(`
    SELECT d.*,
           u1.name as dispatcher_name,
           u2.name as receiver_name
    FROM dispatches d
    LEFT JOIN users u1 ON d.dispatcher_id = u1.id
    LEFT JOIN users u2 ON d.receiver_id = u2.id
    WHERE d.id = ?
  `).get(id) as any;

  if (!row) return undefined;

  return {
    id: row.id,
    inspectionId: row.inspection_id,
    dispatcherId: row.dispatcher_id,
    dispatcherName: row.dispatcher_name,
    receiverId: row.receiver_id,
    receiverName: row.receiver_name,
    dispatchTime: row.dispatch_time,
    expectedCompletionTime: row.expected_completion_time,
    actualCompletionTime: row.actual_completion_time,
    dispatchRemark: row.dispatch_remark,
    rectificationRemark: row.rectification_remark
  };
}

export function createDispatch(
  data: CreateDispatchRequest,
  dispatcherId: string
): Dispatch {
  const db = getDb();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const id = `d${Date.now()}`;

  const dispatcher = getUserById(dispatcherId);
  if (!dispatcher) {
    throw new Error('Dispatcher not found');
  }

  const receiver = getUserById(data.receiverId);
  if (!receiver) {
    throw new Error('Receiver not found');
  }

  const inspection = getInspectionById(data.inspectionId);
  if (!inspection) {
    throw new Error('Inspection not found');
  }

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO dispatches (
        id, inspection_id, dispatcher_id, receiver_id,
        dispatch_time, expected_completion_time, dispatch_remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.inspectionId,
      dispatcherId,
      data.receiverId,
      now,
      data.expectedCompletionTime || null,
      data.dispatchRemark
    );

    updateInspectionStatus(
      data.inspectionId,
      'dispatched' as InspectionStatus,
      dispatcherId,
      data.dispatchRemark
    );
  });

  tx();

  const dispatch = getDispatchById(id);
  if (!dispatch) {
    throw new Error('Failed to create dispatch');
  }

  return dispatch;
}

export function updateDispatch(
  id: string,
  data: UpdateDispatchRequest,
  operatorId: string
): Dispatch | undefined {
  const db = getDb();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const dispatch = getDispatchById(id);
  if (!dispatch) return undefined;

  const operator = getUserById(operatorId);
  if (!operator) {
    throw new Error('Operator not found');
  }

  const tx = db.transaction(() => {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.expectedCompletionTime !== undefined) {
      updates.push('expected_completion_time = ?');
      params.push(data.expectedCompletionTime);
    }
    if (data.rectificationRemark !== undefined) {
      updates.push('rectification_remark = ?');
      params.push(data.rectificationRemark);
    }
    if (data.isCompleted) {
      updates.push('actual_completion_time = ?');
      params.push(now);
    }

    params.push(id);

    if (updates.length > 0) {
      db.prepare(`
        UPDATE dispatches
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...params);
    }

    if (data.isCompleted) {
      updateInspectionStatus(
        dispatch.inspectionId,
        'completed' as InspectionStatus,
        operatorId,
        data.rectificationRemark
      );
      updateInspectionStatus(
        dispatch.inspectionId,
        'pending_review_after' as InspectionStatus,
        operatorId,
        '申请复查'
      );
    } else if (data.expectedCompletionTime && dispatch.dispatchTime) {
      updateInspectionStatus(
        dispatch.inspectionId,
        'in_progress' as InspectionStatus,
        operatorId,
        `预计完成时间：${data.expectedCompletionTime}`
      );
    }
  });

  tx();

  return getDispatchById(id);
}

export function getAvailableReceivers(): Array<{ id: string; name: string; department: string }> {
  return getUsersByRole('property' as UserRole).map(u => ({
    id: u.id,
    name: u.name,
    department: u.department
  }));
}
