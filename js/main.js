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

function generateOrders() {
  return [
    {
      id: 'DD20240115001',
      tableNo: 'A01',
      people: 4,
      status: 'processing',
      createTime: '2024-01-15 11:20:35',
      totalAmount: 328,
      cashierSettled: false,
      items: [
        { dishId: 1, name: '招牌肥牛', quantity: 2, price: 68 },
        { dishId: 4, name: '毛肚', quantity: 1, price: 58 },
        { dishId: 7, name: '藕片', quantity: 1, price: 22 },
        { dishId: 10, name: '金针菇', quantity: 1, price: 20 }
      ],
      timeline: [
        { time: '2024-01-15 11:20:35', role: 'cashier', action: '创建订单', detail: 'A01桌，4人', operator: '收银员-小王' },
        { time: '2024-01-15 11:21:00', role: 'kitchen', action: '接单制作', detail: '全部菜品', operator: '后厨-李师傅' }
      ],
      dishStatus: {
        1: { status: 'ready', cookConfirm: '2024-01-15 11:28:00', cookOperator: '李师傅' },
        4: { status: 'ready', cookConfirm: '2024-01-15 11:30:00', cookOperator: '李师傅' },
        7: { status: 'cooking', cookStart: '2024-01-15 11:35:00', cookOperator: '王厨师' },
        10: { status: 'abnormal', abnormalType: 'no-material', abnormalReason: '金针菇库存不足', abnormalTime: '2024-01-15 11:25:00' }
      }
    },
    {
      id: 'DD20240115002',
      tableNo: 'A02',
      people: 6,
      status: 'processing',
      createTime: '2024-01-15 11:35:20',
      totalAmount: 456,
      cashierSettled: false,
      items: [
        { dishId: 2, name: '鲜切羊肉', quantity: 2, price: 58 },
        { dishId: 3, name: '虾滑', quantity: 1, price: 48 },
        { dishId: 5, name: '黄喉', quantity: 1, price: 45 },
        { dishId: 8, name: '土豆片', quantity: 2, price: 18 },
        { dishId: 11, name: '香菇', quantity: 1, price: 22 }
      ],
      timeline: [
        { time: '2024-01-15 11:35:20', role: 'cashier', action: '创建订单', detail: 'A02桌，6人', operator: '收银员-小王' },
        { time: '2024-01-15 11:36:00', role: 'kitchen', action: '接单制作', detail: '开始备餐', operator: '后厨-张厨师' },
        { time: '2024-01-15 11:55:00', role: 'front', action: '退菜', detail: '虾滑1份-超时', operator: '前厅-经理陈', responsible: 'kitchen' },
        { time: '2024-01-15 12:00:00', role: 'front', action: '退菜', detail: '黄喉1份-超时', operator: '前厅-经理陈', responsible: 'kitchen' },
        { time: '2024-01-15 12:05:00', role: 'kitchen', action: '责任确认', detail: '高峰期出菜延迟，厨房承担', operator: '后厨-李师傅', conclusion: '厨房责任-免单处理' }
      ],
      dishStatus: {
        2: { status: 'ready', cookConfirm: '2024-01-15 11:42:00', cookOperator: '张厨师' },
        3: { status: 'return', returnTime: '2024-01-15 11:55:00', returnReason: 'timeout', responsible: 'kitchen' },
        5: { status: 'return', returnTime: '2024-01-15 12:00:00', returnReason: 'timeout', responsible: 'kitchen' },
        8: { status: 'ready', cookConfirm: '2024-01-15 11:50:00', cookOperator: '张厨师' },
        11: { status: 'ready', cookConfirm: '2024-01-15 11:55:00', cookOperator: '张厨师' }
      }
    },
    {
      id: 'DD20240115003',
      tableNo: 'B01',
      people: 2,
      status: 'processing',
      createTime: '2024-01-15 11:45:10',
      totalAmount: 186,
      cashierSettled: false,
      items: [
        { dishId: 1, name: '招牌肥牛', quantity: 1, price: 68 },
        { dishId: 6, name: '鸭肠', quantity: 1, price: 38 },
        { dishId: 9, name: '菠菜', quantity: 1, price: 16 }
      ],
      timeline: [
        { time: '2024-01-15 11:45:10', role: 'cashier', action: '创建订单', detail: 'B01桌，2人', operator: '收银员-小李' },
        { time: '2024-01-15 11:46:00', role: 'kitchen', action: '接单制作', detail: '开始备餐', operator: '后厨-王厨师' },
        { time: '2024-01-15 11:48:00', role: 'kitchen', action: '异常-缺材料', detail: '鸭肠缺货，无法制作', operator: '后厨-王厨师' }
      ],
      dishStatus: {
        1: { status: 'cooking', cookStart: '2024-01-15 11:46:30', cookOperator: '王厨师' },
        6: { status: 'abnormal', abnormalType: 'no-material', abnormalReason: '鸭肠库存不足', abnormalTime: '2024-01-15 11:48:00' },
        9: { status: 'ready', cookConfirm: '2024-01-15 11:50:00', cookOperator: '王厨师' }
      }
    },
    {
      id: 'DD20240115004',
      tableNo: 'B02',
      people: 8,
      status: 'completed',
      createTime: '2024-01-15 10:50:00',
      totalAmount: 612,
      cashierSettled: true,
      settleTime: '2024-01-15 12:30:00',
      settleOperator: '收银员-小王',
      items: [
        { dishId: 1, name: '招牌肥牛', quantity: 3, price: 68 },
        { dishId: 2, name: '鲜切羊肉', quantity: 2, price: 58 },
        { dishId: 4, name: '毛肚', quantity: 2, price: 58 },
        { dishId: 7, name: '藕片', quantity: 2, price: 22 },
        { dishId: 14, name: '粉条', quantity: 2, price: 16 }
      ],
      timeline: [
        { time: '2024-01-15 10:50:00', role: 'cashier', action: '创建订单', detail: 'B02桌，8人', operator: '收银员-小王' },
        { time: '2024-01-15 10:51:00', role: 'kitchen', action: '接单制作', detail: '开始备餐', operator: '后厨-李师傅' },
        { time: '2024-01-15 11:20:00', role: 'front', action: '加菜', detail: '鱼丸1份-顾客要求', operator: '前厅-小林' },
        { time: '2024-01-15 11:21:00', role: 'kitchen', action: '加菜确认', detail: '鱼丸已加入制作', operator: '后厨-李师傅' },
        { time: '2024-01-15 11:25:00', role: 'kitchen', action: '出菜完成', detail: '全部菜品已出', operator: '后厨-李师傅' },
        { time: '2024-01-15 12:30:00', role: 'cashier', action: '落账结算', detail: '含加菜32元，实收612元', operator: '收银员-小王' }
      ],
      dishStatus: {
        1: { status: 'ready', cookConfirm: '2024-01-15 11:05:00', cookOperator: '李师傅' },
        2: { status: 'ready', cookConfirm: '2024-01-15 11:10:00', cookOperator: '李师傅' },
        4: { status: 'ready', cookConfirm: '2024-01-15 11:15:00', cookOperator: '李师傅' },
        7: { status: 'ready', cookConfirm: '2024-01-15 11:20:00', cookOperator: '李师傅' },
        14: { status: 'ready', cookConfirm: '2024-01-15 11:22:00', cookOperator: '李师傅' }
      }
    },
    {
      id: 'DD20240115005',
      tableNo: 'C01',
      people: 3,
      status: 'completed',
      createTime: '2024-01-15 10:00:00',
      totalAmount: 268,
      cashierSettled: true,
      settleTime: '2024-01-15 11:15:00',
      settleOperator: '收银员-小李',
      items: [
        { dishId: 1, name: '招牌肥牛', quantity: 1, price: 68 },
        { dishId: 3, name: '虾滑', quantity: 1, price: 48 },
        { dishId: 7, name: '藕片', quantity: 1, price: 22 },
        { dishId: 12, name: '豆腐', quantity: 1, price: 15 }
      ],
      timeline: [
        { time: '2024-01-15 10:00:00', role: 'cashier', action: '创建订单', detail: 'C01桌，3人', operator: '收银员-小李' },
        { time: '2024-01-15 10:01:00', role: 'kitchen', action: '接单制作', detail: '开始备餐', operator: '后厨-王厨师' },
        { time: '2024-01-15 10:15:00', role: 'kitchen', action: '出菜完成', detail: '全部菜品已出', operator: '后厨-王厨师' },
        { time: '2024-01-15 11:15:00', role: 'cashier', action: '落账结算', detail: '实收268元', operator: '收银员-小李' }
      ],
      dishStatus: {
        1: { status: 'ready', cookConfirm: '2024-01-15 10:10:00', cookOperator: '王厨师' },
        3: { status: 'ready', cookConfirm: '2024-01-15 10:12:00', cookOperator: '王厨师' },
        7: { status: 'ready', cookConfirm: '2024-01-15 10:14:00', cookOperator: '王厨师' },
        12: { status: 'ready', cookConfirm: '2024-01-15 10:15:00', cookOperator: '王厨师' }
      }
    },
    {
      id: 'DD20240115006',
      tableNo: 'C02',
      people: 5,
      status: 'processing',
      createTime: '2024-01-15 11:05:30',
      totalAmount: 370,
      cashierSettled: false,
      items: [
        { dishId: 2, name: '鲜切羊肉', quantity: 1, price: 58 },
        { dishId: 5, name: '黄喉', quantity: 2, price: 45 },
        { dishId: 10, name: '金针菇', quantity: 1, price: 20 },
        { dishId: 13, name: '鸭血', quantity: 1, price: 18 }
      ],
      timeline: [
        { time: '2024-01-15 11:05:30', role: 'cashier', action: '创建订单', detail: 'C02桌，5人', operator: '收银员-小王' },
        { time: '2024-01-15 11:06:00', role: 'kitchen', action: '接单制作', detail: '开始备餐', operator: '后厨-张厨师' },
        { time: '2024-01-15 11:25:00', role: 'kitchen', action: '异常-复核不通过', detail: '土豆片1份与订单不符', operator: '后厨-张厨师' },
        { time: '2024-01-15 11:30:00', role: 'kitchen', action: '责任确认', detail: '厨房操作失误，重新制作', operator: '后厨-李师傅', conclusion: '厨房责任-免单处理' }
      ],
      dishStatus: {
        2: { status: 'ready', cookConfirm: '2024-01-15 11:15:00', cookOperator: '张厨师' },
        5: { status: 'ready', cookConfirm: '2024-01-15 11:20:00', cookOperator: '张厨师' },
        10: { status: 'cooking', cookStart: '2024-01-15 11:30:00', cookOperator: '李师傅' },
        13: { status: 'pending' }
      }
    }
  ];
}

