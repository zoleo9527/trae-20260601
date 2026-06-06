export enum UserRole {
  BUSINESS = 'business',
  DIRECTOR = 'director',
  TALENT_AGENT = 'talent_agent',
  ADMIN = 'admin',
}

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_BUSINESS_REVIEW = 'pending_business_review',
  PENDING_TALENT_SIGN = 'pending_talent_sign',
  PENDING_ARCHIVE = 'pending_archive',
  ARCHIVE_IN_PROGRESS = 'archive_in_progress',
  ARCHIVED = 'archived',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum ArchiveStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  NEEDS_REVISION = 'needs_revision',
}

export enum ScriptStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  MODIFIED = 'modified',
  PUBLISHED = 'published',
}

export enum NotificationType {
  CONTRACT_SUBMITTED = 'contract_submitted',
  CONTRACT_REJECTED = 'contract_rejected',
  CONTRACT_APPROVED = 'contract_approved',
  ARCHIVE_NEEDED = 'archive_needed',
  ARCHIVE_COMPLETED = 'archive_completed',
  SCHEDULE_CONFLICT = 'schedule_conflict',
  SCRIPT_OUT_OF_SYNC = 'script_out_of_sync',
  DATA_OVERDUE = 'data_overdue',
}
