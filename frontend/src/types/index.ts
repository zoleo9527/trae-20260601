export enum FileStatus {
  PENDING_ARCHIVE = 'PENDING_ARCHIVE',
  ARCHIVING = 'ARCHIVING',
  ARCHIVED = 'ARCHIVED',
  PENDING_COLLECTION = 'PENDING_COLLECTION',
  COLLECTION_CONFIRMED = 'COLLECTION_CONFIRMED',
  EXPIRED_NOT_COLLECTED = 'EXPIRED_NOT_COLLECTED',
  RETURNED_FOR_CORRECTION = 'RETURNED_FOR_CORRECTION'
}

export enum OperatorRole {
  WINDOW_STAFF = 'WINDOW_STAFF',
  NOTARY = 'NOTARY',
  ARCHIVE_KEEPER = 'ARCHIVE_KEEPER'
}

export enum ActionType {
  START_ARCHIVE = 'START_ARCHIVE',
  COMPLETE_ARCHIVE = 'COMPLETE_ARCHIVE',
  TRANSFER_TO_COLLECTION = 'TRANSFER_TO_COLLECTION',
  CONFIRM_COLLECTION = 'CONFIRM_COLLECTION',
  REQUEST_CORRECTION = 'REQUEST_CORRECTION',
  TAKE_OVER = 'TAKE_OVER',
  EXPIRE_WARNING = 'EXPIRE_WARNING'
}

export interface ResponsibilityRecord {
  role: OperatorRole;
  operatorId: string;
  operatorName: string;
  assignedAt: Date | string;
  handoverReason?: string;
  handoverFrom?: string;
  handoverTo?: string;
}

export interface ArchiveContext {
  archiveLocation: string;
  archiveDate: Date | string;
  archiveNote: string;
  archiveReason: string;
  completionNote?: string;
  notarialApproval?: {
    notaryId: string;
    notaryName: string;
    approvalDate: Date | string;
    approvalNote?: string;
  };
}

export interface HandoverRecord {
  handoverId: string;
  fileId: string;
  fromRole: OperatorRole;
  fromOperatorId: string;
  fromOperatorName: string;
  toRole: OperatorRole;
  toOperatorId: string;
  toOperatorName: string;
  handoverReason: string;
  handoverContext: {
    archiveInfo?: string;
    correctionHistory?: string[];
    previousNotes?: string[];
  };
  timestamp: Date | string;
  acknowledged: boolean;
  acknowledgedAt?: Date | string;
}

export interface CollectionContext {
  archiveContext: ArchiveContext;
  handoverRecord: HandoverRecord;
  responsibilityChain: ResponsibilityRecord[];
  recentHistory: OperationLog[];
  pendingCorrections?: string[];
}

export interface FileRecord {
  id: string;
  applicationId: string;
  appointmentNumber: string;
  currentStatus: FileStatus;
  responsiblePerson?: ResponsibilityRecord;
  responsibilityChain: ResponsibilityRecord[];
  archiveInfo?: ArchiveContext;
  collectionInfo?: {
    collectorName: string;
    collectorId?: string;
    collectedAt?: Date | string;
    collectionNote?: string;
    collectionContext?: CollectionContext;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
  expiresAt?: Date | string;
  correctionHistory: {
    timestamp: Date | string;
    operatorRole: OperatorRole;
    operatorName: string;
    correctionContent: string;
    attachments?: string[];
  }[];
}

export interface OperationLog {
  id: string;
  fileId: string;
  operatorRole: OperatorRole;
  operatorId: string;
  operatorName: string;
  action: ActionType;
  fromStatus?: FileStatus;
  toStatus: FileStatus;
  reason?: string;
  attachments?: string[];
  timestamp: Date | string;
  relatedApplicationId?: string;
  responsibilityChainSnapshot?: ResponsibilityRecord[];
  contextSnapshot?: {
    archiveInfo?: string;
    correctionHistory?: string[];
  };
}

export interface Reminder {
  id: string;
  fileId: string;
  type: 'ARCHIVE_DEADLINE' | 'COLLECTION_DEADLINE' | 'RESPONSIBILITY_TRANSFER' | 'CORRECTION_PENDING' | 'HANDOVER_PENDING' | 'EXPIRATION_WARNING';
  recipientRole: OperatorRole;
  recipientId: string;
  recipientName?: string;
  message: string;
  createdAt: Date | string;
  triggeredBy?: string;
  triggeredByName?: string;
  acknowledged: boolean;
  acknowledgedAt?: Date | string;
  actionRequired?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  relatedLogId?: string;
}

export interface ImperfectScenario {
  scenarioId: string;
  scenario: string;
  fileId: string;
  description: string;
  currentStatus: FileStatus;
  responsiblePerson?: ResponsibilityRecord;
  issue: string;
  missingAction: string;
  triggerReminder: () => Reminder;
}

export interface User {
  id: string;
  name: string;
  role: OperatorRole;
}