function getRecentOrders() {
  const recent = [];
  orders.forEach(order => {
    order.timeline.forEach(t => {
      recent.push({
        orderId: order.id,
        tableNo: order.tableNo,
        time: t.time,
        action: t.action,
        role: t.role,
        detail: t.detail,
        operator: t.operator
      });
    });
  });
  recent.sort((a, b) => new Date(b.time) - new Date(a.time));
  return recent.slice(0, 15);
}

let orders = generateOrders();

const statusMap = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成'
};

const roleMap = {
  cashier: '收银',
  front: '前厅',
  kitchen: '后厨'
};

const reasonMap = {
  customer: '顾客要求',
  miss: '漏单补菜',
  error: '操作失误',
  other: '其他',
  'no-material': '缺材料',
  timeout: '超时',
  quality: '菜品质量',
  'review-fail': '复核不通过'
};

function updateTime() {
  const now = new Date();
  document.getElementById('currentTime').textContent = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function initDishSelect() {
  const select = document.getElementById('addDishSelect');
  select.innerHTML = '<option value="">请选择菜品</option>';
  dishes.forEach(dish => {
    const option = document.createElement('option');
    option.value = dish.id;
    option.textContent = `${dish.name} - ¥${dish.price}`;
    select.appendChild(option);
  });
}

function initRoleSelect() {
  const select = document.getElementById('roleSelect');
  select.addEventListener('change', (e) => {
    const role = e.target.value;
    updateRoleVisibility(role);
  });
}

function updateRoleVisibility(role) {
  const tabs = {
    'recent': true,
    'orders': true,
    'add-dish': ['front', 'cashier'].includes(role),
    'return-dish': ['front', 'cashier'].includes(role),
    'handle': ['front', 'kitchen', 'cashier'].includes(role)
  };
  
  Object.keys(tabs).forEach(tab => {
    const btn = document.querySelector(`[data-tab="${tab}"]`);
    if (btn) {
      btn.style.display = tabs[tab] ? 'inline-block' : 'none';
    }
  });
}

function initNavTabs() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}Tab`).classList.add('active');
  
  if (tabName === 'recent') renderRecentList();
  else if (tabName === 'orders') renderOrdersTable();
  else if (tabName === 'add-dish') renderAddDish();
  else if (tabName === 'return-dish') renderReturnDish();
  else if (tabName === 'handle') renderHandle();
}

function renderRecentList() {
  const search = document.getElementById('recentSearch').value.toLowerCase();
  const filter = document.getElementById('recentFilter').value;
  
  let recent = getRecentOrders();
  
  if (filter !== 'all') {
    recent = recent.filter(r => r.role === filter);
  }
  
  if (search) {
    recent = recent.filter(r => 
      r.tableNo.toLowerCase().includes(search) || 
      r.orderId.toLowerCase().includes(search) ||
      r.action.includes(search)
    );
  }
  
  const container = document.getElementById('recentList');
  container.innerHTML = recent.map(item => `
    <div class="recent-card" onclick="showOrderDetail('${item.orderId}')">
      <div class="recent-card-header">
        <span class="recent-card-table">${item.tableNo}</span>
        <span class="recent-card-status status-${item.role === 'cashier' ? 'completed' : (item.role === 'front' ? 'processing' : 'pending')}">${roleMap[item.role]}</span>
      </div>
      <div class="recent-card-info">
        <span>${item.orderId}</span>
        <span>${item.time.split(' ')[1]}</span>
      </div>
      <div class="recent-card-items">
        <div class="recent-card-item">
          <span>${item.action}</span>
          <span>${item.operator || ''}</span>
        </div>
        <div class="recent-card-item" style="font-size: 12px; color: #666;">
          ${item.detail}
        </div>
      </div>
    </div>
  `).join('');
}

function renderOrdersTable() {
  const search = document.getElementById('ordersSearch').value.toLowerCase();
  const filter = document.getElementById('ordersFilter').value;
  
  let filtered = orders;
  
  if (filter !== 'all') {
    if (filter === 'unsettled') {
      filtered = filtered.filter(o => !o.cashierSettled);
    } else {
      filtered = filtered.filter(o => o.status === filter);
    }
  }
  
  if (search) {
    filtered = filtered.filter(o => 
      o.tableNo.toLowerCase().includes(search) || 
      o.id.toLowerCase().includes(search) ||
      o.items.some(item => item.name.toLowerCase().includes(search))
    );
  }
  
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = filtered.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${order.tableNo}</td>
      <td>${order.people}</td>
      <td>
        <span class="recent-card-status status-${order.status}">${statusMap[order.status]}</span>
        ${order.cashierSettled ? '<span style="margin-left:4px;font-size:11px;color:#28a745;">✓已落账</span>' : '<span style="margin-left:4px;font-size:11px;color:#dc3545;">待落账</span>'}
      </td>
      <td>${order.createTime}</td>
      <td>¥${order.totalAmount}</td>
      <td class="order-actions">
        <button class="btn btn-primary" onclick="showOrderDetail('${order.id}')">详情</button>
        ${!order.cashierSettled && order.status === 'completed' ? `<button class="btn btn-secondary" onclick="settleOrder('${order.id}')">落账</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function renderAddDish() {
  const pendingOrders = orders.filter(o => !o.cashierSettled);
  
  const container = document.getElementById('addDishOrders');
  container.innerHTML = pendingOrders.map(order => `
    <div class="order-card" onclick="showAddDishForm('${order.id}')">
      <div class="order-card-header">
        <span class="order-card-table">${order.tableNo}</span>
        <span>${order.id}</span>
      </div>
      <div class="order-card-items">
        ${order.items.slice(0, 4).map(item => `<span>${item.name}×${item.quantity}</span>`).join(', ')}
        ${order.items.length > 4 ? '...' : ''}
      </div>
    </div>
  `).join('');
  
  const currentOrderId = document.getElementById('currentOrderId').value;
  if (currentOrderId) {
    const order = orders.find(o => o.id === currentOrderId);
    if (order) {
      document.getElementById('addTableNo').value = order.tableNo;
    }
  }
}

