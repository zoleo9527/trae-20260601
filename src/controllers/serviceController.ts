import { Request, Response } from 'express';
import { getDatabase } from '../lib/database';
import { ServiceRecord, ServiceCreateRequest, CheckinRequest, ConfirmRequest, RejectRequest } from '../types';

export function createServiceRecord(req: Request, res: Response) {
  const { volunteer_id, service_type, service_date, start_time, location, description } = req.body as ServiceCreateRequest;
  
  if (!volunteer_id || !service_type || !service_date || !start_time || !location) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const db = getDatabase();
  const userId = req.user?.id || 0;

  const result = db.prepare(
    'INSERT INTO service_records (user_id, volunteer_id, service_type, service_date, start_time, location, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, volunteer_id, service_type, service_date, start_time, location, description || '', userId);

  const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(result.lastInsertRowid) as ServiceRecord;
  res.status(201).json(record);
}

export function getServiceRecords(req: Request, res: Response) {
  const db = getDatabase();
  const { status, date, volunteer_id } = req.query;

  let query = `
    SELECT sr.*, v.name as volunteer_name, v.phone as volunteer_phone, 
           u.name as creator_name, cu.name as confirmer_name, ru.name as rejecter_name
    FROM service_records sr
    LEFT JOIN volunteers v ON sr.volunteer_id = v.id
    LEFT JOIN users u ON sr.created_by = u.id
    LEFT JOIN users cu ON sr.confirmed_by = cu.id
    LEFT JOIN users ru ON sr.rejected_by = ru.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (status) {
    query += ' AND sr.status = ?';
    params.push(String(status));
  }
  if (date) {
    query += ' AND sr.service_date = ?';
    params.push(String(date));
  }
  if (volunteer_id) {
    query += ' AND sr.volunteer_id = ?';
    params.push(Number(volunteer_id));
  }

  query += ' ORDER BY sr.created_at DESC';

  const records = db.prepare(query).all(params) as ServiceRecord[];
  res.json(records);
}

export function getServiceRecordById(req: Request, res: Response) {
  const { id } = req.params;
  const db = getDatabase();

  const record = db.prepare(`
    SELECT sr.*, v.name as volunteer_name, v.phone as volunteer_phone, 
           u.name as creator_name, cu.name as confirmer_name, ru.name as rejecter_name
    FROM service_records sr
    LEFT JOIN volunteers v ON sr.volunteer_id = v.id
    LEFT JOIN users u ON sr.created_by = u.id
    LEFT JOIN users cu ON sr.confirmed_by = cu.id
    LEFT JOIN users ru ON sr.rejected_by = ru.id
    WHERE sr.id = ?
  `).get(id) as ServiceRecord | undefined;

  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  const checkin = db.prepare('SELECT * FROM checkin_records WHERE service_record_id = ?').get(id);
  const confirm = db.prepare('SELECT * FROM confirm_records WHERE service_record_id = ?').get(id);

  res.json({ ...record, checkin, confirm });
}

export function checkin(req: Request, res: Response) {
  const { service_record_id, checkin_location } = req.body as CheckinRequest;
  const userId = req.user?.id || 0;

  if (!service_record_id || !checkin_location) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const db = getDatabase();
  const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(service_record_id) as ServiceRecord | undefined;

  if (!record) {
    return res.status(404).json({ error: '服务记录不存在' });
  }

  if (record.status !== 'pending_checkin') {
    return res.status(400).json({ error: '当前状态不允许签到' });
  }

  db.prepare(
    'INSERT INTO checkin_records (service_record_id, checkin_time, checkin_location, checkin_by) VALUES (?, ?, ?, ?)'
  ).run(service_record_id, new Date().toISOString(), checkin_location, userId);

  db.prepare(
    'UPDATE service_records SET status = ?, updated_at = ? WHERE id = ?'
  ).run('checked_in', new Date().toISOString(), service_record_id);

  const updated = db.prepare(`
    SELECT sr.*, v.name as volunteer_name, v.phone as volunteer_phone
    FROM service_records sr
    LEFT JOIN volunteers v ON sr.volunteer_id = v.id
    WHERE sr.id = ?
  `).get(service_record_id) as ServiceRecord;

  res.json(updated);
}

export function completeService(req: Request, res: Response) {
  const { service_record_id, end_time, duration } = req.body;
  const userId = req.user?.id || 0;

  if (!service_record_id || !end_time || duration === undefined) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const db = getDatabase();
  const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(service_record_id) as ServiceRecord | undefined;

  if (!record) {
    return res.status(404).json({ error: '服务记录不存在' });
  }

  if (record.status !== 'checked_in') {
    return res.status(400).json({ error: '当前状态不允许完成服务' });
  }

  db.prepare(
    'UPDATE service_records SET status = ?, end_time = ?, duration = ?, updated_at = ? WHERE id = ?'
  ).run('pending_confirm', end_time, duration, new Date().toISOString(), service_record_id);

  const updated = db.prepare(`
    SELECT sr.*, v.name as volunteer_name, v.phone as volunteer_phone
    FROM service_records sr
    LEFT JOIN volunteers v ON sr.volunteer_id = v.id
    WHERE sr.id = ?
  `).get(service_record_id) as ServiceRecord;

  res.json(updated);
}

export function confirmDuration(req: Request, res: Response) {
  const { service_record_id, confirmed_duration, notes } = req.body as ConfirmRequest;
  const userId = req.user?.id || 0;

  if (!service_record_id || confirmed_duration === undefined) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const db = getDatabase();
  const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(service_record_id) as ServiceRecord | undefined;

  if (!record) {
    return res.status(404).json({ error: '服务记录不存在' });
  }

  if (record.status !== 'pending_confirm') {
    return res.status(400).json({ error: '当前状态不允许确认时长' });
  }

  db.prepare(
    'INSERT INTO confirm_records (service_record_id, confirm_time, confirmed_duration, confirmed_by, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(service_record_id, new Date().toISOString(), confirmed_duration, userId, notes || null);

  db.prepare(
    'UPDATE service_records SET status = ?, duration = ?, confirmed_by = ?, updated_at = ? WHERE id = ?'
  ).run('confirmed', confirmed_duration, userId, new Date().toISOString(), service_record_id);

  const updated = db.prepare(`
    SELECT sr.*, v.name as volunteer_name, v.phone as volunteer_phone
    FROM service_records sr
    LEFT JOIN volunteers v ON sr.volunteer_id = v.id
    WHERE sr.id = ?
  `).get(service_record_id) as ServiceRecord;

  res.json(updated);
}

export function rejectDuration(req: Request, res: Response) {
  const { service_record_id, reason } = req.body as RejectRequest;
  const userId = req.user?.id || 0;

  if (!service_record_id || !reason) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const db = getDatabase();
  const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(service_record_id) as ServiceRecord | undefined;

  if (!record) {
    return res.status(404).json({ error: '服务记录不存在' });
  }

  if (record.status !== 'pending_confirm') {
    return res.status(400).json({ error: '当前状态不允许退回' });
  }

  db.prepare(
    'UPDATE service_records SET status = ?, rejected_by = ?, reject_reason = ?, updated_at = ? WHERE id = ?'
  ).run('rejected', userId, reason, new Date().toISOString(), service_record_id);

  const updated = db.prepare(`
    SELECT sr.*, v.name as volunteer_name, v.phone as volunteer_phone
    FROM service_records sr
    LEFT JOIN volunteers v ON sr.volunteer_id = v.id
    WHERE sr.id = ?
  `).get(service_record_id) as ServiceRecord;

  res.json(updated);
}

export function resetRecord(req: Request, res: Response) {
  const { service_record_id } = req.body;

  if (!service_record_id) {
    return res.status(400).json({ error: '服务记录ID不能为空' });
  }

  const db = getDatabase();
  const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(service_record_id) as ServiceRecord | undefined;

  if (!record) {
    return res.status(404).json({ error: '服务记录不存在' });
  }

  db.prepare(
    'UPDATE service_records SET status = ?, end_time = ?, duration = ?, confirmed_by = ?, rejected_by = ?, reject_reason = ?, updated_at = ? WHERE id = ?'
  ).run('pending_checkin', null, null, null, null, null, new Date().toISOString(), service_record_id);

  db.prepare('DELETE FROM checkin_records WHERE service_record_id = ?').run(service_record_id);
  db.prepare('DELETE FROM confirm_records WHERE service_record_id = ?').run(service_record_id);

  const updated = db.prepare(`
    SELECT sr.*, v.name as volunteer_name, v.phone as volunteer_phone
    FROM service_records sr
    LEFT JOIN volunteers v ON sr.volunteer_id = v.id
    WHERE sr.id = ?
  `).get(service_record_id) as ServiceRecord;

  res.json(updated);
}

export function getTodayTasks(req: Request, res: Response) {
  const today = new Date().toISOString().split('T')[0];
  const db = getDatabase();

  const pendingConfirm = db.prepare(`
    SELECT sr.*, v.name as volunteer_name, v.phone as volunteer_phone
    FROM service_records sr
    LEFT JOIN volunteers v ON sr.volunteer_id = v.id
    WHERE sr.status = 'pending_confirm' AND sr.service_date = ?
    ORDER BY sr.created_at DESC
  `).all(today) as ServiceRecord[];

  const overdue = db.prepare(`
    SELECT sr.*, v.name as volunteer_name, v.phone as volunteer_phone
    FROM service_records sr
    LEFT JOIN volunteers v ON sr.volunteer_id = v.id
    WHERE sr.status IN ('pending_checkin', 'checked_in') AND sr.service_date < ?
    ORDER BY sr.service_date DESC
  `).all(today) as ServiceRecord[];

  const recentlyRejected = db.prepare(`
    SELECT sr.*, v.name as volunteer_name, v.phone as volunteer_phone
    FROM service_records sr
    LEFT JOIN volunteers v ON sr.volunteer_id = v.id
    WHERE sr.status = 'rejected' AND sr.updated_at >= datetime('now', '-1 day')
    ORDER BY sr.updated_at DESC
  `).all() as ServiceRecord[];

  res.json({
    pendingConfirm,
    overdue,
    recentlyRejected,
    pendingCount: pendingConfirm.length,
    overdueCount: overdue.length,
    rejectedCount: recentlyRejected.length
  });
}
