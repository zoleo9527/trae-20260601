const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/users', (req, res) => {
  db.all("SELECT id, username, name, role, avatar FROM users", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/users/current', (req, res) => {
  const userId = req.headers['x-user-id'] || 'all';
  if (userId === 'all') {
    db.get("SELECT * FROM users WHERE role = 'manager' LIMIT 1", (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  } else {
    db.get("SELECT id, username, name, role, avatar FROM users WHERE id = ?", [userId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT id, username, name, role, avatar FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: '用户名或密码错误' });
    res.json({ user: row, token: 'demo-token-' + row.id });
  });
});

app.get('/api/dashboard/today', (req, res) => {
  const role = req.headers['x-role'] || 'manager';
  const today = new Date().toISOString().split('T')[0];
  
  const result = { date: today, tasks: [], stats: {} };
  
  db.serialize(() => {
    db.get("SELECT COUNT(*) as count FROM reservations WHERE date = ?", [today], (err, row) => {
      result.stats.reservations = row.count;
    });
    
    db.get("SELECT COUNT(*) as count FROM staff_schedules WHERE date = ? AND status != 'cancelled'", [today], (err, row) => {
      result.stats.staffOnDuty = row.count;
    });
    
    db.get("SELECT COUNT(*) as count FROM risk_alerts WHERE status IN ('open', 'processing')", (err, row) => {
      result.stats.activeRisks = row.count;
    });
    
    db.get("SELECT COUNT(*) as count FROM route_maintenance WHERE status IN ('pending', 'in_progress')", (err, row) => {
      result.stats.pendingMaintenance = row.count;
    });
    
    if (role === 'frontdesk' || role === 'manager') {
      db.all(`
        SELECT r.*, m.name as member_name, m.level as member_level 
        FROM reservations r 
        JOIN members m ON r.member_id = m.id 
        WHERE r.date = ? 
        ORDER BY r.time_slot
      `, [today], (err, rows) => {
        if (rows && rows.length > 0) {
          result.tasks.push({
            category: '今日预约',
            priority: 'high',
            items: rows.map(r => ({
              id: r.id,
              title: `${r.member_name} - ${r.time_slot}`,
              subtitle: `${r.type === 'trial' ? '体验课' : r.type === 'course' ? '课程' : '自由攀'} · ${r.member_level}`,
              status: r.status,
              type: 'reservation'
            }))
          });
        }
      });
    }
    
    if (role === 'frontdesk' || role === 'manager' || role === 'routesetter') {
      db.all(`SELECT rm.*, r.name as route_name, r.grade, r.color,
              u.name as maintainer_name
              FROM route_maintenance rm
              JOIN routes r ON rm.route_id = r.id
              LEFT JOIN users u ON rm.maintainer_id = u.id
              WHERE rm.status IN ('pending', 'in_progress')
              ORDER BY rm.scheduled_date`, (err, rows) => {
        if (rows && rows.length > 0) {
          result.tasks.push({
            category: '线路维护',
            priority: 'medium',
            items: rows.map(m => ({
              id: m.id,
              title: `${m.route_name} (${m.grade})`,
              subtitle: `${m.type === 'rebolt' ? '换点' : m.type === 'check' ? '检查' : '维护'} · ${m.status === 'in_progress' ? '进行中' : '待处理'}`,
              status: m.status,
              type: 'maintenance'
            }))
          });
        }
      });
    }
    
    db.all(`
            SELECT ra.*, u.name as reporter_name, o.name as owner_name,
             s.date as sched_date, s.shift as sched_shift, su.name as sched_staff_name
      FROM risk_alerts ra
      LEFT JOIN users u ON ra.reported_by = u.id
      LEFT JOIN users o ON ra.current_owner = o.id
      LEFT JOIN staff_schedules s ON ra.source_schedule_id = s.id
      LEFT JOIN users su ON s.staff_id = su.id
      WHERE ra.status IN ('open', 'processing')
      ORDER BY CASE ra.severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
`, (err, rows) => {
      if (rows && rows.length > 0) {
        result.tasks.push({
          category: '风险提示',
          priority: 'high',
          items: rows.map(r => ({
            id: r.id,
            title: r.title,
            subtitle: `${r.severity === 'high' ? '🔴 高危' : r.severity === 'medium' ? '🟡 中危' : '🔵 低危'} · 上报: ${r.reporter_name || '系统'}`,
            status: r.status,
            severity: r.severity,
            type: 'risk'
          }))
        });
      }
      
      res.json(result);
    });
  });
});