function showAddDishForm(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  document.getElementById('currentOrderId').value = orderId;
  document.getElementById('addTableNo').value = order.tableNo;
  
  const select = document.getElementById('addDishSelect');
  select.innerHTML = '<option value="">请选择菜品</option>';
  dishes.forEach(dish => {
    const option = document.createElement('option');
    option.value = dish.id;
    option.textContent = `${dish.name} - ¥${dish.price}`;
    select.appendChild(option);
  });
  
  document.getElementById('addDishForm').style.display = 'block';
  document.getElementById('addDishOrders').style.display = 'none';
}

function submitAddDish() {
  const orderId = document.getElementById('currentOrderId').value;
  const dishId = parseInt(document.getElementById('addDishSelect').value);
  const quantity = parseInt(document.getElementById('addDishQty').value);
  const reason = document.getElementById('addReason').value;
  const remark = document.getElementById('addRemark').value;
  
  if (!orderId || !dishId || !quantity) {
    alert('请填写完整信息');
    return;
  }
  
  const dish = dishes.find(d => d.id === dishId);
  const order = orders.find(o => o.id === orderId);
  if (!dish || !order) {
    alert('菜品或订单不存在');
    return;
  }
  
  const now = new Date().toLocaleString('zh-CN');
  const role = document.getElementById('roleSelect').value;
  const operator = role === 'front' ? '前厅-经理陈' : '收银员-小王';
  
  order.items.push({
    dishId,
    name: dish.name,
    quantity,
    price: dish.price
  });
  
  order.dishStatus[dishId] = { status: 'pending', addTime: now };
  order.totalAmount += dish.price * quantity;
  
  order.timeline.push({
    time: now,
    role: role,
    action: '加菜',
    detail: `${dish.name}×${quantity} - ${reasonMap[reason]}`,
    operator: operator
  });
  
  alert(`加菜成功: ${dish.name} x${quantity}`);
  resetAddDishForm();
  renderAddDish();
  renderRecentList();
}

