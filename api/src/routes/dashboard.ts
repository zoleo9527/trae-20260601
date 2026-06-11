import { Router } from 'express';
import db from '../database.js';

const router = Router();

router.get('/overview', (_req, res) => {
  try {
    const roles = ['项目负责人', '施工班组长', '资料员'] as const;

    const byRole = roles.map(role => {
      const countRow = db.prepare('SELECT COUNT(*) as count FROM completion_documents WHERE assignee_role = ?').get(role) as { count: number };
      const overdueRow = db.prepare(`
        SELECT COUNT(*) as count FROM completion_documents
        WHERE assignee_role = ?
        AND status NOT IN ('已签认')
        AND julianday('now') - julianday(updated_at) > 7
      `).get(role) as { count: number };
      return { role, count: countRow.count, overdueCount: overdueRow.count };
    });

    const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count FROM completion_documents GROUP BY status
    `).all() as { status: string; count: number }[];

    const totalRow = db.prepare('SELECT COUNT(*) as total FROM completion_documents').get() as { total: number };

    res.json({ byRole, byStatus, totalDocuments: totalRow.total });
  } catch (err) {
    res.status(500).json({ error: '获取概览数据失败' });
  }
});

router.get('/risks', (_req, res) => {
  try {
    const overdueDocs = db.prepare(`
      SELECT * FROM completion_documents
      WHERE status NOT IN ('已签认')
      AND julianday('now') - julianday(updated_at) > 7
    `).all();

    const rejectedDocs = db.prepare(`
      SELECT * FROM completion_documents WHERE status = '已驳回'
    `).all();

    const docsWithUnresolvedExceptions = db.prepare(`
      SELECT d.* FROM completion_documents d
      INNER JOIN exceptions e ON d.id = e.document_id
      WHERE e.status IN ('待处理', '处理中', '已升级')
      GROUP BY d.id
    `).all();

    const seen = new Set<string>();
    const risks: any[] = [];

    const addRisk = (doc: any, reason: string) => {
      if (!seen.has(doc.id)) {
        seen.add(doc.id);
        risks.push({ ...doc, riskReason: reason });
      }
    };

    for (const doc of overdueDocs) addRisk(doc, '超时未处理');
    for (const doc of rejectedDocs) addRisk(doc, '已驳回未解决');
    for (const doc of docsWithUnresolvedExceptions) addRisk(doc, '存在未解决异常');

    res.json(risks);
  } catch (err) {
    res.status(500).json({ error: '获取风险数据失败' });
  }
});

router.get('/recent-changes', (_req, res) => {
  try {
    const changes: { type: string; documentId: string; projectName: string; description: string; timestamp: string }[] = [];

    const docUpdates = db.prepare(`
      SELECT id, project_name, status, updated_at FROM completion_documents ORDER BY updated_at DESC LIMIT 10
    `).all() as any[];

    for (const doc of docUpdates) {
      changes.push({
        type: 'status_change',
        documentId: doc.id,
        projectName: doc.project_name,
        description: `状态更新为：${doc.status}`,
        timestamp: doc.updated_at,
      });
    }

    const recentRemarks = db.prepare(`
      SELECT r.document_id, r.content, r.created_at, d.project_name
      FROM remarks r JOIN completion_documents d ON r.document_id = d.id
      ORDER BY r.created_at DESC LIMIT 10
    `).all() as any[];

    for (const r of recentRemarks) {
      changes.push({
        type: 'new_remark',
        documentId: r.document_id,
        projectName: r.project_name,
        description: `新增备注：${r.content.length > 30 ? r.content.slice(0, 30) + '...' : r.content}`,
        timestamp: r.created_at,
      });
    }

    const recentExceptions = db.prepare(`
      SELECT e.document_id, e.category, e.description, e.created_at, d.project_name
      FROM exceptions e JOIN completion_documents d ON e.document_id = d.id
      ORDER BY e.created_at DESC LIMIT 10
    `).all() as any[];

    for (const e of recentExceptions) {
      changes.push({
        type: 'new_exception',
        documentId: e.document_id,
        projectName: e.project_name,
        description: `新增异常(${e.category})：${e.description.length > 30 ? e.description.slice(0, 30) + '...' : e.description}`,
        timestamp: e.created_at,
      });
    }

    changes.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    res.json(changes.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: '获取最近变更失败' });
  }
});

export default router;
