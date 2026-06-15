import { query } from '~/utils/db.server';

export async function getDamageRecords() {
  const result = await query(`
    SELECT dr.*, 
           so.id as so_id, so.customer_name as so_customer_name, so.product_name as so_product_name, 
           so.quantity as so_quantity, so.unit as so_unit, so.status as so_status,
           de.id as de_id, de.status as de_status, de.delivery_address as de_delivery_address,
           de.signer_name as de_signer_name, de.signer_phone as de_signer_phone,
           u.name as reporter_name
    FROM damage_records dr
    LEFT JOIN sales_orders so ON dr.sales_order_id = so.id
    LEFT JOIN delivery_records de ON dr.delivery_record_id = de.id
    LEFT JOIN users u ON dr.reporter_id = u.id
    ORDER BY dr.reported_at DESC
  `);
  
  return result.rows.map(row => ({
    id: row.id,
    deliveryRecordId: row.delivery_record_id,
    salesOrderId: row.sales_order_id,
    reporterId: row.reporter_id,
    status: row.status,
    damageType: row.damage_type,
    damageDescription: row.damage_description,
    damageQuantity: row.damage_quantity,
    photos: row.photos,
    reportedAt: row.reported_at,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    order: {
      id: row.so_id,
      customerName: row.so_customer_name,
      productName: row.so_product_name,
      quantity: row.so_quantity,
      unit: row.so_unit,
      status: row.so_status,
    },
    delivery: {
      id: row.de_id,
      salesOrderId: row.delivery_record_id,
      status: row.de_status,
      deliveryAddress: row.de_delivery_address,
      signerName: row.de_signer_name,
      signerPhone: row.de_signer_phone,
    },
    reporter: {
      id: row.reporter_id,
      name: row.reporter_name,
    },
  }));
}

export async function getDamageRecordById(id) {
  const [damageResult, historyResult] = await Promise.all([
    query(`
      SELECT dr.*, 
             so.id as so_id, so.customer_name as so_customer_name, so.product_name as so_product_name, 
             so.quantity as so_quantity, so.unit as so_unit, so.status as so_status,
             de.id as de_id, de.status as de_status, de.delivery_address as de_delivery_address,
             de.signer_name as de_signer_name, de.signer_phone as de_signer_phone,
             u.name as reporter_name
      FROM damage_records dr
      LEFT JOIN sales_orders so ON dr.sales_order_id = so.id
      LEFT JOIN delivery_records de ON dr.delivery_record_id = de.id
      LEFT JOIN users u ON dr.reporter_id = u.id
      WHERE dr.id = $1
    `, [id]),
    query(`
      SELECT * FROM damage_history 
      WHERE damage_record_id = $1 
      ORDER BY time ASC
    `, [id]),
  ]);
  
  if (damageResult.rows.length === 0) return null;
  
  const row = damageResult.rows[0];
  return {
    id: row.id,
    deliveryRecordId: row.delivery_record_id,
    salesOrderId: row.sales_order_id,
    reporterId: row.reporter_id,
    status: row.status,
    damageType: row.damage_type,
    damageDescription: row.damage_description,
    damageQuantity: row.damage_quantity,
    photos: row.photos,
    reportedAt: row.reported_at,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    order: {
      id: row.so_id,
      customerName: row.so_customer_name,
      productName: row.so_product_name,
      quantity: row.so_quantity,
      unit: row.so_unit,
      status: row.so_status,
    },
    delivery: {
      id: row.de_id,
      salesOrderId: row.delivery_record_id,
      status: row.de_status,
      deliveryAddress: row.de_delivery_address,
      signerName: row.de_signer_name,
      signerPhone: row.de_signer_phone,
    },
    reporter: {
      id: row.reporter_id,
      name: row.reporter_name,
    },
    history: historyResult.rows.map(h => ({
      action: h.action,
      user: h.user_name,
      time: h.time,
      remark: h.remark,
    })),
  };
}