function resetAddDishForm() {
  document.getElementById('currentOrderId').value = '';
  document.getElementById('addTableNo').value = '';
  document.getElementById('addDishSelect').value = '';
  document.getElementById('addDishQty').value = 1;
  document.getElementById('addReason').value = 'customer';
  document.getElementById('addRemark').value = '';
  document.getElementById('addDishForm').style.display = 'none';
  document.getElementById('addDishOrders').style.display = 'grid';
}

function renderReturnDish() {
  const pendingOrders = orders.filter(o => !o.cashierSettled && o.status !== 'completed');
  
  const container = document.getElementById('returnDishOrders');
  container.innerHTML = pendingOrders.map(order => `
    <div class="order-card" onclick="showReturnDishForm('${order.id}')">
      <div class="order-card-header">
        <span class="order-card-table">${order.tableNo}</span>
        <span>${order.id}</span>
      </div>
      <div class="order-card-items">
        ${order.items.map(item => {
          const status = order.dishStatus[item.dishId];
          const statusText = status?.status === 'return' ? '【已退】' : (status?.status === 'abnormal' ? '【异常】' : '');
          return `<span>${statusText}${item.name}×${item.quantity}</span>`;
        }).join('<br>')}
      </div>
    </div>
  `).join('');
}

function showReturnDishForm(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  document.getElementById('returnOrderId').value = orderId;
  document.getElementById('returnTableNo').value = order.tableNo;
  
  const select = document.getElementById('returnDishSelect');
  select.innerHTML = '<option value="">请选择菜品</option>';
  order.items.forEach(item => {
    const status = order.dishStatus[item.dishId];
    if (status?.status !== 'return') {
      const option = document.createElement('option');
      option.value = item.dishId;
      option.textContent = `${item.name} x${item.quantity}`;
      select.appendChild(option);
    }
  });
  
  document.getElementById('returnDishForm').style.display = 'block';
  document.getElementById('returnDishOrders').style.display = 'none';
}

