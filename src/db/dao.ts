import {
  getDb,
  getCurrentUser as dbGetCurrentUser,
  setCurrentUser as dbSetCurrentUser,
  getAllUsers as dbGetAllUsers,
  getUsersByRole as dbGetUsersByRole,
  insertLead as dbInsertLead,
  updateLead as dbUpdateLead,
  getLeadById as dbGetLeadById,
  getLeads as dbGetLeads,
  insertFollowup as dbInsertFollowup,
  updateFollowup as dbUpdateFollowup,
  getFollowupsByLeadId as dbGetFollowupsByLeadId,
  getAllFollowups as dbGetAllFollowups,
  insertTransition as dbInsertTransition,
  updateTransition as dbUpdateTransition,
  getLastTransitionByLeadId as dbGetLastTransitionByLeadId,
  getTransitionsByLeadId as dbGetTransitionsByLeadId,
  insertException as dbInsertException,
  updateException as dbUpdateException,
  getUnhandledExceptions as dbGetUnhandledExceptions,
  getExceptionsByLeadId as dbGetExceptionsByLeadId,
  getExceptionStats as dbGetExceptionStats,
  executeRawSql as dbExecuteRawSql,
  DbLead,
  DbFollowup,
  DbTransition,
  DbException,
  DbUser,
} from './index';
import {
  Lead,
  FollowupRecord,
  StatusTransition,
  ExceptionLog,
  User,
  Role,
  LeadStatus,
} from '../types';

export { getDb };
export { dbExecuteRawSql as executeRawSql };

function mapDbUserToUser(u: DbUser): User {
  return { id: u.id, name: u.name, role: u.role as Role, avatar: u.avatar };
}

function mapDbLeadToLead(row: DbLead): Lead {
  return {
    id: row.id,
    companyName: row.company_name,
    contactPerson: row.contact_person,
    contactPhone: row.contact_phone,
    industry: row.industry,
    requiredArea: row.required_area,
    budget: row.budget,
    status: row.status as LeadStatus,
    source: {
      type: row.source_type as Lead['source']['type'],
      reference: row.source_reference,
      uploadedAt: row.source_uploaded_at,
      uploadedBy: row.source_uploaded_by,
    },
    assignedTo: row.assigned_to,
    assignedRole: row.assigned_role as Role | null,
    assignedAt: row.assigned_at,
    currentResponsible: row.current_responsible,
    currentResponsibleRole: row.current_responsible_role as Role | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    priority: row.priority as Lead['priority'],
    tags: row.tags ? JSON.parse(row.tags) : [],
    remark: row.remark,
    hasException: row.has_exception === 1,
    exceptionType: row.exception_type as Lead['exceptionType'],
    exceptionMessage: row.exception_message,
    exceptionAt: row.exception_at,
  };
}

function mapLeadToDbLead(lead: Omit<Lead, 'id'>): Omit<DbLead, 'id'> {
  return {
    company_name: lead.companyName,
    contact_person: lead.contactPerson,
    contact_phone: lead.contactPhone,
    industry: lead.industry,
    required_area: lead.requiredArea,
    budget: lead.budget,
    status: lead.status,
    source_type: lead.source.type,
    source_reference: lead.source.reference,
    source_uploaded_at: lead.source.uploadedAt,
    source_uploaded_by: lead.source.uploadedBy,
    assigned_to: lead.assignedTo,
    assigned_role: lead.assignedRole,
    assigned_at: lead.assignedAt,
    current_responsible: lead.currentResponsible,
    current_responsible_role: lead.currentResponsibleRole,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
    created_by: lead.createdBy,
    priority: lead.priority,
    tags: JSON.stringify(lead.tags),
    remark: lead.remark,
    has_exception: lead.hasException ? 1 : 0,
    exception_type: lead.exceptionType,
    exception_message: lead.exceptionMessage,
    exception_at: lead.exceptionAt,
  };
}

