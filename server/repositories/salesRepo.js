import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

export const SalesStatus = {
  DRAFT: 'draft',
  PENDING_CONFIRMATION: 'pending_confirmation',
  CONFIRMED: 'confirmed',
  PENDING_WAREHOUSE: 'pending_warehouse',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  STOCK_INSUFFICIENT: 'stock_insufficient'
};

export function getAllSales(filters = {}) {
  let sql = `
    SELECT s.*, c.name as customer_name, u.name as created_by_name
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN users u ON s.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    sql += ' AND s.status = ?';
    params.push(filters.status);
  }
  if (filters.customerId) {
    sql += ' AND s.customer_id = ?';
    params.push(filters.customerId);
  }
  if (filters.date) {
    sql += ' AND DATE(s.created_at) = ?';
    params.push(filters.date);
  }

  sql += ' ORDER BY s.created_at DESC';

  const sales = db.prepare(sql).all(...params);

  // 获取每个销售单的明细
  const getItems = db.prepare(`
    SELECT si.*, p.name as pesticide_name, p.type as pesticide_type, p.unit
    FROM sales_items si
    LEFT JOIN pesticides p ON si.pesticide_id = p.id
    WHERE si.sales_id = ?
  `);

  return sales.map(sale => ({
    ...sale,
    items: getItems.all(sale.id)
  }));
}

export function getSalesById(id) {
  const sale = db.prepare(`
    SELECT s.*, c.name as customer_name, u.name as created_by_name
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN users u ON s.created_by = u.id
    WHERE s.id = ?
  `).get(id);

  if (!sale) return null;

  const items = db.prepare(`
    SELECT si.*, p.name as pesticide_name, p.type as pesticide_type, p.unit
    FROM sales_items si
    LEFT JOIN pesticides p ON si.pesticide_id = p.id
    WHERE si.sales_id = ?
  `).all(id);

  const confirmation = db.prepare(`
    SELECT c.*, u.name as confirmed_by_name
    FROM confirmations c
    LEFT JOIN users u ON c.confirmed_by = u.id
    WHERE c.sales_id = ?
    ORDER BY c.created_at DESC
    LIMIT 1
  `).get(id);

  const warehouseConfirm = db.prepare(`
    SELECT wc.*, u.name as confirmed_by_name
    FROM warehouse_confirms wc
    LEFT JOIN users u ON wc.confirmed_by = u.id
    WHERE wc.sales_id = ?
    ORDER BY wc.created_at DESC
    LIMIT 1
  `).get(id);

  const logs = db.prepare(`
    SELECT ol.*, u.name as operator_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.operator_id = u.id
    WHERE ol.entity_type = 'sales' AND ol.entity_id = ?
    ORDER BY ol.created_at ASC
  `).all(id);

  return {
    ...sale,
    items,
    confirmation,
    warehouseConfirm,
    logs
  };
}

export function createSales(data) {
  const id = uuidv4();
  const { customerId, createdBy, isCredit, items } = data;

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  db.prepare(`
    INSERT INTO sales (id, customer_id, created_by, status, total_amount, is_credit)
    VALUES (?, ?, ?, 'draft', ?, ?)
  `).run(id, customerId, createdBy, totalAmount, isCredit ? 1 : 0);

  const insertItem = db.prepare(`
    INSERT INTO sales_items (id, sales_id, pesticide_id, quantity, unit_price, subtotal)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const item of items) {
    insertItem.run(uuidv4(), id, item.pesticideId, item.quantity, item.unitPrice, item.subtotal);
  }

  logOperation('sales', id, 'create', createdBy, { customerId, totalAmount, isCredit, itemCount: items.length });

  return getSalesById(id);
}

