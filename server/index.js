const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '燃气安检系统API运行正常' });
});

app.get('/api/dashboard/stats', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const totalCustomers = db.prepare('SELECT COUNT(*) as cnt FROM customers').get().cnt;
  const totalPlans = db.prepare('SELECT COUNT(*) as cnt FROM inspection_plans').get().cnt;
  const todayPlans = db.prepare('SELECT COUNT(*) as cnt FROM inspection_plans WHERE plan_date = ?').get(today).cnt;
  const pendingHazards = db.prepare(`SELECT COUNT(*) as cnt FROM hazard_records 
    WHERE rectify_status IN ('pending','notified','scheduled','unreachable','refused')`).get().cnt;
  const highHazards = db.prepare(`SELECT COUNT(*) as cnt FROM hazard_records 
    WHERE severity='high' AND rectify_status IN ('pending','notified','scheduled','unreachable','refused')`).get().cnt;
  const pendingAppointments = db.prepare(`SELECT COUNT(*) as cnt FROM revisit_appointments WHERE status='scheduled'`).get().cnt;
  const missedVisits = db.prepare(`SELECT COUNT(DISTINCT customer_id) as cnt FROM plan_customers WHERE visit_status='missed'`).get().cnt;
  const completedRevisit = db.prepare(`SELECT COUNT(*) as cnt FROM revisit_records WHERE rectify_result='rectified'`).get().cnt;

  const hazardByCategory = db.prepare(`
    SELECT ht.category, COUNT(*) as cnt,
      SUM(CASE WHEN hr.rectify_status='rectified' THEN 1 ELSE 0 END) as rectified_cnt
    FROM hazard_records hr
    JOIN hazard_types ht ON hr.hazard_type_id=ht.id
    GROUP BY ht.category
    ORDER BY cnt DESC
  `).all();

  const statusBreakdown = db.prepare(`
    SELECT rectify_status as status, COUNT(*) as cnt FROM hazard_records GROUP BY rectify_status
  `).all();

  res.json({
    totalCustomers,
    totalPlans,
    todayPlans,
    pendingHazards,
    highHazards,
    pendingAppointments,
    missedVisits,
    completedRevisit,
    hazardByCategory,
    statusBreakdown
  });
});

app.get('/api/inspectors', (req, res) => {
  const rows = db.prepare('SELECT * FROM inspectors ORDER BY id').all();
  res.json(rows);
});

