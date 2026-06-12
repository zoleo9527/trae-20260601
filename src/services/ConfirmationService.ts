import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowRecord, Material, ReturnReason, Note, UserRole,
  WorkflowStage, RecordStatus, ConfirmResult, WorkflowEvent,
  ResponsibilityEntry, Issue, Document
} from '../types';
import { saveRecord, getRecordById } from '../dataStore';
import { TodoService } from './TodoService';

const todoService = new TodoService();

export interface CreateConfirmationDTO {
  clientFinanceId: string;
  requiredMaterials: Material[];
  deadline?: Date;
}

export interface ProvideMaterialsDTO {
  materials: Material[];
}

export interface ReturnRecordDTO {
  returnedBy: string;
  returnReason: ReturnReason;
  specificIssues: Issue[];
  suggestedFixes: string[];
  expectedFixDeadline: Date;
}

export class ConfirmationService {
  createConfirmation(recordId: string, data: CreateConfirmationDTO): WorkflowRecord {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    if (record.currentStage !== WorkflowStage.AWAITING_CONFIRMATION) {
      throw new Error(`无法创建客户确认任务：底稿当前阶段为 ${record.currentStage}，必须先提交底稿`);
    }

    const now = new Date();
    const previousStage = record.currentStage;

    record.confirmationInfo.clientFinanceId = data.clientFinanceId;
    record.confirmationInfo.requiredMaterials = data.requiredMaterials;
    record.confirmationInfo.materialsStatus = data.requiredMaterials.map(m => ({
      materialId: m.id,
      status: m.status
    }));
    record.confirmationInfo.deadline = data.deadline || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    record.confirmationInfo.confirmationStatus = 'in_progress';

    record.currentStage = WorkflowStage.CONFIRMATION_IN_PROGRESS;
    record.status = RecordStatus.PENDING_CONFIRMATION;
    record.updatedAt = now;

    const confirmEvent: WorkflowEvent = {
      eventType: 'CONFIRMATION_INITIATED',
      actorId: data.clientFinanceId,
      actorRole: UserRole.CLIENT_FINANCE,
      timestamp: now,
      details: {
        materialsRequired: data.requiredMaterials.length,
        deadline: record.confirmationInfo.deadline
      },
      previousStage,
      newStage: WorkflowStage.CONFIRMATION_IN_PROGRESS
    };

    const responsibilityEntry: ResponsibilityEntry = {
      stage: WorkflowStage.CONFIRMATION_IN_PROGRESS,
      responsibleRole: UserRole.CLIENT_FINANCE,
      responsibleUserId: data.clientFinanceId,
      action: '客户确认任务已分派',
      timestamp: now,
      isComplete: false,
      notes: `需要准备 ${data.requiredMaterials.length} 项材料，截止日期：${record.confirmationInfo.deadline}`
    };

    record.workflowHistory.push(confirmEvent);
    record.responsibilityTrace.push(responsibilityEntry);
    saveRecord(record);

    todoService.handleStageChange(record, WorkflowStage.CONFIRMATION_IN_PROGRESS, previousStage);

    return record;
  }

  provideMaterials(recordId: string, materials: Material[], userId: string): WorkflowRecord {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const now = new Date();

    materials.forEach(providedMaterial => {
      const existingIndex = record.confirmationInfo.requiredMaterials.findIndex(
        m => m.id === providedMaterial.id
      );
      if (existingIndex >= 0) {
        record.confirmationInfo.requiredMaterials[existingIndex] = providedMaterial;
      } else {
        record.confirmationInfo.requiredMaterials.push(providedMaterial);
      }

      const statusIndex = record.confirmationInfo.materialsStatus.findIndex(
        ms => ms.materialId === providedMaterial.id
      );
      if (statusIndex >= 0) {
        record.confirmationInfo.materialsStatus[statusIndex].status = providedMaterial.status;
        if (providedMaterial.providedAt) {
          record.confirmationInfo.materialsStatus[statusIndex].providedAt = providedMaterial.providedAt;
        }
      } else {
        record.confirmationInfo.materialsStatus.push({
          materialId: providedMaterial.id,
          status: providedMaterial.status,
          providedAt: providedMaterial.providedAt
        });
      }
    });

    record.updatedAt = now;

    const materialEvent: WorkflowEvent = {
      eventType: 'MATERIALS_PROVIDED',
      actorId: userId,
      actorRole: UserRole.CLIENT_FINANCE,
      timestamp: now,
      details: { materialsProvided: materials.length }
    };

    const providedCount = materials.filter(m => m.status === 'provided').length;
    const responsibilityEntry: ResponsibilityEntry = {
      stage: WorkflowStage.CONFIRMATION_IN_PROGRESS,
      responsibleRole: UserRole.CLIENT_FINANCE,
      responsibleUserId: userId,
      action: '客户提供材料',
      timestamp: now,
      isComplete: false,
      notes: `已提供 ${providedCount} 项材料`
    };

    record.workflowHistory.push(materialEvent);
    record.responsibilityTrace.push(responsibilityEntry);
    saveRecord(record);

    todoService.handleStageChange(record, record.currentStage, record.currentStage);

    return record;
  }

