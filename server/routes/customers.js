const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.get('/', (req, res) => {
  const { keyword, tax_type, page = 1, pageSize = 50 } = req.query;
  const offset = (page - 1) * pageSize;

  let where = [];
  let params = [];

  if (keyword) {
    where.push('(name LIKE ? OR company_name LIKE ? OR contact_person LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (tax_type) {
    where.push('tax_type = ?');
    params.push(tax_type);
  }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM customers ${whereSql}`).get(...params).count;

  const list = db.prepare(`
    SELECT c.*, u_acc.name as accountant_name, u_mgr.name as manager_name
    FROM customers c
    LEFT JOIN users u_acc ON c.accountant_id = u_acc.id
    LEFT JOIN users u_mgr ON c.manager_id = u_mgr.id
    ${whereSql}
    ORDER BY c.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const customer = db.prepare(`
    SELECT c.*, u_acc.name as accountant_name, u_mgr.name as manager_name
    FROM customers c
    LEFT JOIN users u_acc ON c.accountant_id = u_acc.id
    LEFT JOIN users u_mgr ON c.manager_id = u_mgr.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!customer) return res.status(404).json({ error: '客户不存在' });

  const recentFilings = db.prepare(`
    SELECT * FROM tax_filings
    WHERE customer_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(req.params.id);

  const recentExceptions = db.prepare(`
    SELECT * FROM exceptions
    WHERE customer_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(req.params.id);

  res.json({ ...customer, recentFilings, recentExceptions });
});

module.exports = router;
