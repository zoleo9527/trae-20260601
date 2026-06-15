export enum OperationType {
  MEMBER_CREATE = 'member_create',
  MEMBER_UPDATE = 'member_update',
  MEMBER_APPROVE = 'member_approve',
  MEMBER_REJECT = 'member_reject',
  BABY_CREATE = 'baby_create',
  BABY_UPDATE = 'baby_update',
  REMINDER_TRIGGER = 'reminder_trigger',
  REMINDER_HANDLE = 'reminder_handle',
  ANOMALY_REPORT = 'anomaly_report',
  ANOMALY_RESOLVE = 'anomaly_resolve',
}

export enum OperationResult {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

export interface OperationLog {
  id: string;
  type: OperationType;
  result: OperationResult;
  
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  
  targetId: string;
  targetType: 'member' | 'baby' | 'reminder';
  
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  
  errorMessage?: string;
  errorCode?: string;
  
  ipAddress?: string;
  userAgent?: string;
  
  createdAt: Date;
}

export interface AnomalyRecord {
  id: string;
  type: 'data_inconsistency' | 'missing_info' | 'rule_violation' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  relatedMemberId?: string;
  relatedBabyId?: string;
  relatedReminderId?: string;
  
  description: string;
  detectedAt: Date;
  
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  
  autoTriggeredReminder: boolean;
  triggeredReminderId?: string;
}