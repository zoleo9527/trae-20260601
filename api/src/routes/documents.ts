import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';

const router = Router();

const statusToStage: Record<string, string> = {
  '待整理': '整理',
  '待审核': '审核',
  '待签认': '签认',
  '已签认': '签认',
  '已驳回': '异常处理',
};

router.get('/', (req, res) => {
  try {
    const { status, assignee_role } = req.query;
    let sql = `
      SELECT d.*,
        (SELECT COUNT(*) FROM remarks WHERE document_id = d.id) as remarks_count,
        (SELECT COUNT(*) FROM exceptions WHERE document_id = d.id) as exceptions_count,
        (SELECT content FROM remarks WHERE document_id = d.id ORDER BY created_at DESC LIMIT 1) as latest_remark
      FROM completion_documents d WHERE 1=1
    `;
    const params: string[] = [];

    if (status) {
      sql += ' AND d.status = ?';
      params.push(status as string);
    }
    if (assignee_role) {
      sql += ' AND d.assignee_role = ?';
      params.push(assignee_role as string);
    }

    sql += ' ORDER BY d.updated_at DESC';

    const documents = db.prepare(sql).all(...params);
    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: '获取文档列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM completion_documents WHERE id = ?').get(req.params.id);
    if (!doc) {
      res.status(404).json({ error: '文档不存在' });
      return;
    }

    const remarks = db.prepare('SELECT * FROM remarks WHERE document_id = ? ORDER BY created_at ASC').all(req.params.id);
    const exceptions = db.prepare('SELECT * FROM exceptions WHERE document_id = ? ORDER BY created_at ASC').all(req.params.id);

    const exceptionsWithRecords = exceptions.map((exc: any) => {
      const records = db.prepare('SELECT * FROM exception_records WHERE exception_id = ? ORDER BY created_at ASC').all(exc.id);
      return { ...exc, records };
    });

    const signOffs = db.prepare('SELECT * FROM sign_offs WHERE document_id = ? ORDER BY signed_at ASC').all(req.params.id);

    res.json({ ...doc, remarks, exceptions: exceptionsWithRecords, signOffs });
  } catch (err) {
    res.status(500).json({ error: '获取文档详情失败' });
  }
});

router.post('/', (req, res) => {
  try {
    const { project_name, doc_type, assignee_name, assignee_role } = req.body;
    if (!project_name || !doc_type || !assignee_name || !assignee_role) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO completion_documents (id, project_name, doc_type, status, assignee_name, assignee_role)
      VALUES (?, ?, ?, '待整理', ?, ?)
    `).run(id, project_name, doc_type, assignee_name, assignee_role);

    const doc = db.prepare('SELECT * FROM completion_documents WHERE id = ?').get(id);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: '创建文档失败' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM completion_documents WHERE id = ?').get(req.params.id) as any;
    if (!doc) {
      res.status(404).json({ error: '文档不存在' });
      return;
    }

    const { status, assignee_name, assignee_role, project_name, doc_type } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (project_name !== undefined) { updates.push('project_name = ?'); params.push(project_name); }
    if (doc_type !== undefined) { updates.push('doc_type = ?'); params.push(doc_type); }
    if (assignee_name !== undefined) { updates.push('assignee_name = ?'); params.push(assignee_name); }
    if (assignee_role !== undefined) { updates.push('assignee_role = ?'); params.push(assignee_role); }

    if (status !== undefined && status !== doc.status) {
      updates.push('status = ?');
      params.push(status);

      if (status === '已驳回') {
        const excId = uuidv4();
        db.prepare(`
          INSERT INTO exceptions (id, document_id, category, description, status)
          VALUES (?, ?, '其他', ?, '待处理')
        `).run(excId, req.params.id, `文档状态变更为已驳回，原状态：${doc.status}`);
      }
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(req.params.id);
      db.prepare(`UPDATE completion_documents SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = db.prepare('SELECT * FROM completion_documents WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新文档失败' });
  }
});

