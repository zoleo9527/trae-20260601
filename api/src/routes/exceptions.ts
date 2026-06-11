import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';

const router = Router();

router.get('/:id/exceptions', (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM completion_documents WHERE id = ?').get(req.params.id);
    if (!doc) {
      res.status(404).json({ error: '文档不存在' });
      return;
    }

    const exceptions = db.prepare('SELECT * FROM exceptions WHERE document_id = ? ORDER BY created_at ASC').all(req.params.id);
    const exceptionsWithRecords = exceptions.map((exc: any) => {
      const records = db.prepare('SELECT * FROM exception_records WHERE exception_id = ? ORDER BY created_at ASC').all(exc.id);
      return { ...exc, records };
    });

    res.json(exceptionsWithRecords);
  } catch (err) {
    res.status(500).json({ error: '获取异常列表失败' });
  }
});

router.post('/:id/exceptions', (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM completion_documents WHERE id = ?').get(req.params.id);
    if (!doc) {
      res.status(404).json({ error: '文档不存在' });
      return;
    }

    const { category, description } = req.body;
    if (!category || !description) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO exceptions (id, document_id, category, description, status)
      VALUES (?, ?, ?, ?, '待处理')
    `).run(id, req.params.id, category, description);

    const exc = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
    res.status(201).json(exc);
  } catch (err) {
    res.status(500).json({ error: '创建异常失败' });
  }
});

router.put('/:id/exceptions/:eid', (req, res) => {
  try {
    const exc = db.prepare('SELECT * FROM exceptions WHERE id = ? AND document_id = ?').get(req.params.eid, req.params.id) as any;
    if (!exc) {
      res.status(404).json({ error: '异常记录不存在' });
      return;
    }

    const { status, handler, handler_role, action, operator, operator_role } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (handler !== undefined) { updates.push('handler = ?'); params.push(handler); }
    if (handler_role !== undefined) { updates.push('handler_role = ?'); params.push(handler_role); }

    if (status === '已解决') {
      updates.push("resolved_at = datetime('now')");
    }

    if (updates.length > 0) {
      params.push(req.params.eid);
      db.prepare(`UPDATE exceptions SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    if (action && operator && operator_role) {
      const recordId = uuidv4();
      db.prepare(`
        INSERT INTO exception_records (id, exception_id, action, operator, operator_role)
        VALUES (?, ?, ?, ?, ?)
      `).run(recordId, req.params.eid, action, operator, operator_role);
    }

    const updated = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.eid);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新异常失败' });
  }
});

export default router;
