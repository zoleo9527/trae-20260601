const dishes = [
  { id: 1, name: '招牌肥牛', price: 68, category: '肉类' },
  { id: 2, name: '鲜切羊肉', price: 58, category: '肉类' },
  { id: 3, name: '虾滑', price: 48, category: '海鲜' },
  { id: 4, name: '毛肚', price: 58, category: '内脏' },
  { id: 5, name: '黄喉', price: 45, category: '内脏' },
  { id: 6, name: '鸭肠', price: 38, category: '内脏' },
  { id: 7, name: '藕片', price: 22, category: '蔬菜' },
  { id: 8, name: '土豆片', price: 18, category: '蔬菜' },
  { id: 9, name: '菠菜', price: 16, category: '蔬菜' },
  { id: 10, name: '金针菇', price: 20, category: '菌菇' },
  { id: 11, name: '香菇', price: 22, category: '菌菇' },
  { id: 12, name: '豆腐', price: 15, category: '豆制品' },
  { id: 13, name: '鸭血', price: 18, category: '豆制品' },
  { id: 14, name: '粉条', price: 16, category: '主食' },
  { id: 15, name: '面条', price: 12, category: '主食' },
  { id: 16, name: '蛋饺', price: 28, category: '主食' },
  { id: 17, name: '鱼丸', price: 32, category: '海鲜' },
  { id: 18, name: '蟹棒', price: 26, category: '海鲜' },
  { id: 19, name: '牛肉丸', price: 30, category: '肉类' },
  { id: 20, name: '午餐肉', price: 24, category: '肉类' }
];

const generateOrders = () => {
  const orders = [
    {
      id: 'DD20240115001',
      tableNo: 'A01',
      people: 4,
      status: 'processing',
      createTime: '2024-01-15 11:20:35',
      totalAmount: 328,
      items: [
        { dishId: 1, name: '招牌肥牛', quantity: 2, price: 68, status: 'ready' },
        { dishId: 4, name: '毛肚', quantity: 1, price: 58, status: 'ready' },
        { dishId: 7, name: '藕片', quantity: 1, price: 22, status: 'cooking' },
        { dishId: 10, name: '金针菇', quantity: 1, price: 20, status: 'pending' }
      ],
      addItems: [],
      returnItems: []
    },
    {
      id: 'DD20240115002',
      tableNo: 'A02',
      people: 6,
      status: 'processing',
      createTime: '2024-01-15 11:35:20',
      totalAmount: 456,
      items: [
        { dishId: 2, name: '鲜切羊肉', quantity: 2, price: 58, status: 'ready' },
        { dishId: 3, name: '虾滑', quantity: 1, price: 48, status: 'cooking' },
        { dishId: 5, name: '黄喉', quantity: 1, price: 45, status: 'pending' },
        { dishId: 8, name: '土豆片', quantity: 2, price: 18, status: 'pending' },
        { dishId: 11, name: '香菇', quantity: 1, price: 22, status: 'pending' }
      ],
      addItems: [],
      returnItems: []
    },
    {
      id: 'DD20240115003',
      tableNo: 'B01',
      people: 2,
      status: 'pending',
      createTime: '2024-01-15 11:45:10',
      totalAmount: 186,
      items: [
        { dishId: 1, name: '招牌肥牛', quantity: 1, price: 68, status: 'pending' },
        { dishId: 6, name: '鸭肠', quantity: 1, price: 38, status: 'pending' },
        { dishId: 9, name: '菠菜', quantity: 1, price: 16, status: 'pending' }
      ],
      addItems: [],
      returnItems: []
    },
    {
      id: 'DD20240115004',
      tableNo: 'B02',
      people: 8,
      status: 'processing',
      createTime: '2024-01-15 10:50:00',
      totalAmount: 580,
      items: [
        { dishId: 1, name: '招牌肥牛', quantity: 3, price: 68, status: 'ready' },
        { dishId: 2, name: '鲜切羊肉', quantity: 2, price: 58, status: 'ready' },
        { dishId: 4, name: '毛肚', quantity: 2, price: 58, status: 'ready' },
        { dishId: 7, name: '藕片', quantity: 2, price: 22, status: 'ready' },
        { dishId: 14, name: '粉条', quantity: 2, price: 16, status: 'ready' }
      ],
      addItems: [
        { dishId: 17, name: '鱼丸', quantity: 1, price: 32, reason: 'customer', status: 'pending' }
      ],
      returnItems: []
    },
    {
      id: 'DD20240115005',
      tableNo: 'C01',
      people: 3,
      status: 'completed',
      createTime: '2024-01-15 10:00:00',
      totalAmount: 268,
      items: [
        { dishId: 1, name: '招牌肥牛', quantity: 1, price: 68, status: 'ready' },
        { dishId: 3, name: '虾滑', quantity: 1, price: 48, status: 'ready' },
        { dishId: 7, name: '藕片', quantity: 1, price: 22, status: 'ready' },
        { dishId: 12, name: '豆腐', quantity: 1, price: 15, status: 'ready' }
      ],
      addItems: [],
      returnItems: []
    },
    {
      id: 'DD20240115006',
      tableNo: 'C02',
      people: 5,
      status: 'processing',
      createTime: '2024-01-15 11:05:30',
      totalAmount: 388,
      items: [
        { dishId: 2, name: '鲜切羊肉', quantity: 1, price: 58, status: 'ready' },
        { dishId: 5, name: '黄喉', quantity: 2, price: 45, status: 'ready' },
        { dishId: 10, name: '金针菇', quantity: 1, price: 20, status: 'cooking' },
        { dishId: 13, name: '鸭血', quantity: 1, price: 18, status: 'pending' }
      ],
      addItems: [],
      returnItems: [
        { dishId: 8, name: '土豆片', quantity: 1, price: 18, reason: 'no-material', responsible: 'kitchen', status: 'pending' }
      ]
    }
  ];
  return orders;
};