const LEAD_FIELD_MAP: Record<string, string> = {
  companyName: 'company_name',
  contactPerson: 'contact_person',
  contactPhone: 'contact_phone',
  requiredArea: 'required_area',
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

function mapLeadUpdatesToDb(updates: Partial<Lead>): Partial<DbLead> {
  const dbUpdates: Record<string, any> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (key === 'source') {
      if (value && typeof value === 'object') {
        dbUpdates.source_type = (value as any).type;
        dbUpdates.source_reference = (value as any).reference;
        dbUpdates.source_uploaded_at = (value as any).uploadedAt;
        dbUpdates.source_uploaded_by = (value as any).uploadedBy;
      }
    } else if (key === 'tags') {
      dbUpdates.tags = JSON.stringify(value);
    } else if (key === 'hasException') {
      dbUpdates.has_exception = value ? 1 : 0;
    } else if (LEAD_FIELD_MAP[key]) {
      dbUpdates[LEAD_FIELD_MAP[key]] = value;
    } else if (['status', 'industry', 'budget', 'priority', 'remark', 'createdBy'].includes(key)) {
      dbUpdates[key] = value;
    }
  }
  return dbUpdates as Partial<DbLead>;
}

function mapDbFollowupToFollowup(row: DbFollowup): FollowupRecord {
  return {
    id: row.id,
    leadId: row.lead_id,
    type: row.type as FollowupRecord['type'],
    content: row.content,
    location: row.location || undefined,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status as FollowupRecord['status'],
    handledBy: row.handled_by,
    handledRole: row.handled_role as Role,
    nextAction: row.next_action,
    nextActionAt: row.next_action_at,
    nextResponsible: row.next_responsible,
    nextResponsibleRole: row.next_responsible_role as Role | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
  };
}

function mapFollowupToDbFollowup(f: Omit<FollowupRecord, 'id'>): Omit<DbFollowup, 'id'> {
  return {
    lead_id: f.leadId,
    type: f.type,
    content: f.content,
    location: f.location || null,
    scheduled_at: f.scheduledAt,
    started_at: f.startedAt,
    completed_at: f.completedAt,
    status: f.status,
    handled_by: f.handledBy,
    handled_role: f.handledRole,
    next_action: f.nextAction,
    next_action_at: f.nextActionAt,
    next_responsible: f.nextResponsible,
    next_responsible_role: f.nextResponsibleRole,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
    attachments: JSON.stringify(f.attachments),
  };
}

const FOLLOWUP_FIELD_MAP: Record<string, string> = {
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

function mapFollowupUpdatesToDb(updates: Partial<FollowupRecord>): Partial<DbFollowup> {
  const dbUpdates: Record<string, any> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (key === 'attachments') {
      dbUpdates.attachments = JSON.stringify(value);
    } else if (FOLLOWUP_FIELD_MAP[key]) {
      dbUpdates[FOLLOWUP_FIELD_MAP[key]] = value;
    } else if (['type', 'content', 'status', 'location'].includes(key)) {
      dbUpdates[key] = value;
    }
  }
  return dbUpdates as Partial<DbFollowup>;
}

function mapDbTransitionToTransition(row: DbTransition): StatusTransition {
  return {
    id: row.id,
    leadId: row.lead_id,
    followupId: row.followup_id,
    fromStatus: row.from_status as LeadStatus | null,
    toStatus: row.to_status as LeadStatus,
    fromFollowupStatus: row.from_followup_status as StatusTransition['fromFollowupStatus'],
    toFollowupStatus: row.to_followup_status as StatusTransition['toFollowupStatus'],
    fromResponsible: row.from_responsible,
    toResponsible: row.to_responsible,
    fromResponsibleRole: row.from_responsible_role as Role | null,
    toResponsibleRole: row.to_responsible_role as Role | null,
    transitionedAt: row.transitioned_at,
    transitionedBy: row.transitioned_by,
    transitionedByRole: row.transitioned_by_role as Role,
    remark: row.remark,
    isGapDetected: row.is_gap_detected === 1,
    gapDurationMinutes: row.gap_duration_minutes,
  };
}