app.get('/api/reservations', (req, res) => {
  const { date } = req.query;
  const sql = date 
    ? `SELECT r.*, m.name as member_name, m.level, m.phone FROM reservations r JOIN members m ON r.member_id = m.id WHERE r.date = ? ORDER BY r.time_slot`
    : `SELECT r.*, m.name as member_name, m.level, m.phone FROM reservations r JOIN members m ON r.member_id = m.id ORDER BY r.date DESC, r.time_slot`;
  
  db.all(sql, date ? [date] : [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/members', (req, res) => {
  db.all("SELECT * FROM members ORDER BY name", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/schedules', (req, res) => {
  const { date, staffId, status } = req.query;
  let sql = `SELECT s.*, u.name as staff_name, u.role as staff_role, 
             a.name as assigned_by_name, rv.name as reviewed_by_name
             FROM staff_schedules s 
             JOIN users u ON s.staff_id = u.id
             LEFT JOIN users a ON s.assigned_by = a.id
             LEFT JOIN users rv ON s.reviewed_by = rv.id`;
  const params = [];
  const conditions = [];
  
  if (date) { conditions.push("s.date = ?"); params.push(date); }
  if (staffId) { conditions.push("s.staff_id = ?"); params.push(staffId); }
  if (status) { conditions.push("s.status = ?"); params.push(status); }
  
  if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY s.date DESC, s.shift";
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/schedules', (req, res) => {
  const { staff_id, date, shift, role, assigned_by } = req.body;
  const userRole = req.headers['x-role'] || 'manager';
  if (userRole !== 'frontdesk' && userRole !== 'manager') {
    return res.status(403).json({ error: '无权限创建排班' });
  }
  const id = uuidv4();
  db.run(`INSERT INTO staff_schedules (id, staff_id, date, shift, role, status, assigned_by) 
          VALUES (?, ?, ?, ?, ?, 'draft', ?)`,
    [id, staff_id, date, shift, role, assigned_by],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, ...req.body, status: 'draft' });
    }
  );
});

app.put('/api/schedules/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, reviewed_by, review_notes, check_in_time, check_out_time } = req.body;
  const role = req.headers["x-role"] || "manager";
  const PERM = { frontdesk: ["draft", "pending_review"], manager: ["scheduled", "rejected"], belayer: ["checked_in", "completed"], routesetter: [] };
  if (!status || !PERM[role] || !PERM[role].includes(status)) {
    return res.status(403).json({ error: "无权限：" + role + " 不能执行 " + (status || '空操作') });
  }
  
  let sql = "UPDATE staff_schedules SET status = ?";
  const params = [status];
  
  if (reviewed_by) { sql += ", reviewed_by = ?"; params.push(reviewed_by); }
  if (review_notes !== undefined) { sql += ", review_notes = ?"; params.push(review_notes); }
  if (check_in_time) { sql += ", check_in_time = ?"; params.push(check_in_time); }
  if (check_out_time) { sql += ", check_out_time = ?"; params.push(check_out_time); }
  
  sql += " WHERE id = ?";
  params.push(id);
  
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get("SELECT * FROM staff_schedules WHERE id = ?", [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) {
        const rf = {};
        if (status === 'pending_review') { rf.current_owner = null; rf.owner_role = 'manager'; } else if (status === 'scheduled' || status === 'checked_in') {
          rf.current_owner = row.staff_id;
          rf.owner_role = row.role;
        } else if (status === 'rejected') {
          rf.current_owner = null;
          rf.owner_role = 'manager';
        } else if (status === 'cancelled') {
          rf.current_owner = null;
          rf.owner_role = null;
        }
        if (Object.keys(rf).length > 0) {
          rf.updated_at = new Date().toISOString();
          const fs = Object.keys(rf).map(k => k + ' = ?').join(', ');
          db.run('UPDATE risk_alerts SET ' + fs + ' WHERE source_schedule_id = ?', 
            [...Object.values(rf), id]);
        }
      }
      res.json(row);
    });
  });
});