const generateAbnormalOrders = () => {
  return [
    {
      id: 'YC20240115001',
      orderId: 'DD20240115003',
      tableNo: 'B01',
      type: 'no-material',
      typeName: '缺材料',
      dishName: '鸭肠',
      quantity: 1,
      reason: '仓库库存不足，无法供应',
      createTime: '2024-01-15 11:48:00',
      status: 'pending',
      handler: ''
    },
    {
      id: 'YC20240115002',
      orderId: 'DD20240115002',
      tableNo: 'A02',
      type: 'timeout',
      typeName: '超时',
      dishName: '虾滑',
      quantity: 1,
      reason: '制作时间超过30分钟，顾客催单',
      createTime: '2024-01-15 12:05:00',
      status: 'pending',
      handler: ''
    },
    {
      id: 'YC20240115003',
      orderId: 'DD20240115006',
      tableNo: 'C02',
      type: 'review-fail',
      typeName: '复核不通过',
      dishName: '土豆片',
      quantity: 1,
      reason: '菜品与订单不符，退回重新制作',
      createTime: '2024-01-15 11:30:00',
      status: 'processing',
      handler: '李师傅'
    },
    {
      id: 'YC20240115004',
      orderId: 'DD20240115001',
      tableNo: 'A01',
      type: 'no-material',
      typeName: '缺材料',
      dishName: '金针菇',
      quantity: 1,
      reason: '当日采购不足',
      createTime: '2024-01-15 11:25:00',
      status: 'pending',
      handler: ''
    },
    {
      id: 'YC20240115005',
      orderId: 'DD20240115002',
      tableNo: 'A02',
      type: 'timeout',
      typeName: '超时',
      dishName: '黄喉',
      quantity: 1,
      reason: '高峰期出菜延迟',
      createTime: '2024-01-15 12:10:00',
      status: 'pending',
      handler: ''
    }
  ];
};

const getRecentOrders = (orders) => {
  return orders.filter(o => o.status !== 'completed').slice(0, 6);
};

const getProductionItems = (orders) => {
  const items = [];
  orders.forEach(order => {
    order.items.forEach(item => {
      items.push({
        orderId: order.id,
        tableNo: order.tableNo,
        dishId: item.dishId,
        dishName: item.name,
        quantity: item.quantity,
        price: item.price,
        status: item.status,
        createTime: order.createTime
      });
    });
    order.addItems.forEach(item => {
      if (item.status !== 'completed') {
        items.push({
          orderId: order.id,
          tableNo: order.tableNo,
          dishId: item.dishId,
          dishName: item.name,
          quantity: item.quantity,
          price: item.price,
          status: 'pending',
          createTime: order.createTime
        });
      }
    });
  });
  return items;
};

const getPendingAddItems = (orders) => {
  const items = [];
  orders.forEach(order => {
    order.addItems.forEach(item => {
      if (item.status === 'pending') {
        items.push({
          orderId: order.id,
          tableNo: order.tableNo,
          ...item
        });
      }
    });
  });
  return items;
};

const getPendingReturnItems = (orders) => {
  const items = [];
  orders.forEach(order => {
    order.returnItems.forEach(item => {
      if (item.status === 'pending') {
        items.push({
          orderId: order.id,
          tableNo: order.tableNo,
          ...item
        });
      }
    });
  });
  return items;
};

export {
  dishes,
  generateOrders,
  generateAbnormalOrders,
  getRecentOrders,
  getProductionItems,
  getPendingAddItems,
  getPendingReturnItems
};