function mapTransitionToDbTransition(t: Omit<StatusTransition, 'id'>): Omit<DbTransition, 'id'> {
  return {
    lead_id: t.leadId,
    followup_id: t.followupId,
    from_status: t.fromStatus,
    to_status: t.toStatus,
    from_followup_status: t.fromFollowupStatus,
    to_followup_status: t.toFollowupStatus,
    from_responsible: t.fromResponsible,
    to_responsible: t.toResponsible,
    from_responsible_role: t.fromResponsibleRole,
    to_responsible_role: t.toResponsibleRole,
    transitioned_at: t.transitionedAt,
    transitioned_by: t.transitionedBy,
    transitioned_by_role: t.transitionedByRole,
    remark: t.remark,
    is_gap_detected: t.isGapDetected ? 1 : 0,
    gap_duration_minutes: t.gapDurationMinutes,
  };
}

function mapDbExceptionToExceptionLog(row: DbException): ExceptionLog {
  return {
    id: row.id,
    leadId: row.lead_id,
    followupId: row.followup_id,
    type: row.type as ExceptionLog['type'],
    message: row.message,
    detectedAt: row.detected_at,
    handled: row.handled === 1,
    handledAt: row.handled_at,
    handledBy: row.handled_by,
    handledRemark: row.handled_remark,
    triggeredByTransitionId: row.triggered_by_transition_id,
  };
}

const EXCEPTION_FIELD_MAP: Record<string, string> = {
  leadId: 'lead_id',
  followupId: 'followup_id',
  detectedAt: 'detected_at',
  handledAt: 'handled_at',
  handledBy: 'handled_by',
  handledRemark: 'handled_remark',
  triggeredByTransitionId: 'triggered_by_transition_id',
};

function mapExceptionUpdatesToDb(updates: Partial<ExceptionLog>): Partial<DbException> {
  const dbUpdates: Record<string, any> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (key === 'handled') {
      dbUpdates.handled = value ? 1 : 0;
    } else if (EXCEPTION_FIELD_MAP[key]) {
      dbUpdates[EXCEPTION_FIELD_MAP[key]] = value;
    } else if (['type', 'message'].includes(key)) {
      dbUpdates[key] = value;
    }
  }
  return dbUpdates as Partial<DbException>;
}

export async function getCurrentUser(): Promise<User> {
  const dbUser = await dbGetCurrentUser();
  return mapDbUserToUser(dbUser);
}

export async function setCurrentUser(userId: string): Promise<void> {
  await dbSetCurrentUser(userId);
}

export async function getAllUsers(): Promise<User[]> {
  const dbUsers = await dbGetAllUsers();
  return dbUsers.map(mapDbUserToUser);
}

export async function getUsersByRole(role: Role): Promise<User[]> {
  const dbUsers = await dbGetUsersByRole(role);
  return dbUsers.map(mapDbUserToUser);
}

export async function insertLead(lead: Omit<Lead, 'id'>): Promise<string> {
  const id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const dbLead = { id, ...mapLeadToDbLead(lead) } as DbLead;
  await dbInsertLead(dbLead);
  return id;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  const dbUpdates = mapLeadUpdatesToDb(updates);
  await dbUpdateLead(id, dbUpdates);
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const dbLead = await dbGetLeadById(id);
  return dbLead ? mapDbLeadToLead(dbLead) : null;
}