export function updateSales(id, data) {
  const { items, ...updates } = data;

  if (updates.totalAmount !== undefined) {
    db.prepare('UPDATE sales SET total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(updates.totalAmount, id);
  }

  if (items) {
    db.prepare('DELETE FROM sales_items WHERE sales_id = ?').run(id);
    const insertItem = db.prepare(`
      INSERT INTO sales_items (id, sales_id, pesticide_id, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      insertItem.run(uuidv4(), id, item.pesticideId, item.quantity, item.unitPrice, item.subtotal);
    }
  }

  return getSalesById(id);
}

export function submitSales(id, operatorId) {
  const sale = getSalesById(id);
  if (!sale) throw new Error('Sales not found');
  if (sale.status !== SalesStatus.DRAFT) throw new Error('Invalid status transition');

  db.prepare(`UPDATE sales SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(SalesStatus.PENDING_CONFIRMATION, id);

  logOperation('sales', id, 'submit', operatorId, { fromStatus: sale.status });

  return getSalesById(id);
}

export function confirmSales(id, operatorId, data) {
  const sale = getSalesById(id);
  if (!sale) throw new Error('Sales not found');
  if (sale.status !== SalesStatus.PENDING_CONFIRMATION) throw new Error('Invalid status transition');

  const confirmationId = uuidv4();
  db.prepare(`
    INSERT INTO confirmations (id, sales_id, confirmed_by, result, reminder, comments)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(confirmationId, id, operatorId, data.result, data.reminder, data.comments);

  const newStatus = data.result === 'prohibited' ? SalesStatus.REJECTED : SalesStatus.PENDING_WAREHOUSE;
  db.prepare(`UPDATE sales SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(newStatus, id);

  logOperation('sales', id, data.result === 'prohibited' ? 'reject' : 'confirm', operatorId, {
    result: data.result,
    reminder: data.reminder
  });

  return getSalesById(id);
}

export function warehouseConfirm(id, operatorId, data) {
  const sale = getSalesById(id);
  if (!sale) throw new Error('Sales not found');
  if (sale.status !== SalesStatus.PENDING_WAREHOUSE && sale.status !== SalesStatus.STOCK_INSUFFICIENT) {
    throw new Error('Invalid status transition');
  }

  // 检查库存
  const insufficientItems = [];
  for (const item of sale.items) {
    const inventory = db.prepare(`
      SELECT quantity FROM inventory WHERE pesticide_id = ?
    `).get(item.pesticide_id);

    if (!inventory || inventory.quantity < item.quantity) {
      insufficientItems.push({
        pesticideId: item.pesticide_id,
        pesticideName: item.pesticide_name,
        required: item.quantity,
        available: inventory?.quantity || 0
      });
    }
  }

  if (insufficientItems.length > 0) {
    db.prepare(`UPDATE sales SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(SalesStatus.STOCK_INSUFFICIENT, id);

    logOperation('sales', id, 'stock_insufficient', operatorId, { insufficientItems });

    return {
      ...getSalesById(id),
      error: {
        code: 'INVENTORY_INSUFFICIENT',
        message: '库存不足',
        details: insufficientItems
      }
    };
  }

  // 扣减库存
  const updateInventory = db.prepare(`
    UPDATE inventory SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
    WHERE pesticide_id = ?
  `);

  for (const item of sale.items) {
    updateInventory.run(item.quantity, item.pesticide_id);
  }

  // 创建仓管确认记录
  const warehouseConfirmId = uuidv4();
  db.prepare(`
    INSERT INTO warehouse_confirms (id, sales_id, confirmed_by, status, actual_quantity, comments)
    VALUES (?, ?, ?, 'confirmed', ?, ?)
  `).run(warehouseConfirmId, id, operatorId, sale.total_amount, data.comments || '');

  db.prepare(`UPDATE sales SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(SalesStatus.COMPLETED, id);

  // 如果是赊账，创建赊账记录
  if (sale.is_credit) {
    const creditId = uuidv4();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 默认30天后还款

    db.prepare(`
      INSERT INTO credits (id, sales_id, customer_id, amount, due_date, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(creditId, id, sale.customer_id, sale.total_amount, dueDate.toISOString().split('T')[0]);
  }

  logOperation('sales', id, 'warehouse_confirm', operatorId, { confirmed: true });

  return getSalesById(id);
}

export function resetSales(id, operatorId) {
  const sale = getSalesById(id);
  if (!sale) throw new Error('Sales not found');
  if (sale.status !== SalesStatus.REJECTED && sale.status !== SalesStatus.CANCELLED) {
    throw new Error('Only rejected or cancelled sales can be reset');
  }

  db.prepare(`UPDATE sales SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(SalesStatus.DRAFT, id);

  logOperation('sales', id, 'reset', operatorId, { fromStatus: sale.status });

  return getSalesById(id);
}

export function cancelSales(id, operatorId) {
  const sale = getSalesById(id);
  if (!sale) throw new Error('Sales not found');

  db.prepare(`UPDATE sales SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(SalesStatus.CANCELLED, id);

  logOperation('sales', id, 'cancel', operatorId, {});

  return getSalesById(id);
}

function logOperation(entityType, entityId, action, operatorId, details) {
  db.prepare(`
    INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), entityType, entityId, action, operatorId, JSON.stringify(details));
}
