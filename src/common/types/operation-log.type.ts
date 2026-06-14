export interface OperationLog {
  id: string;
  entityType: 'LEAVE' | 'MAKEUP';
  entityId: string;
  actorRole: string;
  actorId: string;
  actorName: string;
  action: string;
  oldStatus: string | null;
  newStatus: string | null;
  comment: string;
  timestamp: string;
  idempotencyKey: string | null;
}
