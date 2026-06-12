import { v4 as uuidv4 } from 'uuid';
import {
  ResponsibilityEntry, WorkflowStage, UserRole, WorkflowRecord
} from '../types';
import { getRecordById, saveRecord } from '../dataStore';

export class ResponsibilityService {
  addResponsibilityEntry(
    recordId: string,
    stage: WorkflowStage,
    role: UserRole,
    userId: string | undefined,
    action: string,
    notes?: string
  ): void {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const entry: ResponsibilityEntry = {
      stage,
      responsibleRole: role,
      responsibleUserId: userId,
      action,
      timestamp: new Date(),
      isComplete: false,
      notes
    };

    record.responsibilityTrace.push(entry);
    saveRecord(record);
  }

  markResponsibilityComplete(
    recordId: string,
    stage: WorkflowStage,
    role: UserRole
  ): void {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const entry = record.responsibilityTrace.find(
      e => e.stage === stage && e.responsibleRole === role && !e.isComplete
    );

    if (entry) {
      entry.isComplete = true;
      saveRecord(record);
    }
  }

  getResponsibilityTrace(recordId: string): ResponsibilityEntry[] {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    return record.responsibilityTrace;
  }

  clarifyResponsibility(recordId: string, notes: string, clarifiedBy: string): void {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    if (record.returnInfo) {
      record.returnInfo.isResponsibilityClear = true;
      record.returnInfo.responsibilityNotes = notes;

      const clarificationEvent = {
        eventType: 'RESPONSIBILITY_CLARIFIED',
        actorId: clarifiedBy,
        actorRole: UserRole.PROJECT_MANAGER,
        timestamp: new Date(),
        details: { clarificationNotes: notes }
      };

      record.workflowHistory.push(clarificationEvent);
      saveRecord(record);
    }
  }

  getIncompleteResponsibilities(recordId: string): ResponsibilityEntry[] {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    return record.responsibilityTrace.filter(e => !e.isComplete);
  }

  getResponsibilitySummary(recordId: string): {
    total: number;
    completed: number;
    pending: number;
    byRole: Record<UserRole, number>;
  } {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const trace = record.responsibilityTrace;
    const byRole: Record<UserRole, number> = {
      [UserRole.TAX_CONSULTANT]: 0,
      [UserRole.PROJECT_MANAGER]: 0,
      [UserRole.CLIENT_FINANCE]: 0
    };

    trace.forEach(entry => {
      byRole[entry.responsibleRole]++;
    });

    return {
      total: trace.length,
      completed: trace.filter(e => e.isComplete).length,
      pending: trace.filter(e => !e.isComplete).length,
      byRole
    };
  }
}