function submitReturnDish() {
  const orderId = document.getElementById('returnOrderId').value;
  const dishId = parseInt(document.getElementById('returnDishSelect').value);
  const quantity = parseInt(document.getElementById('returnDishQty').value);
  const reason = document.getElementById('returnReason').value;
  const responsible = document.getElementById('returnResponsible').value;
  const remark = document.getElementById('returnRemark').value;
  
  if (!orderId || !dishId || !quantity || !reason) {
    alert('请填写完整信息');
    return;
  }
  
  const order = orders.find(o => o.id === orderId);
  const dish = order?.items.find(i => i.dishId === dishId);
  if (!order || !dish) {
    alert('订单或菜品不存在');
    return;
  }
  
  const now = new Date().toLocaleString('zh-CN');
  const role = document.getElementById('roleSelect').value;
  const operator = role === 'front' ? '前厅-经理陈' : '收银员-小王';
  
  order.dishStatus[dishId] = {
    status: reason === 'no-material' || reason === 'timeout' || reason === 'review-fail' ? 'abnormal' : 'return',
    returnTime: now,
    returnReason: reason,
    returnQuantity: quantity,
    responsible: responsible
  };
  
  order.totalAmount -= dish.price * quantity;
  
  order.timeline.push({
    time: now,
    role: role,
    action: '退菜',
    detail: `${dish.name}×${quantity} - ${reasonMap[reason]} | 责任方:${responsible === 'front' ? '前厅' : (responsible === 'kitchen' ? '后厨' : '双方')}`,
    operator: operator,
    responsible: responsible
  });
  
  alert(`退菜成功: ${dish.name} x${quantity}`);
  resetReturnDishForm();
  renderReturnDish();
  renderRecentList();
}

