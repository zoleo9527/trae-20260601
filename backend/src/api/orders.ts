import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const orders = await db.all(`
      SELECT o.*, 
             (SELECT COUNT(*) FROM order_items WHERE orderId = o.id) as itemCount,
             (SELECT SUM(quantity) FROM order_items WHERE orderId = o.id) as totalQuantity,
             (SELECT SUM(lockedQuantity) FROM order_items WHERE orderId = o.id) as totalLocked,
             (SELECT SUM(allocatedQuantity) FROM order_items WHERE orderId = o.id) as totalAllocated
      FROM orders o
      ORDER BY o.createdAt DESC
    `);
    
    const ordersWithItems = await Promise.all(orders.map(async order => {
      const items = await db.all('SELECT * FROM order_items WHERE orderId = ?', [order.id]);
      return { ...order, items };
    }));
    
    await db.close();
    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    
    if (!order) {
      await db.close();
      return res.status(404).json({ error: '订单不存在' });
    }
    
    const items = await db.all('SELECT * FROM order_items WHERE orderId = ?', [req.params.id]);
    const logs = await db.all('SELECT * FROM operation_logs WHERE orderId = ? ORDER BY createdAt DESC', [req.params.id]);
    
    await db.close();
    res.json({ ...order, items, logs });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customerName, customerPhone, items, notes } = req.body;
    
    if (!customerName || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const db = await getDb();
    const id = uuidv4();
    const countResult = await db.get('SELECT COUNT(*) as count FROM orders');
    const orderNo = `PO-${new Date().getFullYear()}-${String((countResult?.count || 0) + 1).padStart(4, '0')}`;
    
    await db.run(`
      INSERT INTO orders (id, orderNo, customerName, customerPhone, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [id, orderNo, customerName, customerPhone, notes]);
    
    for (const item of items) {
      await db.run(`
        INSERT INTO order_items (id, orderId, productName, spec, unit, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [uuidv4(), id, item.productName, item.spec, item.unit, item.quantity]);
    }
    
    await db.run(`
      INSERT INTO operation_logs (id, orderId, orderNo, operationType, operatorId, operatorName, operatorRole, description)
      VALUES (?, ?, ?, 'create', 'system', '系统', 'system', '订单创建成功')
    `, [uuidv4(), id, orderNo]);
    
    await db.close();
    res.status(201).json({ id, orderNo });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id/lock', async (req, res) => {
  try {
    const { idempotencyKey, operatorId, operatorName, operatorRole, items } = req.body;
    
    const db = await getDb();
    
    const existingKey = await db.get('SELECT * FROM idempotency_keys WHERE key = ?', [idempotencyKey]);
    if (existingKey) {
      const expiresAt = new Date(existingKey.expiresAt).getTime();
      if (Date.now() < expiresAt) {
        await db.close();
        return res.json(JSON.parse(existingKey.response));
      }
    }
    
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      await db.close();
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== 'pending') {
      await db.close();
      return res.status(400).json({ error: '订单状态不允许锁货' });
    }
    
    let allLocked = true;
    const totalQuantity = await db.get('SELECT SUM(quantity) as total FROM order_items WHERE orderId = ?', [req.params.id]);
    
    for (const item of items) {
      const existingItem = await db.get('SELECT * FROM order_items WHERE id = ?', [item.id]);
      if (!existingItem) continue;
      
      const lockQty = Math.min(item.lockedQuantity || existingItem.quantity, existingItem.quantity);
      if (lockQty < existingItem.quantity) allLocked = false;
      
      await db.run(`
        UPDATE order_items SET lockedQuantity = ? WHERE id = ?
      `, [lockQty, item.id]);
    }
    
    await db.run(`
      UPDATE orders 
      SET status = 'locked', 
          lockStatus = ?, 
          lockedBy = ?, 
          lockedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `, [allLocked ? 'locked' : 'partial', operatorId, new Date().toISOString(), new Date().toISOString(), req.params.id]);
    
    const description = allLocked ? '订单锁货完成' : '订单部分锁货完成';
    
    await db.run(`
      INSERT INTO operation_logs (id, orderId, orderNo, operationType, operatorId, operatorName, operatorRole, description, details)
      VALUES (?, ?, ?, 'lock', ?, ?, ?, ?, ?)
    `, [uuidv4(), req.params.id, order.orderNo, operatorId, operatorName, operatorRole, description, JSON.stringify(items)]);
    
    const response = { success: true, orderId: req.params.id, lockStatus: allLocked ? 'locked' : 'partial' };
    
    await db.run(`
      INSERT OR REPLACE INTO idempotency_keys (id, key, orderId, operationType, response, expiresAt)
      VALUES (?, ?, ?, 'lock', ?, ?)
    `, [uuidv4(), idempotencyKey, req.params.id, JSON.stringify(response), new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
    
    await db.close();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id/allocate', async (req, res) => {
  try {
    const { idempotencyKey, operatorId, operatorName, operatorRole, allocations } = req.body;
    
    const db = await getDb();
    
    const existingKey = await db.get('SELECT * FROM idempotency_keys WHERE key = ?', [idempotencyKey]);
    if (existingKey) {
      const expiresAt = new Date(existingKey.expiresAt).getTime();
      if (Date.now() < expiresAt) {
        await db.close();
        return res.json(JSON.parse(existingKey.response));
      }
    }
    
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      await db.close();
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.lockStatus !== 'locked' && order.lockStatus !== 'partial') {
      await db.close();
      return res.status(400).json({ error: '订单未锁货，无法分配库位' });
    }
    
    for (const allocation of allocations) {
      const item = await db.get('SELECT * FROM order_items WHERE id = ?', [allocation.itemId]);
      if (!item) continue;
      
      const pendingQty = item.lockedQuantity - item.allocatedQuantity;
      const allocQty = Math.min(allocation.quantity || pendingQty, pendingQty);
      
      if (allocQty > 0 && allocation.locationId) {
        const location = await db.get('SELECT * FROM locations WHERE id = ?', [allocation.locationId]);
        if (location && (location.status === 'empty' || location.status === 'reserved')) {
          const available = location.capacity - location.currentQty;
          const actualAlloc = Math.min(allocQty, available);
          
          await db.run(`
            UPDATE order_items SET allocatedQuantity = allocatedQuantity + ? WHERE id = ?
          `, [actualAlloc, item.id]);
          
          await db.run(`
            UPDATE locations 
            SET currentQty = currentQty + ?, 
                status = 'occupied', 
                orderId = ?, 
                allocatedBy = ?, 
                allocatedAt = ?,
                updatedAt = ?
            WHERE id = ?
          `, [actualAlloc, req.params.id, operatorId, new Date().toISOString(), new Date().toISOString(), allocation.locationId]);
        }
      }
    }
    
    const orderItems = await db.all('SELECT * FROM order_items WHERE orderId = ?', [req.params.id]);
    const allAllocated = orderItems.every(item => item.lockedQuantity === item.allocatedQuantity);
    
    await db.run(`
      UPDATE orders 
      SET status = 'allocated', 
          allocatedBy = ?, 
          allocatedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `, [operatorId, new Date().toISOString(), new Date().toISOString(), req.params.id]);
    
    await db.run(`
      INSERT INTO operation_logs (id, orderId, orderNo, operationType, operatorId, operatorName, operatorRole, description, details)
      VALUES (?, ?, ?, 'allocate', ?, ?, ?, '库位分配完成', ?)
    `, [uuidv4(), req.params.id, order.orderNo, operatorId, operatorName, operatorRole, JSON.stringify(allocations)]);
    
    const response = { success: true, orderId: req.params.id, fullyAllocated: allAllocated };
    
    await db.run(`
      INSERT OR REPLACE INTO idempotency_keys (id, key, orderId, operationType, response, expiresAt)
      VALUES (?, ?, ?, 'allocate', ?, ?)
    `, [uuidv4(), idempotencyKey, req.params.id, JSON.stringify(response), new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
    
    await db.close();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id/pick', async (req, res) => {
  try {
    const { idempotencyKey, operatorId, operatorName, operatorRole } = req.body;
    
    const db = await getDb();
    
    const existingKey = await db.get('SELECT * FROM idempotency_keys WHERE key = ?', [idempotencyKey]);
    if (existingKey) {
      const expiresAt = new Date(existingKey.expiresAt).getTime();
      if (Date.now() < expiresAt) {
        await db.close();
        return res.json(JSON.parse(existingKey.response));
      }
    }
    
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      await db.close();
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== 'allocated') {
      await db.close();
      return res.status(400).json({ error: '订单状态不允许拣货' });
    }
    
    await db.run(`
      UPDATE order_items 
      SET pickedQuantity = allocatedQuantity 
      WHERE orderId = ?
    `, [req.params.id]);
    
    await db.run(`
      UPDATE orders 
      SET status = 'picked', 
          pickedBy = ?, 
          pickedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `, [operatorId, new Date().toISOString(), new Date().toISOString(), req.params.id]);
    
    await db.run(`
      INSERT INTO operation_logs (id, orderId, orderNo, operationType, operatorId, operatorName, operatorRole, description)
      VALUES (?, ?, ?, 'pick', ?, ?, ?, '拣货完成')
    `, [uuidv4(), req.params.id, order.orderNo, operatorId, operatorName, operatorRole]);
    
    const response = { success: true, orderId: req.params.id };
    
    await db.run(`
      INSERT OR REPLACE INTO idempotency_keys (id, key, orderId, operationType, response, expiresAt)
      VALUES (?, ?, ?, 'pick', ?, ?)
    `, [uuidv4(), idempotencyKey, req.params.id, JSON.stringify(response), new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
    
    await db.close();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id/load', async (req, res) => {
  try {
    const { idempotencyKey, operatorId, operatorName, operatorRole, licensePlate } = req.body;
    
    const db = await getDb();
    
    const existingKey = await db.get('SELECT * FROM idempotency_keys WHERE key = ?', [idempotencyKey]);
    if (existingKey) {
      const expiresAt = new Date(existingKey.expiresAt).getTime();
      if (Date.now() < expiresAt) {
        await db.close();
        return res.json(JSON.parse(existingKey.response));
      }
    }
    
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      await db.close();
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== 'picked') {
      await db.close();
      return res.status(400).json({ error: '订单状态不允许装车' });
    }
    
    await db.run(`
      UPDATE order_items 
      SET loadedQuantity = pickedQuantity 
      WHERE orderId = ?
    `, [req.params.id]);
    
    await db.run(`
      UPDATE orders 
      SET status = 'in_transit', 
          driverId = ?, 
          loadedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `, [operatorId, new Date().toISOString(), new Date().toISOString(), req.params.id]);
    
    await db.run(`
      INSERT INTO operation_logs (id, orderId, orderNo, operationType, operatorId, operatorName, operatorRole, description, details)
      VALUES (?, ?, ?, 'load', ?, ?, ?, '装车完成，出发送货', ?)
    `, [uuidv4(), req.params.id, order.orderNo, operatorId, operatorName, operatorRole, JSON.stringify({ licensePlate })]);
    
    const response = { success: true, orderId: req.params.id };
    
    await db.run(`
      INSERT OR REPLACE INTO idempotency_keys (id, key, orderId, operationType, response, expiresAt)
      VALUES (?, ?, ?, 'load', ?, ?)
    `, [uuidv4(), idempotencyKey, req.params.id, JSON.stringify(response), new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
    
    await db.close();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id/deliver', async (req, res) => {
  try {
    const { idempotencyKey, operatorId, operatorName, operatorRole } = req.body;
    
    const db = await getDb();
    
    const existingKey = await db.get('SELECT * FROM idempotency_keys WHERE key = ?', [idempotencyKey]);
    if (existingKey) {
      const expiresAt = new Date(existingKey.expiresAt).getTime();
      if (Date.now() < expiresAt) {
        await db.close();
        return res.json(JSON.parse(existingKey.response));
      }
    }
    
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      await db.close();
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== 'in_transit') {
      await db.close();
      return res.status(400).json({ error: '订单状态不允许送达' });
    }
    
    await db.run(`
      UPDATE orders 
      SET status = 'delivered', 
          deliveredAt = ?,
          updatedAt = ?
      WHERE id = ?
    `, [new Date().toISOString(), new Date().toISOString(), req.params.id]);
    
    await db.run(`
      INSERT INTO operation_logs (id, orderId, orderNo, operationType, operatorId, operatorName, operatorRole, description)
      VALUES (?, ?, ?, 'deliver', ?, ?, ?, '货物已送达')
    `, [uuidv4(), req.params.id, order.orderNo, operatorId, operatorName, operatorRole]);
    
    const response = { success: true, orderId: req.params.id };
    
    await db.run(`
      INSERT OR REPLACE INTO idempotency_keys (id, key, orderId, operationType, response, expiresAt)
      VALUES (?, ?, ?, 'deliver', ?, ?)
    `, [uuidv4(), idempotencyKey, req.params.id, JSON.stringify(response), new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
    
    await db.close();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id/sign', async (req, res) => {
  try {
    const { idempotencyKey, operatorId, operatorName, operatorRole, signerName, signerPhone } = req.body;
    
    const db = await getDb();
    
    const existingKey = await db.get('SELECT * FROM idempotency_keys WHERE key = ?', [idempotencyKey]);
    if (existingKey) {
      const expiresAt = new Date(existingKey.expiresAt).getTime();
      if (Date.now() < expiresAt) {
        await db.close();
        return res.json(JSON.parse(existingKey.response));
      }
    }
    
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      await db.close();
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== 'delivered') {
      await db.close();
      return res.status(400).json({ error: '订单状态不允许签收' });
    }
    
    await db.run(`
      UPDATE orders 
      SET status = 'signed', 
          signedBy = ?, 
          signedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `, [operatorId, new Date().toISOString(), new Date().toISOString(), req.params.id]);
    
    await db.run(`
      INSERT INTO operation_logs (id, orderId, orderNo, operationType, operatorId, operatorName, operatorRole, description, details)
      VALUES (?, ?, ?, 'sign', ?, ?, ?, '客户已签收', ?)
    `, [uuidv4(), req.params.id, order.orderNo, operatorId, operatorName, operatorRole, JSON.stringify({ signerName, signerPhone })]);
    
    const response = { success: true, orderId: req.params.id };
    
    await db.run(`
      INSERT OR REPLACE INTO idempotency_keys (id, key, orderId, operationType, response, expiresAt)
      VALUES (?, ?, ?, 'sign', ?, ?)
    `, [uuidv4(), idempotencyKey, req.params.id, JSON.stringify(response), new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
    
    await db.close();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id/complete', async (req, res) => {
  try {
    const { idempotencyKey, operatorId, operatorName, operatorRole } = req.body;
    
    const db = await getDb();
    
    const existingKey = await db.get('SELECT * FROM idempotency_keys WHERE key = ?', [idempotencyKey]);
    if (existingKey) {
      const expiresAt = new Date(existingKey.expiresAt).getTime();
      if (Date.now() < expiresAt) {
        await db.close();
        return res.json(JSON.parse(existingKey.response));
      }
    }
    
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      await db.close();
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== 'signed') {
      await db.close();
      return res.status(400).json({ error: '订单状态不允许完成' });
    }
    
    await db.run(`
      UPDATE orders 
      SET status = 'completed', 
          completedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `, [new Date().toISOString(), new Date().toISOString(), req.params.id]);
    
    await db.run(`
      UPDATE locations 
      SET status = 'empty', 
          orderId = NULL, 
          allocatedBy = NULL, 
          allocatedAt = NULL,
          updatedAt = ?
      WHERE orderId = ?
    `, [new Date().toISOString(), req.params.id]);
    
    await db.run(`
      INSERT INTO operation_logs (id, orderId, orderNo, operationType, operatorId, operatorName, operatorRole, description)
      VALUES (?, ?, ?, 'complete', ?, ?, ?, '订单完成')
    `, [uuidv4(), req.params.id, order.orderNo, operatorId, operatorName, operatorRole]);
    
    const response = { success: true, orderId: req.params.id };
    
    await db.run(`
      INSERT OR REPLACE INTO idempotency_keys (id, key, orderId, operationType, response, expiresAt)
      VALUES (?, ?, ?, 'complete', ?, ?)
    `, [uuidv4(), idempotencyKey, req.params.id, JSON.stringify(response), new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
    
    await db.close();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
