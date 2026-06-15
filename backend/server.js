const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let orders = [
  { id: 1, order_no: 'ORD20240115001', customer_name: '张三', phone: '13900139001', address: '阳光小区3栋1201', fabric_type: '雪尼尔遮光布', total_price: 2800, status: 'completed', current_handler: '周安装', created_at: '2024-01-15T10:00:00', updated_at: '2024-01-20T15:30:00' },
  { id: 2, order_no: 'ORD20240116002', customer_name: '李四', phone: '13900139002', address: '星河湾5栋802', fabric_type: '亚麻混纺', total_price: 1680, status: 'installing', current_handler: '吴安装', created_at: '2024-01-16T09:30:00', updated_at: '2024-01-21T08:00:00' },
  { id: 3, order_no: 'ORD20240117003', customer_name: '王五', phone: '13900139003', address: '绿城花园8栋301', fabric_type: '高精密提花', total_price: 3200, status: 'ironing', current_handler: '孙熨烫', created_at: '2024-01-17T14:00:00', updated_at: '2024-01-21T10:00:00' },
  { id: 4, order_no: 'ORD20240118004', customer_name: '赵六', phone: '13900139004', address: '山水人家12栋1503', fabric_type: '棉麻窗帘', total_price: 980, status: 'sewing', current_handler: '赵缝纫', created_at: '2024-01-18T11:00:00', updated_at: '2024-01-21T09:00:00' },
  { id: 5, order_no: 'ORD20240119005', customer_name: '钱七', phone: '13900139005', address: '锦绣华庭6栋601', fabric_type: '真丝质感', total_price: 4500, status: 'cutting', current_handler: '刘裁剪', created_at: '2024-01-19T15:00:00', updated_at: '2024-01-21T07:00:00' },
  { id: 6, order_no: 'ORD20240120006', customer_name: '孙八', phone: '13900139006', address: '幸福里9栋1802', fabric_type: '涤纶遮光', total_price: 1200, status: 'fabric_received', current_handler: '采购', created_at: '2024-01-20T08:00:00', updated_at: '2024-01-21T06:00:00' },
  { id: 7, order_no: 'ORD20240120007', customer_name: '周九', phone: '13900139007', address: '东方明珠15栋2201', fabric_type: '北欧风棉麻', total_price: 2100, status: 'fabric_ordered', current_handler: '郑采购', created_at: '2024-01-20T10:00:00', updated_at: '2024-01-20T14:00:00' },
  { id: 8, order_no: 'ORD20240121008', customer_name: '吴十', phone: '13900139008', address: '名门世家3栋1002', fabric_type: '印花涤纶', total_price: 1500, status: 'confirmed', current_handler: '导购', created_at: '2024-01-21T09:00:00', updated_at: '2024-01-21T11:00:00' },
  { id: 9, order_no: 'ORD20240121009', customer_name: '郑十一', phone: '13900139009', address: '皇家花园7栋501', fabric_type: '雪尼尔遮光布', total_price: 3800, status: 'measuring', current_handler: '陈量尺', created_at: '2024-01-21T10:00:00', updated_at: '2024-01-21T12:00:00' },
  { id: 10, order_no: 'ORD20240121010', customer_name: '王十二', phone: '13900139010', address: '金色港湾11栋702', fabric_type: '亚麻混纺', total_price: 1890, status: 'pending', current_handler: '李导购', created_at: '2024-01-21T11:00:00', updated_at: '2024-01-21T11:00:00' },
  { id: 11, order_no: 'ORD20240121011', customer_name: '冯十三', phone: '13900139011', address: '滨江新城8栋1101', fabric_type: '高精密提花', total_price: 5200, status: 'needs_revision', current_handler: '张量尺', created_at: '2024-01-21T13:00:00', updated_at: '2024-01-21T14:00:00' },
  { id: 12, order_no: 'ORD20240121012', customer_name: '陈十四', phone: '13900139012', address: '翠湖天地4栋903', fabric_type: '棉麻窗帘', total_price: 1400, status: 'rejected', current_handler: '王导购', created_at: '2024-01-21T14:00:00', updated_at: '2024-01-21T14:30:00' }
];

