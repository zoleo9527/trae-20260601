const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get('/orders', async (req, res) => {
    const { status, handler, search, page = 1, limit = 10 } = req.query;
    let query = db('orders').orderBy('updated_at', 'desc');
    
    if (status) query = query.where('status', status);
    if (handler) query = query.where('current_handler', handler);
    if (search) {
      query = query.where(function() {
        this.where('customer_name', 'like', `%${search}%`)
           .orWhere('order_no', 'like', `%${search}%`)
           .orWhere('address', 'like', `%${search}%`);
      });
    }
    
    const offset = (page - 1) * limit;
    const orders = await query.limit(limit).offset(offset);
    const total = await db('orders').count('id as count').first();
    
    res.json({ orders, total: total.count });
  });

  router.get('/orders/:id', async (req, res) => {
    const order = await db('orders').where('id', req.params.id).first();
    const details = await db('order_details').where('order_id', req.params.id);
    const tracking = await db('tracking').where('order_id', req.params.id).orderBy('created_at');
    res.json({ ...order, details, tracking });
  });

  router.post('/orders', async (req, res) => {
    const { customer_name, phone, address, fabric_type, details, total_price } = req.body;
    const [id] = await db('orders').insert({
      order_no: 'ORD' + Date.now(),
      customer_name,
      phone,
      address,
      fabric_type,
      total_price,
      status: 'pending',
      current_handler: '导购',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    for (const detail of details) {
      await db('order_details').insert({
        order_id: id,
        ...detail,
        created_at: new Date()
      });
    }
    
    await db('tracking').insert({
      order_id: id,
      status: 'pending',
      handler: '导购',
      action: '创建订单',
      note: '订单已创建，等待量尺',
      created_at: new Date()
    });
    
    res.json({ success: true, id });
  });

  router.put('/orders/:id', async (req, res) => {
    const { status, current_handler, note } = req.body;
    await db('orders').where('id', req.params.id).update({
      status,
      current_handler,
      updated_at: new Date()
    });
    
    await db('tracking').insert({
      order_id: req.params.id,
      status,
      handler: current_handler,
      action: getActionByStatus(status),
      note,
      created_at: new Date()
    });
    
    res.json({ success: true });
  });

  router.put('/orders/:id/reject', async (req, res) => {
    const { reason, next_handler } = req.body;
    const order = await db('orders').where('id', req.params.id).first();
    
    await db('orders').where('id', req.params.id).update({
      status: 'rejected',
      current_handler: next_handler,
      updated_at: new Date()
    });
    
    await db('tracking').insert({
      order_id: req.params.id,
      status: 'rejected',
      handler: order.current_handler,
      action: '退回',
      note: reason,
      created_at: new Date()
    });
    
    res.json({ success: true });
  });

  router.put('/orders/:id/review', async (req, res) => {
    const { is_approved, note } = req.body;
    const order = await db('orders').where('id', req.params.id).first();
    const newStatus = is_approved ? 'confirmed' : 'needs_revision';
    
    await db('orders').where('id', req.params.id).update({
      status: newStatus,
      updated_at: new Date()
    });
    
    await db('tracking').insert({
      order_id: req.params.id,
      status: newStatus,
      handler: order.current_handler,
      action: is_approved ? '复核通过' : '复核不通过',
      note,
      created_at: new Date()
    });
    
    res.json({ success: true });
  });

  router.get('/fabric-stock', async (req, res) => {
    const stocks = await db('fabric_stock').orderBy('fabric_name');
    res.json(stocks);
  });

  router.put('/fabric-stock/:id', async (req, res) => {
    await db('fabric_stock').where('id', req.params.id).update({
      quantity: req.body.quantity,
      updated_at: new Date()
    });
    res.json({ success: true });
  });

  router.post('/fabric-order', async (req, res) => {
    const { order_id, fabric_id, quantity, supplier } = req.body;
    const [id] = await db('fabric_orders').insert({
      order_id,
      fabric_id,
      quantity,
      supplier,
      status: 'ordered',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const fabric = await db('fabric_stock').where('id', fabric_id).first();
    await db('orders').where('id', order_id).update({
      status: 'fabric_ordered',
      current_handler: '采购',
      updated_at: new Date()
    });
    
    await db('tracking').insert({
      order_id,
      status: 'fabric_ordered',
      handler: '采购',
      action: '面料下单',
      note: `已向${supplier}下单${quantity}米${fabric?.fabric_name || fabric_id}`,
      created_at: new Date()
    });
    
    res.json({ success: true, id });
  });

  router.get('/fabric-orders', async (req, res) => {
    const { order_id, status } = req.query;
    let query = db('fabric_orders').orderBy('updated_at', 'desc');
    
    if (order_id) query = query.where('order_id', order_id);
    if (status) query = query.where('status', status);
    
    const fabricOrders = await query;
    const result = await Promise.all(fabricOrders.map(async fo => {
      const fabric = await db('fabric_stock').where('id', fo.fabric_id).first();
      const order = await db('orders').where('id', fo.order_id).first();
      return { ...fo, fabric_name: fabric?.fabric_name, customer_name: order?.customer_name };
    }));
    
    res.json(result);
  });

  router.put('/fabric-orders/:id', async (req, res) => {
    const { status } = req.body;
    const fabricOrder = await db('fabric_orders').where('id', req.params.id).first();
    
    await db('fabric_orders').where('id', req.params.id).update({
      status,
      updated_at: new Date()
    });
    
    if (status === 'received') {
      await db('fabric_stock').where('id', fabricOrder.fabric_id).increment('quantity', fabricOrder.quantity);
      
      await db('orders').where('id', fabricOrder.order_id).update({
        status: 'fabric_received',
        updated_at: new Date()
      });
      
      await db('tracking').insert({
        order_id: fabricOrder.order_id,
        status: 'fabric_received',
        handler: '采购',
        action: '面料到货',
        note: '面料已入库',
        created_at: new Date()
      });
    }
    
    res.json({ success: true });
  });

  router.get('/process-tracking', async (req, res) => {
    const { order_id, status } = req.query;
    let query = db('process_tracking').orderBy('created_at');
    
    if (order_id) query = query.where('order_id', order_id);
    if (status) query = query.where('status', status);
    
    const process = await query;
    res.json(process);
  });

  router.post('/process-tracking', async (req, res) => {
    const { order_id, status, process_type, note } = req.body;
    const [id] = await db('process_tracking').insert({
      order_id,
      status,
      process_type,
      note,
      created_at: new Date()
    });
    
    const handlers = { cutting: '裁剪工', sewing: '缝纫工', ironing: '熨烫工', installing: '安装师傅' };
    
    await db('orders').where('id', order_id).update({
      status,
      current_handler: handlers[process_type] || '加工员',
      updated_at: new Date()
    });
    
    await db('tracking').insert({
      order_id,
      status,
      handler: handlers[process_type] || '加工员',
      action: getProcessAction(process_type, status),
      note,
      created_at: new Date()
    });
    
    res.json({ success: true, id });
  });

  router.get('/staff', async (req, res) => {
    const staff = await db('staff').orderBy('role');
    res.json(staff);
  });

  router.post('/staff', async (req, res) => {
    const { name, role, phone } = req.body;
    const [id] = await db('staff').insert({ name, role, phone, created_at: new Date() });
    res.json({ success: true, id });
  });

  router.get('/dashboard', async (req, res) => {
    const pending = await db('orders').count('id as count').where('status', 'pending').first();
    const measuring = await db('orders').count('id as count').where('status', 'measuring').first();
    const confirmed = await db('orders').count('id as count').where('status', 'confirmed').first();
    const fabricOrdered = await db('orders').count('id as count').where('status', 'fabric_ordered').first();
    const fabricReceived = await db('orders').count('id as count').where('status', 'fabric_received').first();
    const processing = await db('orders').count('id as count').where('status', 'processing').first();
    const completed = await db('orders').count('id as count').where('status', 'completed').first();
    const rejected = await db('orders').count('id as count').where('status', 'rejected').first();
    
    const recentChanges = await db('tracking').orderBy('created_at', 'desc').limit(10);
    
    const fabricStockStatus = await db('fabric_stock').select('*');
    const lowStock = fabricStockStatus.filter(f => f.quantity < 10);
    
    const fabricOrdersPending = await db('fabric_orders').count('id as count').where('status', 'ordered').first();
    
    res.json({
      stats: {
        pending: pending.count,
        measuring: measuring.count,
        confirmed: confirmed.count,
        fabric_ordered: fabricOrdered.count,
        fabric_received: fabricReceived.count,
        processing: processing.count,
        completed: completed.count,
        rejected: rejected.count
      },
      recentChanges,
      lowStock: lowStock.length,
      pendingFabricOrders: fabricOrdersPending.count
    });
  });

  return router;
};

function getActionByStatus(status) {
  const actions = {
    pending: '创建订单',
    measuring: '量尺中',
    measured: '量尺完成',
    needs_revision: '待修改',
    confirmed: '确认订单',
    fabric_ordered: '面料下单',
    fabric_received: '面料到货',
    processing: '加工中',
    cutting: '裁剪中',
    sewing: '缝纫中',
    ironing: '熨烫中',
    ready: '待安装',
    installing: '安装中',
    completed: '完成',
    rejected: '退回',
    cancelled: '取消'
  };
  return actions[status] || status;
}

function getProcessAction(process_type, status) {
  const actions = {
    cutting: status === 'cutting' ? '开始裁剪' : '裁剪完成',
    sewing: status === 'sewing' ? '开始缝纫' : '缝纫完成',
    ironing: status === 'ironing' ? '开始熨烫' : '熨烫完成',
    installing: status === 'installing' ? '开始安装' : '安装完成'
  };
  return actions[process_type] || status;
}