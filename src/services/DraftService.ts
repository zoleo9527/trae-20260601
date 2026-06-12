import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowRecord, DraftInfo, DraftContent, UserRole, WorkflowStage,
  RecordStatus, WorkflowEvent, ResponsibilityEntry, Note, Document, TodoType
} from '../types';
import { saveRecord, getRecordById, dataStore } from '../dataStore';
import { TodoService } from './TodoService';

const todoService = new TodoService();

export interface CreateDraftDTO {
  projectId: string;
  clientId: string;
  taxPeriod: string;
  taxConsultantId: string;
  draftContent: DraftContent;
  sourceDocuments?: Document[];
}

export interface UpdateDraftDTO {
  draftContent?: DraftContent;
  sourceDocuments?: Document[];
}

export class DraftService {
  createDraft(data: CreateDraftDTO): WorkflowRecord {
    const now = new Date();
    const recordId = uuidv4();

    const draftInfo: DraftInfo = {
      taxConsultantId: data.taxConsultantId,
      draftContent: data.draftContent,
      sourceDocuments: data.sourceDocuments || [],
      calculations: data.draftContent.calculations || [],
      conclusions: data.draftContent.conclusions || [],
      attachments: [],
      createdAt: now,
      updatedAt: now
    };

    const initialEvent: WorkflowEvent = {
      eventType: 'DRAFT_CREATED',
      actorId: data.taxConsultantId,
      actorRole: UserRole.TAX_CONSULTANT,
      timestamp: now,
      details: { taxType: data.draftContent.taxType },
      newStage: WorkflowStage.DRAFT_CREATED
    };

    const responsibilityEntry: ResponsibilityEntry = {
      stage: WorkflowStage.DRAFT_CREATED,
      responsibleRole: UserRole.TAX_CONSULTANT,
      responsibleUserId: data.taxConsultantId,
      action: '创建申报底稿',
      timestamp: now,
      isComplete: true
    };

    const record: WorkflowRecord = {
      id: recordId,
      projectId: data.projectId,
      clientId: data.clientId,
      taxPeriod: data.taxPeriod,
      createdAt: now,
      updatedAt: now,
      currentStage: WorkflowStage.DRAFT_CREATED,
      status: RecordStatus.ACTIVE,
      draftInfo,
      confirmationInfo: {
        clientFinanceId: '',
        requiredMaterials: [],
        materialsStatus: [],
        confirmationStatus: 'pending',
        deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      },
      supplementaryNotes: [],
      workflowHistory: [initialEvent],
      responsibilityTrace: [responsibilityEntry]
    };

    saveRecord(record);
    return record;
  }

  updateDraft(recordId: string, data: UpdateDraftDTO, userId: string): WorkflowRecord {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const now = new Date();

    if (data.draftContent) {
      record.draftInfo.draftContent = data.draftContent;
      record.draftInfo.updatedAt = now;
    }

    if (data.sourceDocuments) {
      record.draftInfo.sourceDocuments = data.sourceDocuments;
    }

    record.updatedAt = now;

    const updateEvent: WorkflowEvent = {
      eventType: 'DRAFT_UPDATED',
      actorId: userId,
      actorRole: UserRole.TAX_CONSULTANT,
      timestamp: now,
      details: { updatedFields: Object.keys(data) }
    };

    record.workflowHistory.push(updateEvent);
    saveRecord(record);

    return record;
  }

  submitDraft(recordId: string, userId: string): WorkflowRecord {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const now = new Date();
    const previousStage = record.currentStage;

    record.currentStage = WorkflowStage.AWAITING_CONFIRMATION;
    record.status = RecordStatus.PENDING_CONFIRMATION;
    record.updatedAt = now;

    const submitEvent: WorkflowEvent = {
      eventType: 'DRAFT_SUBMITTED',
      actorId: userId,
      actorRole: UserRole.TAX_CONSULTANT,
      timestamp: now,
      details: { submittedAt: now },
      previousStage,
      newStage: WorkflowStage.AWAITING_CONFIRMATION
    };

    const responsibilityEntry: ResponsibilityEntry = {
      stage: WorkflowStage.AWAITING_CONFIRMATION,
      responsibleRole: UserRole.TAX_CONSULTANT,
      responsibleUserId: userId,
      action: '提交申报底稿',
      timestamp: now,
      isComplete: true,
      notes: `税务期间 ${record.taxPeriod} 的申报底稿已提交，等待客户 ${record.confirmationInfo.clientFinanceId || '财务'} 确认`
    };

    record.workflowHistory.push(submitEvent);
    record.responsibilityTrace.push(responsibilityEntry);
    saveRecord(record);

    todoService.handleStageChange(record, WorkflowStage.AWAITING_CONFIRMATION, previousStage);

    return record;
  }

  getDraftById(recordId: string): WorkflowRecord | undefined {
    return getRecordById(recordId);
  }

  getDraftsByConsultant(consultantId: string): WorkflowRecord[] {
    const allRecords = Array.from(dataStore.records.values());
    return allRecords.filter(r => r.draftInfo.taxConsultantId === consultantId);
  }
}