let orderDetails = [
  { id: 1, order_id: 1, item_name: '主卧窗帘', width: 3.5, height: 2.8, quantity: 2, price: 1800, created_at: '2024-01-15T10:00:00' },
  { id: 2, order_id: 1, item_name: '次卧窗帘', width: 2.8, height: 2.6, quantity: 2, price: 1000, created_at: '2024-01-15T10:00:00' },
  { id: 3, order_id: 2, item_name: '客厅窗帘', width: 4.2, height: 2.8, quantity: 2, price: 1680, created_at: '2024-01-16T09:30:00' },
];

let tracking = [
  { id: 1, order_id: 1, status: 'completed', handler: '周安装', action: '安装完成', note: '订单完成', created_at: '2024-01-20T15:30:00' },
  { id: 2, order_id: 1, status: 'installing', handler: '周安装', action: '开始安装', note: '安装进行中', created_at: '2024-01-20T10:00:00' },
  { id: 3, order_id: 1, status: 'ironing', handler: '孙熨烫', action: '熨烫完成', note: '熨烫完成', created_at: '2024-01-19T16:00:00' },
  { id: 4, order_id: 2, status: 'installing', handler: '吴安装', action: '开始安装', note: '正在安装中', created_at: '2024-01-21T08:00:00' },
  { id: 5, order_id: 2, status: 'ironing', handler: '孙熨烫', action: '熨烫完成', note: '熨烫完成', created_at: '2024-01-20T18:00:00' },
  { id: 6, order_id: 3, status: 'ironing', handler: '孙熨烫', action: '开始熨烫', note: '熨烫进行中', created_at: '2024-01-21T10:00:00' },
  { id: 7, order_id: 4, status: 'sewing', handler: '赵缝纫', action: '开始缝纫', note: '缝纫进行中', created_at: '2024-01-21T09:00:00' },
  { id: 8, order_id: 5, status: 'cutting', handler: '刘裁剪', action: '开始裁剪', note: '裁剪进行中', created_at: '2024-01-21T07:00:00' },
  { id: 9, order_id: 11, status: 'needs_revision', handler: '李导购', action: '复核不通过', note: '阳台窗户尺寸有疑问，需要重新量尺确认', created_at: '2024-01-21T14:00:00' },
  { id: 10, order_id: 12, status: 'rejected', handler: '王导购', action: '退回', note: '客户要求更换面料款式，需要重新确认', created_at: '2024-01-21T14:30:00' },
];

let fabricStock = [
  { id: 1, fabric_name: '雪尼尔遮光布', color: '深灰', texture: '绒面', quantity: 50, price_per_meter: 85, updated_at: '2024-01-21T00:00:00' },
  { id: 2, fabric_name: '亚麻混纺', color: '米白', texture: '麻面', quantity: 30, price_per_meter: 65, updated_at: '2024-01-21T00:00:00' },
  { id: 3, fabric_name: '高精密提花', color: '深蓝', texture: '提花', quantity: 15, price_per_meter: 120, updated_at: '2024-01-21T00:00:00' },
  { id: 4, fabric_name: '棉麻窗帘', color: '浅咖', texture: '棉麻', quantity: 8, price_per_meter: 55, updated_at: '2024-01-21T00:00:00' },
  { id: 5, fabric_name: '真丝质感', color: '香槟', texture: '光滑', quantity: 20, price_per_meter: 180, updated_at: '2024-01-21T00:00:00' },
  { id: 6, fabric_name: '涤纶遮光', color: '黑色', texture: '光滑', quantity: 100, price_per_meter: 45, updated_at: '2024-01-21T00:00:00' },
  { id: 7, fabric_name: '北欧风棉麻', color: '浅灰', texture: '棉麻', quantity: 5, price_per_meter: 70, updated_at: '2024-01-21T00:00:00' },
  { id: 8, fabric_name: '印花涤纶', color: '花色', texture: '印花', quantity: 40, price_per_meter: 50, updated_at: '2024-01-21T00:00:00' }
];