router.post('/:id/remarks', (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM completion_documents WHERE id = ?').get(req.params.id) as any;
    if (!doc) {
      res.status(404).json({ error: '文档不存在' });
      return;
    }

    const { content, author, author_role } = req.body;
    if (!content || !author || !author_role) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }

    const stage = statusToStage[doc.status] || '整理';
    const id = uuidv4();

    db.prepare(`
      INSERT INTO remarks (id, document_id, content, author, author_role, stage)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, content, author, author_role, stage);

    const remark = db.prepare('SELECT * FROM remarks WHERE id = ?').get(id);
    res.status(201).json(remark);
  } catch (err) {
    res.status(500).json({ error: '添加备注失败' });
  }
});

router.put('/batch', (req, res) => {
  try {
    const { ids, action, data } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !action) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }

    const results: any[] = [];

    const batchTx = db.transaction(() => {
      for (const id of ids) {
        const doc = db.prepare('SELECT * FROM completion_documents WHERE id = ?').get(id) as any;
        if (!doc) continue;

        if (action === 'submit_review' && doc.status === '待整理') {
          db.prepare("UPDATE completion_documents SET status = '待审核', updated_at = datetime('now') WHERE id = ?").run(id);
          results.push({ id, status: '待审核' });
        } else if (action === 'mark_exception') {
          const excId = uuidv4();
          const category = (data as any)?.category || '其他';
          const description = (data as any)?.description || '批量标记异常';
          db.prepare(`
            INSERT INTO exceptions (id, document_id, category, description, status)
            VALUES (?, ?, ?, ?, '待处理')
          `).run(excId, id, category, description);
          results.push({ id, exceptionId: excId });
        } else if (action === 'reassign') {
          const { assignee_name, assignee_role } = data as any;
          if (assignee_name && assignee_role) {
            db.prepare("UPDATE completion_documents SET assignee_name = ?, assignee_role = ?, updated_at = datetime('now') WHERE id = ?").run(assignee_name, assignee_role, id);
            results.push({ id, assignee_name, assignee_role });
          }
        }
      }
    });

    batchTx();
    res.json({ updated: results });
  } catch (err) {
    res.status(500).json({ error: '批量操作失败' });
  }
});

router.post('/:id/sign-off', (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM completion_documents WHERE id = ?').get(req.params.id) as any;
    if (!doc) {
      res.status(404).json({ error: '文档不存在' });
      return;
    }

    const { clientName, result, comment } = req.body;
    if (!clientName || !result) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }

    if (!['已签认', '已驳回'].includes(result)) {
      res.status(400).json({ error: '无效的签认结果' });
      return;
    }

    const signOffId = uuidv4();

    const signOffTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO sign_offs (id, document_id, client_name, result, comment)
        VALUES (?, ?, ?, ?, ?)
      `).run(signOffId, req.params.id, clientName, result, comment || null);

      const remarkId = uuidv4();
      const remarkContent = result === '已签认'
        ? `客户${clientName}签认确认${comment ? '：' + comment : ''}`
        : `客户${clientName}驳回签认${comment ? '，原因：' + comment : ''}`;
      db.prepare(`
        INSERT INTO remarks (id, document_id, content, author, author_role, stage)
        VALUES (?, ?, ?, ?, '客户', '签认')
      `).run(remarkId, req.params.id, remarkContent, clientName);

      db.prepare("UPDATE completion_documents SET status = ?, updated_at = datetime('now') WHERE id = ?").run(result, req.params.id);

      if (result === '已驳回') {
        const excId = uuidv4();
        db.prepare(`
          INSERT INTO exceptions (id, document_id, category, description, status)
          VALUES (?, ?, '其他', ?, '待处理')
        `).run(excId, req.params.id, `客户${clientName}驳回签认${comment ? '：' + comment : ''}`);
      }
    });

    signOffTx();

    const signOff = db.prepare('SELECT * FROM sign_offs WHERE id = ?').get(signOffId);
    res.status(201).json(signOff);
  } catch (err) {
    res.status(500).json({ error: '签认操作失败' });
  }
});

router.put('/batch-sign-off', (req, res) => {
  try {
    const { ids, clientName, result, comment } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !clientName || !result) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }
    if (!['已签认', '已驳回'].includes(result)) {
      res.status(400).json({ error: '无效的签认结果' });
      return;
    }

    const results: any[] = [];

    const batchTx = db.transaction(() => {
      for (const id of ids) {
        const doc = db.prepare('SELECT * FROM completion_documents WHERE id = ? AND status = ?').get(id, '待签认') as any;
        if (!doc) continue;

        const signOffId = uuidv4();
        db.prepare(`
          INSERT INTO sign_offs (id, document_id, client_name, result, comment)
          VALUES (?, ?, ?, ?, ?)
        `).run(signOffId, id, clientName, result, comment || null);

        const remarkId = uuidv4();
        const remarkContent = result === '已签认'
          ? `客户${clientName}批量签认确认${comment ? '：' + comment : ''}`
          : `客户${clientName}批量驳回签认${comment ? '，原因：' + comment : ''}`;
        db.prepare(`
          INSERT INTO remarks (id, document_id, content, author, author_role, stage)
          VALUES (?, ?, ?, ?, '客户', '签认')
        `).run(remarkId, id, remarkContent, clientName);

        db.prepare("UPDATE completion_documents SET status = ?, updated_at = datetime('now') WHERE id = ?").run(result, id);

        if (result === '已驳回') {
          const excId = uuidv4();
          db.prepare(`
            INSERT INTO exceptions (id, document_id, category, description, status)
            VALUES (?, ?, '其他', ?, '待处理')
          `).run(excId, id, `客户${clientName}批量驳回签认${comment ? '：' + comment : ''}`);
        }

        results.push({ id, result });
      }
    });

    batchTx();
    res.json({ updated: results });
  } catch (err) {
    res.status(500).json({ error: '批量签认操作失败' });
  }
});

export default router;
