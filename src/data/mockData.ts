import { Order, Part, User, InstalledPart } from '../types';

export const mockParts: Part[] = [
  {
    id: 'p001',
    name: 'Intel Core i5-14400F',
    category: 'cpu',
    spec: '10核16线程，基频2.5GHz，睿频4.7GHz',
    unit_price: 1299,
    stock: 50,
    batch_no: 'CPU-202401',
    expire_date: '2027-01-15'
  },
  {
    id: 'p002',
    name: 'Intel Core i7-14700KF',
    category: 'cpu',
    spec: '20核28线程，基频3.4GHz，睿频5.6GHz',
    unit_price: 2499,
    stock: 30,
    batch_no: 'CPU-202402',
    expire_date: '2027-02-20'
  },
  {
    id: 'p003',
    name: '金士顿FURY Beast DDR5 16GB',
    category: 'memory',
    spec: 'DDR5-5600，CL36，单条16GB',
    unit_price: 399,
    stock: 100,
    batch_no: 'MEM-202403',
    expire_date: '2028-03-10'
  },
  {
    id: 'p004',
    name: '金士顿FURY Beast DDR5 32GB',
    category: 'memory',
    spec: 'DDR5-5600，CL36，单条32GB',
    unit_price: 699,
    stock: 60,
    batch_no: 'MEM-202403',
    expire_date: '2028-03-10'
  },
  {
    id: 'p005',
    name: 'NVIDIA RTX 4060',
    category: 'gpu',
    spec: '8GB GDDR6，3072 CUDA核心',
    unit_price: 2499,
    stock: 25,
    batch_no: 'GPU-202401',
    expire_date: '2027-04-15'
  },
  {
    id: 'p006',
    name: 'NVIDIA RTX 4070 SUPER',
    category: 'gpu',
    spec: '12GB GDDR6X，7168 CUDA核心',
    unit_price: 4499,
    stock: 15,
    batch_no: 'GPU-202402',
    expire_date: '2027-05-20'
  },
  {
    id: 'p007',
    name: '华硕PRIME B760M-K',
    category: 'motherboard',
    spec: 'B760芯片组，LGA1700，DDR5',
    unit_price: 799,
    stock: 40,
    batch_no: 'MB-202401',
    expire_date: '2027-06-10'
  },
  {
    id: 'p008',
    name: '华硕ROG STRIX B760-A',
    category: 'motherboard',
    spec: 'B760芯片组，LGA1700，DDR5，WiFi',
    unit_price: 1299,
    stock: 20,
    batch_no: 'MB-202402',
    expire_date: '2027-06-10'
  },
  {
    id: 'p009',
    name: '航嘉WD650K',
    category: 'power',
    spec: '650W，80Plus金牌，全模组',
    unit_price: 499,
    stock: 80,
    batch_no: 'PWR-202401',
    expire_date: '2028-01-01'
  },
  {
    id: 'p010',
    name: '海韵FOCUS GX-850',
    category: 'power',
    spec: '850W，80Plus金牌，全模组',
    unit_price: 899,
    stock: 35,
    batch_no: 'PWR-202402',
    expire_date: '2028-02-15'
  },
  {
    id: 'p011',
    name: '三星980 PRO 1TB',
    category: 'harddisk',
    spec: 'NVMe M.2，7000MB/s读取，5000MB/s写入',
    unit_price: 599,
    stock: 60,
    batch_no: 'SSD-202401',
    expire_date: '2029-01-10'
  },
  {
    id: 'p012',
    name: '三星990 PRO 2TB',
    category: 'harddisk',
    spec: 'NVMe M.2，7450MB/s读取，6900MB/s写入',
    unit_price: 1199,
    stock: 30,
    batch_no: 'SSD-202402',
    expire_date: '2029-02-15'
  },
  {
    id: 'p013',
    name: 'AMD Ryzen 7 7800X3D',
    category: 'cpu',
    spec: '8核16线程，基频4.2GHz，加速5.0GHz，3D V-Cache',
    unit_price: 2999,
    stock: 20,
    batch_no: 'CPU-202403',
    expire_date: '2027-03-25'
  },
  {
    id: 'p014',
    name: 'AMD RX 7800 XT',
    category: 'gpu',
    spec: '16GB GDDR6，3840流处理器',
    unit_price: 3299,
    stock: 18,
    batch_no: 'GPU-202403',
    expire_date: '2027-07-30'
  }
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-20240115-001',
    customer_name: '张三',
    phone: '13800138001',
    order_date: '2024-01-15',
    status: 'delivered',
    install_status: 'completed',
    total_price: 8594,
    paid_amount: 8594,
    created_by: '李销售',
    created_at: '2024-01-15 09:30:00',
    config_items: [
      { id: 'ci001', order_id: 'ORD-20240115-001', part_id: 'p001', part_name: 'Intel Core i5-14400F', spec: '10核16线程', quantity: 1, unit_price: 1299, total_price: 1299 },
      { id: 'ci002', order_id: 'ORD-20240115-001', part_id: 'p003', part_name: '金士顿FURY Beast DDR5 16GB', spec: 'DDR5-5600', quantity: 2, unit_price: 399, total_price: 798 },
      { id: 'ci003', order_id: 'ORD-20240115-001', part_id: 'p005', part_name: 'NVIDIA RTX 4060', spec: '8GB GDDR6', quantity: 1, unit_price: 2499, total_price: 2499 },
      { id: 'ci004', order_id: 'ORD-20240115-001', part_id: 'p007', part_name: '华硕PRIME B760M-K', spec: 'B760芯片组', quantity: 1, unit_price: 799, total_price: 799 },
      { id: 'ci005', order_id: 'ORD-20240115-001', part_id: 'p009', part_name: '航嘉WD650K', spec: '650W', quantity: 1, unit_price: 499, total_price: 499 },
      { id: 'ci006', order_id: 'ORD-20240115-001', part_id: 'p011', part_name: '三星980 PRO 1TB', spec: 'NVMe M.2', quantity: 1, unit_price: 599, total_price: 599 }
    ],
    installed_parts: [
      { id: 'ip001', order_id: 'ORD-20240115-001', part_id: 'p001', part_name: 'Intel Core i5-14400F', spec: '10核16线程，基频2.5GHz', quantity: 1, unit_price: 1299, total_price: 1299, batch_no: 'CPU-202401', expire_date: '2027-01-15', installed_by: '赵装机', installed_at: '2024-01-16 10:00:00' },
      { id: 'ip002', order_id: 'ORD-20240115-001', part_id: 'p004', part_name: '金士顿FURY Beast DDR5 32GB', spec: 'DDR5-5600，CL36', quantity: 2, unit_price: 699, total_price: 1398, batch_no: 'MEM-202403', expire_date: '2028-03-10', installed_by: '赵装机', installed_at: '2024-01-16 10:30:00', remarks: '按客户要求升级' },
      { id: 'ip003', order_id: 'ORD-20240115-001', part_id: 'p005', part_name: 'NVIDIA RTX 4060', spec: '8GB GDDR6', quantity: 1, unit_price: 2499, total_price: 2499, batch_no: 'GPU-202401', expire_date: '2027-04-15', installed_by: '赵装机', installed_at: '2024-01-16 11:00:00' },
      { id: 'ip004', order_id: 'ORD-20240115-001', part_id: 'p007', part_name: '华硕PRIME B760M-K', spec: 'B760芯片组，LGA1700', quantity: 1, unit_price: 799, total_price: 799, batch_no: 'MB-202401', expire_date: '2027-06-10', installed_by: '赵装机', installed_at: '2024-01-16 09:30:00' },
      { id: 'ip005', order_id: 'ORD-20240115-001', part_id: 'p009', part_name: '航嘉WD650K', spec: '650W，80Plus金牌', quantity: 1, unit_price: 499, total_price: 499, batch_no: 'PWR-202401', expire_date: '2028-01-01', installed_by: '赵装机', installed_at: '2024-01-16 11:30:00' },
      { id: 'ip006', order_id: 'ORD-20240115-001', part_id: 'p011', part_name: '三星980 PRO 1TB', spec: 'NVMe M.2，7000MB/s', quantity: 1, unit_price: 599, total_price: 599, batch_no: 'SSD-202401', expire_date: '2029-01-10', installed_by: '赵装机', installed_at: '2024-01-16 12:00:00' }
    ],
    modify_records: [
      {
        id: 'mr001',
        order_id: 'ORD-20240115-001',
        part_id: 'p004',
        part_name: '金士顿FURY Beast DDR5 32GB',
        spec: 'DDR5-5600',
        change_type: 'upgrade',
        old_price: 798,
        new_price: 1398,
        price_diff: 600,
        reason: '客户临时升级内存，从16GB x2升级到32GB x2',
        operator: '李销售',
        created_at: '2024-01-15 10:15:00'
      }
    ],
    delivery_records: [
      { id: 'dr001', order_id: 'ORD-20240115-001', status: 'delivered', delivery_date: '2024-01-18', signer: '张三', remarks: '验收合格', created_at: '2024-01-18 15:30:00' }
    ]
  },
  {
    id: 'ORD-20240118-002',
    customer_name: '李四',
    phone: '13900139002',
    order_date: '2024-01-18',
    status: 'installing',
    install_status: 'in_progress',
    total_price: 12895,
    paid_amount: 10000,
    created_by: '王销售',
    created_at: '2024-01-18 14:00:00',
    config_items: [
      { id: 'ci007', order_id: 'ORD-20240118-002', part_id: 'p002', part_name: 'Intel Core i7-14700KF', spec: '20核28线程', quantity: 1, unit_price: 2499, total_price: 2499 },
      { id: 'ci008', order_id: 'ORD-20240118-002', part_id: 'p004', part_name: '金士顿FURY Beast DDR5 32GB', spec: 'DDR5-5600', quantity: 2, unit_price: 699, total_price: 1398 },
      { id: 'ci009', order_id: 'ORD-20240118-002', part_id: 'p014', part_name: 'AMD RX 7800 XT', spec: '16GB GDDR6', quantity: 1, unit_price: 3299, total_price: 3299 },
      { id: 'ci010', order_id: 'ORD-20240118-002', part_id: 'p008', part_name: '华硕ROG STRIX B760-A', spec: 'B760芯片组 WiFi', quantity: 1, unit_price: 1299, total_price: 1299 },
      { id: 'ci011', order_id: 'ORD-20240118-002', part_id: 'p010', part_name: '海韵FOCUS GX-850', spec: '850W', quantity: 1, unit_price: 899, total_price: 899 },
      { id: 'ci012', order_id: 'ORD-20240118-002', part_id: 'p012', part_name: '三星990 PRO 2TB', spec: 'NVMe M.2', quantity: 1, unit_price: 1199, total_price: 1199 }
    ],
    installed_parts: [
      { id: 'ip007', order_id: 'ORD-20240118-002', part_id: 'p002', part_name: 'Intel Core i7-14700KF', spec: '20核28线程，基频3.4GHz', quantity: 1, unit_price: 2499, total_price: 2499, batch_no: 'CPU-202402', expire_date: '2027-02-20', installed_by: '赵装机', installed_at: '2024-01-19 09:00:00' },
      { id: 'ip008', order_id: 'ORD-20240118-002', part_id: 'p008', part_name: '华硕ROG STRIX B760-A', spec: 'B760芯片组，WiFi', quantity: 1, unit_price: 1299, total_price: 1299, batch_no: 'MB-202402', expire_date: '2027-06-10', installed_by: '赵装机', installed_at: '2024-01-19 09:30:00' },
      { id: 'ip009', order_id: 'ORD-20240118-002', part_id: 'p014', part_name: 'AMD RX 7800 XT', spec: '16GB GDDR6', quantity: 1, unit_price: 3299, total_price: 3299, batch_no: 'GPU-202403', expire_date: '2027-07-30', installed_by: '赵装机', installed_at: '2024-01-19 14:00:00', remarks: 'RTX 4070 SUPER缺货，协商更换' }
    ],
    modify_records: [
      {
        id: 'mr002',
        order_id: 'ORD-20240118-002',
        part_id: 'p014',
        part_name: 'AMD RX 7800 XT',
        spec: '16GB GDDR6',
        change_type: 'replace',
        old_price: 4499,
        new_price: 3299,
        price_diff: -1200,
        reason: '原定RTX 4070 SUPER缺货，协商更换为RX 7800 XT',
        operator: '赵装机',
        created_at: '2024-01-19 11:00:00'
      }
    ],
    delivery_records: []
  },
  {
    id: 'ORD-20240120-003',
    customer_name: '王五',
    phone: '13700137003',
    order_date: '2024-01-20',
    status: 'pending',
    install_status: 'not_started',
    total_price: 6894,
    paid_amount: 3000,
    created_by: '李销售',
    created_at: '2024-01-20 10:00:00',
    config_items: [
      { id: 'ci013', order_id: 'ORD-20240120-003', part_id: 'p001', part_name: 'Intel Core i5-14400F', spec: '10核16线程', quantity: 1, unit_price: 1299, total_price: 1299 },
      { id: 'ci014', order_id: 'ORD-20240120-003', part_id: 'p003', part_name: '金士顿FURY Beast DDR5 16GB', spec: 'DDR5-5600', quantity: 2, unit_price: 399, total_price: 798 },
      { id: 'ci015', order_id: 'ORD-20240120-003', part_id: 'p005', part_name: 'NVIDIA RTX 4060', spec: '8GB GDDR6', quantity: 1, unit_price: 2499, total_price: 2499 },
      { id: 'ci016', order_id: 'ORD-20240120-003', part_id: 'p007', part_name: '华硕PRIME B760M-K', spec: 'B760芯片组', quantity: 1, unit_price: 799, total_price: 799 },
      { id: 'ci017', order_id: 'ORD-20240120-003', part_id: 'p009', part_name: '航嘉WD650K', spec: '650W', quantity: 1, unit_price: 499, total_price: 499 },
      { id: 'ci018', order_id: 'ORD-20240120-003', part_id: 'p011', part_name: '三星980 PRO 1TB', spec: 'NVMe M.2', quantity: 1, unit_price: 599, total_price: 599 }
    ],
    installed_parts: [],
    modify_records: [
      {
        id: 'mr003',
        order_id: 'ORD-20240120-003',
        part_id: 'p010',
        part_name: '海韵FOCUS GX-850',
        spec: '850W',
        change_type: 'upgrade',
        old_price: 499,
        new_price: 899,
        price_diff: 400,
        reason: '客户要求升级电源以支持未来升级',
        operator: '李销售',
        created_at: '2024-01-20 11:30:00'
      }
    ],
    delivery_records: []
  },
  {
    id: 'ORD-20240110-004',
    customer_name: '赵六',
    phone: '13600136004',
    order_date: '2024-01-10',
    status: 'repairing',
    install_status: 'completed',
    total_price: 15295,
    paid_amount: 15295,
    created_by: '王销售',
    created_at: '2024-01-10 09:00:00',
    config_items: [
      { id: 'ci019', order_id: 'ORD-20240110-004', part_id: 'p013', part_name: 'AMD Ryzen 7 7800X3D', spec: '8核16线程 3D V-Cache', quantity: 1, unit_price: 2999, total_price: 2999 },
      { id: 'ci020', order_id: 'ORD-20240110-004', part_id: 'p004', part_name: '金士顿FURY Beast DDR5 32GB', spec: 'DDR5-5600', quantity: 2, unit_price: 699, total_price: 1398 },
      { id: 'ci021', order_id: 'ORD-20240110-004', part_id: 'p006', part_name: 'NVIDIA RTX 4070 SUPER', spec: '12GB GDDR6X', quantity: 1, unit_price: 4499, total_price: 4499 },
      { id: 'ci022', order_id: 'ORD-20240110-004', part_id: 'p008', part_name: '华硕ROG STRIX B760-A', spec: 'B760芯片组 WiFi', quantity: 1, unit_price: 1299, total_price: 1299 },
      { id: 'ci023', order_id: 'ORD-20240110-004', part_id: 'p010', part_name: '海韵FOCUS GX-850', spec: '850W', quantity: 1, unit_price: 899, total_price: 899 },
      { id: 'ci024', order_id: 'ORD-20240110-004', part_id: 'p012', part_name: '三星990 PRO 2TB', spec: 'NVMe M.2', quantity: 1, unit_price: 1199, total_price: 1199 }
    ],
    installed_parts: [
      { id: 'ip010', order_id: 'ORD-20240110-004', part_id: 'p013', part_name: 'AMD Ryzen 7 7800X3D', spec: '8核16线程，3D V-Cache', quantity: 1, unit_price: 2999, total_price: 2999, batch_no: 'CPU-202403', expire_date: '2027-03-25', installed_by: '赵装机', installed_at: '2024-01-12 09:00:00' },
      { id: 'ip011', order_id: 'ORD-20240110-004', part_id: 'p004', part_name: '金士顿FURY Beast DDR5 32GB', spec: 'DDR5-5600，CL36', quantity: 2, unit_price: 699, total_price: 1398, batch_no: 'MEM-202403', expire_date: '2028-03-10', installed_by: '赵装机', installed_at: '2024-01-12 09:30:00', remarks: '已返修检测，怀疑内存兼容性问题' },
      { id: 'ip012', order_id: 'ORD-20240110-004', part_id: 'p006', part_name: 'NVIDIA RTX 4070 SUPER', spec: '12GB GDDR6X', quantity: 1, unit_price: 4499, total_price: 4499, batch_no: 'GPU-202402', expire_date: '2027-05-20', installed_by: '赵装机', installed_at: '2024-01-12 10:30:00' },
      { id: 'ip013', order_id: 'ORD-20240110-004', part_id: 'p008', part_name: '华硕ROG STRIX B760-A', spec: 'B760芯片组，WiFi', quantity: 1, unit_price: 1299, total_price: 1299, batch_no: 'MB-202402', expire_date: '2027-06-10', installed_by: '赵装机', installed_at: '2024-01-12 08:30:00' },
      { id: 'ip014', order_id: 'ORD-20240110-004', part_id: 'p010', part_name: '海韵FOCUS GX-850', spec: '850W，80Plus金牌', quantity: 1, unit_price: 899, total_price: 899, batch_no: 'PWR-202402', expire_date: '2028-02-15', installed_by: '赵装机', installed_at: '2024-01-12 11:00:00' },
      { id: 'ip015', order_id: 'ORD-20240110-004', part_id: 'p012', part_name: '三星990 PRO 2TB', spec: 'NVMe M.2，7450MB/s', quantity: 1, unit_price: 1199, total_price: 1199, batch_no: 'SSD-202402', expire_date: '2029-02-15', installed_by: '赵装机', installed_at: '2024-01-12 11:30:00' }
    ],
    modify_records: [],
    delivery_records: [
      { id: 'dr002', order_id: 'ORD-20240110-004', status: 'delivered', delivery_date: '2024-01-14', signer: '赵六', remarks: '验收合格', created_at: '2024-01-14 16:00:00' },
      { id: 'dr003', order_id: 'ORD-20240110-004', status: 'repair', delivery_date: '2024-01-21', signer: '赵六', remarks: '使用3天后出现蓝屏，怀疑内存兼容性问题', created_at: '2024-01-21 10:00:00' }
    ]
  }
];

export const mockUsers: User[] = [
  { id: 'u001', name: '李销售', role: 'sales' },
  { id: 'u002', name: '王销售', role: 'sales' },
  { id: 'u003', name: '赵装机', role: 'technician' },
  { id: 'u004', name: '孙客服', role: 'support' }
];
