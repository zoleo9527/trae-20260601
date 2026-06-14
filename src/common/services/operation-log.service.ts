import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InMemoryStore } from '../store/in-memory.store';
import { OperationLog } from '../types/operation-log.type';

@Injectable()
export class OperationLogService {
  constructor(private readonly store: InMemoryStore) {}

  log(
    entityType: 'LEAVE' | 'MAKEUP',
    entityId: string,
    actor: { role: string; id: string; name: string },
    action: string,
    comment: string,
    oldStatus: string | null = null,
    newStatus: string | null = null,
    idempotencyKey: string | null = null,
  ): OperationLog {
    const log: OperationLog = {
      id: uuidv4(),
      entityType,
      entityId,
      actorRole: actor.role,
      actorId: actor.id,
      actorName: actor.name,
      action,
      oldStatus,
      newStatus,
      comment,
      timestamp: new Date().toISOString(),
      idempotencyKey,
    };
    this.store.pushOperationLog(log);
    return log;
  }

  query(entityType?: string, entityId?: string): OperationLog[] {
    return this.store.listOperationLogs(entityType, entityId);
  }
}