export async function getPendingDamageRecords() {
  const result = await query(`
    SELECT dr.*, 
           so.id as so_id, so.customer_name as so_customer_name, so.product_name as so_product_name, 
           so.quantity as so_quantity, so.unit as so_unit, so.status as so_status,
           de.id as de_id, de.status as de_status,
           u.name as reporter_name
    FROM damage_records dr
    LEFT JOIN sales_orders so ON dr.sales_order_id = so.id
    LEFT JOIN delivery_records de ON dr.delivery_record_id = de.id
    LEFT JOIN users u ON dr.reporter_id = u.id
    WHERE dr.status = 'pending'
    ORDER BY dr.reported_at DESC
  `);
  
  return result.rows.map(row => ({
    id: row.id,
    deliveryRecordId: row.delivery_record_id,
    salesOrderId: row.sales_order_id,
    reporterId: row.reporter_id,
    status: row.status,
    damageType: row.damage_type,
    damageDescription: row.damage_description,
    damageQuantity: row.damage_quantity,
    photos: row.photos,
    reportedAt: row.reported_at,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    order: {
      id: row.so_id,
      customerName: row.so_customer_name,
      productName: row.so_product_name,
      quantity: row.so_quantity,
      unit: row.so_unit,
      status: row.so_status,
    },
    delivery: {
      id: row.de_id,
      status: row.de_status,
    },
    reporter: {
      id: row.reporter_id,
      name: row.reporter_name,
    },
  }));
}

export async function getProcessingDamageRecords() {
  const result = await query(`
    SELECT dr.*, 
           so.id as so_id, so.customer_name as so_customer_name, so.product_name as so_product_name, 
           so.quantity as so_quantity, so.unit as so_unit, so.status as so_status,
           de.id as de_id, de.status as de_status,
           u.name as reporter_name
    FROM damage_records dr
    LEFT JOIN sales_orders so ON dr.sales_order_id = so.id
    LEFT JOIN delivery_records de ON dr.delivery_record_id = de.id
    LEFT JOIN users u ON dr.reporter_id = u.id
    WHERE dr.status = 'processing'
    ORDER BY dr.reported_at DESC
  `);
  
  return result.rows.map(row => ({
    id: row.id,
    deliveryRecordId: row.delivery_record_id,
    salesOrderId: row.sales_order_id,
    reporterId: row.reporter_id,
    status: row.status,
    damageType: row.damage_type,
    damageDescription: row.damage_description,
    damageQuantity: row.damage_quantity,
    photos: row.photos,
    reportedAt: row.reported_at,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    order: {
      id: row.so_id,
      customerName: row.so_customer_name,
      productName: row.so_product_name,
      quantity: row.so_quantity,
      unit: row.so_unit,
      status: row.so_status,
    },
    delivery: {
      id: row.de_id,
      status: row.de_status,
    },
    reporter: {
      id: row.reporter_id,
      name: row.reporter_name,
    },
  }));
}

export async function createDamageRecord(data) {
  const newId = `DM${Date.now()}`;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  const result = await query(`
    INSERT INTO damage_records (
      id, delivery_record_id, sales_order_id, reporter_id, 
      status, damage_type, damage_description, damage_quantity,
      photos, reported_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `, [
    newId,
    data.deliveryRecordId,
    data.salesOrderId,
    data.reporterId,
    'pending',
    data.damageType,
    data.damageDescription,
    data.damageQuantity,
    data.photos || [],
    now,
    now,
  ]);
  
  if (data.history && data.history.length > 0) {
    for (const item of data.history) {
      await query(`
        INSERT INTO damage_history (damage_record_id, action, user_name, time, remark)
        VALUES ($1, $2, $3, $4, $5)
      `, [newId, item.action, item.user, item.time, item.remark]);
    }
  }
  
  return { id: newId };
}

export async function updateDamageRecord(id, data) {
  const setClauses = [];
  const params = [id];
  let paramIdx = 2;
  
  if (data.status) {
    setClauses.push(`status = $${paramIdx++}`);
    params.push(data.status);
  }
  if (data.resolvedAt) {
    setClauses.push(`resolved_at = $${paramIdx++}`);
    params.push(data.resolvedAt);
  }
  
  const result = await query(`
    UPDATE damage_records 
    SET ${setClauses.join(', ')}
    WHERE id = $1
    RETURNING *
  `, params);
  
  return result.rows[0] || null;
}

export async function addDamageHistory(id, historyItem) {
  const result = await query(`
    INSERT INTO damage_history (damage_record_id, action, user_name, time, remark)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [id, historyItem.action, historyItem.user, historyItem.time, historyItem.remark]);
  
  return result.rows[0];
}