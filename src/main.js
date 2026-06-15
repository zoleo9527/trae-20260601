const users = [
  { id: '1', name: '王前台', role: '前台', username: 'front', password: '123456' },
  { id: '2', name: '李技师', role: '技师', username: 'tech', password: '123456' },
  { id: '3', name: '张店长', role: '店长', username: 'manager', password: '123456' }
];

let db = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TireShopDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains('workOrders')) {
        const workOrderStore = database.createObjectStore('workOrders', { keyPath: 'id' });
        workOrderStore.createIndex('plateNumber', 'plateNumber', { unique: false });
        workOrderStore.createIndex('customerName', 'customerName', { unique: false });
        workOrderStore.createIndex('status', 'status', { unique: false });
      }
      if (!database.objectStoreNames.contains('balanceRecords')) {
        const balanceStore = database.createObjectStore('balanceRecords', { keyPath: 'id' });
        balanceStore.createIndex('workOrderId', 'workOrderId', { unique: false });
      }
      if (!database.objectStoreNames.contains('inspectionRecords')) {
        const inspectionStore = database.createObjectStore('inspectionRecords', { keyPath: 'id' });
        inspectionStore.createIndex('workOrderId', 'workOrderId', { unique: true });
      }
      if (!database.objectStoreNames.contains('operationLogs')) {
        const logStore = database.createObjectStore('operationLogs', { keyPath: 'id' });
        logStore.createIndex('workOrderId', 'workOrderId', { unique: false });
      }
    };
  });
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function getUserByUsername(username) {
  await initDB();
  return users.find(u => u.username === username) || null;
}