function resetReturnDishForm() {
  document.getElementById('returnOrderId').value = '';
  document.getElementById('returnTableNo').value = '';
  document.getElementById('returnDishSelect').value = '';
  document.getElementById('returnDishQty').value = 1;
  document.getElementById('returnReason').value = '';
  document.getElementById('returnResponsible').value = 'front';
  document.getElementById('returnRemark').value = '';
  document.getElementById('returnDishForm').style.display = 'none';
  document.getElementById('returnDishOrders').style.display = 'grid';
}

function renderHandle() {
  const abnormalItems = [];
  
  orders.forEach(order => {
    Object.keys(order.dishStatus).forEach(dishId => {
      const status = order.dishStatus[dishId];
      if (status?.status === 'abnormal' || status?.status === 'cooking') {
        const dish = order.items.find(i => i.dishId === parseInt(dishId));
        if (dish) {
          abnormalItems.push({
            orderId: order.id,
            tableNo: order.tableNo,
            dishId: parseInt(dishId),
            dishName: dish.name,
            quantity: dish.quantity,
            status: status,
            order: order
          });
        }
      }
    });
  });
  
  const pending = abnormalItems.filter(i => i.status.status === 'abnormal');
  const cooking = abnormalItems.filter(i => i.status.status === 'cooking');
  
  document.getElementById('abnormalItems').innerHTML = pending.length ? pending.map(item => `
    <div class="abnormal-card ${item.status.abnormalType}">
      <div class="abnormal-card-header">
        <span class="abnormal-card-table">${item.tableNo}</span>
        <span class="abnormal-card-type type-${item.status.abnormalType}">${reasonMap[item.status.abnormalType] || '异常'}</span>
      </div>
      <div class="abnormal-card-content">
        <div class="abnormal-card-dish">${item.dishName}</div>
        <div class="abnormal-card-reason">${item.status.abnormalReason || item.status.returnReason || ''}</div>
        <div style="font-size:12px;color:#666;margin-top:8px;">
          ${item.status.abnormalTime ? `发生时间: ${item.status.abnormalTime}` : ''}
          ${item.status.returnTime ? `退菜时间: ${item.status.returnTime}` : ''}
        </div>
      </div>
      <div class="abnormal-card-actions">
        ${item.status.responsible ? `<span style="font-size:12px;color:#666;">责任方: ${item.status.responsible === 'kitchen' ? '后厨' : (item.status.responsible === 'front' ? '前厅' : '双方')}</span>` : ''}
        <button class="btn btn-primary" onclick="confirmResponsibility('${item.orderId}', ${item.dishId})">确认处理</button>
      </div>
    </div>
  `).join('') : '<p style="text-align:center;color:#999;padding:20px;">暂无异常待处理</p>';
  
  document.getElementById('cookingItems').innerHTML = cooking.length ? cooking.map(item => `
    <div class="abnormal-card">
      <div class="abnormal-card-header">
        <span class="abnormal-card-table">${item.tableNo}</span>
        <span class="recent-card-status status-processing">制作中</span>
      </div>
      <div class="abnormal-card-content">
        <div class="abnormal-card-dish">${item.dishName}</div>
        <div style="font-size:12px;color:#666;margin-top:8px;">
          ${item.status.cookStart ? `开始制作: ${item.status.cookStart}` : ''}
          <br>制作人: ${item.status.cookOperator || '未知'}
        </div>
      </div>
      <div class="abnormal-card-actions">
        <button class="btn btn-primary" onclick="finishCooking('${item.orderId}', ${item.dishId})">完成出菜</button>
      </div>
    </div>
  `).join('') : '<p style="text-align:center;color:#999;padding:20px;">暂无制作中菜品</p>';
  
  const unsettledOrders = orders.filter(o => !o.cashierSettled && o.status === 'completed');
  document.getElementById('settleItems').innerHTML = unsettledOrders.length ? unsettledOrders.map(order => `
    <div class="order-card" style="border-left-color:#28a745;">
      <div class="order-card-header">
        <span class="order-card-table">${order.tableNo}</span>
        <span>¥${order.totalAmount}</span>
      </div>
      <div class="order-card-items">
        ${order.items.length}个菜品
      </div>
      <button class="btn btn-primary" style="margin-top:10px;" onclick="settleOrder('${order.id}')">确认落账</button>
    </div>
  `).join('') : '<p style="text-align:center;color:#999;padding:20px;">暂无待落账订单</p>';
}

