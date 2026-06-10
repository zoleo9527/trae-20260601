const db = require('./db');
const dayjs = require('dayjs');

function generateNo(prefix) {
  const dateStr = dayjs().format('YYYYMMDD');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}${dateStr}${rand}`;
}

function logAudit(bizType, bizId, action, operator, detail = '') {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (biz_type, biz_id, action, operator_id, operator_name, detail)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(bizType, bizId, action, operator?.id || null, operator?.name || '', detail);
  } catch (e) {
    console.error('审计日志写入失败:', e);
  }
}

function getPagination(page = 1, pageSize = 20) {
  const p = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
  return {
    page: p,
    pageSize: ps,
    offset: (p - 1) * ps,
    limit: ps
  };
}

function paginateResult(total, list, page, pageSize) {
  return {
    total,
    list,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(total / pageSize)
  };
}

module.exports = {
  generateNo,
  logAudit,
  getPagination,
  paginateResult
};
