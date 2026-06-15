import { query } from '~/utils/db.server';

export async function getDeliveryRecords() {
  const result = await query(`
    SELECT dr.*, 
           so.id as so_id, so.customer_name as so_customer_name, so.product_name as so_product_name, 
           so.quantity as so_quantity, so.unit as so_unit, so.status as so_status
    FROM delivery_records dr
    LEFT JOIN sales_orders so ON dr.sales_order_id = so.id
    ORDER BY dr.created_at DESC
  `);
  return result.rows.map(row => ({
    id: row.id,
    salesOrderId: row.sales_order_id,
    driverId: row.driver_id,
    warehouseId: row.warehouse_id,
    status: row.status,
    deliveryAddress: row.delivery_address,
    plannedTime: row.planned_time,
    createdAt: row.created_at,
    dispatchedAt: row.dispatched_at,
    signedAt: row.signed_at,
    signerName: row.signer_name,
    signerPhone: row.signer_phone,
    order: {
      id: row.so_id,
      customerName: row.so_customer_name,
      productName: row.so_product_name,
      quantity: row.so_quantity,
      unit: row.so_unit,
      status: row.so_status,
    },
  }));
}

export async function getDeliveryRecordById(id) {
  const result = await query(`
    SELECT dr.*, 
           so.id as so_id, so.customer_name as so_customer_name, so.product_name as so_product_name, 
           so.quantity as so_quantity, so.unit as so_unit, so.status as so_status
    FROM delivery_records dr
    LEFT JOIN sales_orders so ON dr.sales_order_id = so.id
    WHERE dr.id = $1
  `, [id]);
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    salesOrderId: row.sales_order_id,
    driverId: row.driver_id,
    warehouseId: row.warehouse_id,
    status: row.status,
    deliveryAddress: row.delivery_address,
    plannedTime: row.planned_time,
    createdAt: row.created_at,
    dispatchedAt: row.dispatched_at,
    signedAt: row.signed_at,
    signerName: row.signer_name,
    signerPhone: row.signer_phone,
    order: {
      id: row.so_id,
      customerName: row.so_customer_name,
      productName: row.so_product_name,
      quantity: row.so_quantity,
      unit: row.so_unit,
      status: row.so_status,
    },
  };
}

export async function getPendingDeliveries() {
  const result = await query(`
    SELECT dr.*, 
           so.id as so_id, so.customer_name as so_customer_name, so.product_name as so_product_name, 
           so.quantity as so_quantity, so.unit as so_unit, so.status as so_status
    FROM delivery_records dr
    LEFT JOIN sales_orders so ON dr.sales_order_id = so.id
    WHERE dr.status = 'pending'
    ORDER BY dr.planned_time
  `);
  return result.rows.map(row => ({
    id: row.id,
    salesOrderId: row.sales_order_id,
    driverId: row.driver_id,
    warehouseId: row.warehouse_id,
    status: row.status,
    deliveryAddress: row.delivery_address,
    plannedTime: row.planned_time,
    createdAt: row.created_at,
    dispatchedAt: row.dispatched_at,
    signedAt: row.signed_at,
    signerName: row.signer_name,
    signerPhone: row.signer_phone,
    order: {
      id: row.so_id,
      customerName: row.so_customer_name,
      productName: row.so_product_name,
      quantity: row.so_quantity,
      unit: row.so_unit,
      status: row.so_status,
    },
  }));
}

export async function getDeliveriesInTransit() {
  const result = await query(`
    SELECT dr.*, 
           so.id as so_id, so.customer_name as so_customer_name, so.product_name as so_product_name, 
           so.quantity as so_quantity, so.unit as so_unit, so.status as so_status
    FROM delivery_records dr
    LEFT JOIN sales_orders so ON dr.sales_order_id = so.id
    WHERE dr.status = 'in_transit'
    ORDER BY dr.planned_time
  `);
  return result.rows.map(row => ({
    id: row.id,
    salesOrderId: row.sales_order_id,
    driverId: row.driver_id,
    warehouseId: row.warehouse_id,
    status: row.status,
    deliveryAddress: row.delivery_address,
    plannedTime: row.planned_time,
    createdAt: row.created_at,
    dispatchedAt: row.dispatched_at,
    signedAt: row.signed_at,
    signerName: row.signer_name,
    signerPhone: row.signer_phone,
    order: {
      id: row.so_id,
      customerName: row.so_customer_name,
      productName: row.so_product_name,
      quantity: row.so_quantity,
      unit: row.so_unit,
      status: row.so_status,
    },
  }));
}

export async function updateDeliveryStatus(id, status, data = {}) {
  const setClauses = [`status = $2`];
  const params = [id, status];
  let paramIdx = 3;
  
  if (data.signerName) {
    setClauses.push(`signer_name = $${paramIdx++}`);
    params.push(data.signerName);
  }
  if (data.signerPhone) {
    setClauses.push(`signer_phone = $${paramIdx++}`);
    params.push(data.signerPhone);
  }
  if (data.signedAt) {
    setClauses.push(`signed_at = $${paramIdx++}`);
    params.push(data.signedAt);
  }
  if (data.dispatchedAt) {
    setClauses.push(`dispatched_at = $${paramIdx++}`);
    params.push(data.dispatchedAt);
  }
  
  const result = await query(`
    UPDATE delivery_records 
    SET ${setClauses.join(', ')}
    WHERE id = $1
    RETURNING *
  `, params);
  
  return result.rows[0] || null;
}