app.get('/api/routes', (req, res) => {
  db.all(`SELECT r.*, u.name as setter_name FROM routes r 
          LEFT JOIN users u ON r.setter_id = u.id 
          ORDER BY r.grade`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/maintenance', (req, res) => {
  db.all(`SELECT rm.*, r.name as route_name, r.grade, r.color,
          u.name as maintainer_name
          FROM route_maintenance rm
          JOIN routes r ON rm.route_id = r.id
          LEFT JOIN users u ON rm.maintainer_id = u.id
          ORDER BY rm.scheduled_date DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/maintenance/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, maintainer_id, completed_date } = req.body;
  
  let sql = "UPDATE route_maintenance SET status = ?";
  const params = [status];
  
  if (maintainer_id) { sql += ", maintainer_id = ?"; params.push(maintainer_id); }
  if (completed_date) { sql += ", completed_date = ?"; params.push(completed_date); }
  
  sql += " WHERE id = ?";
  params.push(id);
  
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get("SELECT * FROM route_maintenance WHERE id = ?", [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

app.get('/api/risks', (req, res) => {
  const { status } = req.query;
  let sql = `SELECT ra.*, u.name as reporter_name, h.name as handler_name, o.name as owner_name,
             s.date as sched_date, s.shift as sched_shift, s.status as sched_status, su.name as sched_staff_name
             FROM risk_alerts ra
             LEFT JOIN users u ON ra.reported_by = u.id
             LEFT JOIN users h ON ra.handled_by = h.id
             LEFT JOIN users o ON ra.current_owner = o.id
             LEFT JOIN staff_schedules s ON ra.source_schedule_id = s.id
             LEFT JOIN users su ON s.staff_id = su.id`;
  const params = [];
  
  if (status) {
    sql += " WHERE ra.status = ?";
    params.push(status);
  }
  sql += " ORDER BY ra.created_at DESC";
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/risks', (req, res) => {
  const { type, severity, title, description, related_type, related_id, reported_by } = req.body;
  const id = uuidv4();
  db.run(`INSERT INTO risk_alerts (id, type, severity, title, description, related_type, related_id, status, reported_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
    [id, type, severity, title, description, related_type, related_id, reported_by],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, ...req.body, status: 'open', created_at: new Date().toISOString() });
    }
  );
});

app.put('/api/risks/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, handled_by, resolution } = req.body;
  
  let sql = "UPDATE risk_alerts SET status = ?";
  const params = [status];
  
  if (handled_by) { sql += ", handled_by = ?"; params.push(handled_by); }
  if (resolution) { sql += ", resolution = ?"; params.push(resolution); }
  if (status === 'resolved' || status === 'closed') {
    sql += ", handled_at = ?";
    params.push(new Date().toISOString());
  }
  
  sql += " WHERE id = ?";
  params.push(id);
  
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get("SELECT * FROM risk_alerts WHERE id = ?", [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

app.get('/api/logs', (req, res) => {
  db.all(`SELECT al.*, u.name as user_name FROM activity_logs al 
          LEFT JOIN users u ON al.user_id = u.id 
          ORDER BY al.created_at DESC LIMIT 100`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/logs', (req, res) => {
  const { user_id, action, entity_type, entity_id, details } = req.body;
  const id = uuidv4();
  db.run(`INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, details)
          VALUES (?, ?, ?, ?, ?, ?)`,
    [id, user_id, action, entity_type, entity_id, details],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, ...req.body });
    }
  );
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`攀岩馆运营系统后端运行在 http://localhost:${PORT}`);
});
