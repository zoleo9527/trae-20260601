import { getDb } from './index';
import {
  Lead,
  FollowupRecord,
  StatusTransition,
  ExceptionLog,
  User,
  Role,
  LeadStatus,
} from '../types';

export async function getCurrentUser(): Promise<User> {
  const db = await getDb();
  const result = await db.select<{ value: string }[]>(
    "SELECT value FROM app_settings WHERE key = 'current_user_id'"
  );
  const userId = result[0]?.value || 'user_1';
  const users = await db.select<User[]>(
    'SELECT id, name, role, avatar FROM users WHERE id = ?',
    [userId]
  );
  return users[0];
}

export async function setCurrentUser(userId: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('current_user_id', ?, CURRENT_TIMESTAMP)",
    [userId]
  );
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  return await db.select<User[]>(
    'SELECT id, name, role, avatar FROM users ORDER BY name'
  );
}

export async function getUsersByRole(role: Role): Promise<User[]> {
  const db = await getDb();
  return await db.select<User[]>(
    'SELECT id, name, role, avatar FROM users WHERE role = ? ORDER BY name',
    [role]
  );
}

export async function insertLead(lead: Omit<Lead, 'id'>): Promise<string> {
  const db = await getDb();
  const id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await db.execute(
    `INSERT INTO leads (
      id, company_name, contact_person, contact_phone, industry, required_area, budget,
      status, source_type, source_reference, source_uploaded_at, source_uploaded_by,
      assigned_to, assigned_role, assigned_at, current_responsible, current_responsible_role,
      created_at, updated_at, created_by, priority, tags, remark,
      has_exception, exception_type, exception_message, exception_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      lead.companyName,
      lead.contactPerson,
      lead.contactPhone,
      lead.industry,
      lead.requiredArea,
      lead.budget,
      lead.status,
      lead.source.type,
      lead.source.reference,
      lead.source.uploadedAt,
      lead.source.uploadedBy,
      lead.assignedTo,
      lead.assignedRole,
      lead.assignedAt,
      lead.currentResponsible,
      lead.currentResponsibleRole,
      lead.createdAt,
      lead.updatedAt,
      lead.createdBy,
      lead.priority,
      JSON.stringify(lead.tags),
      lead.remark,
      lead.hasException ? 1 : 0,
      lead.exceptionType,
      lead.exceptionMessage,
      lead.exceptionAt,
    ]
  );
  return id;
}

export async function updateLead(
  id: string,
  updates: Partial<Lead>
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const fieldMap: Record<string, string> = {
    companyName: 'company_name',
    contactPerson: 'contact_person',
    contactPhone: 'contact_phone',
    requiredArea: 'required_area',
    sourceType: 'source_type',
    sourceReference: 'source_reference',
    assignedTo: 'assigned_to',
    assignedRole: 'assigned_role',
    assignedAt: 'assigned_at',
    currentResponsible: 'current_responsible',
    currentResponsibleRole: 'current_responsible_role',
    hasException: 'has_exception',
    exceptionType: 'exception_type',
    exceptionMessage: 'exception_message',
    exceptionAt: 'exception_at',
  };

  for (const [key, value] of Object.entries(updates)) {
    const dbField = fieldMap[key] || key;
    if (dbField === 'tags' && Array.isArray(value)) {
      fields.push(`${dbField} = ?`);
      values.push(JSON.stringify(value));
    } else if (dbField === 'has_exception') {
      fields.push(`${dbField} = ?`);
      values.push(value ? 1 : 0);
    } else if (value !== undefined) {
      fields.push(`${dbField} = ?`);
      values.push(value);
    }
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db.execute(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const db = await getDb();
  const rows = await db.select<Lead[]>(
    'SELECT * FROM leads WHERE id = ?',
    [id]
  );
  return rows[0] ? mapLeadRow(rows[0]) : null;
}

export interface LeadFilter {
  status?: LeadStatus[];
  assignedTo?: string;
  currentResponsible?: string;
  hasException?: boolean;
  priority?: ('high' | 'medium' | 'low')[];
  keyword?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
}

export async function getLeads(filter: LeadFilter = {}): Promise<{
  data: Lead[];
  total: number;
}> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (filter.status?.length) {
    conditions.push(`status IN (${filter.status.map(() => '?').join(', ')})`);
    params.push(...filter.status);
  }

  if (filter.assignedTo) {
    conditions.push('assigned_to = ?');
    params.push(filter.assignedTo);
  }

  if (filter.currentResponsible) {
    conditions.push('current_responsible = ?');
    params.push(filter.currentResponsible);
  }

  if (filter.hasException !== undefined) {
    conditions.push('has_exception = ?');
    params.push(filter.hasException ? 1 : 0);
  }

  if (filter.priority?.length) {
    conditions.push(`priority IN (${filter.priority.map(() => '?').join(', ')})`);
    params.push(...filter.priority);
  }

  if (filter.keyword) {
    conditions.push(
      '(company_name LIKE ? OR contact_person LIKE ? OR contact_phone LIKE ? OR industry LIKE ?)'
    );
    const keyword = `%${filter.keyword}%`;
    params.push(keyword, keyword, keyword, keyword);
  }

  if (filter.createdFrom) {
    conditions.push('created_at >= ?');
    params.push(filter.createdFrom);
  }

  if (filter.createdTo) {
    conditions.push('created_at <= ?');
    params.push(filter.createdTo);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countResult = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM leads ${whereClause}`,
    params
  );

  const page = filter.page || 1;
  const pageSize = filter.pageSize || 50;
  const offset = (page - 1) * pageSize;

  const rows = await db.select<Lead[]>(
    `SELECT * FROM leads ${whereClause} ORDER BY
      has_exception DESC,
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapLeadRow),
    total: countResult[0]?.count || 0,
  };
}

function mapLeadRow(row: any): Lead {
  return {
    id: row.id,
    companyName: row.company_name,
    contactPerson: row.contact_person,
    contactPhone: row.contact_phone,
    industry: row.industry,
    requiredArea: row.required_area,
    budget: row.budget,
    status: row.status,
    source: {
      type: row.source_type,
      reference: row.source_reference,
      uploadedAt: row.source_uploaded_at,
      uploadedBy: row.source_uploaded_by,
    },
    assignedTo: row.assigned_to,
    assignedRole: row.assigned_role,
    assignedAt: row.assigned_at,
    currentResponsible: row.current_responsible,
    currentResponsibleRole: row.current_responsible_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    priority: row.priority,
    tags: row.tags ? JSON.parse(row.tags) : [],
    remark: row.remark,
    hasException: row.has_exception === 1,
    exceptionType: row.exception_type,
    exceptionMessage: row.exception_message,
    exceptionAt: row.exception_at,
  };
}

export async function insertFollowup(
  followup: Omit<FollowupRecord, 'id'>
): Promise<string> {
  const db = await getDb();
  const id = `followup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await db.execute(
    `INSERT INTO followup_records (
      id, lead_id, type, content, location, scheduled_at, started_at, completed_at,
      status, handled_by, handled_role, next_action, next_action_at,
      next_responsible, next_responsible_role, created_at, updated_at, attachments
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      followup.leadId,
      followup.type,
      followup.content,
      followup.location,
      followup.scheduledAt,
      followup.startedAt,
      followup.completedAt,
      followup.status,
      followup.handledBy,
      followup.handledRole,
      followup.nextAction,
      followup.nextActionAt,
      followup.nextResponsible,
      followup.nextResponsibleRole,
      followup.createdAt,
      followup.updatedAt,
      JSON.stringify(followup.attachments),
    ]
  );
  return id;
}

export async function updateFollowup(
  id: string,
  updates: Partial<FollowupRecord>
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const fieldMap: Record<string, string> = {
    leadId: 'lead_id',
    scheduledAt: 'scheduled_at',
    startedAt: 'started_at',
    completedAt: 'completed_at',
    handledBy: 'handled_by',
    handledRole: 'handled_role',
    nextAction: 'next_action',
    nextActionAt: 'next_action_at',
    nextResponsible: 'next_responsible',
    nextResponsibleRole: 'next_responsible_role',
  };

  for (const [key, value] of Object.entries(updates)) {
    const dbField = fieldMap[key] || key;
    if (dbField === 'attachments' && Array.isArray(value)) {
      fields.push(`${dbField} = ?`);
      values.push(JSON.stringify(value));
    } else if (value !== undefined) {
      fields.push(`${dbField} = ?`);
      values.push(value);
    }
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db.execute(
    `UPDATE followup_records SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function getFollowupsByLeadId(
  leadId: string
): Promise<FollowupRecord[]> {
  const db = await getDb();
  const rows = await db.select<FollowupRecord[]>(
    'SELECT * FROM followup_records WHERE lead_id = ? ORDER BY created_at DESC',
    [leadId]
  );
  return rows.map(mapFollowupRow);
}

function mapFollowupRow(row: any): FollowupRecord {
  return {
    id: row.id,
    leadId: row.lead_id,
    type: row.type,
    content: row.content,
    location: row.location,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    handledBy: row.handled_by,
    handledRole: row.handled_role,
    nextAction: row.next_action,
    nextActionAt: row.next_action_at,
    nextResponsible: row.next_responsible,
    nextResponsibleRole: row.next_responsible_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
  };
}

export async function insertTransition(
  transition: Omit<StatusTransition, 'id'>
): Promise<string> {
  const db = await getDb();
  const id = `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await db.execute(
    `INSERT INTO status_transitions (
      id, lead_id, followup_id, from_status, to_status, from_followup_status,
      to_followup_status, from_responsible, to_responsible, from_responsible_role,
      to_responsible_role, transitioned_at, transitioned_by, transitioned_by_role,
      remark, is_gap_detected, gap_duration_minutes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      transition.leadId,
      transition.followupId,
      transition.fromStatus,
      transition.toStatus,
      transition.fromFollowupStatus,
      transition.toFollowupStatus,
      transition.fromResponsible,
      transition.toResponsible,
      transition.fromResponsibleRole,
      transition.toResponsibleRole,
      transition.transitionedAt,
      transition.transitionedBy,
      transition.transitionedByRole,
      transition.remark,
      transition.isGapDetected ? 1 : 0,
      transition.gapDurationMinutes,
    ]
  );
  return id;
}

export async function getLastTransitionByLeadId(
  leadId: string
): Promise<StatusTransition | null> {
  const db = await getDb();
  const rows = await db.select<StatusTransition[]>(
    'SELECT * FROM status_transitions WHERE lead_id = ? ORDER BY transitioned_at DESC LIMIT 1',
    [leadId]
  );
  return rows[0] ? mapTransitionRow(rows[0]) : null;
}

export async function getTransitionsByLeadId(
  leadId: string
): Promise<StatusTransition[]> {
  const db = await getDb();
  const rows = await db.select<StatusTransition[]>(
    'SELECT * FROM status_transitions WHERE lead_id = ? ORDER BY transitioned_at ASC',
    [leadId]
  );
  return rows.map(mapTransitionRow);
}

function mapTransitionRow(row: any): StatusTransition {
  return {
    id: row.id,
    leadId: row.lead_id,
    followupId: row.followup_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    fromFollowupStatus: row.from_followup_status,
    toFollowupStatus: row.to_followup_status,
    fromResponsible: row.from_responsible,
    toResponsible: row.to_responsible,
    fromResponsibleRole: row.from_responsible_role,
    toResponsibleRole: row.to_responsible_role,
    transitionedAt: row.transitioned_at,
    transitionedBy: row.transitioned_by,
    transitionedByRole: row.transitioned_by_role,
    remark: row.remark,
    isGapDetected: row.is_gap_detected === 1,
    gapDurationMinutes: row.gap_duration_minutes,
  };
}

export async function insertException(
  exception: Omit<ExceptionLog, 'id'>
): Promise<string> {
  const db = await getDb();
  const id = `exception_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await db.execute(
    `INSERT INTO exception_logs (
      id, lead_id, followup_id, type, message, detected_at, handled,
      handled_at, handled_by, handled_remark, triggered_by_transition_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      exception.leadId,
      exception.followupId,
      exception.type,
      exception.message,
      exception.detectedAt,
      exception.handled ? 1 : 0,
      exception.handledAt,
      exception.handledBy,
      exception.handledRemark,
      exception.triggeredByTransitionId,
    ]
  );
  return id;
}

export async function updateException(
  id: string,
  updates: Partial<ExceptionLog>
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const fieldMap: Record<string, string> = {
    leadId: 'lead_id',
    followupId: 'followup_id',
    detectedAt: 'detected_at',
    handledAt: 'handled_at',
    handledBy: 'handled_by',
    handledRemark: 'handled_remark',
    triggeredByTransitionId: 'triggered_by_transition_id',
  };

  for (const [key, value] of Object.entries(updates)) {
    const dbField = fieldMap[key] || key;
    if (dbField === 'handled') {
      fields.push(`${dbField} = ?`);
      values.push(value ? 1 : 0);
    } else if (value !== undefined) {
      fields.push(`${dbField} = ?`);
      values.push(value);
    }
  }

  values.push(id);

  await db.execute(
    `UPDATE exception_logs SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function getUnhandledExceptions(
  leadId?: string
): Promise<ExceptionLog[]> {
  const db = await getDb();
  let query = 'SELECT * FROM exception_logs WHERE handled = 0';
  const params: any[] = [];

  if (leadId) {
    query += ' AND lead_id = ?';
    params.push(leadId);
  }

  query += ' ORDER BY detected_at DESC';

  const rows = await db.select<ExceptionLog[]>(query, params);
  return rows.map(mapExceptionRow);
}

export async function getExceptionsByLeadId(
  leadId: string
): Promise<ExceptionLog[]> {
  const db = await getDb();
  const rows = await db.select<ExceptionLog[]>(
    'SELECT * FROM exception_logs WHERE lead_id = ? ORDER BY detected_at DESC',
    [leadId]
  );
  return rows.map(mapExceptionRow);
}

function mapExceptionRow(row: any): ExceptionLog {
  return {
    id: row.id,
    leadId: row.lead_id,
    followupId: row.followup_id,
    type: row.type,
    message: row.message,
    detectedAt: row.detected_at,
    handled: row.handled === 1,
    handledAt: row.handled_at,
    handledBy: row.handled_by,
    handledRemark: row.handled_remark,
    triggeredByTransitionId: row.triggered_by_transition_id,
  };
}

export async function getExceptionStats(): Promise<{
  total: number;
  byType: Record<string, number>;
}> {
  const db = await getDb();
  const totalResult = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM exception_logs WHERE handled = 0'
  );

  const byTypeResult = await db.select<{ type: string; count: number }[]>(
    'SELECT type, COUNT(*) as count FROM exception_logs WHERE handled = 0 GROUP BY type'
  );

  const byType: Record<string, number> = {};
  for (const row of byTypeResult) {
    byType[row.type] = row.count;
  }

  return {
    total: totalResult[0]?.count || 0,
    byType,
  };
}

export async function executeRawSql(sql: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  await db.execute(sql, params);
}
