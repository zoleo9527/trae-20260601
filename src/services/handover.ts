import { store } from '../store';
import {
  HandoverRecord,
  HandoverAction,
  HandoverFilterParams,
  HandoverSummaryItem,
  HandoverSummaryResponse,
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

  query(params: HandoverFilterParams): HandoverRecord[] {
    let results = [...store.handoverRecords];

    if (params.role) {
      results = results.filter(
        (r) => r.fromRole === params.role || r.toRole === params.role
      );
    }

    if (params.action) {
      results = results.filter((r) => r.action === params.action);
    }

    if (params.entityType) {
      results = results.filter((r) => r.entityType === params.entityType);
    }

    if (params.since) {
      const since = new Date(params.since).getTime();
      results = results.filter((r) => new Date(r.timestamp).getTime() >= since);
    }

    if (params.until) {
      const until = new Date(params.until).getTime();
      results = results.filter((r) => new Date(r.timestamp).getTime() <= until);
    }

    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return results;
  }

  summary(since?: string, until?: string): HandoverSummaryResponse {
    let records = [...store.handoverRecords];

    if (since) {
      const sinceTs = new Date(since).getTime();
      records = records.filter((r) => new Date(r.timestamp).getTime() >= sinceTs);
    }

    if (until) {
      const untilTs = new Date(until).getTime();
      records = records.filter((r) => new Date(r.timestamp).getTime() <= untilTs);
    }

    const grouped = new Map<string, { role: Role; action: HandoverAction; count: number }>();

    for (const r of records) {
      const key = `${r.fromRole}::${r.action}`;
      if (!grouped.has(key)) {
        grouped.set(key, { role: r.fromRole, action: r.action, count: 0 });
      }
      grouped.get(key)!.count++;
    }

    const groups: HandoverSummaryItem[] = [];
    for (const item of grouped.values()) {
      groups.push(item);
    }

    groups.sort((a, b) => {
      if (a.role !== b.role) return a.role.localeCompare(b.role);
      return a.action.localeCompare(b.action);
    });

    return {
      groups,
      totalRecords: records.length,
    };
  }
}

export const handoverService = new HandoverService();
