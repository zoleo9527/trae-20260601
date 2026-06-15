import { getUserByUsername, createWorkOrder, getWorkOrders, createBalanceRecord, updateBalanceRecord, createInspectionRecord, updateInspectionRecord, updateWorkOrder, createOperationLog, getOperationLogs } from './lib/db.js';

const users = [
  { id: '1', name: '王前台', role: '前台', username: 'front', password: '123456' },
  { id: '2', name: '李技师', role: '技师', username: 'tech', password: '123456' },
  { id: '3', name: '张店长', role: '店长', username: 'manager', password: '123456' }
];

let currentUser = null;
let currentView = 'login';
let orders = [];
let selectedOrder = null;

async function init() {
  await render();
}

async function render() {
  const app = document.getElementById('app');
  
  if (currentView === 'login') {
    app.innerHTML = renderLogin();
    bindLoginEvents();
  } else if (currentView === 'list') {
    await loadOrders();
    app.innerHTML = renderOrderList();
    bindOrderListEvents();
  } else if (currentView === 'detail') {
    app.innerHTML = renderOrderDetail();
    bindDetailEvents();
  }
}

function renderLogin() {
  return `
    <div class="login-container">
      <div class="login-card">
        <h1>轮胎门店管理系统</h1>
        <p style="text-align: center; color: #64748b; margin-bottom: 24px;">动平衡记录与质检交车系统</p>
        <div class="role-buttons">
          <button class="role-btn active" data-role="front">前台</button>
          <button class="role-btn" data-role="tech">技师</button>
          <button class="role-btn" data-role="manager">店长</button>
        </div>
        <div class="form-group">
          <label>用户名</label>
          <input type="text" id="username" value="front" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" id="password" value="123456" />
        </div>
        <button class="btn btn-primary" style="width: 100%; padding: 12px;" id="login-btn">登录</button>
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
}

function bindLoginEvents() {
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const role = btn.dataset.role;
      const user = users.find(u => u.username === role);
      document.getElementById('username').value = user.username;
      document.getElementById('password').value = user.password;
    });
  });

  document.getElementById('login-btn').addEventListener('click', async () => {
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
  });
}

async function loadOrders(filter = {}) {
  orders = await getWorkOrders(filter);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
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

function renderOrderList() {
  return `
    <div class="container">
      <div class="page-header">
        <div>
          <h1>工单列表</h1>
          <p style="font-size: 14px; color: #64748b;">当前角色：${currentUser.name} (${currentUser.role})</p>
        </div>
        <div style="display: flex; gap: 12px;">
          ${currentUser.role === '前台' || currentUser.role === '店长' ? `
            <button class="btn btn-primary" id="create-order-btn">+ 新建工单</button>
          ` : ''}
          <button class="btn btn-outline" id="logout-btn">退出登录</button>
        </div>
      </div>
      <div class="search-bar">
        <input type="text" id="filter-plate" placeholder="车牌号" />
        <input type="text" id="filter-name" placeholder="客户姓名" />
        <select id="filter-status">
          <option value="">全部状态</option>
          <option value="进行中">进行中</option>
          <option value="已完成">已完成</option>
        </select>
        <button class="btn btn-outline" id="reset-filter">重置</button>
      </div>
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>车牌号</th>
              <th>客户</th>
              <th>车型</th>
              <th>动平衡状态</th>
              <th>质检状态</th>
              <th>工单状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${orders.length === 0 ? `
              <tr><td colspan="8" style="text-align: center; color: #64748b;">暂无工单记录</td></tr>
            ` : orders.map(order => `
              <tr data-order-id="${order.id}">
                <td>${order.plateNumber}</td>
                <td>${order.customerName}</td>
                <td>${order.vehicleModel || '-'}</td>
                <td>
                  <span class="badge ${getBalanceStatus(order) === '待录入' ? 'badge-info' : getBalanceStatus(order) === '处理中' ? 'badge-warning' : getBalanceStatus(order) === '需复检' ? 'badge-danger' : 'badge-success'}">
                    ${getBalanceStatus(order)}
                  </span>
                </td>
                <td>
                  <span class="badge ${getInspectionStatus(order) === '待质检' ? 'badge-info' : getInspectionStatus(order) === '质检中' ? 'badge-warning' : getInspectionStatus(order) === '质检不通过' ? 'badge-danger' : 'badge-success'}">
                    ${getInspectionStatus(order)}
                  </span>
                </td>
                <td>
                  <span class="badge ${order.status === '进行中' ? 'badge-warning' : 'badge-success'}">${order.status}</span>
                </td>
                <td>${formatDate(order.createdAt)}</td>
                <td><button class="btn btn-outline btn-sm view-detail-btn">查看详情</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindOrderListEvents() {
  document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    currentView = 'login';
    render();
  });

  document.getElementById('create-order-btn')?.addEventListener('click', () => {
    document.body.innerHTML += `
      <div class="modal-overlay" id="create-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>新建工单</h2>
            <button class="modal-close" id="close-create-modal">×</button>
          </div>
          <div class="form-group"><label>车牌号 *</label><input type="text" id="form-plate" /></div>
          <div class="form-group"><label>客户姓名 *</label><input type="text" id="form-name" /></div>
          <div class="form-group"><label>联系电话</label><input type="text" id="form-phone" /></div>
          <div class="form-group"><label>车型</label><input type="text" id="form-model" /></div>
          <div class="form-group"><label>轮胎型号</label><input type="text" id="form-tire" /></div>
          <div class="flex-end mt-20">
            <button class="btn btn-outline" id="cancel-create">取消</button>
            <button class="btn btn-primary" id="submit-create">创建工单</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('close-create-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-create').addEventListener('click', closeModal);
    document.getElementById('submit-create').addEventListener('click', async () => {
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
      await render();
    });
  });

  document.querySelectorAll('.view-detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      const orderId = row.dataset.orderId;
      selectedOrder = orders.find(o => o.id === orderId);
      currentView = 'detail';
      render();
    });
  });

  document.getElementById('filter-plate').addEventListener('input', applyFilter);
  document.getElementById('filter-name').addEventListener('input', applyFilter);
  document.getElementById('filter-status').addEventListener('change', applyFilter);
  document.getElementById('reset-filter').addEventListener('click', async () => {
    document.getElementById('filter-plate').value = '';
    document.getElementById('filter-name').value = '';
    document.getElementById('filter-status').value = '';
    await loadOrders();
    await render();
  });
}

