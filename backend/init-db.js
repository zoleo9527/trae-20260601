const knex = require('knex');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './backend/database.sqlite'
  },
  useNullAsDefault: true
});

async function init() {
  await db.schema.dropTableIfExists('orders');
  await db.schema.dropTableIfExists('order_details');
  await db.schema.dropTableIfExists('tracking');
  await db.schema.dropTableIfExists('fabric_stock');
  await db.schema.dropTableIfExists('fabric_orders');
  await db.schema.dropTableIfExists('process_tracking');
  await db.schema.dropTableIfExists('staff');

  await db.schema.createTable('orders', table => {
    table.increments('id').primary();
    table.string('order_no').unique();
    table.string('customer_name');
    table.string('phone');
    table.string('address');
    table.string('fabric_type');
    table.decimal('total_price');
    table.string('status').defaultTo('pending');
    table.string('current_handler');
    table.datetime('created_at');
    table.datetime('updated_at');
  });

  await db.schema.createTable('order_details', table => {
    table.increments('id').primary();
    table.integer('order_id').references('id').inTable('orders');
    table.string('item_name');
    table.decimal('width');
    table.decimal('height');
    table.integer('quantity');
    table.decimal('price');
    table.datetime('created_at');
  });

  await db.schema.createTable('tracking', table => {
    table.increments('id').primary();
    table.integer('order_id').references('id').inTable('orders');
    table.string('status');
    table.string('handler');
    table.string('action');
    table.text('note');
    table.datetime('created_at');
  });

  await db.schema.createTable('fabric_stock', table => {
    table.increments('id').primary();
    table.string('fabric_name').unique();
    table.string('color');
    table.string('texture');
    table.integer('quantity').defaultTo(0);
    table.decimal('price_per_meter');
    table.datetime('updated_at');
  });

  await db.schema.createTable('fabric_orders', table => {
    table.increments('id').primary();
    table.integer('order_id').references('id').inTable('orders');
    table.integer('fabric_id').references('id').inTable('fabric_stock');
    table.integer('quantity');
    table.string('supplier');
    table.string('status').defaultTo('ordered');
    table.datetime('created_at');
    table.datetime('updated_at');
  });

  await db.schema.createTable('process_tracking', table => {
    table.increments('id').primary();
    table.integer('order_id').references('id').inTable('orders');
    table.string('status');
    table.string('process_type');
    table.text('note');
    table.datetime('created_at');
  });

  await db.schema.createTable('staff', table => {
    table.increments('id').primary();
    table.string('name');
    table.string('role');
    table.string('phone');
    table.datetime('created_at');
  });

  await db('fabric_stock').insert([
    { fabric_name: '雪尼尔遮光布', color: '深灰', texture: '绒面', quantity: 50, price_per_meter: 85, updated_at: new Date() },
    { fabric_name: '亚麻混纺', color: '米白', texture: '麻面', quantity: 30, price_per_meter: 65, updated_at: new Date() },
    { fabric_name: '高精密提花', color: '深蓝', texture: '提花', quantity: 15, price_per_meter: 120, updated_at: new Date() },
    { fabric_name: '棉麻窗帘', color: '浅咖', texture: '棉麻', quantity: 8, price_per_meter: 55, updated_at: new Date() },
    { fabric_name: '真丝质感', color: '香槟', texture: '光滑', quantity: 20, price_per_meter: 180, updated_at: new Date() },
    { fabric_name: '涤纶遮光', color: '黑色', texture: '光滑', quantity: 100, price_per_meter: 45, updated_at: new Date() },
    { fabric_name: '北欧风棉麻', color: '浅灰', texture: '棉麻', quantity: 5, price_per_meter: 70, updated_at: new Date() },
    { fabric_name: '印花涤纶', color: '花色', texture: '印花', quantity: 40, price_per_meter: 50, updated_at: new Date() }
  ]);

  await db('staff').insert([
    { name: '王导购', role: '导购', phone: '13800138001', created_at: new Date() },
    { name: '李导购', role: '导购', phone: '13800138002', created_at: new Date() },
    { name: '张量尺', role: '量尺师', phone: '13800138003', created_at: new Date() },
    { name: '陈量尺', role: '量尺师', phone: '13800138004', created_at: new Date() },
    { name: '刘裁剪', role: '裁剪工', phone: '13800138005', created_at: new Date() },
    { name: '赵缝纫', role: '缝纫工', phone: '13800138006', created_at: new Date() },
    { name: '孙熨烫', role: '熨烫工', phone: '13800138007', created_at: new Date() },
    { name: '周安装', role: '安装师傅', phone: '13800138008', created_at: new Date() },
    { name: '吴安装', role: '安装师傅', phone: '13800138009', created_at: new Date() },
    { name: '郑采购', role: '采购', phone: '13800138010', created_at: new Date() }
  ]);

  const now = new Date();
  const orders = [
    { order_no: 'ORD' + (now.getTime() - 86400000 * 5), customer_name: '张三', phone: '13900139001', address: '阳光小区3栋1201', fabric_type: '雪尼尔遮光布', total_price: 2800, status: 'completed', current_handler: '周安装', created_at: new Date(now.getTime() - 86400000 * 5), updated_at: new Date(now.getTime() - 86400000 * 2) },
    { order_no: 'ORD' + (now.getTime() - 86400000 * 4), customer_name: '李四', phone: '13900139002', address: '星河湾5栋802', fabric_type: '亚麻混纺', total_price: 1680, status: 'installing', current_handler: '吴安装', created_at: new Date(now.getTime() - 86400000 * 4), updated_at: new Date(now.getTime() - 3600000) },
    { order_no: 'ORD' + (now.getTime() - 86400000 * 3), customer_name: '王五', phone: '13900139003', address: '绿城花园8栋301', fabric_type: '高精密提花', total_price: 3200, status: 'ironing', current_handler: '孙熨烫', created_at: new Date(now.getTime() - 86400000 * 3), updated_at: new Date(now.getTime() - 7200000) },
    { order_no: 'ORD' + (now.getTime() - 86400000 * 2), customer_name: '赵六', phone: '13900139004', address: '山水人家12栋1503', fabric_type: '棉麻窗帘', total_price: 980, status: 'sewing', current_handler: '赵缝纫', created_at: new Date(now.getTime() - 86400000 * 2), updated_at: new Date(now.getTime() - 14400000) },
    { order_no: 'ORD' + (now.getTime() - 86400000), customer_name: '钱七', phone: '13900139005', address: '锦绣华庭6栋601', fabric_type: '真丝质感', total_price: 4500, status: 'cutting', current_handler: '刘裁剪', created_at: new Date(now.getTime() - 86400000), updated_at: new Date(now.getTime() - 21600000) },
    { order_no: 'ORD' + (now.getTime() - 3600000 * 12), customer_name: '孙八', phone: '13900139006', address: '幸福里9栋1802', fabric_type: '涤纶遮光', total_price: 1200, status: 'fabric_received', current_handler: '采购', created_at: new Date(now.getTime() - 3600000 * 12), updated_at: new Date(now.getTime() - 28800000) },
    { order_no: 'ORD' + (now.getTime() - 3600000 * 8), customer_name: '周九', phone: '13900139007', address: '东方明珠15栋2201', fabric_type: '北欧风棉麻', total_price: 2100, status: 'fabric_ordered', current_handler: '郑采购', created_at: new Date(now.getTime() - 3600000 * 8), updated_at: new Date(now.getTime() - 3600000 * 6) },
    { order_no: 'ORD' + (now.getTime() - 3600000 * 6), customer_name: '吴十', phone: '13900139008', address: '名门世家3栋1002', fabric_type: '印花涤纶', total_price: 1500, status: 'confirmed', current_handler: '导购', created_at: new Date(now.getTime() - 3600000 * 6), updated_at: new Date(now.getTime() - 3600000 * 4) },
    { order_no: 'ORD' + (now.getTime() - 3600000 * 4), customer_name: '郑十一', phone: '13900139009', address: '皇家花园7栋501', fabric_type: '雪尼尔遮光布', total_price: 3800, status: 'measuring', current_handler: '陈量尺', created_at: new Date(now.getTime() - 3600000 * 4), updated_at: new Date(now.getTime() - 3600000 * 2) },
    { order_no: 'ORD' + (now.getTime() - 3600000 * 2), customer_name: '王十二', phone: '13900139010', address: '金色港湾11栋702', fabric_type: '亚麻混纺', total_price: 1890, status: 'pending', current_handler: '李导购', created_at: new Date(now.getTime() - 3600000 * 2), updated_at: new Date(now.getTime() - 3600000 * 2) },
    { order_no: 'ORD' + (now.getTime() - 3600000), customer_name: '冯十三', phone: '13900139011', address: '滨江新城8栋1101', fabric_type: '高精密提花', total_price: 5200, status: 'needs_revision', current_handler: '张量尺', created_at: new Date(now.getTime() - 3600000), updated_at: new Date(now.getTime() - 1800000) },
    { order_no: 'ORD' + now.getTime(), customer_name: '陈十四', phone: '13900139012', address: '翠湖天地4栋903', fabric_type: '棉麻窗帘', total_price: 1400, status: 'rejected', current_handler: '王导购', created_at: now, updated_at: now }
  ];

  for (const order of orders) {
    const [id] = await db('orders').insert(order);
    
    if (order.status === 'completed') {
      await db('tracking').insert([
        { order_id: id, status: 'pending', handler: '王导购', action: '创建订单', note: '订单已创建', created_at: new Date(order.created_at) },
        { order_id: id, status: 'measuring', handler: '张量尺', action: '量尺中', note: '量尺进行中', created_at: new Date(order.created_at.getTime() + 3600000) },
        { order_id: id, status: 'measured', handler: '张量尺', action: '量尺完成', note: '量尺完成，等待复核', created_at: new Date(order.created_at.getTime() + 7200000) },
        { order_id: id, status: 'confirmed', handler: '王导购', action: '复核通过', note: '尺寸复核通过', created_at: new Date(order.created_at.getTime() + 10800000) },
        { order_id: id, status: 'fabric_ordered', handler: '郑采购', action: '面料下单', note: '已下单雪尼尔遮光布', created_at: new Date(order.created_at.getTime() + 14400000) },
        { order_id: id, status: 'fabric_received', handler: '郑采购', action: '面料到货', note: '面料已入库', created_at: new Date(order.created_at.getTime() + 28800000) },
        { order_id: id, status: 'cutting', handler: '刘裁剪', action: '开始裁剪', note: '裁剪进行中', created_at: new Date(order.created_at.getTime() + 32400000) },
        { order_id: id, status: 'sewing', handler: '赵缝纫', action: '开始缝纫', note: '缝纫进行中', created_at: new Date(order.created_at.getTime() + 43200000) },
        { order_id: id, status: 'ironing', handler: '孙熨烫', action: '开始熨烫', note: '熨烫进行中', created_at: new Date(order.created_at.getTime() + 54000000) },
        { order_id: id, status: 'installing', handler: '周安装', action: '开始安装', note: '安装进行中', created_at: new Date(order.created_at.getTime() + 64800000) },
        { order_id: id, status: 'completed', handler: '周安装', action: '安装完成', note: '订单完成', created_at: new Date(order.updated_at) }
      ]);
    } else if (order.status === 'installing') {
      await db('tracking').insert([
        { order_id: id, status: 'pending', handler: '李导购', action: '创建订单', note: '订单已创建', created_at: new Date(order.created_at) },
        { order_id: id, status: 'measuring', handler: '陈量尺', action: '量尺中', note: '量尺进行中', created_at: new Date(order.created_at.getTime() + 3600000) },
        { order_id: id, status: 'confirmed', handler: '李导购', action: '复核通过', note: '尺寸复核通过', created_at: new Date(order.created_at.getTime() + 7200000) },
        { order_id: id, status: 'fabric_ordered', handler: '郑采购', action: '面料下单', note: '已下单亚麻混纺', created_at: new Date(order.created_at.getTime() + 10800000) },
        { order_id: id, status: 'fabric_received', handler: '郑采购', action: '面料到货', note: '面料已入库', created_at: new Date(order.created_at.getTime() + 21600000) },
        { order_id: id, status: 'cutting', handler: '刘裁剪', action: '裁剪完成', note: '裁剪完成', created_at: new Date(order.created_at.getTime() + 25200000) },
        { order_id: id, status: 'sewing', handler: '赵缝纫', action: '缝纫完成', note: '缝纫完成', created_at: new Date(order.created_at.getTime() + 36000000) },
        { order_id: id, status: 'ironing', handler: '孙熨烫', action: '熨烫完成', note: '熨烫完成', created_at: new Date(order.created_at.getTime() + 43200000) },
        { order_id: id, status: 'installing', handler: '吴安装', action: '开始安装', note: '正在安装中', created_at: new Date(order.updated_at) }
      ]);
    } else if (order.status === 'rejected') {
      await db('tracking').insert([
        { order_id: id, status: 'pending', handler: '王导购', action: '创建订单', note: '订单已创建', created_at: new Date(order.created_at) },
        { order_id: id, status: 'measuring', handler: '张量尺', action: '量尺中', note: '量尺进行中', created_at: new Date(order.created_at.getTime() + 1800000) },
        { order_id: id, status: 'measured', handler: '张量尺', action: '量尺完成', note: '量尺完成', created_at: new Date(order.created_at.getTime() + 3600000) },
        { order_id: id, status: 'rejected', handler: '王导购', action: '退回', note: '客户要求更换面料款式，需要重新确认', created_at: new Date(order.updated_at) }
      ]);
    } else if (order.status === 'needs_revision') {
      await db('tracking').insert([
        { order_id: id, status: 'pending', handler: '李导购', action: '创建订单', note: '订单已创建', created_at: new Date(order.created_at) },
        { order_id: id, status: 'measuring', handler: '陈量尺', action: '量尺中', note: '量尺进行中', created_at: new Date(order.created_at.getTime() + 1800000) },
        { order_id: id, status: 'measured', handler: '陈量尺', action: '量尺完成', note: '量尺完成', created_at: new Date(order.created_at.getTime() + 3600000) },
        { order_id: id, status: 'needs_revision', handler: '李导购', action: '复核不通过', note: '阳台窗户尺寸有疑问，需要重新量尺确认', created_at: new Date(order.updated_at) }
      ]);
    } else {
      await db('tracking').insert([
        { order_id: id, status: order.status, handler: order.current_handler, action: getActionByStatus(order.status), note: '订单状态更新', created_at: new Date(order.created_at) }
      ]);
    }
  }

  console.log('Database initialized successfully');
  process.exit(0);
}

function getActionByStatus(status) {
  const actions = {
    pending: '创建订单',
    measuring: '量尺中',
    measured: '量尺完成',
    confirmed: '确认订单',
    fabric_ordered: '面料下单',
    fabric_received: '面料到货',
    cutting: '开始裁剪',
    sewing: '开始缝纫',
    ironing: '开始熨烫',
    installing: '开始安装',
    completed: '完成',
    rejected: '退回',
    needs_revision: '待修改'
  };
  return actions[status] || status;
}

init().catch(console.error);