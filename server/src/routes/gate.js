const express = require('express');
const router = express.Router();
const containerService = require('../services/containerService');
const slotService = require('../services/slotService');
const statusService = require('../services/statusService');
const { getDb } = require('../db');
const bus = require('../eventBus');
const dayjs = require('dayjs');

router.post('/entry', (req, res) => {
  try {
    const result = containerService.registerEntry(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/entry/:id', (req, res) => {
  try {
    const result = containerService.modifyEntry(
      Number(req.params.id), req.body, req.body.operator || ''
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/entries', (req, res) => {
  try {
    const result = containerService.listEntries(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/entry/:id', (req, res) => {
  try {
    const result = containerService.getEntry(Number(req.params.id));
    if (!result) return res.status(404).json({ success: false, error: '记录不存在' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/departing', (req, res) => {
  try {
    const db = getDb();
    const containers = db.prepare(`
      SELECT c.*, s.slot_code, gr.truck_no as entry_truck_no, gr.driver_name as entry_driver_name
      FROM containers c
      LEFT JOIN slots s ON c.slot_id = s.id
      LEFT JOIN gate_records gr ON c.gate_record_id = gr.id
      WHERE c.status = 'DEPARTING'
      ORDER BY c.entry_time DESC
    `).all();
    res.json({ success: true, data: containers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/depart-confirm', (req, res) => {
  try {
    const db = getDb();
    const { container_id, confirmed_by } = req.body;

    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(container_id);
    if (!container) return res.status(404).json({ success: false, error: '集装箱不存在' });
    if (container.status !== 'DEPARTING') {
      return res.status(400).json({ success: false, error: `集装箱状态为 ${container.status}，非待离港状态` });
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const oldSlotId = container.slot_id;

    const transaction = db.transaction(() => {
      db.prepare('UPDATE containers SET status = ?, actual_departure = ? WHERE id = ?')
        .run('DEPARTED', now, container_id);

      if (oldSlotId) {
        const activeAlloc = db.prepare(
          'SELECT * FROM slot_allocations WHERE container_id = ? AND status = ?'
        ).get(container_id, 'ACTIVE');

        if (activeAlloc) {
          db.prepare('UPDATE slot_allocations SET status = ? WHERE id = ?')
            .run('RELEASED', activeAlloc.id);
        }

        db.prepare('UPDATE slots SET container_id = NULL, container_no = ?, status = ? WHERE id = ?')
          .run('', 'EMPTY', oldSlotId);
      }

      db.prepare('UPDATE containers SET slot_id = NULL WHERE id = ?').run(container_id);

      db.prepare(`
        INSERT INTO status_change_logs (container_no, from_status, to_status, changed_by, changed_at, reason, detail)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        container.container_no, 'DEPARTING', 'DEPARTED',
        confirmed_by || '闸口员', now, '离港核验通过',
        oldSlotId ? `释放堆位ID: ${oldSlotId}` : '无堆位'
      );
    });

    transaction();

    const releasedSlotCode = oldSlotId
      ? (db.prepare('SELECT slot_code FROM slots WHERE id = ?').get(oldSlotId)?.slot_code || '')
      : '';

    if (oldSlotId) {
      bus.emit(bus.SLOT_RELEASED, {
        containerId: container_id,
        container_no: container.container_no,
        slotId: oldSlotId,
        slot_code: releasedSlotCode,
        releasedBy: confirmed_by || '闸口员',
        reason: '离港核验-集装箱出港',
      });
    }

    bus.emit(bus.CONTAINER_STATUS_CHANGED, {
      container_no: container.container_no,
      fromStatus: 'DEPARTING',
      toStatus: 'DEPARTED',
      changedBy: confirmed_by || '闸口员',
      reason: '离港核验通过',
      detail: `堆位 ${releasedSlotCode} 已释放`,
    });

    const result = db.prepare('SELECT * FROM containers WHERE id = ?').get(container_id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