export interface LeadFilter {
  status?: LeadStatus[];
  assignedTo?: string;
  currentResponsible?: string;
  hasException?: boolean;
  priority?: ('high' | 'medium' | 'low')[];
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export async function getLeads(filter: LeadFilter = {}): Promise<{
  data: Lead[];
  total: number;
}> {
  const { data, total } = await dbGetLeads(filter);
  return { data: data.map(mapDbLeadToLead), total };
}

export async function insertFollowup(followup: Omit<FollowupRecord, 'id'>): Promise<string> {
  const id = `followup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const dbFollowup = { id, ...mapFollowupToDbFollowup(followup) } as DbFollowup;
  await dbInsertFollowup(dbFollowup);
  return id;
}

export async function updateFollowup(id: string, updates: Partial<FollowupRecord>): Promise<void> {
  const dbUpdates = mapFollowupUpdatesToDb(updates);
  await dbUpdateFollowup(id, dbUpdates);
}

export async function getFollowupsByLeadId(leadId: string): Promise<FollowupRecord[]> {
  const dbFollowups = await dbGetFollowupsByLeadId(leadId);
  return dbFollowups.map(mapDbFollowupToFollowup);
}

export async function getAllFollowups(limit?: number): Promise<FollowupRecord[]> {
  const dbFollowups = await dbGetAllFollowups(limit);
  return dbFollowups.map(mapDbFollowupToFollowup);
}

export async function insertTransition(transition: Omit<StatusTransition, 'id'>): Promise<string> {
  const id = `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const dbTransition = { id, ...mapTransitionToDbTransition(transition) } as DbTransition;
  await dbInsertTransition(dbTransition);
  return id;
}

export async function updateTransition(id: string, updates: Partial<StatusTransition>): Promise<void> {
  const dbUpdates: Record<string, any> = {};
  const TRANSITION_FIELD_MAP: Record<string, string> = {
    leadId: 'lead_id',
    followupId: 'followup_id',
    fromStatus: 'from_status',
    toStatus: 'to_status',
    fromFollowupStatus: 'from_followup_status',
    toFollowupStatus: 'to_followup_status',
    fromResponsible: 'from_responsible',
    toResponsible: 'to_responsible',
    fromResponsibleRole: 'from_responsible_role',
    toResponsibleRole: 'to_responsible_role',
    transitionedAt: 'transitioned_at',
    transitionedBy: 'transitioned_by',
    transitionedByRole: 'transitioned_by_role',
    isGapDetected: 'is_gap_detected',
    gapDurationMinutes: 'gap_duration_minutes',
  };
  for (const [key, value] of Object.entries(updates)) {
    if (key === 'isGapDetected') {
      dbUpdates.is_gap_detected = value ? 1 : 0;
    } else if (TRANSITION_FIELD_MAP[key]) {
      dbUpdates[TRANSITION_FIELD_MAP[key]] = value;
    } else if (key === 'remark') {
      dbUpdates.remark = value;
    }
  }
  await dbUpdateTransition(id, dbUpdates as Partial<DbTransition>);
}

export async function getLastTransitionByLeadId(leadId: string): Promise<StatusTransition | null> {
  const dbTransition = await dbGetLastTransitionByLeadId(leadId);
  return dbTransition ? mapDbTransitionToTransition(dbTransition) : null;
}

export async function getTransitionsByLeadId(leadId: string): Promise<StatusTransition[]> {
  const dbTransitions = await dbGetTransitionsByLeadId(leadId);
  return dbTransitions.map(mapDbTransitionToTransition);
}

export async function insertException(exception: Omit<ExceptionLog, 'id'>): Promise<string> {
  const id = `exception_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const dbException = {
    id,
    lead_id: exception.leadId,
    followup_id: exception.followupId,
    type: exception.type,
    message: exception.message,
    detected_at: exception.detectedAt,
    handled: exception.handled ? 1 : 0,
    handled_at: exception.handledAt,
    handled_by: exception.handledBy,
    handled_remark: exception.handledRemark,
    triggered_by_transition_id: exception.triggeredByTransitionId,
  } as DbException;
  await dbInsertException(dbException);
  return id;
}

export async function updateException(id: string, updates: Partial<ExceptionLog>): Promise<void> {
  const dbUpdates = mapExceptionUpdatesToDb(updates);
  await dbUpdateException(id, dbUpdates);
}

export async function getUnhandledExceptions(leadId?: string): Promise<ExceptionLog[]> {
  const dbExceptions = await dbGetUnhandledExceptions(leadId);
  return dbExceptions.map(mapDbExceptionToExceptionLog);
}

export async function getExceptionsByLeadId(leadId: string): Promise<ExceptionLog[]> {
  const dbExceptions = await dbGetExceptionsByLeadId(leadId);
  return dbExceptions.map(mapDbExceptionToExceptionLog);
}

export async function getExceptionStats(): Promise<{
  total: number;
  byType: Record<string, number>;
}> {
  return dbGetExceptionStats();
}