function closeModal() {
  document.querySelector('.modal-overlay')?.remove();
}

async function applyFilter() {
  const filter = {
    plateNumber: document.getElementById('filter-plate').value,
    customerName: document.getElementById('filter-name').value,
    status: document.getElementById('filter-status').value || undefined
  };
  await loadOrders(filter);
  await render();
}

function renderOrderDetail() {
  const hasBalanceChanged = selectedOrder._balanceChanged || false;
  return `
    <div class="container">
      <div class="page-header">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button class="btn btn-outline" id="back-btn">← 返回列表</button>
          <h1>工单详情</h1>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="badge ${selectedOrder.status === '进行中' ? 'badge-warning' : 'badge-success'}">${selectedOrder.status}</span>
          <button class="btn btn-outline" id="logout-detail-btn">退出登录</button>
        </div>
      </div>
      <div class="card">
        <div class="order-info">
          <div class="info-row"><span class="label">车牌号</span><span class="value">${selectedOrder.plateNumber}</span></div>
          <div class="info-row"><span class="label">客户姓名</span><span class="value">${selectedOrder.customerName}</span></div>
          <div class="info-row"><span class="label">联系电话</span><span class="value">${selectedOrder.phone || '-'}</span></div>
          <div class="info-row"><span class="label">车型</span><span class="value">${selectedOrder.vehicleModel || '-'}</span></div>
          <div class="info-row"><span class="label">轮胎型号</span><span class="value">${selectedOrder.tireType || '-'}</span></div>
          <div class="info-row"><span class="label">创建时间</span><span class="value">${formatDate(selectedOrder.createdAt)}</span></div>
        </div>
      </div>
      <div class="card">
        <div class="section-header">
          <h2>动平衡记录</h2>
          <div style="display: flex; gap: 12px;">
            ${hasBalanceChanged && selectedOrder.inspectionRecord ? `<div style="color: #f59e0b;">⚠️ 动平衡记录已修改，请重新质检</div>` : ''}
            ${(currentUser.role === '技师' || currentUser.role === '店长') ? `<button class="btn btn-primary btn-sm" id="add-balance-btn">+ 添加记录</button>` : ''}
          </div>
        </div>
        ${selectedOrder.balanceRecords.length === 0 ? `
          <p class="empty-text">暂无动平衡记录</p>
        ` : `
          <table class="table">
            <thead>
              <tr><th>位置</th><th>平衡前(g)</th><th>平衡后(g)</th><th>差值(g)</th><th>状态</th><th>时间</th><th>备注</th><th>操作</th></tr>
            </thead>
            <tbody>
              ${selectedOrder.balanceRecords.map(r => `
                <tr data-record-id="${r.id}">
                  <td>${r.wheelPosition}</td>
                  <td>${r.beforeValue}</td>
                  <td>${r.balanceValue}</td>
                  <td>${r.beforeValue - r.balanceValue}</td>
                  <td><span class="badge ${r.status === '待处理' ? 'badge-info' : r.status === '处理中' ? 'badge-warning' : r.status === '需复检' ? 'badge-danger' : 'badge-success'}">${r.status}</span></td>
                  <td>${formatDate(r.updatedAt)}</td>
                  <td>${r.remark || '-'}</td>
                  <td>
                    ${(currentUser.role === '技师' || currentUser.role === '店长') ? `
                      <button class="btn btn-outline btn-sm edit-balance-btn">编辑</button>
                      ${r.status !== '已完成' ? `<button class="btn btn-success btn-sm complete-balance-btn">完成</button>` : ''}
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
      <div class="card">
        <div class="section-header">
          <h2>质检交车记录</h2>
          ${(currentUser.role === '前台' || currentUser.role === '店长') ? `
            <button class="btn btn-primary btn-sm" id="start-inspection-btn" ${selectedOrder.balanceRecords.length === 0 ? 'disabled' : ''}>
              ${selectedOrder.inspectionRecord?.status === '质检中' ? '继续质检' : '开始质检'}
            </button>
          ` : ''}
        </div>
        ${!selectedOrder.inspectionRecord ? `
          <p class="empty-text">暂无质检记录</p>
        ` : `
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span>质检状态</span>
              <span class="badge ${selectedOrder.inspectionRecord.status === '待质检' ? 'badge-info' : selectedOrder.inspectionRecord.status === '质检中' ? 'badge-warning' : selectedOrder.inspectionRecord.status === '质检不通过' ? 'badge-danger' : 'badge-success'}">${selectedOrder.inspectionRecord.status}</span>
            </div>
            <div class="info-row"><span class="label">质检时间</span><span class="value">${formatDate(selectedOrder.inspectionRecord.updatedAt)}</span></div>
            <div class="info-row"><span class="label">备注</span><span class="value">${selectedOrder.inspectionRecord.remark || '-'}</span></div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px;">
              <div><h4 style="font-size: 14px; color: #64748b; margin-bottom: 8px;">检查项目</h4><div style="display: flex; flex-wrap: wrap; gap: 6px;">${selectedOrder.inspectionRecord.checkItems.map(i => `<span style="padding: 4px 10px; background: #e2e8f0; border-radius: 4px; font-size: 12px;">${i}</span>`).join('')}</div></div>
              <div><h4 style="font-size: 14px; color: #64748b; margin-bottom: 8px;">合格项</h4><div style="display: flex; flex-wrap: wrap; gap: 6px;">${selectedOrder.inspectionRecord.passedItems.map(i => `<span style="padding: 4px 10px; background: #dcfce7; color: #16a34a; border-radius: 4px; font-size: 12px;">${i}</span>`).join('')}</div></div>
              <div><h4 style="font-size: 14px; color: #64748b; margin-bottom: 8px;">不合格项</h4><div style="display: flex; flex-wrap: wrap; gap: 6px;">${selectedOrder.inspectionRecord.failedItems.map(i => `<span style="padding: 4px 10px; background: #fee2e2; color: #dc2626; border-radius: 4px; font-size: 12px;">${i}</span>`).join('')}</div></div>
            </div>
          </div>
        `}
        ${(currentUser.role === '前台' || currentUser.role === '店长') && selectedOrder.inspectionRecord?.status === '质检通过' && selectedOrder.status === '进行中' ? `
          <button class="btn btn-success" id="complete-delivery-btn">确认交车</button>
        ` : ''}
      </div>
      <div class="card">
        <div class="section-header"><h2>操作日志</h2></div>
        <div id="logs-container"></div>
      </div>
    </div>
  `;
}

async function bindDetailEvents() {
  document.getElementById('back-btn').addEventListener('click', () => {
    currentView = 'list';
    selectedOrder = null;
    render();
  });

  document.getElementById('logout-detail-btn').addEventListener('click', () => {
    currentUser = null;
    currentView = 'login';
    render();
  });

  document.getElementById('add-balance-btn')?.addEventListener('click', () => {
    showBalanceForm(null);
  });

  document.querySelectorAll('.edit-balance-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      const recordId = row.dataset.recordId;
      const record = selectedOrder.balanceRecords.find(r => r.id === recordId);
      showBalanceForm(record);
    });
  });

  document.querySelectorAll('.complete-balance-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('tr');
      const recordId = row.dataset.recordId;
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
      selectedOrder._balanceChanged = true;
      await loadOrders();
      selectedOrder = orders.find(o => o.id === selectedOrder.id);
      render();
    });
  });

  document.getElementById('start-inspection-btn')?.addEventListener('click', async () => {
    if (selectedOrder.balanceRecords.length === 0) {
      alert('请先录入动平衡记录');
      return;
    }
    if (!selectedOrder.inspectionRecord) {
      await createInspectionRecord({
        workOrderId: selectedOrder.id,
        status: '质检中',
        inspectorId: currentUser.id,
        checkItems: ['动平衡值检查', '轮胎安装紧固', '轮胎磨损检查', '胎压检测', '气门嘴检查', '轮毂清洁度', '配重块安装', '轮胎动平衡测试'],
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
    await loadOrders();
    selectedOrder = orders.find(o => o.id === selectedOrder.id);
    showInspectionForm();
  });

  document.getElementById('complete-delivery-btn')?.addEventListener('click', async () => {
    await updateWorkOrder(selectedOrder.id, { status: '已完成' });
    await createOperationLog({
      workOrderId: selectedOrder.id,
      action: '交车完成',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      details: '工单完成，客户已取车'
    });
    await loadOrders();
    selectedOrder = orders.find(o => o.id === selectedOrder.id);
    render();
  });

  await loadLogs();
}

function showBalanceForm(record) {
  const wheelPositions = ['左前轮', '右前轮', '左后轮', '右后轮', '备胎'];
  document.body.innerHTML += `
    <div class="modal-overlay" id="balance-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>${record ? '编辑动平衡记录' : '添加动平衡记录'}</h2>
          <button class="modal-close" id="close-balance-modal">×</button>
        </div>
        <div class="form-group">
          <label>车轮位置 *</label>
          <select id="balance-position">
            <option value="">请选择</option>
            ${wheelPositions.map(p => `<option value="${p}" ${record?.wheelPosition === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>平衡前 (g)</label>
          <input type="number" id="balance-before" value="${record?.beforeValue || 0}" min="0" />
        </div>
        <div class="form-group">
          <label>平衡后 (g) *</label>
          <input type="number" id="balance-after" value="${record?.balanceValue || 0}" min="0" />
        </div>
        <div class="form-group">
          <label>状态</label>
          <select id="balance-status">
            <option value="待处理" ${record?.status === '待处理' ? 'selected' : ''}>待处理</option>
            <option value="处理中" ${record?.status === '处理中' ? 'selected' : ''}>处理中</option>
            <option value="已完成" ${record?.status === '已完成' ? 'selected' : ''}>已完成</option>
            <option value="需复检" ${record?.status === '需复检' ? 'selected' : ''}>需复检</option>
          </select>
        </div>
        <div class="form-group">
          <label>备注</label>
          <textarea id="balance-remark">${record?.remark || ''}</textarea>
        </div>
        <div class="flex-end mt-20">
          <button class="btn btn-outline" id="cancel-balance">取消</button>
          <button class="btn btn-primary" id="submit-balance">${record ? '保存修改' : '添加记录'}</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('close-balance-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-balance').addEventListener('click', closeModal);
  document.getElementById('submit-balance').addEventListener('click', async () => {
    const position = document.getElementById('balance-position').value;
    const after = parseInt(document.getElementById('balance-after').value);
    if (!position) {
      alert('请选择车轮位置');
      return;
    }
    if (after < 0) {
      alert('平衡值不能为负数');
      return;
    }

    if (record) {
      const oldValue = record.balanceValue;
      await updateBalanceRecord(record.id, {
        wheelPosition: position,
        beforeValue: parseInt(document.getElementById('balance-before').value),
        balanceValue: after,
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
        details: `修改动平衡: ${position}，从 ${oldValue}g 改为 ${after}g`
      });
    } else {
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
        details: `添加动平衡: ${position}，平衡值: ${after}g`
      });
    }
    selectedOrder._balanceChanged = true;
    closeModal();
    await loadOrders();
    selectedOrder = orders.find(o => o.id === selectedOrder.id);
    render();
  });
}

function showInspectionForm() {
  const checkItems = selectedOrder.inspectionRecord?.checkItems || [
    '动平衡值检查', '轮胎安装紧固', '轮胎磨损检查', '胎压检测', '气门嘴检查', '轮毂清洁度', '配重块安装', '轮胎动平衡测试'
  ];
  const passedItems = selectedOrder.inspectionRecord?.passedItems || [];
  const failedItems = selectedOrder.inspectionRecord?.failedItems || [];
  
  document.body.innerHTML += `
    <div class="modal-overlay" id="inspection-modal">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2>质检检查</h2>
          <button class="modal-close" id="close-inspection-modal">×</button>
        </div>
        <div class="form-group">
          <label>检查项目</label>
          <div class="check-list">
            ${checkItems.map(item => {
              const isPassed = passedItems.includes(item);
              const isFailed = failedItems.includes(item);
              return `
                <div class="check-item">
                  <button type="button" class="check-btn btn ${isPassed ? 'btn-success' : isFailed ? 'btn-danger' : 'btn-outline'}" data-item="${item}">${item}</button>
                  <span class="check-status">${isPassed ? '✓ 合格' : isFailed ? '✗ 不合格' : '未检查'}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>备注</label>
          <textarea id="inspection-remark">${selectedOrder.inspectionRecord?.remark || ''}</textarea>
        </div>
        <div class="summary-row">
          <div><span style="display: block; font-size: 12px; color: #64748b;">合格项</span><span class="summary-value success" id="summary-passed">${passedItems.length} 项</span></div>
          <div><span style="display: block; font-size: 12px; color: #64748b;">不合格项</span><span class="summary-value danger" id="summary-failed">${failedItems.length} 项</span></div>
        </div>
        <div class="flex-end mt-20">
          <button class="btn btn-outline" id="cancel-inspection">取消</button>
          <button class="btn btn-primary" id="submit-inspection">提交质检结果</button>
        </div>
      </div>
    </div>
  `;

  const currentPassed = [...passedItems];
  const currentFailed = [...failedItems];

  document.getElementById('close-inspection-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-inspection').addEventListener('click', closeModal);

  document.querySelectorAll('.check-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.item;
      const passedIdx = currentPassed.indexOf(item);
      const failedIdx = currentFailed.indexOf(item);
      
      if (passedIdx === -1 && failedIdx === -1) {
        currentPassed.push(item);
        btn.className = 'check-btn btn btn-success';
      } else if (passedIdx !== -1) {
        currentPassed.splice(passedIdx, 1);
        currentFailed.push(item);
        btn.className = 'check-btn btn btn-danger';
      } else {
        currentFailed.splice(failedIdx, 1);
        btn.className = 'check-btn btn btn-outline';
      }
      
      document.getElementById('summary-passed').textContent = `${currentPassed.length} 项`;
      document.getElementById('summary-failed').textContent = `${currentFailed.length} 项`;
    });
  });

  document.getElementById('submit-inspection').addEventListener('click', async () => {
    if (currentPassed.length + currentFailed.length === 0) {
      alert('请至少选择一项检查结果');
      return;
    }
    const status = currentFailed.length > 0 ? '质检不通过' : '质检通过';
    
    if (!selectedOrder.inspectionRecord) {
      await createInspectionRecord({
        workOrderId: selectedOrder.id,
        status,
        inspectorId: currentUser.id,
        checkItems,
        passedItems: currentPassed,
        failedItems: currentFailed,
        remark: document.getElementById('inspection-remark').value
      });
    } else {
      await updateInspectionRecord(selectedOrder.inspectionRecord.id, {
        status,
        inspectorId: currentUser.id,
        passedItems: currentPassed,
        failedItems: currentFailed,
        remark: document.getElementById('inspection-remark').value
      });
    }
    
    await createOperationLog({
      workOrderId: selectedOrder.id,
      action: status === '质检通过' ? '质检通过' : '质检不通过',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      details: `${status}: 合格(${currentPassed.length})，不合格(${currentFailed.length})`
    });
    
    closeModal();
    await loadOrders();
    selectedOrder = orders.find(o => o.id === selectedOrder.id);
    render();
  });
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
          <div class="log-header">
            <span class="log-action">${log.action}</span>
            <span class="log-time">${formatDate(log.timestamp)}</span>
          </div>
          <div style="font-size: 13px; color: #64748b;">${log.operatorName} (${log.operatorRole})</div>
          <div style="font-size: 14px;">${log.details}</div>
        </div>
      `).join('')}
    </div>
  `;
}

init();