function confirmResponsibility(orderId, dishId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const dish = order.items.find(i => i.dishId === dishId);
  if (!dish) return;
  
  const status = order.dishStatus[dishId];
  const now = new Date().toLocaleString('zh-CN');
  
  order.timeline.push({
    time: now,
    role: 'kitchen',
    action: '责任确认',
    detail: `${dish.name} - ${status.abnormalReason || reasonMap[status.returnReason]}`,
    operator: '后厨-李师傅',
    responsible: status.responsible,
    conclusion: status.responsible === 'kitchen' ? '厨房责任-免单处理' : (status.responsible === 'front' ? '前厅责任-正常结算' : '双方协商处理')
  });
  
  order.dishStatus[dishId] = {
    ...status,
    status: 'cooking',
    cookStart: now,
    cookOperator: '李师傅'
  };
  
  alert(`已确认责任，开始制作: ${dish.name}`);
  renderHandle();
  renderRecentList();
}

function finishCooking(orderId, dishId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const dish = order.items.find(i => i.dishId === dishId);
  if (!dish) return;
  
  const now = new Date().toLocaleString('zh-CN');
  
  order.dishStatus[dishId] = {
    ...order.dishStatus[dishId],
    status: 'ready',
    cookConfirm: now,
    cookOperator: order.dishStatus[dishId].cookOperator
  };
  
  order.timeline.push({
    time: now,
    role: 'kitchen',
    action: '出菜完成',
    detail: `${dish.name}`,
    operator: order.dishStatus[dishId].cookOperator
  });
  
  const allReady = order.items.every(item => order.dishStatus[item.dishId]?.status === 'ready');
  if (allReady) {
    order.status = 'completed';
    order.timeline.push({
      time: now,
      role: 'kitchen',
      action: '订单完成',
      detail: '全部菜品已出',
      operator: '后厨-李师傅'
    });
  }
  
  alert(`出菜完成: ${dish.name}`);
  renderHandle();
  renderRecentList();
}

function settleOrder(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const now = new Date().toLocaleString('zh-CN');
  
  order.cashierSettled = true;
  order.settleTime = now;
  order.settleOperator = '收银员-小王';
  
  order.timeline.push({
    time: now,
    role: 'cashier',
    action: '落账结算',
    detail: `实收¥${order.totalAmount}`,
    operator: '收银员-小王'
  });
  
  alert(`落账成功: ¥${order.totalAmount}`);
  renderOrdersTable();
  renderRecentList();
  renderHandle();
}

