const { getDb } = require('../db');
const dayjs = require('dayjs');
const fs = require('fs');
const path = require('path');

const EXPORTS_DIR = path.join(__dirname, '..', '..', 'exports');

if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

function createExportTask(taskType, parameters, createdBy) {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const result = db.prepare(`
    INSERT INTO export_tasks (task_type, parameters, status, created_by, created_at)
    VALUES (?, ?, 'PROCESSING', ?, ?)
  `).run(taskType, JSON.stringify(parameters || {}), createdBy || '', now);

  const taskId = result.lastInsertRowid;

  try {
    const data = gatherExportData(taskType, parameters);
    const fileName = `${taskType}_${dayjs().format('YYYYMMDD_HHmmss')}_${taskId}.json`;
    const filePath = path.join(EXPORTS_DIR, fileName);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    db.prepare('UPDATE export_tasks SET status = ?, file_path = ?, completed_at = ? WHERE id = ?')
      .run('COMPLETED', filePath, dayjs().format('YYYY-MM-DD HH:mm:ss'), taskId);

    return { id: taskId, status: 'COMPLETED', file_path: filePath };
  } catch (err) {
    db.prepare('UPDATE export_tasks SET status = ? WHERE id = ?')
      .run('FAILED', taskId);
    throw err;
  }
}

function gatherExportData(taskType, parameters) {
  const db = getDb();
  const params = parameters || {};

  switch (taskType) {
    case 'containers': {
      let sql = 'SELECT * FROM containers WHERE 1=1';
      const p = [];
      if (params.status) { sql += ' AND status = ?'; p.push(params.status); }
      if (params.type) { sql += ' AND type = ?'; p.push(params.type); }
      return db.prepare(sql).all(...p);
    }
    case 'fee_items': {
      let sql = `
        SELECT fi.*, c.type, c.cargo_type, c.status as container_status
        FROM fee_items fi LEFT JOIN containers c ON fi.container_id = c.id WHERE 1=1
      `;
      const p = [];
      if (params.status) { sql += ' AND fi.status = ?'; p.push(params.status); }
      return db.prepare(sql).all(...p);
    }
    case 'inspection_plans': {
      let sql = `
        SELECT ip.*, c.type, c.cargo_type, c.status as container_status
        FROM inspection_plans ip LEFT JOIN containers c ON ip.container_id = c.id WHERE 1=1
      `;
      const p = [];
      if (params.status) { sql += ' AND ip.status = ?'; p.push(params.status); }
      return db.prepare(sql).all(...p);
    }
    case 'slot_allocations': {
      return db.prepare(`
        SELECT sa.*, c.type, c.cargo_type, c.status as container_status
        FROM slot_allocations sa LEFT JOIN containers c ON sa.container_id = c.id
        ORDER BY sa.allocated_at DESC
      `).all();
    }
    case 'status_change_logs': {
      let sql = 'SELECT * FROM status_change_logs WHERE 1=1';
      const p = [];
      if (params.container_no) { sql += ' AND container_no = ?'; p.push(params.container_no); }
      sql += ' ORDER BY changed_at DESC';
      return db.prepare(sql).all(...p);
    }
    default:
      return db.prepare('SELECT * FROM containers').all();
  }
}

function listExportTasks(filters = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM export_tasks WHERE 1=1';
  const params = [];

  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.task_type) {
    sql += ' AND task_type = ?';
    params.push(filters.task_type);
  }

  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params);
}

function getExportFilePath(taskId) {
  const db = getDb();
  const task = db.prepare('SELECT * FROM export_tasks WHERE id = ?').get(taskId);
  if (!task) throw new Error('导出任务不存在');
  if (task.status !== 'COMPLETED') throw new Error('导出任务未完成');
  if (!task.file_path || !fs.existsSync(task.file_path)) throw new Error('导出文件不存在');

  return task.file_path;
}

module.exports = { createExportTask, listExportTasks, getExportFilePath };