app.get('/api/customers', (req, res) => {
  const { keyword } = req.query;
  let sql = 'SELECT * FROM customers';
  let params = [];
  if (keyword) {
    sql += ' WHERE name LIKE ? OR phone LIKE ? OR address LIKE ? OR gas_account LIKE ?';
    const k = `%${keyword}%`;
    params = [k, k, k, k];
  }
  sql += ' ORDER BY id DESC LIMIT 200';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.post('/api/customers', (req, res) => {
  const { name, phone, address, community, building_no, room_no, gas_account } = req.body;
  const info = db.prepare(`
    INSERT INTO customers (name, phone, address, community, building_no, room_no, gas_account)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, phone, address, community, building_no, room_no, gas_account || null);
  res.json({ id: info.lastInsertRowid, ok: true });
});

app.get('/api/customers/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM customers WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '客户不存在' });
  const records = db.prepare(`
    SELECT r.*, i.name as inspector_name
    FROM inspection_records r LEFT JOIN inspectors i ON r.inspector_id=i.id
    WHERE r.customer_id=? ORDER BY r.inspect_date DESC LIMIT 20
  `).all(req.params.id);
  const hazards = db.prepare(`
    SELECT hr.*, ht.name as hazard_name, ht.code as hazard_code, ht.category, ht.is_construction
    FROM hazard_records hr JOIN hazard_types ht ON hr.hazard_type_id=ht.id
    WHERE hr.customer_id=?
    ORDER BY hr.id DESC
  `).all(req.params.id);
  const notices = db.prepare(`
    SELECT n.* FROM rectify_notices n WHERE n.customer_id=? ORDER BY n.issue_date DESC
  `).all(req.params.id);
  const appointments = db.prepare(`
    SELECT a.*, i.name as inspector_name FROM revisit_appointments a
    LEFT JOIN inspectors i ON a.inspector_id=i.id
    WHERE a.customer_id=? ORDER BY a.created_at DESC
  `).all(req.params.id);
  const visits = db.prepare(`
    SELECT v.*, o.name as operator_name FROM customer_visits v
    LEFT JOIN inspectors o ON v.operator_id=o.id
    WHERE v.customer_id=? ORDER BY v.visit_date DESC
  `).all(req.params.id);
  res.json({ customer: row, records, hazards, notices, appointments, visits });
});

app.get('/api/plans', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT p.*, i.name as inspector_name,
      (SELECT COUNT(*) FROM plan_customers pc WHERE pc.plan_id=p.id) as total_count,
      (SELECT COUNT(*) FROM plan_customers pc WHERE pc.plan_id=p.id AND pc.visit_status='completed') as completed_count,
      (SELECT COUNT(*) FROM plan_customers pc WHERE pc.plan_id=p.id AND pc.visit_status='missed') as missed_count
    FROM inspection_plans p LEFT JOIN inspectors i ON p.inspector_id=i.id
  `;
  let params = [];
  if (status && status !== 'all') {
    sql += ' WHERE p.status=?';
    params = [status];
  }
  sql += ' ORDER BY p.plan_date DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.post('/api/plans', (req, res) => {
  const { plan_no, plan_name, inspector_id, plan_date, area, remark } = req.body;
  const info = db.prepare(`
    INSERT INTO inspection_plans (plan_no, plan_name, inspector_id, plan_date, area, status, remark)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(plan_no, plan_name, inspector_id, plan_date, area, remark);
  res.json({ id: info.lastInsertRowid, ok: true });
});

app.get('/api/plans/:id', (req, res) => {
  const plan = db.prepare(`
    SELECT p.*, i.name as inspector_name, i.phone as inspector_phone
    FROM inspection_plans p LEFT JOIN inspectors i ON p.inspector_id=i.id
    WHERE p.id=?
  `).get(req.params.id);
  if (!plan) return res.status(404).json({ error: '计划不存在' });
  const customers = db.prepare(`
    SELECT pc.*, c.name, c.phone, c.address, c.community, c.building_no, c.room_no, c.gas_account
    FROM plan_customers pc JOIN customers c ON pc.customer_id=c.id
    WHERE pc.plan_id=? ORDER BY c.building_no, c.room_no
  `).all(req.params.id);
  res.json({ plan, customers });
});

app.post('/api/plans/:id/customers', (req, res) => {
  const { customer_ids } = req.body;
  const planId = req.params.id;
  const insert = db.prepare('INSERT INTO plan_customers (plan_id, customer_id) VALUES (?, ?)');
  const tx = db.transaction((ids) => {
    for (const cid of ids) {
      try { insert.run(planId, cid); } catch (e) {}
    }
  });
  tx(customer_ids);
  res.json({ ok: true });
});

app.patch('/api/plans/:id', (req, res) => {
  const { status, remark } = req.body;
  db.prepare('UPDATE inspection_plans SET status=COALESCE(?,status), remark=COALESCE(?,remark) WHERE id=?')
    .run(status || null, remark || null, req.params.id);
  res.json({ ok: true });
});

app.get('/api/hazard-types', (req, res) => {
  const rows = db.prepare('SELECT * FROM hazard_types ORDER BY category, code').all();
  res.json(rows);
});

app.get('/api/hazards', (req, res) => {
  const { rectify_status, severity, is_construction, keyword } = req.query;
  let sql = `
    SELECT hr.*, ht.name as hazard_name, ht.code as hazard_code, ht.category, ht.is_construction,
      c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
      r.record_no, r.inspect_date,
      i.name as handler_name
    FROM hazard_records hr
    JOIN hazard_types ht ON hr.hazard_type_id=ht.id
    JOIN customers c ON hr.customer_id=c.id
    LEFT JOIN inspection_records r ON hr.record_id=r.id
    LEFT JOIN inspectors i ON hr.handler_id=i.id
    WHERE 1=1
  `;
  let params = [];
  if (rectify_status && rectify_status !== 'all') {
    sql += ' AND hr.rectify_status=?';
    params.push(rectify_status);
  }
  if (severity && severity !== 'all') {
    sql += ' AND hr.severity=?';
    params.push(severity);
  }
  if (is_construction && is_construction !== 'all') {
    sql += ' AND ht.is_construction=?';
    params.push(is_construction === '1' ? 1 : 0);
  }
  if (keyword) {
    sql += ' AND (c.name LIKE ? OR c.address LIKE ? OR ht.name LIKE ?)';
    const k = `%${keyword}%`;
    params.push(k, k, k);
  }
  sql += ' ORDER BY hr.id DESC LIMIT 200';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.post('/api/inspection-records', (req, res) => {
  const { record_no, plan_customer_id, inspector_id, customer_id, inspect_date,
    is_user_at_home, meter_reading, overall_status, remark, hazards } = req.body;
  const info = db.prepare(`
    INSERT INTO inspection_records (record_no, plan_customer_id, inspector_id, customer_id, inspect_date, is_user_at_home, meter_reading, overall_status, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(record_no, plan_customer_id, inspector_id, customer_id, inspect_date,
    is_user_at_home ? 1 : 0, meter_reading, overall_status, remark);
  const recordId = info.lastInsertRowid;
  if (plan_customer_id) {
    const visitedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const status = is_user_at_home ? 'completed' : 'missed';
    db.prepare(`UPDATE plan_customers SET visit_status=?, visit_times=visit_times+1, last_visit_time=? WHERE id=?`)
      .run(status, visitedAt, plan_customer_id);
  }
  if (hazards && hazards.length) {
    const insert = db.prepare(`
      INSERT INTO hazard_records (record_id, customer_id, hazard_type_id, location, description, severity, rectify_status, deadline, handler_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const tx = db.transaction((list) => {
      for (const h of list) {
        insert.run(recordId, customer_id, h.hazard_type_id, h.location, h.description,
          h.severity, 'pending', h.deadline || null, h.handler_id || null);
      }
    });
    tx(hazards);
  }
  res.json({ id: recordId, ok: true });
});

app.get('/api/inspection-records/:id', (req, res) => {
  const record = db.prepare(`
    SELECT r.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
      c.gas_account, i.name as inspector_name, i.employee_no, p.plan_no, p.plan_name
    FROM inspection_records r
    JOIN customers c ON r.customer_id=c.id
    JOIN inspectors i ON r.inspector_id=i.id
    LEFT JOIN plan_customers pc ON r.plan_customer_id=pc.id
    LEFT JOIN inspection_plans p ON pc.plan_id=p.id
    WHERE r.id=?
  `).get(req.params.id);
  if (!record) return res.status(404).json({ error: '记录不存在' });
  const hazards = db.prepare(`
    SELECT hr.*, ht.name as hazard_name, ht.code as hazard_code, ht.category,
      ht.description as type_desc, ht.is_construction, ht.default_deadline_days
    FROM hazard_records hr JOIN hazard_types ht ON hr.hazard_type_id=ht.id
    WHERE hr.record_id=?
  `).all(req.params.id);
  res.json({ record, hazards });
});

app.patch('/api/hazards/:id', (req, res) => {
  const { rectify_status, deadline, handler_id, description } = req.body;
  db.prepare(`
    UPDATE hazard_records SET 
      rectify_status=COALESCE(?,rectify_status),
      deadline=COALESCE(?,deadline),
      handler_id=COALESCE(?,handler_id),
      description=COALESCE(?,description)
    WHERE id=?
  `).run(rectify_status || null, deadline || null, handler_id || null, description || null, req.params.id);
  res.json({ ok: true });
});

app.get('/api/notices', (req, res) => {
  const { status, customer_id } = req.query;
  let sql = `
    SELECT n.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
      o.name as operator_name, hr.description as hazard_desc,
      ht.name as hazard_name
    FROM rectify_notices n
    JOIN customers c ON n.customer_id=c.id
    LEFT JOIN inspectors o ON n.operator_id=o.id
    LEFT JOIN hazard_records hr ON n.hazard_record_id=hr.id
    LEFT JOIN hazard_types ht ON hr.hazard_type_id=ht.id
    WHERE 1=1
  `;
  const params = [];
  if (customer_id) {
    sql += ' AND n.customer_id=?';
    params.push(customer_id);
  }
  sql += ' ORDER BY n.issue_date DESC LIMIT 200';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.post('/api/notices', (req, res) => {
  const { notice_no, hazard_record_id, customer_id, issue_date, deadline,
    rectify_requirement, notice_method, operator_id, customer_signature } = req.body;
  const info = db.prepare(`
    INSERT INTO rectify_notices (notice_no, hazard_record_id, customer_id, issue_date, deadline, rectify_requirement, notice_method, operator_id, customer_signature)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(notice_no, hazard_record_id, customer_id, issue_date, deadline,
    rectify_requirement, notice_method, operator_id, customer_signature || null);
  if (hazard_record_id) {
    db.prepare('UPDATE hazard_records SET rectify_status=? WHERE id=?')
      .run('notified', hazard_record_id);
  }
  res.json({ id: info.lastInsertRowid, ok: true });
});

app.get('/api/appointments', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT a.*, c.address as customer_address, c.community,
      o.name as operator_name, i.name as inspector_name,
      hr.description as hazard_desc, ht.name as hazard_name
    FROM revisit_appointments a
    JOIN customers c ON a.customer_id=c.id
    LEFT JOIN inspectors o ON a.operator_id=o.id
    LEFT JOIN inspectors i ON a.inspector_id=i.id
    LEFT JOIN hazard_records hr ON a.hazard_record_id=hr.id
    LEFT JOIN hazard_types ht ON hr.hazard_type_id=ht.id
    WHERE 1=1
  `;
  const params = [];
  if (status && status !== 'all') {
    sql += ' AND a.status=?';
    params.push(status);
  }
  sql += ' ORDER BY a.appointment_date, a.appointment_time_slot LIMIT 200';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.post('/api/appointments', (req, res) => {
  const { appointment_no, hazard_record_id, customer_id, customer_name, customer_phone,
    appointment_date, appointment_time_slot, operator_id, inspector_id, remark } = req.body;
  const info = db.prepare(`
    INSERT INTO revisit_appointments (appointment_no, hazard_record_id, customer_id, customer_name, customer_phone, appointment_date, appointment_time_slot, status, operator_id, inspector_id, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?)
  `).run(appointment_no, hazard_record_id, customer_id, customer_name, customer_phone,
    appointment_date, appointment_time_slot, operator_id, inspector_id, remark);
  if (hazard_record_id) {
    db.prepare('UPDATE hazard_records SET rectify_status=? WHERE id=?')
      .run('scheduled', hazard_record_id);
  }
  res.json({ id: info.lastInsertRowid, ok: true });
});

app.patch('/api/appointments/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE revisit_appointments SET status=? WHERE id=?')
    .run(status, req.params.id);
  res.json({ ok: true });
});

app.get('/api/revisits', (req, res) => {
  const rows = db.prepare(`
    SELECT rv.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
      i.name as inspector_name, a.appointment_no, a.appointment_date,
      hr.description as hazard_desc, ht.name as hazard_name
    FROM revisit_records rv
    JOIN customers c ON rv.customer_id=c.id
    JOIN inspectors i ON rv.inspector_id=i.id
    LEFT JOIN revisit_appointments a ON rv.appointment_id=a.id
    LEFT JOIN hazard_records hr ON rv.hazard_record_id=hr.id
    LEFT JOIN hazard_types ht ON hr.hazard_type_id=ht.id
    ORDER BY rv.revisit_date DESC LIMIT 200
  `).all();
  res.json(rows);
});

app.post('/api/revisits', (req, res) => {
  const { revisit_no, appointment_id, hazard_record_id, inspector_id, customer_id,
    revisit_date, is_user_at_home, rectify_result, description, next_action } = req.body;
  const info = db.prepare(`
    INSERT INTO revisit_records (revisit_no, appointment_id, hazard_record_id, inspector_id, customer_id, revisit_date, is_user_at_home, rectify_result, description, next_action)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(revisit_no, appointment_id, hazard_record_id, inspector_id, customer_id,
    revisit_date, is_user_at_home ? 1 : 0, rectify_result, description, next_action);
  if (appointment_id) {
    const newStatus = rectify_result === 'rectified' ? 'completed'
      : rectify_result === 'partial' ? 'partial'
      : rectify_result === 'refused' ? 'refused'
      : !is_user_at_home ? 'missed' : 'rescheduled';
    db.prepare('UPDATE revisit_appointments SET status=? WHERE id=?').run(newStatus, appointment_id);
  }
  if (hazard_record_id) {
    if (rectify_result === 'rectified') {
      db.prepare('UPDATE hazard_records SET rectify_status=? WHERE id=?').run('rectified', hazard_record_id);
    } else if (rectify_result === 'refused') {
      db.prepare('UPDATE hazard_records SET rectify_status=? WHERE id=?').run('refused', hazard_record_id);
    } else if (!is_user_at_home) {
      db.prepare('UPDATE hazard_records SET rectify_status=? WHERE id=?').run('unreachable', hazard_record_id);
    }
  }
  res.json({ id: info.lastInsertRowid, ok: true });
});

app.get('/api/visits', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT v.*, c.name as customer_name, c.phone as customer_phone,
      o.name as operator_name
    FROM customer_visits v
    JOIN customers c ON v.customer_id=c.id
    LEFT JOIN inspectors o ON v.operator_id=o.id
    WHERE 1=1
  `;
  const params = [];
  if (status && status !== 'all') {
    sql += ' AND v.status=?';
    params.push(status);
  }
  sql += ' ORDER BY v.visit_date DESC LIMIT 200';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.post('/api/visits', (req, res) => {
  const { visit_no, customer_id, record_id, operator_id, visit_date, visit_method,
    visit_purpose, visit_content, customer_feedback, satisfaction_level, status, follow_up } = req.body;
  const info = db.prepare(`
    INSERT INTO customer_visits (visit_no, customer_id, record_id, operator_id, visit_date, visit_method, visit_purpose, visit_content, customer_feedback, satisfaction_level, status, follow_up)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(visit_no, customer_id, record_id || null, operator_id || null, visit_date,
    visit_method, visit_purpose, visit_content, customer_feedback || null,
    satisfaction_level || null, status || 'completed', follow_up || null);
  res.json({ id: info.lastInsertRowid, ok: true });
});

app.patch('/api/visits/:id', (req, res) => {
  const { status, follow_up, customer_feedback, satisfaction_level } = req.body;
  db.prepare(`
    UPDATE customer_visits SET 
      status=COALESCE(?,status),
      follow_up=COALESCE(?,follow_up),
      customer_feedback=COALESCE(?,customer_feedback),
      satisfaction_level=COALESCE(?,satisfaction_level)
    WHERE id=?
  `).run(status || null, follow_up || null, customer_feedback || null, satisfaction_level || null, req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`🚀 燃气安检系统API运行于 http://localhost:${PORT}`);
});