let fabricOrders = [
  { id: 1, order_id: 7, fabric_id: 7, quantity: 30, supplier: '面料供应商A', status: 'ordered', created_at: '2024-01-20T14:00:00', updated_at: '2024-01-20T14:00:00' },
];

let staff = [
  { id: 1, name: '王导购', role: '导购', phone: '13800138001', created_at: '2024-01-01T00:00:00' },
  { id: 2, name: '李导购', role: '导购', phone: '13800138002', created_at: '2024-01-01T00:00:00' },
  { id: 3, name: '张量尺', role: '量尺师', phone: '13800138003', created_at: '2024-01-01T00:00:00' },
  { id: 4, name: '陈量尺', role: '量尺师', phone: '13800138004', created_at: '2024-01-01T00:00:00' },
  { id: 5, name: '刘裁剪', role: '裁剪工', phone: '13800138005', created_at: '2024-01-01T00:00:00' },
  { id: 6, name: '赵缝纫', role: '缝纫工', phone: '13800138006', created_at: '2024-01-01T00:00:00' },
  { id: 7, name: '孙熨烫', role: '熨烫工', phone: '13800138007', created_at: '2024-01-01T00:00:00' },
  { id: 8, name: '周安装', role: '安装师傅', phone: '13800138008', created_at: '2024-01-01T00:00:00' },
  { id: 9, name: '吴安装', role: '安装师傅', phone: '13800138009', created_at: '2024-01-01T00:00:00' },
  { id: 10, name: '郑采购', role: '采购', phone: '13800138010', created_at: '2024-01-01T00:00:00' }
];

let nextId = { orders: 13, tracking: 11, fabricOrders: 2, staff: 11 };

const getActionByStatus = (status) => {
  const actions = {
    pending: '创建订单',
    measuring: '量尺中',
    measured: '量尺完成',
    needs_revision: '待修改',
    confirmed: '确认订单',
    fabric_ordered: '面料下单',
    fabric_received: '面料到货',
    processing: '加工中',
    cutting: '开始裁剪',
    sewing: '开始缝纫',
    ironing: '开始熨烫',
    ready: '待安装',
    installing: '开始安装',
    completed: '完成',
    rejected: '退回',
    cancelled: '取消'
  };
  return actions[status] || status;
};

