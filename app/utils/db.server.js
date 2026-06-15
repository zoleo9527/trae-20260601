import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/building_materials',
});

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('query error', { text, error });
    throw error;
  }
}

export async function getClient() {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  client.release = () => {
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  return client;
}

export async function initDatabase() {
  const createTables = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL,
      name VARCHAR(100) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales_orders (
      id VARCHAR(50) PRIMARY KEY,
      customer_name VARCHAR(200) NOT NULL,
      product_name VARCHAR(200) NOT NULL,
      quantity INTEGER NOT NULL,
      unit VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS delivery_records (
      id VARCHAR(50) PRIMARY KEY,
      sales_order_id VARCHAR(50) REFERENCES sales_orders(id),
      driver_id INTEGER REFERENCES users(id),
      warehouse_id INTEGER REFERENCES users(id),
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      delivery_address TEXT NOT NULL,
      planned_time TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      dispatched_at TIMESTAMP,
      signed_at TIMESTAMP,
      signer_name VARCHAR(100),
      signer_phone VARCHAR(20)
    );

    CREATE TABLE IF NOT EXISTS damage_records (
      id VARCHAR(50) PRIMARY KEY,
      delivery_record_id VARCHAR(50) REFERENCES delivery_records(id),
      sales_order_id VARCHAR(50) REFERENCES sales_orders(id),
      reporter_id INTEGER REFERENCES users(id),
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      damage_type VARCHAR(50) NOT NULL,
      damage_description TEXT NOT NULL,
      damage_quantity INTEGER NOT NULL,
      photos TEXT[],
      reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS damage_history (
      id SERIAL PRIMARY KEY,
      damage_record_id VARCHAR(50) REFERENCES damage_records(id),
      action VARCHAR(50) NOT NULL,
      user_name VARCHAR(100) NOT NULL,
      time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      remark TEXT
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action VARCHAR(50) NOT NULL,
      target_type VARCHAR(50) NOT NULL,
      target_id VARCHAR(50) NOT NULL,
      time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      remark TEXT
    );
  `;

  await query(createTables);
  console.log('Tables created successfully');
}

export async function initSampleData() {
  const usersExist = await query('SELECT COUNT(*) FROM users');
  if (usersExist.rows[0].count > 0) {
    console.log('Sample data already exists');
    return;
  }

  const insertUsers = `
    INSERT INTO users (username, password, role, name) VALUES
    ('warehouse', '123456', 'warehouse', '仓库主管'),
    ('driver', '123456', 'driver', '司机张师傅'),
    ('customer', '123456', 'customer', '客服小李');
  `;

  const insertSalesOrders = `
    INSERT INTO sales_orders (id, customer_name, product_name, quantity, unit, status) VALUES
    ('SO20240115001', '万科地产', '水泥', 50, '吨', 'pending'),
    ('SO20240115002', '恒大建设', '钢筋', 30, '吨', 'pending'),
    ('SO20240115003', '碧桂园', '砂石', 100, '吨', 'pending'),
    ('SO20240114001', '融创集团', '砖块', 5000, '块', 'delivered'),
    ('SO20240114002', '保利地产', '涂料', 200, '桶', 'damaged'),
    ('SO20240113001', '绿地集团', '钢筋', 25, '吨', 'delivered');
  `;

  const insertDeliveryRecords = `
    INSERT INTO delivery_records (id, sales_order_id, driver_id, warehouse_id, status, delivery_address, planned_time, created_at, dispatched_at, signed_at, signer_name, signer_phone) VALUES
    ('DR20240115001', 'SO20240115001', 2, 1, 'pending', '北京市朝阳区望京SOHO', '2024-01-15 09:00:00', '2024-01-15 08:00:00', NULL, NULL, NULL, NULL),
    ('DR20240115002', 'SO20240115002', 2, 1, 'pending', '上海市浦东新区陆家嘴', '2024-01-15 14:00:00', '2024-01-15 08:30:00', NULL, NULL, NULL, NULL),
    ('DR20240115003', 'SO20240115003', 2, 1, 'in_transit', '广州市天河区珠江新城', '2024-01-15 16:00:00', '2024-01-15 09:00:00', '2024-01-15 10:00:00', NULL, NULL, NULL),
    ('DR20240114001', 'SO20240114001', 2, 1, 'signed', '深圳市南山区科技园', '2024-01-14 10:00:00', '2024-01-14 08:00:00', '2024-01-14 08:30:00', '2024-01-14 11:30:00', '王经理', '13800138001'),
    ('DR20240114002', 'SO20240114002', 2, 1, 'damaged', '杭州市西湖区文三路', '2024-01-14 14:00:00', '2024-01-14 10:00:00', '2024-01-14 11:00:00', '2024-01-14 15:30:00', '李工', '13900139002'),
    ('DR20240113001', 'SO20240113001', 2, 1, 'damaged', '南京市鼓楼区新街口', '2024-01-13 10:00:00', '2024-01-13 08:00:00', '2024-01-13 08:30:00', '2024-01-13 11:00:00', '张总', '13700137001');
  `;

  const insertDamageRecords = `
    INSERT INTO damage_records (id, delivery_record_id, sales_order_id, reporter_id, status, damage_type, damage_description, damage_quantity, photos, reported_at, created_at, resolved_at) VALUES
    ('DM20240114001', 'DR20240114002', 'SO20240114002', 2, 'pending', 'package_damage', '第3桶涂料外包装破损，内部涂料泄漏约10%', 1, ARRAY['photo1.jpg', 'photo2.jpg'], '2024-01-14 15:35:00', '2024-01-14 15:35:00', NULL),
    ('DM20240113001', 'DR20240113001', 'SO20240113001', 2, 'processing', 'quantity_shortage', '钢筋到货数量短缺2吨', 2, ARRAY['photo3.jpg'], '2024-01-13 11:00:00', '2024-01-13 11:00:00', NULL),
    ('DM20240112001', 'DR20240112001', 'SO20240112001', 2, 'resolved', 'product_damage', '砖块运输途中破损50块', 50, ARRAY['photo4.jpg', 'photo5.jpg', 'photo6.jpg'], '2024-01-12 09:00:00', '2024-01-12 09:00:00', '2024-01-12 17:00:00');
  `;

  const insertDamageHistory = `
    INSERT INTO damage_history (damage_record_id, action, user_name, time, remark) VALUES
    ('DM20240114001', 'reported', '司机张师傅', '2024-01-14 15:35:00', '现场发现涂料泄漏，已拍照留存'),
    ('DM20240114001', 'reviewed', '仓库主管', '2024-01-14 16:00:00', '已确认照片，等待客服处理'),
    ('DM20240113001', 'reported', '司机张师傅', '2024-01-13 11:00:00', '收货方称重发现短缺'),
    ('DM20240113001', 'reviewed', '仓库主管', '2024-01-13 11:30:00', '正在核对出库记录'),
    ('DM20240113001', 'assigned', '仓库主管', '2024-01-13 11:45:00', '已转客服跟进处理'),
    ('DM20240112001', 'reported', '司机张师傅', '2024-01-12 09:00:00', '送货时发现砖块破损'),
    ('DM20240112001', 'reviewed', '仓库主管', '2024-01-12 09:30:00', '确认破损情况属实'),
    ('DM20240112001', 'assigned', '仓库主管', '2024-01-12 10:00:00', '转客服处理补发'),
    ('DM20240112001', 'contacted', '客服小李', '2024-01-12 10:30:00', '已联系客户，客户同意补发'),
    ('DM20240112001', 'resolved', '客服小李', '2024-01-12 17:00:00', '补发已安排，客户确认满意');
  `;

  const insertOperationLogs = `
    INSERT INTO operation_logs (user_id, action, target_type, target_id, time, remark) VALUES
    (2, 'dispatch', 'delivery', 'DR20240115003', '2024-01-15 10:00:00', '出库配送'),
    (2, 'sign', 'delivery', 'DR20240114001', '2024-01-14 11:30:00', '客户签收'),
    (2, 'report_damage', 'damage', 'DM20240114001', '2024-01-14 15:35:00', '上报破损'),
    (1, 'review_damage', 'damage', 'DM20240114001', '2024-01-14 16:00:00', '审核破损记录'),
    (3, 'contact_customer', 'damage', 'DM20240113001', '2024-01-13 14:00:00', '联系客户沟通解决方案');
  `;

  const insertAdditionalSO = `
    INSERT INTO sales_orders (id, customer_name, product_name, quantity, unit, status) VALUES
    ('SO20240112001', '中海地产', '砖块', 10000, '块', 'delivered');
  `;

  const insertAdditionalDR = `
    INSERT INTO delivery_records (id, sales_order_id, driver_id, warehouse_id, status, delivery_address, planned_time, created_at, dispatched_at, signed_at, signer_name, signer_phone) VALUES
    ('DR20240112001', 'SO20240112001', 2, 1, 'signed', '成都市锦江区春熙路', '2024-01-12 09:00:00', '2024-01-12 07:00:00', '2024-01-12 07:30:00', '2024-01-12 09:00:00', '刘经理', '13600136001');
  `;

  await query(insertUsers);
  await query(insertSalesOrders);
  await query(insertAdditionalSO);
  await query(insertDeliveryRecords);
  await query(insertAdditionalDR);
  await query(insertDamageRecords);
  await query(insertDamageHistory);
  await query(insertOperationLogs);
  
  console.log('Sample data inserted successfully');
}
