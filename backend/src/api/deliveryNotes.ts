import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const notes = await db.all(`
      SELECT dn.*, o.customerName, o.customerPhone
      FROM delivery_notes dn
      LEFT JOIN orders o ON dn.orderId = o.id
      ORDER BY dn.createdAt DESC
    `);
    await db.close();
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const note = await db.get(`
      SELECT dn.*, o.customerName, o.customerPhone, o.items
      FROM delivery_notes dn
      LEFT JOIN orders o ON dn.orderId = o.id
      WHERE dn.id = ?
    `, [req.params.id]);
    
    if (!note) {
      await db.close();
      return res.status(404).json({ error: '送货回单不存在' });
    }
    
    await db.close();
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { orderId, orderNo, driverId, driverName, licensePlate } = req.body;
    
    if (!orderId || !orderNo || !driverId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const db = await getDb();
    
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      await db.close();
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== 'picked') {
      await db.close();
      return res.status(400).json({ error: '订单未拣货，无法创建送货回单' });
    }
    
    const noteNo = `DN-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    
    await db.run(`
      INSERT INTO delivery_notes (id, noteNo, orderId, orderNo, driverId, driverName, licensePlate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [uuidv4(), noteNo, orderId, orderNo, driverId, driverName, licensePlate]);
    
    await db.close();
    res.status(201).json({ success: true, noteNo });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id/load', async (req, res) => {
  try {
    const { operatorId, operatorName, operatorRole } = req.body;
    
    const db = await getDb();
    const note = await db.get('SELECT * FROM delivery_notes WHERE id = ?', [req.params.id]);
    
    if (!note) {
      await db.close();
      return res.status(404).json({ error: '送货回单不存在' });
    }
    
    await db.run(`
      UPDATE delivery_notes 
      SET status = 'loaded', 
          loadedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `, [new Date().toISOString(), new Date().toISOString(), req.params.id]);
    
    await db.run(`
      UPDATE orders 
      SET status = 'in_transit', 
          driverId = ?, 
          loadedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `, [operatorId, new Date().toISOString(), new Date().toISOString(), note.orderId]);
    
    await db.run(`
      INSERT INTO operation_logs (id, orderId, orderNo, operationType, operatorId, operatorName, operatorRole, description)
      VALUES (?, ?, ?, 'load', ?, ?, ?, '装车完成')
    `, [uuidv4(), note.orderId, note.orderNo, operatorId, operatorName, operatorRole]);
    
    await db.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id/deliver', async (req, res) => {
  try {
    const { operatorId, operatorName, operatorRole } = req.body;
    
    const db = await getDb();
    const note = await db.get('SELECT * FROM delivery_notes WHERE id = ?', [req.params.id]);
    
    if (!note) {
      await db.close();
      return res.status(404).json({ error: '送货回单不存在' });
    }
    
    await db.run(`
      UPDATE delivery_notes 
      SET status = 'delivered', 
          deliveredAt = ?,
          updatedAt = ?
      WHERE id = ?
    `, [new Date().toISOString(), new Date().toISOString(), req.params.id]);
    
    await db.run(`
      UPDATE orders 
      SET status = 'delivered', 
          deliveredAt = ?,
          updatedAt = ?
      WHERE id = ?
    `, [new Date().toISOString(), new Date().toISOString(), note.orderId]);
    
    await db.run(`
      INSERT INTO operation_logs (id, orderId, orderNo, operationType, operatorId, operatorName, operatorRole, description)
      VALUES (?, ?, ?, 'deliver', ?, ?, ?, '货物已送达')
    `, [uuidv4(), note.orderId, note.orderNo, operatorId, operatorName, operatorRole]);
    
    await db.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id/sign', async (req, res) => {
  try {
    const { operatorId, operatorName, operatorRole, signerName, signerPhone } = req.body;
    
    const db = await getDb();
    const note = await db.get('SELECT * FROM delivery_notes WHERE id = ?', [req.params.id]);
    
    if (!note) {
      await db.close();
      return res.status(404).json({ error: '送货回单不存在' });
    }
    
    await db.run(`
      UPDATE delivery_notes 
      SET status = 'signed', 
          signedAt = ?,
          signerName = ?,
          signerPhone = ?,
          updatedAt = ?
      WHERE id = ?
    `, [new Date().toISOString(), signerName, signerPhone, new Date().toISOString(), req.params.id]);
    
    await db.run(`
      UPDATE orders 
      SET status = 'signed', 
          signedBy = ?, 
          signedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `, [operatorId, new Date().toISOString(), new Date().toISOString(), note.orderId]);
    
    await db.run(`
      INSERT INTO operation_logs (id, orderId, orderNo, operationType, operatorId, operatorName, operatorRole, description, details)
      VALUES (?, ?, ?, 'sign', ?, ?, ?, '客户已签收', ?)
    `, [uuidv4(), note.orderId, note.orderNo, operatorId, operatorName, operatorRole, JSON.stringify({ signerName, signerPhone })]);
    
    await db.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
