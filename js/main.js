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
}

function generateAbnormalOrders() {
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
}

function getRecentOrders(orders) {
  return orders.filter(o => o.status !== 'completed').slice(0, 6);
}

function getProductionItems(orders) {
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
}

function getPendingAddItems(orders) {
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
}

function getPendingReturnItems(orders) {
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
}

let orders = generateOrders();
let abnormalOrders = generateAbnormalOrders();

const statusMap = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成'
};

const reasonMap = {
  customer: '顾客要求',
  miss: '漏单补菜',
  error: '操作失误',
  other: '其他',
  'no-material': '材料不足',
  timeout: '超时未上',
  quality: '菜品质量',
  'order-error': '点单错误'
};

const responsibleMap = {
  front: '前厅',
  kitchen: '后厨',
  both: '双方协商'
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
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.style.display = 'inline-block';
  });
  
  if (role === 'front') {
    document.querySelector('[data-tab="production"]').style.display = 'none';
  } else if (role === 'kitchen') {
    document.querySelector('[data-tab="add-dish"]').style.display = 'none';
    document.querySelector('[data-tab="return-dish"]').style.display = 'none';
  } else if (role === 'cashier') {
    document.querySelector('[data-tab="add-dish"]').style.display = 'none';
    document.querySelector('[data-tab="return-dish"]').style.display = 'none';
    document.querySelector('[data-tab="production"]').style.display = 'none';
  }
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
  else if (tabName === 'add-dish') renderPendingAddList();
  else if (tabName === 'return-dish') renderPendingReturnList();
  else if (tabName === 'production') renderProductionBoard();
  else if (tabName === 'abnormal') renderAbnormalList();
}

function renderRecentList() {
  const search = document.getElementById('recentSearch').value.toLowerCase();
  const filter = document.getElementById('recentFilter').value;
  
  let filtered = getRecentOrders(orders);
  
  if (filter !== 'all') {
    filtered = filtered.filter(o => o.status === filter);
  }
  
  if (search) {
    filtered = filtered.filter(o => 
      o.tableNo.toLowerCase().includes(search) || 
      o.id.toLowerCase().includes(search)
    );
  }
  
  const container = document.getElementById('recentList');
  container.innerHTML = filtered.map(order => `
    <div class="recent-card" onclick="showOrderDetail('${order.id}')">
      <div class="recent-card-header">
        <span class="recent-card-table">${order.tableNo}</span>
        <span class="recent-card-status status-${order.status}">${statusMap[order.status]}</span>
      </div>
      <div class="recent-card-info">
        <span>${order.id}</span>
        <span>${order.people}人</span>
      </div>
      <div class="recent-card-items">
        ${order.items.slice(0, 3).map(item => `
          <div class="recent-card-item">
            <span>${item.name} x${item.quantity}</span>
            <span>¥${item.price * item.quantity}</span>
          </div>
        `).join('')}
        ${order.items.length > 3 ? `<div class="recent-card-item">... 还有${order.items.length - 3}项</div>` : ''}
      </div>
    </div>
  `).join('');
}

