const express = require('express');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const db = require('../database/db');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { writeLog, LOG_ACTIONS } = require('../utils/logger');
const router = express.Router();

const EXPORT_TYPES = {
  LEASE_LIST: 'LEASE_LIST',
  DEDUCTION_SUMMARY: 'DEDUCTION_SUMMARY',
  LIABILITY_REPORT: 'LIABILITY_REPORT',
  OPERATION_LOG: 'OPERATION_LOG',
};

const TASK_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

router.use(authMiddleware);

const exportsDir = path.join(__dirname, '..', '..', 'exports');

const generateLeaseListExcel = async (params, taskId) => {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('租约列表');

  ws.columns = [
    { header: '租约编号', key: 'lease_no', width: 20 },
    { header: '品牌名称', key: 'brand_name', width: 22 },
    { header: '店铺编号', key: 'store_code', width: 14 },
    { header: '楼层', key: 'floor', width: 10 },
    { header: '面积(㎡)', key: 'area', width: 12 },
    { header: '起租日期', key: 'start_date', width: 14 },
    { header: '到期日期', key: 'end_date', width: 14 },
    { header: '基础租金', key: 'base_rent', width: 14 },
    { header: '状态', key: 'status_name', width: 12 },
    { header: '基础扣点%', key: 'base_rate', width: 12 },
    { header: '活动扣点%', key: 'promotion_rate', width: 12 },
    { header: '责任标记', key: 'liability_desc', width: 30 },
    { header: '招商经理', key: 'submitter_name', width: 14 },
    { header: '提交时间', key: 'submitted_at', width: 20 },
    { header: '营运确认人', key: 'confirmer_name', width: 14 },
    { header: '生效时间', key: 'activated_at', width: 20 },
  ];

  const STATUS_NAME = { DRAFT: '草稿', PENDING: '待确认', ACTIVE: '生效', REJECTED: '已驳回', EXPIRED: '已到期' };

  const rows = db.prepare(`
    SELECT l.*, u.name as submitter_name, u2.name as confirmer_name,
      dr.base_rate, dr.promotion_rate, dr.liability_flag
    FROM brand_leases l
    LEFT JOIN users u ON l.submitter_id = u.id
    LEFT JOIN users u2 ON l.confirmer_id = u2.id
    LEFT JOIN (
      SELECT * FROM deduction_rules dr1 WHERE dr1.id IN (SELECT MAX(id) FROM deduction_rules GROUP BY lease_id)
    ) dr ON dr.lease_id = l.id
    ORDER BY l.id DESC
  `).all();

  const LIABILITY_MAP = {
    LEASE_NO_RULE: '未录入扣点',
    RATE_ABNORMAL: '扣点异常(>50%)',
    SPECIAL_CLAUSE_MISSING: '特殊条款缺失',
    DATE_MISMATCH: '日期不一致',
    MANUAL_MARKED: '人工标记',
  };

  for (const r of rows) {
    ws.addRow({
      ...r,
      status_name: STATUS_NAME[r.status] || r.status,
      liability_desc: r.liability_flag ? (LIABILITY_MAP[r.liability_flag] || r.liability_flag) : '',
    });
  }

  const fileName = `租约列表_${new Date().toISOString().slice(0,10)}_${taskId}.xlsx`;
  const fullPath = path.join(exportsDir, fileName);
  await workbook.xlsx.writeFile(fullPath);
  return { fileName, fullPath };
};

const generateDeductionSummaryExcel = async (params, taskId) => {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('扣点规则汇总');
  ws.columns = [
    { header: '租约编号', key: 'lease_no', width: 20 },
    { header: '品牌名称', key: 'brand_name', width: 22 },
    { header: '扣点版本', key: 'version', width: 10 },
    { header: '基础扣点%', key: 'base_rate', width: 14 },
    { header: '活动扣点%', key: 'promotion_rate', width: 14 },
    { header: '特殊条款', key: 'special_clause', width: 40 },
    { header: '规则状态', key: 'rule_status_name', width: 12 },
    { header: '录入人', key: 'creator_name', width: 14 },
    { header: '确认人', key: 'confirmer_name', width: 14 },
    { header: '确认时间', key: 'confirmed_at', width: 20 },
    { header: '责任标记', key: 'liability_desc', width: 30 },
  ];

  const RULE_STATUS = { DRAFT: '草稿', PENDING_CONFIRM: '待确认', CONFIRMED: '已确认', SUPERSEDED: '已替代' };
  const LIABILITY_MAP = {
    LEASE_NO_RULE: '未录入扣点',
    RATE_ABNORMAL: '扣点异常(>50%)',
    SPECIAL_CLAUSE_MISSING: '特殊条款缺失',
    DATE_MISMATCH: '日期不一致',
    MANUAL_MARKED: '人工标记',
  };

  const rows = db.prepare(`
    SELECT bl.lease_no, bl.brand_name,
      dr.*, u.name as creator_name, u2.name as confirmer_name
    FROM deduction_rules dr
    LEFT JOIN brand_leases bl ON dr.lease_id = bl.id
    LEFT JOIN users u ON dr.creator_id = u.id
    LEFT JOIN users u2 ON dr.confirmer_id = u2.id
    ORDER BY bl.id DESC, dr.version DESC
  `).all();

  for (const r of rows) {
    ws.addRow({
      ...r,
      rule_status_name: RULE_STATUS[r.status] || r.status,
      liability_desc: r.liability_flag ? (LIABILITY_MAP[r.liability_flag] || r.liability_flag) : '',
    });
  }

  const fileName = `扣点规则汇总_${new Date().toISOString().slice(0,10)}_${taskId}.xlsx`;
  const fullPath = path.join(exportsDir, fileName);
  await workbook.xlsx.writeFile(fullPath);
  return { fileName, fullPath };
};