function showOrderDetail(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const timelineSorted = [...order.timeline].sort((a, b) => new Date(b.time) - new Date(a.time));
  
  document.getElementById('modalTitle').textContent = `订单详情 - ${order.id}`;
  document.getElementById('modalBody').innerHTML = `
    <div style="margin-bottom:16px;padding:12px;background:#f8f9fa;border-radius:6px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div><strong>桌号:</strong> ${order.tableNo}</div>
        <div><strong>人数:</strong> ${order.people}人</div>
        <div><strong>状态:</strong> ${statusMap[order.status]}</div>
        <div><strong>结算:</strong> ${order.cashierSettled ? `<span style="color:#28a745;">✓已落账</span>` : '<span style="color:#dc3545;">待落账</span>'}</div>
        <div><strong>下单时间:</strong> ${order.createTime}</div>
        <div><strong>总金额:</strong> ¥${order.totalAmount}</div>
      </div>
    </div>
    
    <div style="margin-bottom:16px;">
      <h4 style="margin-bottom:8px;">菜品状态</h4>
      <div class="dish-list">
        ${order.items.map(item => {
          const status = order.dishStatus[item.dishId];
          let statusText = '';
          let statusClass = 'status-pending';
          
          if (status?.status === 'ready') {
            statusText = '已出菜';
            statusClass = 'status-completed';
          } else if (status?.status === 'cooking') {
            statusText = '制作中';
            statusClass = 'status-processing';
          } else if (status?.status === 'return') {
            statusText = '已退菜';
            statusClass = 'status-pending';
          } else if (status?.status === 'abnormal') {
            statusText = reasonMap[status.abnormalType] || reasonMap[status.returnReason] || '异常';
            statusClass = 'status-processing';
          } else {
            statusText = '待制作';
          }
          
          return `
            <div class="dish-item" style="display:flex;justify-content:space-between;align-items:center;">
              <span>${item.name} x${item.quantity} - ¥${item.price * item.quantity}</span>
              <span class="recent-card-status ${statusClass}">${statusText}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <div>
      <h4 style="margin-bottom:8px;">⏱ 时间回看（按时间倒序）</h4>
      <div style="max-height:300px;overflow-y:auto;">
        ${timelineSorted.map((t, idx) => `
          <div style="padding:10px 0;border-bottom:1px solid #e9ecef;${idx === 0 ? 'background:#fff3cd;' : ''}">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="font-weight:600;color:${t.role === 'cashier' ? '#28a745' : (t.role === 'front' ? '#007bff' : '#c41e3a')};">
                ${roleMap[t.role]} · ${t.action}
              </span>
              <span style="font-size:12px;color:#999;">${t.time.split(' ')[1]}</span>
            </div>
            <div style="font-size:13px;color:#333;">${t.detail}</div>
            <div style="font-size:12px;color:#666;margin-top:4px;">
              操作人: ${t.operator || '系统'}
              ${t.responsible ? ` | 责任方: ${t.responsible === 'kitchen' ? '后厨' : (t.responsible === 'front' ? '前厅' : '双方')}` : ''}
              ${t.conclusion ? ` | 结论: ${t.conclusion}` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    ${!order.cashierSettled && order.status === 'completed' ? `
      <button class="btn btn-primary" style="margin-top:16px;width:100%;" onclick="settleOrder('${order.id}');closeModal();">
        落账结算
      </button>
    ` : ''}
  `;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

function initSearchFilters() {
  document.getElementById('recentSearch').addEventListener('input', renderRecentList);
  document.getElementById('recentFilter').addEventListener('change', renderRecentList);
  document.getElementById('ordersSearch').addEventListener('input', renderOrdersTable);
  document.getElementById('ordersFilter').addEventListener('change', renderOrdersTable);
}

function init() {
  updateTime();
  setInterval(updateTime, 1000);
  
  initDishSelect();
  initRoleSelect();
  initNavTabs();
  initSearchFilters();
  
  renderRecentList();
  renderOrdersTable();
  renderAddDish();
  renderReturnDish();
  renderHandle();
}

document.addEventListener('DOMContentLoaded', init);