import db from '../database.ts';
import { v4 as uuidv4 } from 'uuid';
import type { DocumentStatus } from '../types.ts';

export interface Document {
  id: string;
  projectId: string;
  projectName?: string;
  status: DocumentStatus;
  content: string;
  handler: string;
  qaRecords: QARecord[];
  evaluation: Evaluation | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface QARecord {
  id: string;
  question: string;
  answer: string;
  answeredBy: string;
  answeredAt: string;
}

export interface Evaluation {
  id: string;
  documentId: string;
  scheduledAt: string;
  location: string;
  evaluators: string[];
  status: 'pending' | 'completed' | 'cancelled';
}

export interface CreateDocumentDTO {
  projectId: string;
  handler: string;
}

export interface UpdateDocumentDTO {
  content?: string;
  handler?: string;
}

export interface AddQARecordDTO {
  question: string;
  answer: string;
  answeredBy: string;
}

export interface ScheduleEvaluationDTO {
  scheduledAt: string;
  location: string;
  evaluators: string[];
}

const DocumentStatusTransitions: Record<DocumentStatus, DocumentStatus[]> = {
  pending: ['drafting'],
  drafting: ['review', 'pending', 'rejected'],
  review: ['published', 'drafting', 'rejected'],
  published: [],
  rejected: ['drafting'],
};

export class DocumentService {
  findAll(params?: { projectId?: string; status?: string }) {
    let whereClause = '1=1';
    const values: any[] = [];

    if (params?.projectId) {
      whereClause += ' AND d.project_id = ?';
      values.push(params.projectId);
    }
    if (params?.status) {
      whereClause += ' AND d.status = ?';
      values.push(params.status);
    }

    const rows = db.prepare(`
      SELECT d.*, p.name as project_name 
      FROM documents d
      LEFT JOIN projects p ON d.project_id = p.id
      WHERE ${whereClause}
      ORDER BY d.created_at DESC
    `).all(...values);

    return rows.map((row: any) => this.mapRowToDocument(row));
  }

  findById(id: string) {
    const row = db.prepare(`
      SELECT d.*, p.name as project_name 
      FROM documents d
      LEFT JOIN projects p ON d.project_id = p.id
      WHERE d.id = ?
    `).get(id);

    if (!row) return null;

    const qaRows = db.prepare('SELECT * FROM qa_records WHERE document_id = ? ORDER BY answered_at DESC').all(id);
    const qaRecords = qaRows.map((r: any) => ({
      id: r.id,
      question: r.question,
      answer: r.answer,
      answeredBy: r.answered_by,
      answeredAt: r.answered_at,
    }));

    const evalRow = db.prepare('SELECT * FROM evaluations WHERE document_id = ?').get(id);
    let evaluation: Evaluation | null = null;
    if (evalRow) {
      const e = evalRow as any;
      evaluation = {
        id: e.id,
        documentId: e.document_id,
        scheduledAt: e.scheduled_at,
        location: e.location,
        evaluators: JSON.parse(e.evaluators),
        status: e.status,
      };
    }

    return {
      ...this.mapRowToDocument(row as any),
      qaRecords,
      evaluation,
    };
  }

  update(id: string, dto: UpdateDocumentDTO) {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (dto.content !== undefined) {
      updates.push('content = ?');
      values.push(dto.content);
    }
    if (dto.handler !== undefined) {
      updates.push('handler = ?');
      values.push(dto.handler);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(now);
      values.push(id);

      db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.findById(id);
  }

  updateStatus(id: string, newStatus: DocumentStatus, reason: string, userId: string) {
    const doc = this.findById(id);
    if (!doc) {
      throw new Error('DOCUMENT_001:文档不存在');
    }

    if (doc.status === 'published') {
      throw new Error('DOCUMENT_002:文档已发布，无法编辑');
    }

    if (!DocumentStatusTransitions[doc.status].includes(newStatus)) {
      throw new Error('DOCUMENT_002:状态流转不合规');
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE documents SET status = ?, updated_at = ? WHERE id = ?
    `).run(newStatus, now, id);

    if (newStatus === 'published') {
      db.prepare(`UPDATE documents SET published_at = ? WHERE id = ?`).run(now, id);
    }

    db.prepare(`
      INSERT INTO status_histories (id, entity_type, entity_id, from_status, to_status, changed_by, reason, created_at)
      VALUES (?, 'document', ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), id, doc.status, newStatus, userId, reason, now);

    return this.findById(id);
  }

  addQARecord(documentId: string, dto: AddQARecordDTO) {
    const doc = this.findById(documentId);
    if (!doc) {
      throw new Error('DOCUMENT_001:文档不存在');
    }

    const now = new Date().toISOString();
    const qaId = uuidv4();

    db.prepare(`
      INSERT INTO qa_records (id, document_id, question, answer, answered_by, answered_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(qaId, documentId, dto.question, dto.answer, dto.answeredBy, now);

    return {
      id: qaId,
      question: dto.question,
      answer: dto.answer,
      answeredBy: dto.answeredBy,
      answeredAt: now,
    };
  }

  scheduleEvaluation(id: string, dto: ScheduleEvaluationDTO) {
    const doc = this.findById(id);
    if (!doc) {
      throw new Error('DOCUMENT_001:文档不存在');
    }

    const evalId = uuidv4();

    db.prepare(`
      INSERT INTO evaluations (id, document_id, scheduled_at, location, evaluators, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(evalId, id, dto.scheduledAt, dto.location, JSON.stringify(dto.evaluators));

    return {
      id: evalId,
      documentId: id,
      scheduledAt: dto.scheduledAt,
      location: dto.location,
      evaluators: dto.evaluators,
      status: 'pending' as const,
    };
  }

  getStats() {
    const stats: Record<string, number> = {};
    const rows = db.prepare('SELECT status, COUNT(*) as count FROM documents GROUP BY status').all() as Array<{ status: string; count: number }>;
    
    for (const row of rows) {
      stats[row.status] = row.count;
    }

    return stats;
  }

  private mapRowToDocument(row: any): Document {
    return {
      id: row.id,
      projectId: row.project_id,
      projectName: row.project_name,
      status: row.status as DocumentStatus,
      content: row.content || '',
      handler: row.handler,
      qaRecords: [],
      evaluation: null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    };
  }
}

export const documentService = new DocumentService();
