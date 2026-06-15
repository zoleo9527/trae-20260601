export enum ReminderType {
  MILESTONE = 'milestone',
  FORMULA_SWITCH = 'formula_switch',
  VACCINATION = 'vaccination',
  GROWTH_CHECK = 'growth_check',
  SUPPLEMENT = 'supplement',
  FORMULA_BATCH_ISSUE = 'formula_batch_issue',
  PROMOTION_ISSUE = 'promotion_issue',
}

export enum ReminderStatus {
  PENDING = 'pending',
  TRIGGERED = 'triggered',
  HANDLED = 'handled',
  IGNORED = 'ignored',
  EXPIRED = 'expired',
}

export enum ReminderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Reminder {
  id: string;
  memberId: string;
  babyId: string;
  
  type: ReminderType;
  status: ReminderStatus;
  priority: ReminderPriority;
  
  title: string;
  content: string;
  suggestedAction?: string;
  
  triggerMonthAge: number;
  triggeredAt?: Date;
  
  handledBy?: string;
  handledAt?: Date;
  handleResult?: string;
  handleNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  isAnomaly: boolean;
  anomalyReason?: string;
}

export interface CreateReminderDto {
  memberId: string;
  babyId: string;
  type: ReminderType;
  priority?: ReminderPriority;
  title: string;
  content: string;
  suggestedAction?: string;
  triggerMonthAge: number;
  isAnomaly?: boolean;
  anomalyReason?: string;
}

export interface HandleReminderDto {
  result: 'completed' | 'deferred' | 'invalid';
  notes?: string;
}

export interface ReminderQueryDto {
  memberId?: string;
  babyId?: string;
  type?: ReminderType;
  status?: ReminderStatus;
  priority?: ReminderPriority;
  isAnomaly?: boolean;
  handledBy?: string;
  page?: number;
  pageSize?: number;
}

export enum AnomalyCategory {
  FORMULA_BATCH = 'formula_batch',
  PROMOTION = 'promotion',
  MEMBER_INFO = 'member_info',
  SYSTEM = 'system',
}

export interface ReminderHistoryDto {
  reminderId: string;
  memberId: string;
  babyName: string;
  babyMonthAge: number;
  type: ReminderType;
  title: string;
  content: string;
  status: ReminderStatus;
  handledBy?: string;
  handledAt?: Date;
  handleResult?: string;
  createdAt: Date;
  isAnomaly?: boolean;
  anomalyCategory?: AnomalyCategory;
}

export interface AnomalyReportDto {
  memberId: string;
  babyId?: string;
  category: AnomalyCategory;
  title: string;
  description: string;
  priority?: ReminderPriority;
  
  relatedInfo?: {
    formulaBatchNumber?: string;
    formulaBrand?: string;
    promotionCode?: string;
    promotionType?: string;
    expiryDate?: string;
  };
}