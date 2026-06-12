import db from '../database.ts';
import { v4 as uuidv4 } from 'uuid';
import type { ProjectStatus } from '../types.ts';

export interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  biddingType: string;
  status: ProjectStatus;
  handler: string;
  documentHandler: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDTO {
  name: string;
  client: string;
  budget: number;
  biddingType: string;
  handler: string;
  documentHandler: string;
  reason: string;
}

export interface UpdateProjectDTO {
  name?: string;
  client?: string;
  budget?: number;
  biddingType?: string;
  handler?: string;
  documentHandler?: string;
  reason?: string;
}

const ProjectStatusTransitions: Record<ProjectStatus, ProjectStatus[]> = {
  draft: ['initial_review'],
  initial_review: ['re_review', 'draft', 'rejected'],
  re_review: ['approved', 'initial_review', 'rejected'],
  approved: [],
  rejected: ['draft'],
};

export class ProjectService {
  findAll(params: { page?: number; pageSize?: number; status?: string; handler?: string }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const offset = (page - 1) * pageSize;

    let whereClause = '1=1';
    const values: any[] = [];

    if (params.status) {
      whereClause += ' AND status = ?';
      values.push(params.status);
    }
    if (params.handler) {
      whereClause += ' AND handler = ?';
      values.push(params.handler);
    }

    const countResult = db.prepare(`SELECT COUNT(*) as count FROM projects WHERE ${whereClause}`).get(...values) as { count: number };
    const total = countResult.count;

    const rows = db.prepare(`
      SELECT * FROM projects 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...values, pageSize, offset);

    const projects = rows.map((row: any) => this.mapRowToProject(row));

    return {
      data: projects,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  findById(id: string) {
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!row) return null;
    return this.mapRowToProject(row as any);
  }

  create(dto: CreateProjectDTO) {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO projects (id, name, client, budget, bidding_type, status, handler, document_handler, reason, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)
    `).run(id, dto.name, dto.client, dto.budget, dto.biddingType, dto.handler, dto.documentHandler, dto.reason, now, now);

    db.prepare(`
      INSERT INTO status_histories (id, entity_type, entity_id, from_status, to_status, changed_by, reason, created_at)
      VALUES (?, 'project', ?, NULL, 'draft', ?, '创建项目', ?)
    `).run(uuidv4(), id, dto.handler, now);

    return this.findById(id);
  }

  update(id: string, dto: UpdateProjectDTO) {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      values.push(dto.name);
    }
    if (dto.client !== undefined) {
      updates.push('client = ?');
      values.push(dto.client);
    }
    if (dto.budget !== undefined) {
      updates.push('budget = ?');
      values.push(dto.budget);
    }
    if (dto.biddingType !== undefined) {
      updates.push('bidding_type = ?');
      values.push(dto.biddingType);
    }
    if (dto.handler !== undefined) {
      updates.push('handler = ?');
      values.push(dto.handler);
    }
    if (dto.documentHandler !== undefined) {
      updates.push('document_handler = ?');
      values.push(dto.documentHandler);
    }
    if (dto.reason !== undefined) {
      updates.push('reason = ?');
      values.push(dto.reason);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(now);
      values.push(id);

      db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.findById(id);
  }

  updateStatus(id: string, newStatus: ProjectStatus, reason: string, userId: string) {
    const project = this.findById(id);
    if (!project) {
      throw new Error('PROJECT_001:项目不存在');
    }

    if (!ProjectStatusTransitions[project.status].includes(newStatus)) {
      throw new Error('PROJECT_002:状态流转不合规');
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE projects SET status = ?, updated_at = ? WHERE id = ?
    `).run(newStatus, now, id);

    db.prepare(`
      INSERT INTO status_histories (id, entity_type, entity_id, from_status, to_status, changed_by, reason, created_at)
      VALUES (?, 'project', ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), id, project.status, newStatus, userId, reason, now);

    if (newStatus === 'approved') {
      const existingDoc = db.prepare('SELECT id FROM documents WHERE project_id = ?').get(id);
      if (!existingDoc) {
        const docId = uuidv4();
        db.prepare(`
          INSERT INTO documents (id, project_id, status, handler, created_at, updated_at)
          VALUES (?, ?, 'pending', ?, ?, ?)
        `).run(docId, id, project.documentHandler, now, now);

        db.prepare(`
          INSERT INTO status_histories (id, entity_type, entity_id, from_status, to_status, changed_by, reason, created_at)
          VALUES (?, 'document', ?, NULL, 'pending', ?, '项目立项通过，自动创建文档', ?)
        `).run(uuidv4(), docId, userId, now);
      }
    }

    return this.findById(id);
  }

  delete(id: string) {
    db.prepare('DELETE FROM status_histories WHERE entity_type = ? AND entity_id = ?').run('project', id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }

  getStats() {
    const stats: Record<string, number> = {};
    const rows = db.prepare('SELECT status, COUNT(*) as count FROM projects GROUP BY status').all() as Array<{ status: string; count: number }>;
    
    for (const row of rows) {
      stats[row.status] = row.count;
    }

    return stats;
  }

  private mapRowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      client: row.client,
      budget: row.budget,
      biddingType: row.bidding_type,
      status: row.status as ProjectStatus,
      handler: row.handler,
      documentHandler: row.document_handler,
      reason: row.reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const projectService = new ProjectService();
