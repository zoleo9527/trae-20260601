import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowRecord, Note, WorkflowEvent, ResponsibilityEntry, UserRole
} from '../types';
import { getRecordById, getAllRecords, saveRecord } from '../dataStore';

export interface RecordFilters {
  projectId?: string;
  clientId?: string;
  taxPeriod?: string;
  status?: string;
  currentStage?: string;
}

export interface NoteDTO {
  authorId: string;
  authorRole: UserRole;
  content: string;
  type: 'general' | 'technical' | 'client_communication' | 'internal';
  relatedTo?: string;
  isVisibleToClient: boolean;
}

export class RecordService {
  getRecordById(recordId: string): WorkflowRecord | undefined {
    return getRecordById(recordId);
  }

  getRecords(filters?: RecordFilters): WorkflowRecord[] {
    let records = getAllRecords();

    if (filters) {
      if (filters.projectId) {
        records = records.filter(r => r.projectId === filters.projectId);
      }
      if (filters.clientId) {
        records = records.filter(r => r.clientId === filters.clientId);
      }
      if (filters.taxPeriod) {
        records = records.filter(r => r.taxPeriod === filters.taxPeriod);
      }
      if (filters.status) {
        records = records.filter(r => r.status === filters.status);
      }
      if (filters.currentStage) {
        records = records.filter(r => r.currentStage === filters.currentStage);
      }
    }

    return records;
  }

  addNote(recordId: string, noteData: NoteDTO): Note {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const now = new Date();
    const note: Note = {
      id: uuidv4(),
      ...noteData,
      createdAt: now
    };

    record.supplementaryNotes.push(note);
    record.updatedAt = now;

    const noteEvent: WorkflowEvent = {
      eventType: 'NOTE_ADDED',
      actorId: noteData.authorId,
      actorRole: noteData.authorRole,
      timestamp: now,
      details: {
        noteId: note.id,
        noteType: noteData.type,
        isVisibleToClient: noteData.isVisibleToClient
      }
    };

    record.workflowHistory.push(noteEvent);
    saveRecord(record);

    return note;
  }

  getRecordHistory(recordId: string): WorkflowEvent[] {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    return record.workflowHistory;
  }

  getNotes(recordId: string, includeInternal: boolean = false): Note[] {
    const record = getRecordById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    if (includeInternal) {
      return record.supplementaryNotes;
    }

    return record.supplementaryNotes.filter(note => note.isVisibleToClient);
  }
}
