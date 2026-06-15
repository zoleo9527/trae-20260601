export enum IntakeStatus {
  PENDING = 'pending',
  WAITING_CONSENT = 'waiting_consent',
  CONSENT_SIGNED = 'consent_signed',
  DIAGNOSING = 'diagnosing',
  WAITING_PARTS = 'waiting_parts',
  REPAIRING = 'repairing',
  QUALITY_CHECK = 'quality_check',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