async function createWorkOrder(data) {
  await initDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['workOrders'], 'readwrite');
    transaction.objectStore('workOrders').add({
      id, ...data, balanceRecords: [], inspectionRecord: null, createdAt: now, updatedAt: now,
      needsReinspection: false, balanceUpdatedAfterInspection: false
    }).onsuccess = () => resolve(id);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getWorkOrders(filter = {}) {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['workOrders'], 'readonly');
    transaction.objectStore('workOrders').getAll().onsuccess = async (event) => {
      let results = event.target.result;
      if (filter.plateNumber) results = results.filter(o => o.plateNumber.includes(filter.plateNumber));
      if (filter.customerName) results = results.filter(o => o.customerName.includes(filter.customerName));
      if (filter.status) results = results.filter(o => o.status === filter.status);
      for (const order of results) {
        order.balanceRecords = await getBalanceRecords(order.id);
        order.inspectionRecord = await getInspectionRecord(order.id);
      }
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      resolve(results);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getWorkOrderById(id) {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['workOrders'], 'readonly');
    transaction.objectStore('workOrders').get(id).onsuccess = async (event) => {
      if (!event.target.result) {
        resolve(null);
        return;
      }
      const order = event.target.result;
      order.balanceRecords = await getBalanceRecords(id);
      order.inspectionRecord = await getInspectionRecord(id);
      resolve(order);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function updateWorkOrder(id, data) {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['workOrders'], 'readwrite');
    transaction.objectStore('workOrders').get(id).onsuccess = (event) => {
      const order = event.target.result;
      transaction.objectStore('workOrders').put({
        ...order, ...data, updatedAt: new Date().toISOString()
      }).onsuccess = () => resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function createBalanceRecord(data) {
  await initDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['balanceRecords', 'workOrders', 'inspectionRecords'], 'readwrite');
    transaction.objectStore('balanceRecords').add({
      id, ...data, createdAt: now, updatedAt: now
    }).onsuccess = async () => {
      const order = await getWorkOrderById(data.workOrderId);
      if (order?.inspectionRecord?.status === '质检通过') {
        transaction.objectStore('workOrders').get(data.workOrderId).onsuccess = (e) => {
          const wo = e.target.result;
          wo.needsReinspection = true;
          wo.balanceUpdatedAfterInspection = true;
          wo.updatedAt = now;
          transaction.objectStore('workOrders').put(wo);
        };
        transaction.objectStore('inspectionRecords').index('workOrderId').get(data.workOrderId).onsuccess = (e) => {
          const ir = e.target.result;
          if (ir) {
            ir.status = '待重新质检';
            ir.updatedAt = now;
            transaction.objectStore('inspectionRecords').put(ir);
          }
        };
      }
      resolve(id);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function updateBalanceRecord(id, data) {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['balanceRecords', 'workOrders', 'inspectionRecords'], 'readwrite');
    transaction.objectStore('balanceRecords').get(id).onsuccess = (event) => {
      const record = event.target.result;
      const workOrderId = record.workOrderId;
      transaction.objectStore('balanceRecords').put({
        ...record, ...data, updatedAt: new Date().toISOString()
      }).onsuccess = async () => {
        const order = await getWorkOrderById(workOrderId);
        if (order?.inspectionRecord?.status === '质检通过') {
          const now = new Date().toISOString();
          transaction.objectStore('workOrders').get(workOrderId).onsuccess = (e) => {
            const wo = e.target.result;
            wo.needsReinspection = true;
            wo.balanceUpdatedAfterInspection = true;
            wo.updatedAt = now;
            transaction.objectStore('workOrders').put(wo);
          };
          transaction.objectStore('inspectionRecords').index('workOrderId').get(workOrderId).onsuccess = (e) => {
            const ir = e.target.result;
            if (ir) {
              ir.status = '待重新质检';
              ir.updatedAt = now;
              transaction.objectStore('inspectionRecords').put(ir);
            }
          };
        }
        resolve();
      };
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getBalanceRecords(workOrderId) {
  await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(['balanceRecords'], 'readonly');
    transaction.objectStore('balanceRecords').index('workOrderId').getAll(workOrderId).onsuccess = (event) => {
      const results = event.target.result || [];
      results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      resolve(results);
    };
  });
}

async function createInspectionRecord(data) {
  await initDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['inspectionRecords', 'workOrders'], 'readwrite');
    transaction.objectStore('inspectionRecords').add({
      id, ...data, createdAt: now, updatedAt: now
    }).onsuccess = () => {
      transaction.objectStore('workOrders').get(data.workOrderId).onsuccess = (event) => {
        const wo = event.target.result;
        wo.needsReinspection = false;
        wo.balanceUpdatedAfterInspection = false;
        wo.updatedAt = now;
        transaction.objectStore('workOrders').put(wo);
      };
      resolve(id);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function updateInspectionRecord(id, data) {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['inspectionRecords', 'workOrders'], 'readwrite');
    transaction.objectStore('inspectionRecords').get(id).onsuccess = (event) => {
      const record = event.target.result;
      const workOrderId = record.workOrderId;
      const now = new Date().toISOString();
      transaction.objectStore('inspectionRecords').put({
        ...record, ...data, updatedAt: now
      }).onsuccess = () => {
        if (data.status === '质检通过') {
          transaction.objectStore('workOrders').get(workOrderId).onsuccess = (e) => {
            const wo = e.target.result;
            wo.needsReinspection = false;
            wo.balanceUpdatedAfterInspection = false;
            wo.updatedAt = now;
            transaction.objectStore('workOrders').put(wo);
          };
        }
        resolve();
      };
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getInspectionRecord(workOrderId) {
  await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(['inspectionRecords'], 'readonly');
    transaction.objectStore('inspectionRecords').index('workOrderId').get(workOrderId).onsuccess = (event) => {
      resolve(event.target.result || null);
    };
  });
}

async function createOperationLog(data) {
  await initDB();
  const id = uuidv4();
  return new Promise((resolve) => {
    const transaction = db.transaction(['operationLogs'], 'readwrite');
    transaction.objectStore('operationLogs').add({
      id, ...data, timestamp: new Date().toISOString()
    }).onsuccess = () => resolve();
  });
}

async function getOperationLogs(workOrderId) {
  await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(['operationLogs'], 'readonly');
    let request;
    if (workOrderId) {
      request = transaction.objectStore('operationLogs').index('workOrderId').getAll(workOrderId);
    } else {
      request = transaction.objectStore('operationLogs').getAll();
    }
    request.onsuccess = (event) => {
      const results = event.target.result || [];
      results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      resolve(results);
    };
  });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

let currentUser = null;
let currentView = 'login';
let orders = [];
let selectedOrder = null;

async function render() {
  const app = document.getElementById('app');
  if (currentView === 'login') {
    app.innerHTML = `
      <div class="login-container">
        <div class="login-card">
          <h1>轮胎门店管理系统</h1>
          <p style="text-align: center; color: #64748b; margin-bottom: 24px;">动平衡记录与质检交车系统</p>
          <div class="role-buttons">
            <button class="role-btn active" onclick="selectRole('front')">前台</button>
            <button class="role-btn" onclick="selectRole('tech')">技师</button>
            <button class="role-btn" onclick="selectRole('manager')">店长</button>
          </div>
          <div class="form-group">
            <label>用户名</label>
            <input type="text" id="username" value="front" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" id="password" value="123456" />
          </div>
          <button class="btn btn-primary" style="width: 100%; padding: 12px;" onclick="handleLogin()">登录</button>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; font-size: 12px; color: #64748b; margin-top: 24px;">
            <p>演示账号：</p>
            <ul style="list-style: none; padding: 0;">
              <li>前台: front / 123456</li>
              <li>技师: tech / 123456</li>
              <li>店长: manager / 123456</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  } else if (currentView === 'list') {
    await loadOrders();
    app.innerHTML = `
      <div class="container">
        <div class="page-header">
          <div>
            <h1>工单列表</h1>
            <p style="font-size: 14px; color: #64748b;">当前角色：${currentUser.name} (${currentUser.role})</p>
          </div>
          <div style="display: flex; gap: 12px;">
            ${currentUser.role === '前台' || currentUser.role === '店长' ? `<button class="btn btn-primary" onclick="showCreateOrder()">+ 新建工单</button>` : ''}
            <button class="btn btn-outline" onclick="handleLogout()">退出登录</button>
          </div>
        </div>
        <div class="search-bar">
          <input type="text" id="filter-plate" placeholder="车牌号" oninput="applyFilter()" />
          <input type="text" id="filter-name" placeholder="客户姓名" oninput="applyFilter()" />
          <select id="filter-status" onchange="applyFilter()">
            <option value="">全部状态</option>
            <option value="进行中">进行中</option>
            <option value="已完成">已完成</option>
          </select>
          <button class="btn btn-outline" onclick="resetFilter()">重置</button>
        </div>
        <div class="card">
          <table class="table">
            <thead><tr><th>车牌号</th><th>客户</th><th>车型</th><th>动平衡状态</th><th>质检状态</th><th>工单状态</th><th>创建时间</th><th>操作</th></tr></thead>
            <tbody>
              ${orders.length === 0 ? `<tr><td colspan="8" style="text-align: center; color: #64748b;">暂无工单记录</td></tr>` : orders.map(order => `
                <tr>
                  <td>${order.plateNumber}</td>
                  <td>${order.customerName}</td>
                  <td>${order.vehicleModel || '-'}</td>
                  <td><span class="badge ${getBalanceStatus(order) === '待录入' ? 'badge-info' : getBalanceStatus(order) === '处理中' ? 'badge-warning' : getBalanceStatus(order) === '需复检' ? 'badge-danger' : 'badge-success'}">${getBalanceStatus(order)}</span></td>
                  <td><span class="badge ${getInspectionStatus(order) === '待质检' ? 'badge-info' : getInspectionStatus(order) === '质检中' ? 'badge-warning' : getInspectionStatus(order) === '质检不通过' ? 'badge-danger' : getInspectionStatus(order) === '待重新质检' ? 'badge-warning' : 'badge-success'}">${getInspectionStatus(order)}</span></td>
                  <td><span class="badge ${order.status === '进行中' ? 'badge-warning' : 'badge-success'}">${order.status}</span></td>
                  <td>${formatDate(order.createdAt)}</td>
                  <td><button class="btn btn-outline btn-sm" onclick="viewDetail('${order.id}')">查看详情</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (currentView === 'detail') {
    app.innerHTML = `
      <div class="container">
        <div class="page-header">
          <div style="display: flex; align-items: center; gap: 16px;">
            <button class="btn btn-outline" onclick="handleBack()">← 返回列表</button>
            <h1>工单详情</h1>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="badge ${selectedOrder.status === '进行中' ? 'badge-warning' : 'badge-success'}">${selectedOrder.status}</span>
            <button class="btn btn-outline" onclick="handleLogout()">退出登录</button>
          </div>
        </div>
        <div class="card">
          <div class="order-info">
            <div class="info-row"><span class="label">车牌号</span><span class="value">${selectedOrder.plateNumber}</span></div>
            <div class="info-row"><span class="label">客户姓名</span><span class="value">${selectedOrder.customerName}</span></div>
            <div class="info-row"><span class="label">联系电话</span><span class="value">${selectedOrder.phone || '-'}</span></div>
            <div class="info-row"><span class="label">车型</span><span class="value">${selectedOrder.vehicleModel || '-'}</span></div>
            <div class="info-row"><span class="label">轮胎型号</span><span class="value">${selectedOrder.tireType || '-'}</span></div>
            <div class="info-row"><span class="label">创建时间</span><span class="value">${formatDateTime(selectedOrder.createdAt)}</span></div>
            <div class="info-row"><span class="label">更新时间</span><span class="value">${formatDateTime(selectedOrder.updatedAt)}</span></div>
          </div>
        </div>
        <div class="card">
          <div class="section-header">
            <h2>动平衡记录</h2>
            <div style="display: flex; align-items: center; gap: 12px;">
              ${selectedOrder.balanceUpdatedAfterInspection && selectedOrder.inspectionRecord ? `<span style="color: #f59e0b;">⚠️ 动平衡已修改，质检已重置</span>` : ''}
              ${canAddBalance() ? `<button class="btn btn-primary btn-sm" onclick="showBalanceForm(null)">+ 添加记录</button>` : ''}
            </div>
          </div>
          ${selectedOrder.balanceRecords.length === 0 ? `<p class="empty-text">暂无动平衡记录</p>` : `
            <table class="table">
              <thead><tr><th>位置</th><th>平衡前(g)</th><th>平衡后(g)</th><th>差值(g)</th><th>状态</th><th>时间</th><th>备注</th><th>操作</th></tr></thead>
              <tbody>${selectedOrder.balanceRecords.map(record => `
                <tr>
                  <td>${record.wheelPosition}</td>
                  <td>${record.beforeValue}</td>
                  <td>${record.balanceValue}</td>
                  <td>${record.beforeValue - record.balanceValue}</td>
                  <td><span class="badge ${record.status === '待处理' ? 'badge-info' : record.status === '处理中' ? 'badge-warning' : record.status === '需复检' ? 'badge-danger' : 'badge-success'}">${record.status}</span></td>
                  <td>${formatDateTime(record.updatedAt)}</td>
                  <td>${record.remark || '-'}</td>
                  <td>
                    ${canAddBalance() ? `<button class="btn btn-outline btn-sm" onclick="showBalanceForm('${record.id}')">编辑</button>` : ''}
                    ${canAddBalance() && record.status !== '已完成' ? `<button class="btn btn-success btn-sm" onclick="completeBalance('${record.id}')">完成</button>` : ''}
                  </td>
                </tr>
              `).join('')}</tbody>
            </table>
          `}
        </div>
        <div class="card">
          <div class="section-header">
            <h2>质检交车记录</h2>
            ${canDoInspection() ? `<button class="btn btn-primary btn-sm" onclick="startInspection()" ${!selectedOrder.inspectionRecord && selectedOrder.balanceRecords.length === 0 ? 'disabled' : ''}>${selectedOrder.inspectionRecord?.status === '质检中' ? '继续质检' : '开始质检'}</button>` : ''}
          </div>
          ${!selectedOrder.inspectionRecord ? `<p class="empty-text">暂无质检记录</p>` : `
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span>质检状态</span>
                <span class="badge ${selectedOrder.inspectionRecord.status === '待质检' ? 'badge-info' : selectedOrder.inspectionRecord.status === '质检中' ? 'badge-warning' : selectedOrder.inspectionRecord.status === '质检不通过' ? 'badge-danger' : selectedOrder.inspectionRecord.status === '待重新质检' ? 'badge-warning' : 'badge-success'}">${selectedOrder.inspectionRecord.status}</span>
              </div>
              <div class="info-row"><span class="label">质检时间</span><span class="value">${formatDateTime(selectedOrder.inspectionRecord.updatedAt)}</span></div>
              <div class="info-row"><span class="label">备注</span><span class="value">${selectedOrder.inspectionRecord.remark || '-'}</span></div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px;">
                <div><h4 style="font-size: 14px; color: #64748b; margin-bottom: 8px;">检查项目</h4><div class="tags">${selectedOrder.inspectionRecord.checkItems.map(i => `<span class="tag">${i}</span>`).join('')}</div></div>
                <div><h4 style="font-size: 14px; color: #64748b; margin-bottom: 8px;">合格项</h4><div class="tags tags-success">${selectedOrder.inspectionRecord.passedItems.map(i => `<span class="tag">${i}</span>`).join('')}</div></div>
                <div><h4 style="font-size: 14px; color: #64748b; margin-bottom: 8px;">不合格项</h4><div class="tags tags-danger">${selectedOrder.inspectionRecord.failedItems.map(i => `<span class="tag">${i}</span>`).join('')}</div></div>
              </div>
            </div>
          `}
          ${canCompleteDelivery() ? `<button class="btn btn-success mt-20" onclick="completeDelivery()">确认交车</button>` : ''}
        </div>
        <div class="card">
          <div class="section-header"><h2>操作日志</h2></div>
          <div id="logs-container"></div>
        </div>
      </div>
    `;
    loadLogs();
  }
}

function getBalanceStatus(order) {
  if (order.balanceRecords.length === 0) return '待录入';
  if (order.balanceRecords.some(r => r.status === '待处理' || r.status === '处理中')) return '处理中';
  if (order.balanceRecords.some(r => r.status === '需复检')) return '需复检';
  return '已完成';
}

function getInspectionStatus(order) {
  return order.inspectionRecord ? order.inspectionRecord.status : '待质检';
}

function canAddBalance() {
  return currentUser.role === '技师' || currentUser.role === '店长';
}

function canDoInspection() {
  return currentUser.role === '前台' || currentUser.role === '店长';
}

function canCompleteDelivery() {
  return (currentUser.role === '前台' || currentUser.role === '店长') && selectedOrder.inspectionRecord?.status === '质检通过' && selectedOrder.status === '进行中';
}

async function loadOrders(filter = {}) {
  orders = await getWorkOrders(filter);
}

async function handleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const user = await getUserByUsername(username);
  if (user && user.password === password) {
    currentUser = user;
    currentView = 'list';
    await render();
  } else {
    alert('用户名或密码错误');
  }
}

function handleLogout() {
  currentUser = null;
  currentView = 'login';
  render();
}

function selectRole(role) {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  const user = users.find(u => u.username === role);
  document.getElementById('username').value = user.username;
  document.getElementById('password').value = user.password;
}

function applyFilter() {
  loadOrders({
    plateNumber: document.getElementById('filter-plate').value,
    customerName: document.getElementById('filter-name').value,
    status: document.getElementById('filter-status').value || undefined
  }).then(() => render());
}

function resetFilter() {
  document.getElementById('filter-plate').value = '';
  document.getElementById('filter-name').value = '';
  document.getElementById('filter-status').value = '';
  loadOrders().then(() => render());
}

function showCreateOrder() {
  document.body.innerHTML += `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header"><h2>新建工单</h2><button class="modal-close" onclick="closeModal()">×</button></div>
        <div class="form-group"><label>车牌号 *</label><input type="text" id="form-plate" /></div>
        <div class="form-group"><label>客户姓名 *</label><input type="text" id="form-name" /></div>
        <div class="form-group"><label>联系电话</label><input type="text" id="form-phone" /></div>
        <div class="form-group"><label>车型</label><input type="text" id="form-model" /></div>
        <div class="form-group"><label>轮胎型号</label><input type="text" id="form-tire" /></div>
        <div class="flex-end mt-20">
          <button class="btn btn-outline" onclick="closeModal()">取消</button>
          <button class="btn btn-primary" onclick="submitCreateOrder()">创建工单</button>
        </div>
      </div>
    </div>
  `;
}

async function submitCreateOrder() {
  const plate = document.getElementById('form-plate').value;
  const name = document.getElementById('form-name').value;
  if (!plate || !name) {
    alert('请填写车牌号和客户姓名');
    return;
  }
  const orderId = await createWorkOrder({
    plateNumber: plate,
    customerName: name,
    phone: document.getElementById('form-phone').value,
    vehicleModel: document.getElementById('form-model').value,
    tireType: document.getElementById('form-tire').value,
    createdBy: currentUser.id,
    status: '进行中'
  });
  await createOperationLog({
    workOrderId: orderId,
    action: '创建工单',
    operatorId: currentUser.id,
    operatorName: currentUser.name,
    operatorRole: currentUser.role,
    details: `创建工单: ${plate} - ${name}`
  });
  closeModal();
  await loadOrders();
  render();
}

function closeModal() {
  document.querySelector('.modal-overlay')?.remove();
}

async function viewDetail(orderId) {
  selectedOrder = await getWorkOrderById(orderId);
  currentView = 'detail';
  render();
}

function handleBack() {
  selectedOrder = null;
  currentView = 'list';
  render();
}

function showBalanceForm(recordId) {
  const record = recordId ? selectedOrder.balanceRecords.find(r => r.id === recordId) : null;
  document.body.innerHTML += `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header"><h2>${record ? '编辑动平衡记录' : '添加动平衡记录'}</h2><button class="modal-close" onclick="closeModal()">×</button></div>
        <div class="form-group"><label>车轮位置 *</label><select id="balance-position">
          <option value="">请选择</option>
          <option value="左前轮" ${record?.wheelPosition === '左前轮' ? 'selected' : ''}>左前轮</option>
          <option value="右前轮" ${record?.wheelPosition === '右前轮' ? 'selected' : ''}>右前轮</option>
          <option value="左后轮" ${record?.wheelPosition === '左后轮' ? 'selected' : ''}>左后轮</option>
          <option value="右后轮" ${record?.wheelPosition === '右后轮' ? 'selected' : ''}>右后轮</option>
          <option value="备胎" ${record?.wheelPosition === '备胎' ? 'selected' : ''}>备胎</option>
        </select></div>
        <div class="form-group"><label>平衡前 (g)</label><input type="number" id="balance-before" value="${record?.beforeValue || 0}" min="0" /></div>
        <div class="form-group"><label>平衡后 (g) *</label><input type="number" id="balance-after" value="${record?.balanceValue || 0}" min="0" /></div>
        <div class="form-group"><label>状态</label><select id="balance-status">
          <option value="待处理" ${record?.status === '待处理' ? 'selected' : ''}>待处理</option>
          <option value="处理中" ${record?.status === '处理中' ? 'selected' : ''}>处理中</option>
          <option value="已完成" ${record?.status === '已完成' ? 'selected' : ''}>已完成</option>
          <option value="需复检" ${record?.status === '需复检' ? 'selected' : ''}>需复检</option>
        </select></div>
        <div class="form-group"><label>备注</label><textarea id="balance-remark">${record?.remark || ''}</textarea></div>
        <div class="flex-end mt-20">
          <button class="btn btn-outline" onclick="closeModal()">取消</button>
          <button class="btn btn-primary" onclick="${record ? `submitUpdateBalance('${record.id}')` : 'submitAddBalance()'}">${record ? '保存修改' : '添加记录'}</button>
        </div>
      </div>
    </div>
  `;
}

async function submitAddBalance() {
  const position = document.getElementById('balance-position').value;
  const after = parseInt(document.getElementById('balance-after').value);
  if (!position) {
    alert('请选择车轮位置');
    return;
  }
  await createBalanceRecord({
    workOrderId: selectedOrder.id,
    wheelPosition: position,
    beforeValue: parseInt(document.getElementById('balance-before').value),
    balanceValue: after,
    status: document.getElementById('balance-status').value,
    technicianId: currentUser.id,
    remark: document.getElementById('balance-remark').value
  });
  await createOperationLog({
    workOrderId: selectedOrder.id,
    action: '更新动平衡',
    operatorId: currentUser.id,
    operatorName: currentUser.name,
    operatorRole: currentUser.role,
    details: `添加动平衡记录: ${position}，平衡值: ${after}g`
  });
  closeModal();
  selectedOrder = await getWorkOrderById(selectedOrder.id);
  render();
}

async function submitUpdateBalance(recordId) {
  const record = selectedOrder.balanceRecords.find(r => r.id === recordId);
  const oldValue = record.balanceValue;
  const newValue = parseInt(document.getElementById('balance-after').value);
  await updateBalanceRecord(recordId, {
    wheelPosition: document.getElementById('balance-position').value,
    beforeValue: parseInt(document.getElementById('balance-before').value),
    balanceValue: newValue,
    status: document.getElementById('balance-status').value,
    technicianId: currentUser.id,
    remark: document.getElementById('balance-remark').value
  });
  await createOperationLog({
    workOrderId: selectedOrder.id,
    action: '修改记录',
    operatorId: currentUser.id,
    operatorName: currentUser.name,
    operatorRole: currentUser.role,
    details: `修改动平衡记录: ${record.wheelPosition}，平衡值从 ${oldValue}g 改为 ${newValue}g`
  });
  closeModal();
  selectedOrder = await getWorkOrderById(selectedOrder.id);
  render();
}

async function completeBalance(recordId) {
  const record = selectedOrder.balanceRecords.find(r => r.id === recordId);
  await updateBalanceRecord(recordId, { status: '已完成' });
  await createOperationLog({
    workOrderId: selectedOrder.id,
    action: '完成动平衡',
    operatorId: currentUser.id,
    operatorName: currentUser.name,
    operatorRole: currentUser.role,
    details: `完成动平衡: ${record.wheelPosition}`
  });
  selectedOrder = await getWorkOrderById(selectedOrder.id);
  render();
}

async function startInspection() {
  if (selectedOrder.balanceRecords.length === 0) {
    alert('请先录入动平衡记录');
    return;
  }
  if (!selectedOrder.inspectionRecord) {
    await createInspectionRecord({
      workOrderId: selectedOrder.id,
      status: '质检中',
      inspectorId: currentUser.id,
      checkItems: [],
      passedItems: [],
      failedItems: [],
      remark: ''
    });
  } else {
    await updateInspectionRecord(selectedOrder.inspectionRecord.id, { status: '质检中' });
  }
  await createOperationLog({
    workOrderId: selectedOrder.id,
    action: '开始质检',
    operatorId: currentUser.id,
    operatorName: currentUser.name,
    operatorRole: currentUser.role,
    details: '开始质检流程'
  });
  selectedOrder = await getWorkOrderById(selectedOrder.id);
  showInspectionForm();
}

function showInspectionForm() {
  const checkItems = selectedOrder.inspectionRecord?.checkItems || [
    '动平衡值检查', '轮胎安装紧固', '轮胎磨损检查', '胎压检测', '气门嘴检查', '轮毂清洁度', '配重块安装', '轮胎动平衡测试'
  ];
  const passedItems = selectedOrder.inspectionRecord?.passedItems || [];
  const failedItems = selectedOrder.inspectionRecord?.failedItems || [];
  document.body.innerHTML += `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal-content" style="max-width: 600px;" onclick="event.stopPropagation()">
        <div class="modal-header"><h2>质检检查</h2><button class="modal-close" onclick="closeModal()">×</button></div>
        <div class="form-group">
          <label>检查项目</label>
          <div class="check-list">
            ${checkItems.map(item => `
              <div class="check-item">
                <button type="button" class="btn check-btn ${passedItems.includes(item) ? 'btn-success' : failedItems.includes(item) ? 'btn-danger' : 'btn-outline'}" onclick="toggleCheckItem('${item}')">${item}</button>
                <span class="check-status">${passedItems.includes(item) ? '✓ 合格' : failedItems.includes(item) ? '✗ 不合格' : '未检查'}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="form-group"><label>备注</label><textarea id="inspection-remark">${selectedOrder.inspectionRecord?.remark || ''}</textarea></div>
        <div class="summary-row">
          <div><span style="display: block; font-size: 12px; color: #64748b;">合格项</span><span class="summary-value success" id="summary-passed">${passedItems.length} 项</span></div>
          <div><span style="display: block; font-size: 12px; color: #64748b;">不合格项</span><span class="summary-value danger" id="summary-failed">${failedItems.length} 项</span></div>
        </div>
        <div class="flex-end mt-20">
          <button class="btn btn-outline" onclick="closeModal()">取消</button>
          <button class="btn btn-primary" onclick="submitInspection()">提交质检结果</button>
        </div>
        <script>
          window.currentPassed = [...${JSON.stringify(passedItems)}];
          window.currentFailed = [...${JSON.stringify(failedItems)}];
          window.currentCheckItems = [...${JSON.stringify(checkItems)}];
        </script>
      </div>
    </div>
  `;
}

function toggleCheckItem(item) {
  const passedIdx = window.currentPassed.indexOf(item);
  const failedIdx = window.currentFailed.indexOf(item);
  if (passedIdx === -1 && failedIdx === -1) {
    window.currentPassed.push(item);
  } else if (passedIdx !== -1) {
    window.currentPassed.splice(passedIdx, 1);
    window.currentFailed.push(item);
  } else {
    window.currentFailed.splice(failedIdx, 1);
  }
  updateInspectionUI();
}

function updateInspectionUI() {
  document.getElementById('summary-passed').textContent = `${window.currentPassed.length} 项`;
  document.getElementById('summary-failed').textContent = `${window.currentFailed.length} 项`;
  document.querySelectorAll('.check-btn').forEach(btn => {
    const item = btn.textContent;
    if (window.currentPassed.includes(item)) {
      btn.className = 'btn check-btn btn-success';
      btn.nextElementSibling.textContent = '✓ 合格';
    } else if (window.currentFailed.includes(item)) {
      btn.className = 'btn check-btn btn-danger';
      btn.nextElementSibling.textContent = '✗ 不合格';
    } else {
      btn.className = 'btn check-btn btn-outline';
      btn.nextElementSibling.textContent = '未检查';
    }
  });
}

async function submitInspection() {
  if (window.currentPassed.length + window.currentFailed.length === 0) {
    alert('请至少选择一项检查结果');
    return;
  }
  const status = window.currentFailed.length > 0 ? '质检不通过' : '质检通过';
  if (!selectedOrder.inspectionRecord) {
    await createInspectionRecord({
      workOrderId: selectedOrder.id,
      status,
      inspectorId: currentUser.id,
      checkItems: window.currentCheckItems,
      passedItems: window.currentPassed,
      failedItems: window.currentFailed,
      remark: document.getElementById('inspection-remark').value
    });
  } else {
    await updateInspectionRecord(selectedOrder.inspectionRecord.id, {
      status,
      inspectorId: currentUser.id,
      checkItems: window.currentCheckItems,
      passedItems: window.currentPassed,
      failedItems: window.currentFailed,
      remark: document.getElementById('inspection-remark').value
    });
  }
  await createOperationLog({
    workOrderId: selectedOrder.id,
    action: status === '质检通过' ? '质检通过' : '质检不通过',
    operatorId: currentUser.id,
    operatorName: currentUser.name,
    operatorRole: currentUser.role,
    details: `${status}: 合格项(${window.currentPassed.length})，不合格项(${window.currentFailed.length})`
  });
  closeModal();
  selectedOrder = await getWorkOrderById(selectedOrder.id);
  render();
}

async function completeDelivery() {
  if (!selectedOrder.inspectionRecord || selectedOrder.inspectionRecord.status !== '质检通过') {
    alert('必须先完成质检且质检通过才能交车');
    return;
  }
  await updateWorkOrder(selectedOrder.id, { status: '已完成' });
  await createOperationLog({
    workOrderId: selectedOrder.id,
    action: '交车完成',
    operatorId: currentUser.id,
    operatorName: currentUser.name,
    operatorRole: currentUser.role,
    details: '工单完成，客户已取车'
  });
  selectedOrder = await getWorkOrderById(selectedOrder.id);
  render();
}

async function loadLogs() {
  const logs = await getOperationLogs(selectedOrder.id);
  const container = document.getElementById('logs-container');
  if (logs.length === 0) {
    container.innerHTML = '<p class="empty-text">暂无操作日志</p>';
    return;
  }
  container.innerHTML = `
    <div class="log-list">
      ${logs.map(log => `
        <div class="log-item">
          <div class="log-header"><span class="log-action">${log.action}</span><span class="log-time">${formatDateTime(log.timestamp)}</span></div>
          <div style="font-size: 13px; color: #64748b;">${log.operatorName} (${log.operatorRole})</div>
          <div style="font-size: 14px;">${log.details}</div>
        </div>
      `).join('')}
    </div>
  `;
}

render();