function renderOrdersTable() {
  const search = document.getElementById('ordersSearch').value.toLowerCase();
  const filter = document.getElementById('ordersFilter').value;
  
  let filtered = orders;
  
  if (filter !== 'all') {
    filtered = filtered.filter(o => o.status === filter);
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
      <td><span class="recent-card-status status-${order.status}">${statusMap[order.status]}</span></td>
      <td>${order.createTime}</td>
      <td>¥${order.totalAmount}</td>
      <td class="order-actions">
        <button class="btn btn-primary" onclick="showOrderDetail('${order.id}')">详情</button>
        ${order.status !== 'completed' ? `<button class="btn btn-secondary" onclick="completeOrder('${order.id}')">完成</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function renderPendingAddList() {
  const pendingAdds = getPendingAddItems(orders);
  
  const container = document.getElementById('pendingAddList');
  if (pendingAdds.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无待确认加菜</p>';
    return;
  }
  
  container.innerHTML = pendingAdds.map(item => `
    <div class="add-item">
      <div class="add-item-header">
        <span class="add-item-table">${item.tableNo}</span>
        <span class="recent-card-status status-${item.status}">待确认</span>
      </div>
      <div class="add-item-dish">${item.name} x${item.quantity} - ¥${item.price * item.quantity}</div>
      <div class="add-item-info">原因: ${reasonMap[item.reason] || item.reason}</div>
      <button class="btn btn-primary" style="margin-top: 8px; padding: 4px 12px; font-size: 12px;" onclick="confirmAddItem('${item.orderId}', ${item.dishId})">确认加菜</button>
    </div>
  `).join('');
}

function renderPendingReturnList() {
  const pendingReturns = getPendingReturnItems(orders);
  
  const container = document.getElementById('pendingReturnList');
  if (pendingReturns.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无待处理退菜</p>';
    return;
  }
  
  container.innerHTML = pendingReturns.map(item => `
    <div class="return-item">
      <div class="return-item-header">
        <span class="return-item-table">${item.tableNo}</span>
        <span class="recent-card-status status-${item.status}">待处理</span>
      </div>
      <div class="return-item-dish">${item.name} x${item.quantity} - ¥${item.price * item.quantity}</div>
      <div class="return-item-info">原因: ${reasonMap[item.reason] || item.reason}</div>
      <div class="return-item-info">责任方: ${responsibleMap[item.responsible] || item.responsible}</div>
      <button class="btn btn-primary" style="margin-top: 8px; padding: 4px 12px; font-size: 12px;" onclick="confirmReturnItem('${item.orderId}', ${item.dishId})">确认退菜</button>
    </div>
  `).join('');
}

function renderProductionBoard() {
  const search = document.getElementById('productionSearch').value.toLowerCase();
  const filter = document.getElementById('productionFilter').value;
  
  let items = getProductionItems(orders);
  
  if (filter !== 'all') {
    items = items.filter(item => item.status === filter);
  }
  
  if (search) {
    items = items.filter(item => 
      item.tableNo.toLowerCase().includes(search) || 
      item.dishName.toLowerCase().includes(search)
    );
  }
  
  const pending = items.filter(item => item.status === 'pending');
  const cooking = items.filter(item => item.status === 'cooking');
  const ready = items.filter(item => item.status === 'ready');
  
  document.getElementById('pendingProduction').innerHTML = pending.map(item => `
    <div class="production-item">
      <div class="production-item-header">
        <span class="production-item-table">${item.tableNo}</span>
        <span>x${item.quantity}</span>
      </div>
      <div class="production-item-dish">${item.dishName}</div>
      <div class="production-item-time">下单时间: ${item.createTime}</div>
      <div class="production-item-actions">
        <button class="btn btn-primary" onclick="startCooking('${item.orderId}', ${item.dishId})">开始制作</button>
      </div>
    </div>
  `).join('');
  
  document.getElementById('cookingProduction').innerHTML = cooking.map(item => `
    <div class="production-item">
      <div class="production-item-header">
        <span class="production-item-table">${item.tableNo}</span>
        <span>x${item.quantity}</span>
      </div>
      <div class="production-item-dish">${item.dishName}</div>
      <div class="production-item-time">下单时间: ${item.createTime}</div>
      <div class="production-item-actions">
        <button class="btn btn-primary" onclick="finishCooking('${item.orderId}', ${item.dishId})">完成出菜</button>
      </div>
    </div>
  `).join('');
  
  document.getElementById('readyProduction').innerHTML = ready.map(item => `
    <div class="production-item">
      <div class="production-item-header">
        <span class="production-item-table">${item.tableNo}</span>
        <span>x${item.quantity}</span>
      </div>
      <div class="production-item-dish">${item.dishName}</div>
      <div class="production-item-time">下单时间: ${item.createTime}</div>
    </div>
  `).join('');
}

function renderAbnormalList() {
  const search = document.getElementById('abnormalSearch').value.toLowerCase();
  const filter = document.getElementById('abnormalFilter').value;
  
  let filtered = abnormalOrders;
  
  if (filter !== 'all') {
    filtered = filtered.filter(o => o.type === filter);
  }
  
  if (search) {
    filtered = filtered.filter(o => 
      o.tableNo.toLowerCase().includes(search) || 
      o.id.toLowerCase().includes(search) ||
      o.orderId.toLowerCase().includes(search)
    );
  }
  
  const container = document.getElementById('abnormalList');
  container.innerHTML = filtered.map(order => `
    <div class="abnormal-card ${order.type}">
      <div class="abnormal-card-header">
        <span class="abnormal-card-table">${order.tableNo}</span>
        <span class="abnormal-card-type type-${order.type}">${order.typeName}</span>
      </div>
      <div class="abnormal-card-content">
        <div class="abnormal-card-dish">${order.dishName} x${order.quantity}</div>
        <div class="abnormal-card-reason">${order.reason}</div>
      </div>
      <div style="font-size: 12px; color: #666; margin-bottom: 12px;">
        订单号: ${order.orderId}<br>
        时间: ${order.createTime}
        ${order.handler ? `<br>处理人: ${order.handler}` : ''}
      </div>
      <div class="abnormal-card-actions">
        ${order.status === 'pending' ? `
          <button class="btn btn-primary" onclick="handleAbnormal('${order.id}')">处理</button>
          <button class="btn btn-secondary" onclick="ignoreAbnormal('${order.id}')">忽略</button>
        ` : `
          <button class="btn btn-secondary" onclick="showAbnormalDetail('${order.id}')">查看详情</button>
        `}
      </div>
    </div>
  `).join('');
}

function showOrderDetail(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  document.getElementById('modalTitle').textContent = `订单详情 - ${order.id}`;
  document.getElementById('modalBody').innerHTML = `
    <div style="margin-bottom: 16px;">
      <div><strong>桌号:</strong> ${order.tableNo}</div>
      <div><strong>人数:</strong> ${order.people}人</div>
      <div><strong>状态:</strong> <span class="recent-card-status status-${order.status}">${statusMap[order.status]}</span></div>
      <div><strong>下单时间:</strong> ${order.createTime}</div>
      <div><strong>总金额:</strong> ¥${order.totalAmount}</div>
    </div>
    <div>
      <h4>菜品列表</h4>
      <div class="dish-list">
        ${order.items.map(item => `
          <div class="dish-item">
            <span>${item.name} x${item.quantity}</span>
            <span>¥${item.price * item.quantity}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ${order.addItems.length > 0 ? `
      <div style="margin-top: 16px;">
        <h4>加菜记录</h4>
        <div class="dish-list">
          ${order.addItems.map(item => `
            <div class="dish-item">
              <span>${item.name} x${item.quantity} (${reasonMap[item.reason]})</span>
              <span>¥${item.price * item.quantity}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    ${order.returnItems.length > 0 ? `
      <div style="margin-top: 16px;">
        <h4>退菜记录</h4>
        <div class="dish-list">
          ${order.returnItems.map(item => `
            <div class="dish-item">
              <span>${item.name} x${item.quantity} (${reasonMap[item.reason]})</span>
              <span>-¥${item.price * item.quantity}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function showAbnormalDetail(abnormalId) {
  const abnormal = abnormalOrders.find(o => o.id === abnormalId);
  if (!abnormal) return;
  
  document.getElementById('modalTitle').textContent = `异常单详情 - ${abnormal.id}`;
  document.getElementById('modalBody').innerHTML = `
    <div style="margin-bottom: 16px;">
      <div><strong>类型:</strong> <span class="abnormal-card-type type-${abnormal.type}">${abnormal.typeName}</span></div>
      <div><strong>桌号:</strong> ${abnormal.tableNo}</div>
      <div><strong>订单号:</strong> ${abnormal.orderId}</div>
    </div>
    <div>
      <h4>菜品信息</h4>
      <div style="padding: 12px; background: #f8f9fa; border-radius: 6px;">
        <div><strong>菜品:</strong> ${abnormal.dishName}</div>
        <div><strong>数量:</strong> ${abnormal.quantity}</div>
        <div><strong>原因:</strong> ${abnormal.reason}</div>
        <div><strong>时间:</strong> ${abnormal.createTime}</div>
        <div><strong>处理状态:</strong> ${abnormal.status === 'pending' ? '待处理' : '处理中'}</div>
        ${abnormal.handler ? `<div><strong>处理人:</strong> ${abnormal.handler}</div>` : ''}
      </div>
    </div>
  `;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

function submitAddDish() {
  const tableNo = document.getElementById('addTableNo').value;
  const dishId = parseInt(document.getElementById('addDishSelect').value);
  const quantity = parseInt(document.getElementById('addDishQty').value);
  const reason = document.getElementById('addReason').value;
  const remark = document.getElementById('addRemark').value;
  
  if (!tableNo || !dishId || !quantity) {
    alert('请填写完整信息');
    return;
  }
  
  const dish = dishes.find(d => d.id === dishId);
  if (!dish) {
    alert('菜品不存在');
    return;
  }
  
  let order = orders.find(o => o.tableNo === tableNo && o.status !== 'completed');
  
  if (!order) {
    order = {
      id: `DD${Date.now()}`,
      tableNo,
      people: 0,
      status: 'processing',
      createTime: new Date().toLocaleString('zh-CN'),
      totalAmount: 0,
      items: [],
      addItems: [],
      returnItems: []
    };
    orders.push(order);
  }
  
  order.addItems.push({
    dishId,
    name: dish.name,
    quantity,
    price: dish.price,
    reason,
    remark,
    status: 'pending'
  });
  
  order.totalAmount += dish.price * quantity;
  
  alert(`加菜成功: ${dish.name} x${quantity}`);
  
  document.getElementById('addTableNo').value = '';
  document.getElementById('addDishSelect').value = '';
  document.getElementById('addDishQty').value = 1;
  document.getElementById('addReason').value = 'customer';
  document.getElementById('addRemark').value = '';
  
  renderPendingAddList();
  renderRecentList();
}

function submitReturnDish() {
  const tableNo = document.getElementById('returnTableNo').value;
  const dishId = parseInt(document.getElementById('returnDishSelect').value);
  const quantity = parseInt(document.getElementById('returnDishQty').value);
  const reason = document.getElementById('returnReason').value;
  const responsible = document.getElementById('returnResponsible').value;
  const remark = document.getElementById('returnRemark').value;
  
  if (!tableNo || !dishId || !quantity || !reason) {
    alert('请填写完整信息');
    return;
  }
  
  const dish = dishes.find(d => d.id === dishId);
  if (!dish) {
    alert('菜品不存在');
    return;
  }
  
  const order = orders.find(o => o.tableNo === tableNo && o.status !== 'completed');
  if (!order) {
    alert('未找到该桌号的订单');
    return;
  }
  
  const existingItem = order.items.find(item => item.dishId === dishId);
  if (!existingItem) {
    alert('该菜品不在订单中');
    return;
  }
  
  order.returnItems.push({
    dishId,
    name: dish.name,
    quantity,
    price: dish.price,
    reason,
    responsible,
    remark,
    status: 'pending'
  });
  
  order.totalAmount -= dish.price * quantity;
  
  if (reason === 'no-material' || reason === 'timeout' || reason === 'review-fail') {
    abnormalOrders.push({
      id: `YC${Date.now()}`,
      orderId: order.id,
      tableNo: order.tableNo,
      type: reason === 'no-material' ? 'no-material' : (reason === 'timeout' ? 'timeout' : 'review-fail'),
      typeName: reason === 'no-material' ? '缺材料' : (reason === 'timeout' ? '超时' : '复核不通过'),
      dishName: dish.name,
      quantity,
      reason: remark || (reason === 'no-material' ? '材料不足' : (reason === 'timeout' ? '超时未上' : '复核不通过')),
      createTime: new Date().toLocaleString('zh-CN'),
      status: 'pending',
      handler: ''
    });
  }
  
  alert(`退菜成功: ${dish.name} x${quantity}`);
  
  document.getElementById('returnTableNo').value = '';
  document.getElementById('returnDishSelect').value = '';
  document.getElementById('returnDishQty').value = 1;
  document.getElementById('returnReason').value = '';
  document.getElementById('returnResponsible').value = 'front';
  document.getElementById('returnRemark').value = '';
  
  renderPendingReturnList();
  renderRecentList();
  renderAbnormalList();
}

function confirmAddItem(orderId, dishId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const addItem = order.addItems.find(item => item.dishId === dishId);
  if (!addItem) return;
  
  addItem.status = 'completed';
  
  const existingItem = order.items.find(item => item.dishId === dishId);
  if (existingItem) {
    existingItem.quantity += addItem.quantity;
  } else {
    order.items.push({
      dishId: addItem.dishId,
      name: addItem.name,
      quantity: addItem.quantity,
      price: addItem.price,
      status: 'pending'
    });
  }
  
  alert(`已确认加菜: ${addItem.name}`);
  renderPendingAddList();
  renderRecentList();
  renderProductionBoard();
}

function confirmReturnItem(orderId, dishId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const returnItem = order.returnItems.find(item => item.dishId === dishId);
  if (!returnItem) return;
  
  returnItem.status = 'completed';
  
  const existingItem = order.items.find(item => item.dishId === dishId);
  if (existingItem) {
    existingItem.quantity -= returnItem.quantity;
    if (existingItem.quantity <= 0) {
      order.items = order.items.filter(item => item.dishId !== dishId);
    }
  }
  
  alert(`已确认退菜: ${returnItem.name}`);
  renderPendingReturnList();
  renderRecentList();
}

function startCooking(orderId, dishId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const item = order.items.find(item => item.dishId === dishId);
  if (item) {
    item.status = 'cooking';
  }
  
  const addItem = order.addItems.find(item => item.dishId === dishId);
  if (addItem) {
    addItem.status = 'cooking';
  }
  
  renderProductionBoard();
}

function finishCooking(orderId, dishId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const item = order.items.find(item => item.dishId === dishId);
  if (item) {
    item.status = 'ready';
  }
  
  const addItem = order.addItems.find(item => item.dishId === dishId);
  if (addItem) {
    addItem.status = 'completed';
  }
  
  const allReady = order.items.every(item => item.status === 'ready');
  if (allReady) {
    order.status = 'completed';
  }
  
  renderProductionBoard();
  renderRecentList();
}

function completeOrder(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  order.status = 'completed';
  order.items.forEach(item => item.status = 'ready');
  
  alert(`订单 ${orderId} 已完成`);
  renderOrdersTable();
  renderRecentList();
}

function handleAbnormal(abnormalId) {
  const abnormal = abnormalOrders.find(o => o.id === abnormalId);
  if (!abnormal) return;
  
  abnormal.status = 'processing';
  abnormal.handler = '当前用户';
  
  alert(`异常单 ${abnormalId} 已开始处理`);
  renderAbnormalList();
}

function ignoreAbnormal(abnormalId) {
  if (!confirm('确定要忽略这个异常单吗？')) return;
  
  abnormalOrders = abnormalOrders.filter(o => o.id !== abnormalId);
  renderAbnormalList();
}

function exportOrders() {
  const data = orders.map(order => ({
    id: order.id,
    tableNo: order.tableNo,
    people: order.people,
    status: statusMap[order.status],
    createTime: order.createTime,
    totalAmount: order.totalAmount,
    items: order.items.map(item => `${item.name} x${item.quantity}`).join(', ')
  }));
  
  const csv = ['单号,桌号,人数,状态,下单时间,金额,菜品'].concat(
    data.map(o => `${o.id},${o.tableNo},${o.people},${o.status},${o.createTime},${o.totalAmount},"${o.items}"`)
  ).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `订单导出_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`;
  link.click();
}

function updateReturnDishSelect() {
  const tableNo = document.getElementById('returnTableNo').value;
  const select = document.getElementById('returnDishSelect');
  
  select.innerHTML = '<option value="">请选择菜品</option>';
  
  if (!tableNo) return;
  
  const order = orders.find(o => o.tableNo === tableNo && o.status !== 'completed');
  if (!order) return;
  
  order.items.forEach(item => {
    const option = document.createElement('option');
    option.value = item.dishId;
    option.textContent = `${item.name} x${item.quantity} - ¥${item.price}`;
    select.appendChild(option);
  });
}

function initSearchFilters() {
  document.getElementById('recentSearch').addEventListener('input', renderRecentList);
  document.getElementById('recentFilter').addEventListener('change', renderRecentList);
  document.getElementById('ordersSearch').addEventListener('input', renderOrdersTable);
  document.getElementById('ordersFilter').addEventListener('change', renderOrdersTable);
  document.getElementById('addDishSearch').addEventListener('input', () => {});
  document.getElementById('returnDishSearch').addEventListener('input', () => {});
  document.getElementById('productionSearch').addEventListener('input', renderProductionBoard);
  document.getElementById('productionFilter').addEventListener('change', renderProductionBoard);
  document.getElementById('abnormalSearch').addEventListener('input', renderAbnormalList);
  document.getElementById('abnormalFilter').addEventListener('change', renderAbnormalList);
  
  document.getElementById('returnTableNo').addEventListener('input', updateReturnDishSelect);
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
  renderPendingAddList();
  renderPendingReturnList();
  renderProductionBoard();
  renderAbnormalList();
}

document.addEventListener('DOMContentLoaded', init);