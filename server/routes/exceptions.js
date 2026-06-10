import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { status, severity, house_id, handler_role, source_type, source_id } = req.query;

  let sql = `
    SELECT e.*,
      h.code as house_code, h.name as house_name,
      u.name as handler_name
    FROM exceptions e
    JOIN houses h ON e.house_id = h.id
    LEFT JOIN users u ON e.handler_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) { sql += ' AND e.status = ?'; params.push(status); }
  if (severity) { sql += ' AND e.severity = ?'; params.push(severity); }
  if (house_id) { sql += ' AND e.house_id = ?'; params.push(house_id); }
  if (handler_role) { sql += ' AND e.handler_role = ?'; params.push(handler_role); }
  if (source_type) { sql += ' AND e.source_type = ?'; params.push(source_type); }
  if (source_id) { sql += ' AND e.source_id = ?'; params.push(source_id); }

  sql += " ORDER BY CASE e.severity WHEN 'critical' THEN 1 WHEN 'urgent' THEN 2 WHEN 'warning' THEN 3 WHEN 'info' THEN 4 END, e.created_at DESC";

  res.json({ exceptions: db.prepare(sql).all(...params) });
});

router.get('/summary', (req, res) => {
  const db = getDb();
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM exceptions GROUP BY status
  `).all();
  const bySeverity = db.prepare(`
    SELECT severity, COUNT(*) as count FROM exceptions WHERE status IN ('open','assigned','handling') GROUP BY severity
  `).all();
  res.json({ byStatus, bySeverity });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const exc = db.prepare(`
    SELECT e.*,
      h.code as house_code, h.name as house_name,
      u.name as handler_name
    FROM exceptions e
    JOIN houses h ON e.house_id = h.id
    LEFT JOIN users u ON e.handler_id = u.id
    WHERE e.id = ?
  `).get(req.params.id);

  if (!exc) return res.status(404).json({ error: '异常不存在' });

  const timeline = db.prepare(`
    SELECT et.*, u.name as operator_name_fallback
    FROM exception_timeline et
    LEFT JOIN users u ON et.operator_id = u.id
    WHERE et.exception_id = ?
    ORDER BY et.created_at ASC
  `).all(req.params.id);

  const attachments = db.prepare(`
    SELECT a.*, u.name as uploader_name
    FROM attachments a
    JOIN users u ON a.uploaded_by = u.id
    WHERE a.target_type = 'exception' AND a.target_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.id);

  res.json({ exception: exc, timeline, attachments });
});

router.get('/:id/timeline', (req, res) => {
  const db = getDb();
  const timeline = db.prepare(`
    SELECT et.*, u.name as operator_name_fallback
    FROM exception_timeline et
    LEFT JOIN users u ON et.operator_id = u.id
    WHERE et.exception_id = ?
    ORDER BY et.created_at ASC
  `).all(req.params.id);
  res.json({ timeline });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { source_type, source_id, house_id, severity, category, description, handler_role, reporter_id, reporter_name } = req.body;

  const r = db.prepare(`
    INSERT INTO exceptions (source_type, source_id, house_id, severity, category, description, handler_role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
  `).run(source_type || 'system', source_id || null, house_id, severity || 'warning', category, description, handler_role || 'manager');

  db.prepare(`
    INSERT INTO exception_timeline (exception_id, action, content, operator_id, operator_name)
    VALUES (?, 'created', ?, ?, ?)
  `).run(r.lastInsertRowid, description, reporter_id || null, reporter_name || '系统');

  res.json({ id: r.lastInsertRowid });
});

router.put('/:id/assign', (req, res) => {
  const db = getDb();
  const { handler_id, handler_role, operator_id, operator_name } = req.body;

  const exc = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  if (!exc) return res.status(404).json({ error: '异常不存在' });

  db.prepare(`
    UPDATE exceptions SET handler_id = ?, handler_role = ?, status = 'assigned', updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(handler_id, handler_role, req.params.id);

  const handlerUser = db.prepare('SELECT name FROM users WHERE id = ?').get(handler_id);
  const handlerName = handlerUser?.name || operator_name || '未知';

  db.prepare(`
    INSERT INTO exception_timeline (exception_id, action, content, operator_id, operator_name)
    VALUES (?, 'assigned', ?, ?, ?)
  `).run(req.params.id, `指派给${handlerName}（${handler_role === 'feeder' ? '饲养员' : handler_role === 'sorter' ? '分拣员' : '场长'}）`, operator_id || null, operator_name || '系统');

  if (handler_id) {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, link)
      VALUES (?, 'assigned', '异常已指派给您', ?, '/exceptions')
    `).run(handler_id, exc.description);
  }

  res.json({ ok: true });
});

router.put('/:id/handle', (req, res) => {
  const db = getDb();
  const { operator_id, operator_name } = req.body;

  db.prepare(`
    UPDATE exceptions SET status = 'handling', updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(req.params.id);

  db.prepare(`
    INSERT INTO exception_timeline (exception_id, action, content, operator_id, operator_name)
    VALUES (?, 'handling', '开始处理', ?, ?)
  `).run(req.params.id, operator_id || null, operator_name || '未知');

  res.json({ ok: true });
});

router.put('/:id/resolve', (req, res) => {
  const db = getDb();
  const { resolution, operator_id, operator_name } = req.body;

  db.prepare(`
    UPDATE exceptions SET status = 'resolved', resolution = ?, resolved_at = datetime('now','localtime'), updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(resolution || '已解决', req.params.id);

  db.prepare(`
    INSERT INTO exception_timeline (exception_id, action, content, operator_id, operator_name)
    VALUES (?, 'resolved', ?, ?, ?)
  `).run(req.params.id, `已解决：${resolution || '已解决'}`, operator_id || null, operator_name || '未知');

  res.json({ ok: true });
});

router.put('/:id/close', (req, res) => {
  const db = getDb();
  const { operator_id, operator_name } = req.body;

  db.prepare(`
    UPDATE exceptions SET status = 'closed', updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(req.params.id);

  db.prepare(`
    INSERT INTO exception_timeline (exception_id, action, content, operator_id, operator_name)
    VALUES (?, 'closed', '已关闭', ?, ?)
  `).run(req.params.id, operator_id || null, operator_name || '场长');

  res.json({ ok: true });
});

export default router;