app.get('/api/orders', (req, res) => {
  const { status, handler, search, page = 1, limit = 10 } = req.query;
  let result = [...orders].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  
  if (status) {
    const statuses = status.split(',');
    result = result.filter(o => statuses.includes(o.status));
  }
  if (handler) result = result.filter(o => o.current_handler === handler);
  if (search) {
    const searchLower = search.toLowerCase();
    result = result.filter(o => 
      o.customer_name.toLowerCase().includes(searchLower) ||
      o.order_no.toLowerCase().includes(searchLower) ||
      o.address.toLowerCase().includes(searchLower)
    );
  }
  
  const offset = (page - 1) * limit;
  const paginated = result.slice(offset, offset + parseInt(limit));
  
  res.json({ orders: paginated, total: result.length });
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  const details = orderDetails.filter(d => d.order_id === parseInt(req.params.id));
  const orderTracking = tracking.filter(t => t.order_id === parseInt(req.params.id)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const fabricOrder = fabricOrders.find(f => f.order_id === parseInt(req.params.id));
  
  res.json({ ...order, details, tracking: orderTracking, fabric_order: fabricOrder });
});

app.post('/api/orders', (req, res) => {
  const { customer_name, phone, address, fabric_type, details, total_price } = req.body;
  const newOrder = {
    id: nextId.orders++,
    order_no: 'ORD' + Date.now(),
    customer_name,
    phone,
    address,
    fabric_type,
    total_price,
    status: 'pending',
    current_handler: '导购',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  orders.push(newOrder);
  
  res.json({ success: true, id: newOrder.id });
});

app.put('/api/orders/:id', (req, res) => {
  const { status, current_handler, note } = req.body;
  const orderIndex = orders.findIndex(o => o.id === parseInt(req.params.id));
  
  if (orderIndex !== -1) {
    const order = orders[orderIndex];
    orders[orderIndex] = {
      ...orders[orderIndex],
      status,
      current_handler,
      updated_at: new Date().toISOString()
    };
    
    tracking.push({
      id: nextId.tracking++,
      order_id: parseInt(req.params.id),
      status,
      handler: current_handler,
      action: getActionByStatus(status),
      note: note || '订单状态更新',
      created_at: new Date().toISOString()
    });
  }
  
  res.json({ success: true });
});

app.put('/api/orders/:id/reject', (req, res) => {
  const { reason, next_handler } = req.body;
  const orderIndex = orders.findIndex(o => o.id === parseInt(req.params.id));
  
  if (orderIndex !== -1) {
    const order = orders[orderIndex];
    orders[orderIndex] = {
      ...orders[orderIndex],
      status: 'rejected',
      current_handler: next_handler,
      updated_at: new Date().toISOString()
    };
    
    tracking.push({
      id: nextId.tracking++,
      order_id: parseInt(req.params.id),
      status: 'rejected',
      handler: order.current_handler,
      action: '退回',
      note: reason,
      created_at: new Date().toISOString()
    });
  }
  
  res.json({ success: true });
});

app.put('/api/orders/:id/review', (req, res) => {
  const { is_approved, note } = req.body;
  const orderIndex = orders.findIndex(o => o.id === parseInt(req.params.id));
  
  if (orderIndex !== -1) {
    const order = orders[orderIndex];
    const newStatus = is_approved ? 'confirmed' : 'needs_revision';
    
    orders[orderIndex] = {
      ...orders[orderIndex],
      status: newStatus,
      ...(is_approved && { current_handler: '采购' }),
      updated_at: new Date().toISOString()
    };
    
    tracking.push({
      id: nextId.tracking++,
      order_id: parseInt(req.params.id),
      status: newStatus,
      handler: order.current_handler,
      action: is_approved ? '复核通过' : '复核不通过',
      note,
      created_at: new Date().toISOString()
    });
  }
  
  res.json({ success: true });
});

app.get('/api/fabric-stock', (req, res) => {
  res.json(fabricStock);
});

app.put('/api/fabric-stock/:id', (req, res) => {
  const { quantity } = req.body;
  const index = fabricStock.findIndex(f => f.id === parseInt(req.params.id));
  
  if (index !== -1) {
    fabricStock[index] = {
      ...fabricStock[index],
      quantity,
      updated_at: new Date().toISOString()
    };
  }
  
  res.json({ success: true });
});

app.post('/api/fabric-order', (req, res) => {
  const { order_id, fabric_id, quantity, supplier, note } = req.body;
  const newFabricOrder = {
    id: nextId.fabricOrders++,
    order_id,
    fabric_id,
    quantity,
    supplier,
    status: 'ordered',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  fabricOrders.push(newFabricOrder);
  
  const orderIndex = orders.findIndex(o => o.id === order_id);
  if (orderIndex !== -1) {
    const order = orders[orderIndex];
    orders[orderIndex] = {
      ...orders[orderIndex],
      status: 'fabric_ordered',
      current_handler: '采购',
      updated_at: new Date().toISOString()
    };
    
    tracking.push({
      id: nextId.tracking++,
      order_id,
      status: 'fabric_ordered',
      handler: order.current_handler,
      action: '面料下单',
      note: note || `已向 ${supplier} 下单面料，数量: ${quantity}米`,
      created_at: new Date().toISOString()
    });
  }
  
  res.json({ success: true, id: newFabricOrder.id });
});

app.get('/api/fabric-orders', (req, res) => {
  const { order_id, status } = req.query;
  let result = [...fabricOrders];
  
  if (order_id) result = result.filter(f => f.order_id === parseInt(order_id));
  if (status) result = result.filter(f => f.status === status);
  
  const enriched = result.map(fo => {
    const fabric = fabricStock.find(f => f.id === fo.fabric_id);
    const order = orders.find(o => o.id === fo.order_id);
    return { ...fo, fabric_name: fabric?.fabric_name, customer_name: order?.customer_name };
  });
  
  res.json(enriched);
});

app.put('/api/fabric-orders/:id/receive', (req, res) => {
  const { note } = req.body;
  const fabricOrderIndex = fabricOrders.findIndex(f => f.id === parseInt(req.params.id));
  
  if (fabricOrderIndex !== -1) {
    const fabricOrder = fabricOrders[fabricOrderIndex];
    fabricOrders[fabricOrderIndex] = {
      ...fabricOrders[fabricOrderIndex],
      status: 'received',
      updated_at: new Date().toISOString()
    };
    
    const fabricIndex = fabricStock.findIndex(f => f.id === fabricOrder.fabric_id);
    if (fabricIndex !== -1) {
      fabricStock[fabricIndex].quantity += fabricOrder.quantity;
    }
    
    const orderIndex = orders.findIndex(o => o.id === fabricOrder.order_id);
    if (orderIndex !== -1) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        status: 'fabric_received',
        current_handler: '裁剪工',
        updated_at: new Date().toISOString()
      };
      
      tracking.push({
        id: nextId.tracking++,
        order_id: fabricOrder.order_id,
        status: 'fabric_received',
        handler: '采购',
        action: '面料到货',
        note: note || '面料已到货入库',
        created_at: new Date().toISOString()
      });
    }
  }
  
  res.json({ success: true });
});

app.put('/api/orders/:id/fabric-receive', (req, res) => {
  const { note } = req.body;
  const orderId = parseInt(req.params.id);
  
  const fabricOrder = fabricOrders.find(f => f.order_id === orderId && f.status === 'ordered');
  if (fabricOrder) {
    fabricOrders = fabricOrders.map(f => 
      f.id === fabricOrder.id ? { ...f, status: 'received', updated_at: new Date().toISOString() } : f
    );
    
    const fabricIndex = fabricStock.findIndex(f => f.id === fabricOrder.fabric_id);
    if (fabricIndex !== -1) {
      fabricStock[fabricIndex].quantity += fabricOrder.quantity;
    }
  }
  
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    const order = orders[orderIndex];
    orders[orderIndex] = {
      ...orders[orderIndex],
      status: 'fabric_received',
      current_handler: '裁剪工',
      updated_at: new Date().toISOString()
    };
    
    tracking.push({
      id: nextId.tracking++,
      order_id: orderId,
      status: 'fabric_received',
      handler: order.current_handler,
      action: '面料到货',
      note: note || '面料已到货',
      created_at: new Date().toISOString()
    });
  }
  
  res.json({ success: true });
});

app.get('/api/staff', (req, res) => {
  res.json(staff);
});

app.post('/api/staff', (req, res) => {
  const { name, role, phone } = req.body;
  const newStaff = {
    id: nextId.staff++,
    name,
    role,
    phone,
    created_at: new Date().toISOString()
  };
  staff.push(newStaff);
  
  res.json({ success: true, id: newStaff.id });
});

app.get('/api/dashboard', (req, res) => {
  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    measuring: orders.filter(o => o.status === 'measuring').length,
    measured: orders.filter(o => o.status === 'measured').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    fabric_ordered: orders.filter(o => o.status === 'fabric_ordered').length,
    fabric_received: orders.filter(o => o.status === 'fabric_received').length,
    processing: orders.filter(o => ['cutting', 'sewing', 'ironing'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
    needs_revision: orders.filter(o => o.status === 'needs_revision').length
  };
  
  const recentChanges = [...tracking].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
  
  const lowStock = fabricStock.filter(f => f.quantity < 10);
  const pendingFabricOrders = fabricOrders.filter(f => f.status === 'ordered').length;
  
  res.json({ stats, recentChanges, lowStock: lowStock.length, pendingFabricOrders });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});