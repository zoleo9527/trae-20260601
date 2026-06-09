import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

export function getAllCredits(filters = {}) {
  let sql = `
    SELECT c.*, cust.name as customer_name, s.id as sales_id
    FROM credits c
    LEFT JOIN customers cust ON c.customer_id = cust.id
    LEFT JOIN sales s ON c.sales_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    sql += ' AND c.status = ?';
    params.push(filters.status);
  }
  if (filters.customerId) {
    sql += ' AND c.customer_id = ?';
    params.push(filters.customerId);
  }

  sql += ' ORDER BY c.due_date ASC';

  return db.prepare(sql).all(...params);
}

export function getCreditById(id) {
  return db.prepare(`
    SELECT c.*, cust.name as customer_name, cust.phone as customer_phone, s.id as sales_id
    FROM credits c
    LEFT JOIN customers cust ON c.customer_id = cust.id
    LEFT JOIN sales s ON c.sales_id = s.id
    WHERE c.id = ?
  `).get(id);
}

export function repayCredit(id, amount, operatorId) {
  const credit = getCreditById(id);
  if (!credit) throw new Error('Credit not found');

  const newRepaidAmount = credit.repaid_amount + amount;
  const newStatus = newRepaidAmount >= credit.amount ? 'repaid' :
                   newRepaidAmount > 0 ? 'partial' : 'pending';

  // 检查是否逾期
  const today = new Date().toISOString().split('T')[0];
  if (today > credit.due_date && newStatus !== 'repaid') {
    db.prepare(`
      UPDATE credits SET status = 'overdue', repaid_amount = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newRepaidAmount, id);
  } else {
    db.prepare(`
      UPDATE credits SET repaid_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newRepaidAmount, newStatus, id);
  }

  // 记录操作日志
  db.prepare(`
    INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_id, details)
    VALUES (?, 'credit', ?, 'repay', ?, ?)
  `).run(uuidv4(), id, operatorId, JSON.stringify({ amount, newRepaidAmount }));

  return getCreditById(id);
}

export function getOverdueCredits() {
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    SELECT c.*, cust.name as customer_name, cust.phone as customer_phone
    FROM credits c
    LEFT JOIN customers cust ON c.customer_id = cust.id
    WHERE c.status IN ('pending', 'partial', 'overdue')
      AND c.due_date < ?
    ORDER BY c.due_date ASC
  `).all(today);
}

export function getCustomerOverdueStatus(customerId) {
  const today = new Date().toISOString().split('T')[0];
  const overdue = db.prepare(`
    SELECT COUNT(*) as count, SUM(amount - repaid_amount) as total_due
    FROM credits
    WHERE customer_id = ?
      AND status IN ('pending', 'partial', 'overdue')
      AND due_date < ?
  `).get(customerId, today);

  return {
    hasOverdue: overdue.count > 0,
    count: overdue.count,
    totalDue: overdue.total_due || 0
  };
}
