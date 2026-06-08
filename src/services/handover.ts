import { store } from '../store';
import {
  HandoverRecord,
  HandoverAction,
  Role,
  getNextRole,
} from '../types';

export class HandoverService {
  record(params: {
    entityType: HandoverRecord['entityType'];
    entityId: string;
    fromRole: Role;
    toRole: Role;
    fromUserId: string;
    toUserId: string;
    action: HandoverAction;
    comment: string;
  }): HandoverRecord {
    const record: HandoverRecord = {
      id: store.generateId(),
      ...params,
      timestamp: new Date().toISOString(),
    };
    store.handoverRecords.push(record);
    return record;
  }

  validateTransition(
    fromRole: Role,
    toRole: Role,
    action: HandoverAction
  ): { valid: boolean; error?: string } {
    if (action === HandoverAction.Return) {
      return { valid: true };
    }

    if (action === HandoverAction.Alert) {
      return { valid: true };
    }

    const expectedNext = getNextRole(fromRole);
    if (!expectedNext) {
      return { valid: false, error: `${fromRole} 无后续交接角色` };
    }

    if (toRole !== expectedNext) {
      return {
        valid: false,
        error: `${fromRole} 的下一交接角色应为 ${expectedNext}，而非 ${toRole}`,
      };
    }

    return { valid: true };
  }

  getRecordsForEntity(entityType: string, entityId: string): HandoverRecord[] {
    return store
      .getHandoverRecords(entityType, entityId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  getLatestAction(entityType: string, entityId: string): HandoverRecord | null {
    const records = this.getRecordsForEntity(entityType, entityId);
    return records.length > 0 ? records[records.length - 1] : null;
  }

  hasPendingConfirmation(entityType: string, entityId: string, expectedRole: Role): boolean {
    const latest = this.getLatestAction(entityType, entityId);
    if (!latest) return false;
    return latest.toRole === expectedRole && latest.action === HandoverAction.Submit;
  }
}

export const handoverService = new HandoverService();