  confirmRecord(recordId: string, result: ConfirmResult, userId: string): WorkflowRecord {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const now = new Date();

    record.confirmationInfo.confirmationResult = result;
    record.confirmationInfo.confirmationStatus = 'confirmed';
    record.confirmationInfo.confirmedAt = now;
    record.currentStage = WorkflowStage.CONFIRMED;
    record.status = RecordStatus.COMPLETED;
    record.updatedAt = now;

    const confirmEvent: WorkflowEvent = {
      eventType: 'RECORD_CONFIRMED',
      actorId: userId,
      actorRole: UserRole.CLIENT_FINANCE,
      timestamp: now,
      details: {
        approvedItems: result.approvedItems,
        concerns: result.concerns
      },
      newStage: WorkflowStage.CONFIRMED
    };

    const responsibilityEntry: ResponsibilityEntry = {
      stage: WorkflowStage.CONFIRMED,
      responsibleRole: UserRole.CLIENT_FINANCE,
      responsibleUserId: userId,
      action: '确认申报底稿',
      timestamp: now,
      isComplete: true,
      notes: `客户代表: ${result.clientRepresentative}`
    };

    record.workflowHistory.push(confirmEvent);
    record.responsibilityTrace.push(responsibilityEntry);
    saveRecord(record);

    todoService.handleStageChange(record, WorkflowStage.CONFIRMED, record.currentStage);

    return record;
  }

  returnRecord(recordId: string, returnData: ReturnRecordDTO): WorkflowRecord {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const now = new Date();

    record.returnInfo = {
      returnedBy: returnData.returnedBy,
      returnReason: returnData.returnReason,
      specificIssues: returnData.specificIssues,
      suggestedFixes: returnData.suggestedFixes,
      returnedAt: now,
      expectedFixDeadline: returnData.expectedFixDeadline,
      isResponsibilityClear: returnData.returnReason.category !== 'other',
      isResolved: false
    };

    if (!record.returnInfo.isResponsibilityClear) {
      record.returnInfo.responsibilityNotes = '退回原因属于"其他"类别，责任归属需进一步明确';
    }

    record.confirmationInfo.confirmationStatus = 'returned';
    record.currentStage = WorkflowStage.RETURNED;
    record.status = RecordStatus.PENDING_REVISION;
    record.updatedAt = now;

    const returnEvent: WorkflowEvent = {
      eventType: 'RECORD_RETURNED',
      actorId: returnData.returnedBy,
      actorRole: UserRole.CLIENT_FINANCE,
      timestamp: now,
      details: {
        returnCategory: returnData.returnReason.category,
        priority: returnData.returnReason.priority,
        issuesCount: returnData.specificIssues.length
      },
      newStage: WorkflowStage.RETURNED
    };

    const responsibilityEntry: ResponsibilityEntry = {
      stage: WorkflowStage.RETURNED,
      responsibleRole: UserRole.CLIENT_FINANCE,
      responsibleUserId: returnData.returnedBy,
      action: '退回申报底稿',
      timestamp: now,
      isComplete: true,
      notes: `退回原因: ${returnData.returnReason.description}`
    };

    const revisionEntry: ResponsibilityEntry = {
      stage: WorkflowStage.REVISION_IN_PROGRESS,
      responsibleRole: UserRole.TAX_CONSULTANT,
      responsibleUserId: record.draftInfo.taxConsultantId,
      action: '修订申报底稿',
      timestamp: now,
      isComplete: false,
      notes: `退回原因: ${returnData.returnReason.description}，期望完成时间: ${returnData.expectedFixDeadline}`
    };

    record.workflowHistory.push(returnEvent);
    record.responsibilityTrace.push(responsibilityEntry, revisionEntry);
    saveRecord(record);

    todoService.handleStageChange(record, WorkflowStage.RETURNED, WorkflowStage.CONFIRMATION_IN_PROGRESS);

    return record;
  }

  getConfirmationDetails(recordId: string): WorkflowRecord | undefined {
    return getRecordById(recordId);
  }

  addNoteToRecord(recordId: string, note: Omit<Note, 'id' | 'createdAt'>): WorkflowRecord {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const now = new Date();
    const newNote: Note = {
      ...note,
      id: uuidv4(),
      createdAt: now
    };

    record.supplementaryNotes.push(newNote);
    record.updatedAt = now;

    saveRecord(record);
    return record;
  }
}
