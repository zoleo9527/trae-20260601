const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');

router.put('/visits', (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !status) return res.status(400).json({ error: '需要提供ids数组和status' });

  const validStatuses = ['pending', 'completed', 'need_followup', 'transferred_to_recall'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: '无效的状态值' });

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const updateOne = db.prepare('UPDATE visit_records SET status = ?, updated_at = ? WHERE id = ?');

  const batchUpdate = db.transaction(() => {
    let updated = 0;
    for (const id of ids) {
      const r = updateOne.run(status, now, id);
      updated += r.changes;
    }
    return updated;
  });

  const count = batchUpdate();
  res.json({ updated: count });
});

router.put('/recalls', (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !status) return res.status(400).json({ error: '需要提供ids数组和status' });

  const validStatuses = ['initiated', 'reviewing', 'executing', 'recalled', 'closed'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: '无效的状态值' });

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const batchUpdate = db.transaction(() => {
    let updated = 0;
    for (const id of ids) {
      const recall = db.prepare('SELECT * FROM recall_records WHERE id = ?').get(id);
      if (!recall) continue;

      if (status !== recall.status) {
        const allowed = {
          initiated: ['reviewing'],
          reviewing: ['executing', 'closed'],
          executing: ['recalled', 'closed'],
          recalled: [],
          closed: []
        };
        if (!(allowed[recall.status] || []).includes(status)) continue;
      }

      db.prepare(
        `UPDATE recall_records SET status = ?, resolved_date = ?, updated_at = ? WHERE id = ?`
      ).run(status, (status === 'recalled' || status === 'closed') ? now : null, now, id);

      if (status === 'recalled') {
        db.prepare('UPDATE animals SET status = ?, updated_at = ? WHERE id = ?').run('recalled', now, recall.animal_id);
      }

      if (status === 'closed' && recall.source_visit_id) {
        db.prepare('UPDATE visit_records SET status = ?, recall_id = ?, updated_at = ? WHERE id = ?').run('need_followup', null, now, recall.source_visit_id);
      }

      updated++;
    }
    return updated;
  });

  const count = batchUpdate();
  res.json({ updated: count });
});

module.exports = router;