const generateLiabilityReport = async (params, taskId) => {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('责任不清报表');
  ws.columns = [
    { header: '租约编号', key: 'lease_no', width: 20 },
    { header: '品牌', key: 'brand_name', width: 22 },
    { header: '租约状态', key: 'lease_status', width: 12 },
    { header: '扣点版本', key: 'version', width: 10 },
    { header: '责任类型', key: 'liability_flag', width: 20 },
    { header: '责任说明', key: 'liability_desc', width: 30 },
    { header: '标记原因', key: 'liability_reason', width: 30 },
    { header: '标记人', key: 'marker_name', width: 14 },
    { header: '标记时间', key: 'liability_marked_at', width: 20 },
    { header: '录入人', key: 'submitter_name', width: 14 },
    { header: '营运人', key: 'confirmer_name', width: 14 },
  ];

  const LIABILITY_MAP = {
    LEASE_NO_RULE: '未录入扣点(招商责任)',
    RATE_ABNORMAL: '扣点异常(督导责任)',
    SPECIAL_CLAUSE_MISSING: '特殊条款缺失(双方)',
    DATE_MISMATCH: '日期不一致(双方)',
    MANUAL_MARKED: '人工标记(督导)',
  };
  const LEASE_STATUS = { DRAFT: '草稿', PENDING: '待确认', ACTIVE: '生效', REJECTED: '已驳回' };

  const rows = db.prepare(`
    SELECT bl.lease_no, bl.brand_name, bl.status as lease_status, bl.submitted_at,
      dr.version, dr.liability_flag, dr.liability_reason, dr.liability_marked_at,
      u.name as marker_name, u1.name as submitter_name, u2.name as confirmer_name
    FROM deduction_rules dr
    LEFT JOIN brand_leases bl ON dr.lease_id = bl.id
    LEFT JOIN users u ON dr.liability_marked_by = u.id
    LEFT JOIN users u1 ON bl.submitter_id = u1.id
    LEFT JOIN users u2 ON bl.confirmer_id = u2.id
    WHERE dr.liability_flag IS NOT NULL
    ORDER BY bl.id DESC
  `).all();

  for (const r of rows) {
    ws.addRow({
      ...r,
      lease_status: LEASE_STATUS[r.lease_status] || r.lease_status,
      liability_desc: LIABILITY_MAP[r.liability_flag] || r.liability_flag,
    });
  }

  const fileName = `责任不清报表_${new Date().toISOString().slice(0,10)}_${taskId}.xlsx`;
  const fullPath = path.join(exportsDir, fileName);
  await workbook.xlsx.writeFile(fullPath);
  return { fileName, fullPath };
};

const generateOperationLogExcel = async (params, taskId) => {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('操作日志');
  ws.columns = [
    { header: '时间', key: 'created_at', width: 20 },
    { header: '租约编号', key: 'lease_no', width: 20 },
    { header: '操作人', key: 'operator_name', width: 14 },
    { header: '角色', key: 'operator_role_name', width: 16 },
    { header: '操作类型', key: 'action', width: 28 },
    { header: '原状态', key: 'from_status', width: 12 },
    { header: '新状态', key: 'to_status', width: 12 },
    { header: '详情', key: 'action_detail', width: 60 },
  ];

  const ACTION_MAP = {
    LEASE_CREATE: '创建租约', LEASE_EDIT: '编辑租约', LEASE_SUBMIT: '提交租约',
    LEASE_CONFIRM: '确认租约生效', LEASE_REJECT: '驳回租约',
    DEDUCTION_CREATE: '创建扣点规则', DEDUCTION_EDIT: '编辑扣点规则',
    DEDUCTION_CONFIRM: '确认扣点规则', DEDUCTION_MARK_LIABILITY: '标记责任不清',
    DEDUCTION_CLEAR_LIABILITY: '清除责任标记',
    EXPORT_CREATE: '创建导出任务', EXPORT_COMPLETE: '导出完成',
  };
  const ROLE_MAP = {
    ROLE_MERCHANDISE_MANAGER: '招商经理',
    ROLE_OPERATION_SUPERVISOR: '营运督导',
    ROLE_STORE_MANAGER: '品牌店长',
    ROLE_SUPERVISOR: '主管',
  };

  const rows = db.prepare(`
    SELECT ol.*, bl.lease_no
    FROM operation_logs ol
    LEFT JOIN brand_leases bl ON ol.lease_id = bl.id
    ORDER BY ol.id DESC LIMIT 500
  `).all();

  for (const r of rows) {
    ws.addRow({
      ...r,
      action: ACTION_MAP[r.action] || r.action,
      operator_role_name: ROLE_MAP[r.operator_role] || r.operator_role,
    });
  }

  const fileName = `操作日志_${new Date().toISOString().slice(0,10)}_${taskId}.xlsx`;
  const fullPath = path.join(exportsDir, fileName);
  await workbook.xlsx.writeFile(fullPath);
  return { fileName, fullPath };
};

const runTask = async (task) => {
  const updateTask = db.prepare('UPDATE export_tasks SET status = ?, progress = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?');
  updateTask.run(TASK_STATUS.PROCESSING, 10, task.id);

  setTimeout(async () => {
    try {
      updateTask.run(TASK_STATUS.PROCESSING, 50, task.id);
      const params = task.params_json ? JSON.parse(task.params_json) : {};

      let result;
      switch (task.task_type) {
        case EXPORT_TYPES.LEASE_LIST:
          result = await generateLeaseListExcel(params, task.id); break;
        case EXPORT_TYPES.DEDUCTION_SUMMARY:
          result = await generateDeductionSummaryExcel(params, task.id); break;
        case EXPORT_TYPES.LIABILITY_REPORT:
          result = await generateLiabilityReport(params, task.id); break;
        case EXPORT_TYPES.OPERATION_LOG:
          result = await generateOperationLogExcel(params, task.id); break;
        default:
          throw new Error('未知导出类型');
      }

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      db.prepare(`
        UPDATE export_tasks SET status = ?, progress = ?, file_path = ?, file_name = ?, completed_at = ? WHERE id = ?
      `).run(TASK_STATUS.COMPLETED, 100, result.fullPath, result.fileName, now, task.id);

      writeLog({
        operator: { id: task.user_id, name: task.user_name, role: 'SYSTEM' },
        action: LOG_ACTIONS.EXPORT_COMPLETE,
        actionDetail: { taskId: task.id, fileName: result.fileName },
      });
    } catch (err) {
      db.prepare('UPDATE export_tasks SET status = ?, error_msg = ?, completed_at = datetime(\'now\', \'localtime\') WHERE id = ?')
        .run(TASK_STATUS.FAILED, err.message, task.id);
    }
  }, 500);
};

router.post('/', permissionMiddleware('export:create'), (req, res) => {
  const { task_type, task_name, params } = req.body;
  if (!task_type || !EXPORT_TYPES[task_type]) {
    return res.status(400).json({ code: 400, message: '无效的导出类型' });
  }
  if (!task_name) {
    return res.status(400).json({ code: 400, message: '任务名称必填' });
  }

  const stmt = db.prepare(`
    INSERT INTO export_tasks (user_id, user_name, task_type, task_name, params_json)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    req.user.id, req.user.name,
    task_type, task_name,
    params ? JSON.stringify(params) : null
  );

  const task = { id: result.lastInsertRowid, user_id: req.user.id, user_name: req.user.name, task_type, params_json: params ? JSON.stringify(params) : null };

  writeLog({
    operator: req.user,
    action: LOG_ACTIONS.EXPORT_CREATE,
    actionDetail: { taskId: task.id, task_type, task_name },
  });

  runTask(task);

  res.json({ code: 200, message: '导出任务已创建，后台处理中', data: { task_id: task.id } });
});

router.get('/', (req, res) => {
  const role = req.user.role;
  let tasks;
  if (role === 'ROLE_SUPERVISOR') {
    tasks = db.prepare('SELECT * FROM export_tasks ORDER BY id DESC LIMIT 50').all();
  } else {
    tasks = db.prepare('SELECT * FROM export_tasks WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(req.user.id);
  }

  for (const t of tasks) {
    try { t.params = t.params_json ? JSON.parse(t.params_json) : null; } catch (e) {}
  }

  res.json({ code: 200, data: tasks });
});

router.get('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM export_tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ code: 404, message: '任务不存在' });
  if (req.user.role !== 'ROLE_SUPERVISOR' && task.user_id !== req.user.id) {
    return res.status(403).json({ code: 403, message: '仅创建者或主管可查看任务详情' });
  }

  try { task.params = task.params_json ? JSON.parse(task.params_json) : null; } catch (e) {}
  res.json({ code: 200, data: task });
});

router.get('/download/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM export_tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ code: 404, message: '任务不存在' });

  const role = req.user.role;
  if (role !== 'ROLE_SUPERVISOR' && role !== 'ROLE_OPERATION_SUPERVISOR') {
    if (task.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '仅任务创建者或主管可下载导出文件' });
    }
  }

  if (task.status !== TASK_STATUS.COMPLETED || !task.file_path) {
    return res.status(400).json({ code: 400, message: '任务尚未完成或失败' });
  }
  if (!fs.existsSync(task.file_path)) {
    return res.status(404).json({ code: 404, message: '文件不存在' });
  }

  res.download(task.file_path, task.file_name);
});

module.exports = { router, EXPORT_TYPES, TASK_STATUS };
